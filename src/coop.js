// Co-op client: room codes over WebSocket, peer presence, shared monster HP, chat, two-sided trade.
// Everything degrades to solo: if the socket can't connect the game keeps running locally. Saves stay local.
import { normalizeCode, tradeHash, cleanName } from './coop-proto.js';
import { ITEMS, BAG_SLOTS, isStackable } from './data.js';

const SESSION = 'ironbound.coop';
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export class Coop {
  constructor(game, { url, WS = globalThis.WebSocket, storage = globalThis.sessionStorage } = {}) {
    this.g = game; this.WS = WS; this.storage = storage;
    this.url = url || (typeof location !== 'undefined' ? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws` : null);
    this.ws = null; this.status = 'off'; // off | connecting | online | offline
    this.room = null; // {code, id, token}
    this.members = []; this.peers = new Map(); // id -> presence
    this.chat = []; this.trade = null; this.invites = [];
    this.listeners = new Set(); this.retry = 0; this.stT = 0; this.lastSt = ''; this.swings = 0;
    game.net = null;
    game.on((t, p) => { if (t === 'swing' && !p.gather) this.swings++; if (t === 'area' && this.room) this.sendState(true); });
    try { const s = JSON.parse(this.storage?.getItem(SESSION) || 'null'); if (s?.code) { this.room = s; this.connect(); } } catch { /* ignore */ }
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type, p = {}) { for (const fn of this.listeners) fn(type, p); }
  get active() { return !!(this.room && this.status === 'online' && this.room.id); }

  // ---- connection ---------------------------------------------------------------------------------
  connect() {
    if (!this.WS || !this.url) { this.setStatus('offline'); return; }
    if (this.ws && this.ws.readyState <= 1) return;
    this.setStatus('connecting');
    let ws; try { ws = new this.WS(this.url); } catch { this.setStatus('offline'); return this.scheduleRetry(); }
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      if (this.room?.token) this.raw({ t: 'resume', code: this.room.code, id: this.room.id, token: this.room.token });
      else if (this.pendingAct) { this.raw(this.pendingAct); this.pendingAct = null; }
      else this.setStatus('online');
    };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } this.onFrame(m); };
    ws.onclose = () => { if (this.ws !== ws) return; this.ws = null; this.g.net = null; this.peers.clear(); this.setStatus('offline'); if (this.room) this.scheduleRetry(); };
    ws.onerror = () => {};
  }
  scheduleRetry() { clearTimeout(this.retryT); const ms = Math.min(15000, 800 * 2 ** this.retry++); this.retryT = setTimeout(() => { if (this.room || this.pendingAct) this.connect(); }, ms); }
  setStatus(s) { if (this.status !== s) { this.status = s; this.emit('status', { status: s }); } }
  raw(o) { if (this.ws?.readyState === 1) { this.ws.send(JSON.stringify(o)); return true; } return false; }
  send(d, to) { return this.raw(to ? { t: 'msg', d, to } : { t: 'msg', d }); }
  act(frame) { if (!this.raw(frame)) { this.pendingAct = frame; this.connect(); } }

  create() { this.act({ t: 'create', name: this.g.data.name }); }
  join(code) { this.act({ t: 'join', code: normalizeCode(code), name: this.g.data.name }); }
  leave() {
    this.raw({ t: 'leave' }); this.room = null; this.storage?.removeItem(SESSION); this.peers.clear(); this.members = []; this.g.net = null;
    if (this.trade) this.endTrade('left'); clearTimeout(this.retryT); try { this.ws?.close(); } catch { /* ignore */ } this.ws = null; this.setStatus('off'); this.emit('room');
  }

  onFrame(m) {
    switch (m.t) {
      case 'joined':
        this.room = { code: m.code, id: m.id, token: m.token }; this.storage?.setItem(SESSION, JSON.stringify(this.room));
        this.members = m.members; this.g.net = this; this.setStatus('online'); this.sendState(true);
        this.emit('room', { resumed: !!m.resumed }); this.sys(m.resumed ? 'Reconnected to room ' + m.code : `Joined room ${m.code}`); break;
      case 'peer':
        this.members = m.members;
        if (m.ev === 'leave') this.peers.delete(m.id);
        if (m.ev === 'away' && this.peers.get(m.id)) this.peers.get(m.id).away = true;
        if (m.ev === 'join' || m.ev === 'back') this.sendState(true);
        this.sys(`${m.name} ${{ join: 'joined', back: 'reconnected', away: 'lost connection', leave: m.reason === 'timeout' ? 'timed out' : 'left' }[m.ev]}`);
        if (this.trade && this.trade.peer === m.id && m.ev === 'leave') this.endTrade('peer left');
        this.emit('room'); break;
      case 'mhp': if (m.area === this.g.data.area) this.g.applyRemoteHp(`${m.area}:${m.id}`, m.hp); break;
      case 'msg': this.onMsg(m.from, m.d); break;
      case 'error':
        if (m.err === 'resume_failed' || m.err === 'no_room' || m.err === 'room_full') { if (m.err === 'resume_failed') this.sys('Room expired - playing solo'); this.room = null; this.storage?.removeItem(SESSION); this.setStatus('online'); this.emit('room'); }
        this.emit('error', { err: m.err }); break;
      case 'left': break;
    }
  }
  sys(x) { this.addChat({ sys: true, x }); }
  addChat(c) { this.chat.push({ ...c, ts: Date.now() }); if (this.chat.length > 50) this.chat.shift(); this.emit('chat', c); }
  memberName(id) { return this.members.find((m) => m.id === id)?.name || this.peers.get(id)?.n || 'Player'; }

  onMsg(from, d) {
    if (d.k === 'st') { const p = this.peers.get(from) || { rx: d.x, swingT: 0, sw: d.sw }; if (d.sw !== p.sw && d.a === this.g.data.area) { p.swingT = 0.45; this.emit('peerswing', { id: from, p: { ...p, ...d } }); } Object.assign(p, d, { away: false, seen: Date.now() }); if (Math.abs(p.rx - d.x) > 400) p.rx = d.x; this.peers.set(from, p); return; }
    if (d.k === 'chat') { const p = this.peers.get(from); if (p) p.bubble = { x: d.x, t: 4 }; this.addChat({ from, name: this.memberName(from), x: String(d.x).slice(0, 120) }); return; }
    if (d.k === 'trade_req') { if (this.trade) return this.send({ k: 'trade_res', tid: d.tid, ok: false, busy: true }, from); this.invites = this.invites.filter((i) => i.from !== from); this.invites.push({ tid: d.tid, from }); this.emit('invite', { tid: d.tid, from, name: this.memberName(from) }); return; }
    if (d.k === 'trade_res') { if (this.trade?.tid !== d.tid) return; if (d.ok) { this.trade.open = true; this.emit('trade'); } else this.endTrade(d.busy ? 'player is busy' : 'declined'); return; }
    if (d.k === 'trade_offer') { if (this.trade?.tid !== d.tid || from !== this.trade.peer) return; this.trade.theirs = sanitizeOffer(d); this.trade.myReady = this.trade.theirReady = false; this.emit('trade'); return; }
    if (d.k === 'trade_ready') { if (this.trade?.tid !== d.tid) return; this.trade.theirReady = d.h === this.hash(); this.emit('trade'); return; }
    if (d.k === 'trade_cancel') { if (this.trade?.tid === d.tid) this.endTrade('cancelled by ' + this.memberName(from)); return; }
    if (d.k === 'trade_decision' && from === 'server') { if (this.trade?.tid !== d.tid) return; if (d.commit) this.commitTrade(); else this.endTrade('trade cancelled'); }
  }

  // ---- presence ---------------------------------------------------------------------------------
  state() {
    const g = this.g, h = g.hero, tgt = g.targetEnt, hc = g.combat;
    return { k: 'st', n: g.data.name, a: g.data.area, x: Math.round(h.x), d: h.dir, s: h.state, lv: g.combatLevel ?? 3, look: g.data.look, eq: { ...g.data.equip }, at: hc.type, tw: !!hc.two, sw: this.swings, tx: tgt ? Math.round(tgt.x) : null, tool: tgt?.type === 'node' ? tgt.kind : null, hp: Math.round((g.data.hp / g.maxHp) * 100) };
  }
  sendState(force = false) {
    if (!this.active) return; const s = this.state(), j = JSON.stringify(s);
    if (force || j !== this.lastSt) { this.lastSt = j; this.send(s); }
  }
  tick(dt) {
    if (this.active) { this.stT += dt; if (this.stT > 0.15) { this.stT = 0; this.sendState(); } this.kaT = (this.kaT || 0) + dt; if (this.kaT > 3) { this.kaT = 0; this.sendState(true); } }
    for (const p of this.peers.values()) { p.rx += (p.x - p.rx) * Math.min(1, dt * 8); if (p.swingT > 0) p.swingT -= dt; if (p.bubble) { p.bubble.t -= dt; if (p.bubble.t <= 0) p.bubble = null; } }
  }
  peersHere() { return [...this.peers.entries()].filter(([id, p]) => p.a === this.g.data.area && !p.away && this.members.some((m) => m.id === id)).map(([id, p]) => ({ id, ...p })); }

  /** called by Game.hitMonster when we damage a monster */
  damage(m, dmg) { if (!this.active) return; const i = Number(String(m.id).split(':')[1]); this.raw({ t: 'dmg', area: this.g.data.area, id: i, dmg: Math.max(0, Math.min(500, Math.round(dmg))), max: m.max, respawn: 6 }); }
  say(x) { x = String(x || '').trim().slice(0, 120); if (!x) return false; if (!this.active) return false; this.send({ k: 'chat', x }); this.addChat({ from: this.room.id, name: cleanName(this.g.data.name), x, me: true }); const me = this.g; void me; return true; }

  // ---- trade -----------------------------------------------------------------------------------
  requestTrade(peer) {
    if (this.trade || !this.active) return false;
    const tid = `${this.room.id}-${peer}-${Date.now().toString(36)}`;
    this.trade = { tid, peer, open: false, mine: { items: [], coins: 0 }, theirs: { items: [], coins: 0 }, myReady: false, theirReady: false };
    this.send({ k: 'trade_req', tid }, peer); this.emit('trade'); return true;
  }
  answerInvite(tid, ok) {
    const inv = this.invites.find((i) => i.tid === tid); this.invites = this.invites.filter((i) => i.tid !== tid);
    if (!inv) return;
    if (ok && this.trade) ok = false;
    this.send({ k: 'trade_res', tid, ok }, inv.from);
    if (ok) { this.trade = { tid, peer: inv.from, open: true, mine: { items: [], coins: 0 }, theirs: { items: [], coins: 0 }, myReady: false, theirReady: false }; this.emit('trade'); }
  }
  /** offer a bag slot (index) or coins. Returns true on change */
  offerSlot(idx, n) {
    const t = this.trade, s = this.g.data.bag[idx]; if (!t?.open || !s) return false;
    const it = ITEMS[s.id]; if (!it || it.untradeable) return false;
    const have = this.g.data.bag.filter((b) => b.id === s.id && same(b.e, s.e) && same(b.gem, s.gem)).reduce((a, b) => a + b.n, 0);
    const ex = t.mine.items.find((o) => o.id === s.id && same(o.e, s.e) && same(o.gem, s.gem));
    const add = Math.max(1, Math.min(n ?? s.n, have - (ex?.n || 0))); if (have - (ex?.n || 0) <= 0) return false;
    if (ex) ex.n += add; else { if (t.mine.items.length >= 12) return false; const o = { id: s.id, n: add }; if (s.e) o.e = s.e; if (s.gem) o.gem = s.gem; t.mine.items.push(o); }
    return this.offerChanged();
  }
  unoffer(i) { const t = this.trade; if (!t?.open || !t.mine.items[i]) return false; t.mine.items.splice(i, 1); return this.offerChanged(); }
  offerCoins(n) { const t = this.trade; if (!t?.open) return false; t.mine.coins = Math.max(0, Math.min(this.g.data.coins, Math.floor(Number(n) || 0))); return this.offerChanged(); }
  offerChanged() { const t = this.trade; t.myReady = t.theirReady = false; this.send({ k: 'trade_offer', tid: t.tid, items: t.mine.items, coins: t.mine.coins }, t.peer); this.emit('trade'); return true; }
  hash() { const t = this.trade; if (!t) return ''; const me = this.room.id; const a = me < t.peer ? [t.mine, t.theirs] : [t.theirs, t.mine]; return tradeHash(a); }
  canAfford() { const t = this.trade, g = this.g; if (t.mine.coins > g.data.coins) return false; return t.mine.items.every((o) => g.data.bag.filter((b) => b.id === o.id && same(b.e, o.e) && same(b.gem, o.gem)).reduce((a, b) => a + b.n, 0) >= o.n); }
  bagFits() { const t = this.trade, g = this.g; let free = BAG_SLOTS - g.slotsUsed; for (const o of t.mine.items) { const s = g.data.bag.filter((b) => b.id === o.id && same(b.e, o.e)); if (s.length && s.reduce((a, b) => a + b.n, 0) === o.n) free += s.length; } return t.theirs.items.reduce((a, o) => a + (isStackable(o.id) && !o.e && !o.gem ? (g.data.bag.some((b) => b.id === o.id && !b.e && !b.gem) ? 0 : 1) : o.n), 0) <= free; }
  accept() {
    const t = this.trade; if (!t?.open) return { ok: false };
    if (!this.canAfford()) return { ok: false, err: 'You no longer have everything you offered' };
    if (!this.bagFits()) return { ok: false, err: 'Not enough bag space' };
    t.myReady = true; this.send({ k: 'trade_ready', tid: t.tid, ok: true, h: this.hash(), to: t.peer }); this.emit('trade'); return { ok: true };
  }
  cancelTrade() { const t = this.trade; if (!t) return; this.send({ k: 'trade_cancel', tid: t.tid, to: t.peer }, t.peer); this.endTrade('cancelled'); }
  endTrade(why) { this.trade = null; this.emit('trade', { ended: why }); }
  commitTrade() {
    const t = this.trade, g = this.g; if (!t) return;
    for (const o of t.mine.items) { let left = o.n; for (let i = g.data.bag.length - 1; i >= 0 && left > 0; i--) { const b = g.data.bag[i]; if (b.id !== o.id || !same(b.e, o.e) || !same(b.gem, o.gem)) continue; const k = Math.min(b.n, left); b.n -= k; left -= k; if (b.n <= 0) g.data.bag.splice(i, 1); } }
    g.data.coins -= Math.min(g.data.coins, t.mine.coins);
    for (const o of t.theirs.items) g.addItem(o.id, o.n, o.e || null, o.gem || null);
    g.data.coins += t.theirs.coins;
    this.trade = null; g.emit('change'); this.emit('trade', { ended: 'Trade complete!', done: true });
  }
}

export function sanitizeOffer(d) {
  const items = (Array.isArray(d.items) ? d.items : []).slice(0, 12).filter((o) => o && ITEMS[o.id] && Number.isInteger(o.n) && o.n > 0 && o.n <= 1e7).map((o) => { const x = { id: o.id, n: o.n }; if (o.e && typeof o.e === 'object') x.e = o.e; if (o.gem && typeof o.gem === 'object') x.gem = o.gem; return x; });
  return { items, coins: Number.isInteger(d.coins) && d.coins >= 0 && d.coins <= 1e9 ? d.coins : 0 };
}
