// Ironbound co-op rooms: short codes, membership, reconnect grace, relaying, shared monster HP and trade arbitration.
// Transport-agnostic: a "conn" is {send(obj), close(code, reason)}; server.js adapts ws sockets to it.
import { MAX_PLAYERS, generateCode, normalizeCode, validCode, cleanName, validateClientFrame, RateLimiter } from '../src/coop-proto.js';

export const GRACE_MS = 30000;
export const TRADE_TIMEOUT_MS = 120000;

export class RoomManager {
  constructor({ rng = Math.random, now = () => Date.now(), maxRooms = 500, graceMs = GRACE_MS } = {}) {
    this.rng = rng; this.now = now; this.maxRooms = maxRooms; this.graceMs = graceMs; this.rooms = new Map(); this.seq = 0;
  }
  newCode() { for (let i = 0; i < 50; i++) { const c = generateCode(this.rng); if (!this.rooms.has(c)) return c; } return null; }
  token() { let t = ''; for (let i = 0; i < 24; i++) t += Math.floor(this.rng() * 36).toString(36); return t + (++this.seq).toString(36); }
  attach(conn) { conn.limiter = new RateLimiter({ now: this.now }); conn.strikes = 0; return conn; }

  handle(conn, m) {
    if (!conn.limiter.take()) { if (++conn.strikes > 40) conn.close(1008, 'rate limit'); else conn.send({ t: 'error', err: 'rate_limited' }); return; }
    const v = validateClientFrame(m);
    if (!v.ok) return conn.send({ t: 'error', err: v.err });
    switch (m.t) {
      case 'ping': return conn.send({ t: 'pong' });
      case 'create': return this.create(conn, m.name);
      case 'join': return this.join(conn, m.code, m.name);
      case 'resume': return this.resume(conn, m);
      case 'leave': return this.leave(conn);
      case 'dmg': return this.damage(conn, m);
      case 'msg': return this.relay(conn, m);
    }
  }
  create(conn, name) {
    if (conn.room) return conn.send({ t: 'error', err: 'already_in_room' });
    if (this.rooms.size >= this.maxRooms) return conn.send({ t: 'error', err: 'server_full' });
    const code = this.newCode(); if (!code) return conn.send({ t: 'error', err: 'server_full' });
    const room = { code, members: new Map(), trades: new Map(), mobs: new Map(), nextId: 1 };
    this.rooms.set(code, room);
    const me = this.addMember(room, conn, name);
    conn.send({ t: 'joined', code, id: me.id, token: me.token, members: this.roster(room), max: MAX_PLAYERS });
  }
  join(conn, code, name) {
    if (conn.room) return conn.send({ t: 'error', err: 'already_in_room' });
    code = normalizeCode(code); const room = this.rooms.get(code);
    if (!room || !validCode(code)) return conn.send({ t: 'error', err: 'no_room' });
    if (room.members.size >= MAX_PLAYERS) return conn.send({ t: 'error', err: 'room_full' });
    const me = this.addMember(room, conn, name);
    conn.send({ t: 'joined', code, id: me.id, token: me.token, members: this.roster(room), max: MAX_PLAYERS });
    this.broadcast(room, { t: 'peer', ev: 'join', id: me.id, name: me.name, members: this.roster(room) }, me.id);
  }
  resume(conn, { code, id, token }) {
    if (conn.room) return conn.send({ t: 'error', err: 'already_in_room' });
    const room = this.rooms.get(normalizeCode(code)), me = room?.members.get(id);
    if (!room || !me || me.token !== token) return conn.send({ t: 'error', err: 'resume_failed' });
    if (me.conn && me.conn !== conn) { me.conn.room = null; me.conn.member = null; try { me.conn.close(4000, 'replaced'); } catch { /* ignore */ } }
    me.conn = conn; me.away = null; conn.room = room; conn.member = me;
    conn.send({ t: 'joined', code: room.code, id, token, members: this.roster(room), max: MAX_PLAYERS, resumed: true });
    for (const d of me.pending.splice(0)) conn.send({ t: 'msg', from: 'server', d });
    this.broadcast(room, { t: 'peer', ev: 'back', id, name: me.name, members: this.roster(room) }, id);
  }
  addMember(room, conn, name) {
    const me = { id: 'p' + room.nextId++, name: cleanName(name), token: this.token(), conn, away: null, pending: [] };
    room.members.set(me.id, me); conn.room = room; conn.member = me; return me;
  }
  roster(room) { return [...room.members.values()].map((m) => ({ id: m.id, name: m.name, away: !!m.away })); }
  broadcast(room, obj, exceptId = null) { for (const m of room.members.values()) if (m.id !== exceptId && m.conn && !m.away) m.conn.send(obj); }

  /** shared monster HP: the server applies every player's damage, so kills are shared (each client grants its own loot/XP) */
  damage(conn, m) {
    const room = conn.room; if (!room) return conn.send({ t: 'error', err: 'not_in_room' });
    const key = `${m.area}:${m.id}`, t = this.now();
    let mob = room.mobs.get(key);
    if (!mob || (mob.deadUntil && t >= mob.deadUntil) || mob.max !== m.max) mob = { hp: m.max, max: m.max, deadUntil: 0 };
    if (!mob.deadUntil) { mob.hp = Math.max(0, mob.hp - m.dmg); if (mob.hp <= 0) mob.deadUntil = t + m.respawn * 1000; }
    room.mobs.set(key, mob);
    if (room.mobs.size > 2000) room.mobs.delete(room.mobs.keys().next().value);
    this.broadcast(room, { t: 'mhp', area: m.area, id: m.id, hp: mob.hp, max: mob.max, by: conn.member.id });
  }

  relay(conn, m) {
    const room = conn.room, me = conn.member;
    if (!room) return conn.send({ t: 'error', err: 'not_in_room' });
    const d = m.d;
    if (d.k === 'trade_ready') return this.onTradeReady(room, me, d);
    if (d.k === 'trade_cancel') this.onTradeCancel(room, me, d);
    let targets = [...room.members.values()].filter((x) => x.id !== me.id);
    if (m.to) { const t = room.members.get(m.to); if (!t || t.id === me.id) return conn.send({ t: 'error', err: 'no_such_member' }); targets = [t]; }
    for (const t of targets) if (t.conn && !t.away) t.conn.send({ t: 'msg', from: me.id, d });
  }
  // trade: the server commits only when both sides are ready on the same offer hash, and tells both at once
  decide(room, tid, commit, parties) {
    const tr = room.trades.get(tid); if (tr?.done) return; room.trades.set(tid, { ...(tr || {}), done: true, ts: this.now() });
    for (const id of parties) { const m = room.members.get(id); if (!m) continue; const d = { k: 'trade_decision', tid, commit }; if (m.conn && !m.away) m.conn.send({ t: 'msg', from: 'server', d }); else m.pending.push(d); }
  }
  onTradeReady(room, me, d) {
    let t = room.trades.get(d.tid); if (t?.done) return;
    const other = room.members.get(d.to);
    if (!other || other.id === me.id) return this.decide(room, d.tid, false, [me.id]);
    if (!t) { t = { a: me.id, b: other.id, ready: {}, ts: this.now() }; room.trades.set(d.tid, t); }
    if (![t.a, t.b].includes(me.id)) return;
    if (!d.ok) return this.decide(room, d.tid, false, [t.a, t.b]);
    t.ready[me.id] = d.h;
    const peer = me.id === t.a ? t.b : t.a, pm = room.members.get(peer);
    if (pm?.conn && !pm.away) pm.conn.send({ t: 'msg', from: me.id, d: { k: 'trade_ready', tid: d.tid, ok: true, h: d.h, to: peer } });
    if (t.ready[t.a] && t.ready[t.a] === t.ready[t.b]) this.decide(room, d.tid, true, [t.a, t.b]);
  }
  onTradeCancel(room, me, d) { const t = room.trades.get(d.tid); if (t && !t.done && [t.a, t.b].includes(me.id)) this.decide(room, d.tid, false, [t.a, t.b]); }

  disconnect(conn) {
    const room = conn.room, m = conn.member;
    if (!room || !m || m.conn !== conn) return;
    m.conn = null; m.away = this.now();
    this.broadcast(room, { t: 'peer', ev: 'away', id: m.id, name: m.name, members: this.roster(room) }, m.id);
  }
  leave(conn) { const room = conn.room, m = conn.member; if (!room || !m) return; this.removeMember(room, m, 'left'); conn.room = null; conn.member = null; conn.send({ t: 'left' }); }
  removeMember(room, m, reason) {
    room.members.delete(m.id);
    for (const [tid, t] of room.trades) if (!t.done && (t.a === m.id || t.b === m.id)) this.decide(room, tid, false, [t.a, t.b]);
    if (m.conn) { m.conn.room = null; m.conn.member = null; }
    if (room.members.size === 0) { this.rooms.delete(room.code); return; }
    this.broadcast(room, { t: 'peer', ev: 'leave', id: m.id, name: m.name, members: this.roster(room), reason });
  }
  sweep() {
    const t = this.now();
    for (const room of [...this.rooms.values()]) {
      for (const m of [...room.members.values()]) if (m.away && t - m.away > this.graceMs) this.removeMember(room, m, 'timeout');
      for (const [tid, tr] of [...room.trades]) { if (tr.done) { if (t - tr.ts > 600000) room.trades.delete(tid); } else if (t - tr.ts > TRADE_TIMEOUT_MS) this.decide(room, tid, false, [tr.a, tr.b]); }
    }
  }
  stats() { return { rooms: this.rooms.size, players: [...this.rooms.values()].reduce((a, r) => a + r.members.size, 0) }; }
}
