// Co-op tests: room manager (codes, relay, shared HP, trade arbitration, resume, validation) and two real Coop
// clients talking through the real ws server.
import { RoomManager } from '../server/rooms.js';
import { validateClientFrame, tradeHash, normalizeCode, validCode } from '../src/coop-proto.js';
import { createServer } from '../server.js';
import { Coop } from '../src/coop.js';
import { Game } from '../src/game.js';
import { newData } from '../src/save.js';
import { mulberry32 } from '../src/rng.js';
import WebSocket from 'ws';

let n = 0, failed = 0;
const check = (c, m) => { n++; if (!c) { failed++; console.log('  FAIL -', m); } else console.log('  ok   -', m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const conn = () => { const c = { out: [], closed: null, send(o) { c.out.push(o); }, close(code) { c.closed = code; } }; return c; };
const last = (c, t) => [...c.out].reverse().find((o) => o.t === t);

// ---- RoomManager ----
{
  let now = 1000; const R = new RoomManager({ rng: mulberry32(5), now: () => now });
  const a = R.attach(conn()), b = R.attach(conn()), x = R.attach(conn());
  R.handle(a, { t: 'create', name: 'Ann<script>' });
  const j = last(a, 'joined'); check(j && validCode(j.code) && j.id === 'p1', 'create gives a 5-char code');
  check(R.roster(a.room)[0].name === 'Annscript', 'names are sanitised');
  R.handle(b, { t: 'join', code: j.code.toLowerCase(), name: 'Bob' });
  check(last(b, 'joined')?.members.length === 2 && last(a, 'peer')?.ev === 'join', 'join by code (case-insensitive) notifies members');
  R.handle(x, { t: 'join', code: 'ZZZZZ', name: 'X' }); check(last(x, 'error')?.err === 'no_room', 'bad code rejected');
  R.handle(a, { t: 'msg', d: { k: 'chat', x: 'hi' } }); check(last(b, 'msg')?.d.x === 'hi' && last(b, 'msg').from === 'p1', 'chat relayed with server-stamped sender');
  R.handle(a, { t: 'msg', d: { k: 'trade_decision', tid: 't', commit: true } }); check(last(a, 'error')?.err === 'unknown_kind', 'clients cannot forge trade decisions');
  // shared HP
  R.handle(a, { t: 'dmg', area: 'lumby', id: 3, dmg: 4, max: 10, respawn: 6 }); R.handle(b, { t: 'dmg', area: 'lumby', id: 3, dmg: 3, max: 10, respawn: 6 });
  check(last(a, 'mhp')?.hp === 3 && last(b, 'mhp')?.hp === 3, 'damage from both players stacks on one HP pool');
  R.handle(b, { t: 'dmg', area: 'lumby', id: 3, dmg: 9, max: 10, respawn: 6 }); check(last(a, 'mhp')?.hp === 0, 'shared kill broadcast');
  R.handle(a, { t: 'dmg', area: 'lumby', id: 3, dmg: 2, max: 10, respawn: 6 }); check(last(a, 'mhp')?.hp === 0, 'dead monster stays dead until respawn');
  now += 7000; R.handle(a, { t: 'dmg', area: 'lumby', id: 3, dmg: 2, max: 10, respawn: 6 }); check(last(a, 'mhp')?.hp === 8, 'monster respawns with full HP');
  R.handle(a, { t: 'dmg', area: 'lumby', id: 3, dmg: 99999, max: 10, respawn: 6 }); check(last(a, 'error')?.err === 'bad_dmg', 'absurd damage rejected');
  // trade arbitration
  const H = tradeHash([{ items: [{ id: 'logs', n: 1 }], coins: 0 }, { items: [], coins: 5 }]);
  R.handle(a, { t: 'msg', d: { k: 'trade_ready', tid: 'T1', ok: true, h: H, to: 'p2' } });
  check(!b.out.some((o) => o.d?.k === 'trade_decision') && last(b, 'msg')?.d.k === 'trade_ready', 'one side ready: forwarded, no decision');
  R.handle(b, { t: 'msg', d: { k: 'trade_ready', tid: 'T1', ok: true, h: 'other', to: 'p1' } });
  check(!a.out.some((o) => o.d?.k === 'trade_decision'), 'mismatched offers do not commit');
  R.handle(b, { t: 'msg', d: { k: 'trade_ready', tid: 'T1', ok: true, h: H, to: 'p1' } });
  check(last(a, 'msg')?.d.k === 'trade_decision' && last(a, 'msg').d.commit && last(b, 'msg').d.commit, 'both accepted same offer -> commit to both');
  R.handle(a, { t: 'msg', d: { k: 'trade_ready', tid: 'T2', ok: true, h: H, to: 'p2' } }); R.handle(b, { t: 'msg', d: { k: 'trade_cancel', tid: 'T2', to: 'p1' } });
  check(a.out.some((o) => o.d?.k === 'trade_decision' && o.d.tid === 'T2' && !o.d.commit), 'cancel -> both told cancelled');
  // reconnect
  const tok = last(b, 'joined').token; R.disconnect(b); check(last(a, 'peer')?.ev === 'away', 'drop -> peers see away');
  const b2 = R.attach(conn()); R.handle(b2, { t: 'resume', code: j.code, id: 'p2', token: 'nope' }); check(last(b2, 'error')?.err === 'resume_failed', 'resume needs the token');
  R.handle(b2, { t: 'resume', code: j.code, id: 'p2', token: tok }); check(last(b2, 'joined')?.resumed && last(a, 'peer')?.ev === 'back', 'resume within grace keeps the seat');
  R.disconnect(b2); now += 40000; R.sweep(); check(R.roster(a.room).length === 1 && last(a, 'peer')?.ev === 'leave', 'seat expires after grace');
  R.handle(a, { t: 'leave' }); check(R.rooms.size === 0, 'empty room removed');
  for (let i = 0; i < 5; i++) R.handle(R.attach(conn()), { t: 'create' });
  const full = R.rooms.values().next().value.code; const cs = [1, 2, 3, 4].map(() => R.attach(conn())); cs.forEach((c) => R.handle(c, { t: 'join', code: full }));
  check(last(cs[3], 'error')?.err === 'room_full', 'max 4 players');
  check(!validateClientFrame({ t: 'msg', d: { k: 'chat', x: 'x'.repeat(500) } }).ok && !validateClientFrame([]).ok && normalizeCode(' ab-c d9 ') === 'ABCD9', 'frame validation');
}

// ---- two real clients through the ws server ----
const server = createServer(); await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `ws://127.0.0.1:${server.address().port}/ws`;
const store = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };
const until = async (fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await sleep(20); } return false; };
const gA = new Game(newData('Alice'), mulberry32(1)), gB = new Game(newData('Bob'), mulberry32(2));
const sA = store(), sB = store();
const A = new Coop(gA, { url, WS: WebSocket, storage: sA }), B = new Coop(gB, { url, WS: WebSocket, storage: sB });
A.create(); check(await until(() => A.active && A.room.code), 'client A created a room');
B.join(A.room.code.toLowerCase()); check(await until(() => B.active && A.members.length === 2), 'client B joined by code');
for (let i = 0; i < 10; i++) { A.tick(0.2); B.tick(0.2); await sleep(30); }
check(await until(() => A.peersHere().length === 1 && B.peersHere()[0]?.n === 'Alice' && B.peersHere()[0].lv >= 3), 'each sees the other hero in the same area (name + level)');
gB.travel('draynor'); for (let i = 0; i < 3; i++) { B.tick(0.2); await sleep(40); }
check(await until(() => A.peersHere().length === 0), 'players in other areas are not drawn'); gB.travel('lumby'); B.sendState(true);
// shared monster
const mA = gA.ents.find((e) => e.kind === 'chicken'), mB = gB.ent(mA.id);
gA.hitMonster(mA, 1); check(await until(() => mB.hp === mA.max - 1), 'damage by A shows on B (shared HP)');
const xp0 = gB.data.xp.attack, k0 = gB.data.stats.kills, kA = gA.data.stats.kills;
gB.hitMonster(mB, mB.hp); check(mB.dead > 0 && gB.data.stats.kills === k0 + 1, 'B lands the kill and gets its own kill/loot');
check(await until(() => mA.dead > 0) && gA.data.stats.kills === kA + 1, 'A, who also fought it, gets kill credit too');
check(gB.data.xp.attack > xp0, 'XP is per player');
const other = gA.ents.filter((e) => e.kind === 'chicken')[1]; if (other) { gB.hitMonster(gB.ent(other.id), 99); await until(() => other.dead > 0); check(other.dead > 0 && gA.data.stats.kills === kA + 1, 'bystander sees the kill but gets no loot'); }
// chat
A.say('hello Bob'); check(await until(() => B.chat.some((c) => c.x === 'hello Bob' && c.name === 'Alice')), 'chat delivered');
// trade
gA.addItem('logs', 5); gB.data.coins = 100; const logsB = gB.count('logs'), cA0 = gA.data.coins, lA0 = gA.count('logs');
A.requestTrade(B.room.id); check(await until(() => B.invites.length === 1), 'trade request reaches B');
B.answerInvite(B.invites[0].tid, true); check(await until(() => A.trade?.open && B.trade?.open), 'both trade windows open');
A.offerSlot(gA.data.bag.findIndex((s) => s.id === 'logs'), 3); B.offerCoins(40);
check(await until(() => B.trade.theirs.items[0]?.n === 3 && A.trade.theirs.coins === 40), 'offers mirrored both ways');
A.accept(); check(await until(() => B.trade?.theirReady), 'B sees A accepted');
B.offerCoins(30); check(await until(() => A.trade && !A.trade.myReady && A.trade.theirs.coins === 30), 'changing an offer resets acceptance');
A.accept(); B.accept();
check(await until(() => !A.trade && !B.trade), 'trade completes after both confirm');
check(gA.count('logs') === lA0 - 3 && gA.data.coins === cA0 + 30 && gB.count('logs') === logsB + 3 && gB.data.coins === 70, 'items and coins swapped exactly once');
// cancel
A.requestTrade(B.room.id); await until(() => B.invites.length === 1); B.answerInvite(B.invites[0].tid, true); await until(() => A.trade?.open);
A.offerCoins(10); B.cancelTrade(); check(await until(() => !A.trade && !B.trade) && gA.data.coins === cA0 + 30, 'cancel closes both, nothing moves');
// reconnect
const code = A.room.code; B.ws.close(); check(await until(() => A.members.find((m) => m.id === B.room.id)?.away), 'A sees B reconnecting');
check(await until(() => B.active, 6000) && B.room.code === code && !A.members.find((m) => m.id === B.room.id)?.away, 'B auto-resumes the same seat');
const gC = new Game(newData('Cara'), mulberry32(3)), C = new Coop(gC, { url, WS: WebSocket, storage: sB }); // reload: session restored from storage
check(await until(() => C.active && C.room.code === code, 6000), 'page reload resumes the room from session storage');
// offline fallback
const D = new Coop(new Game(newData('Solo'), mulberry32(4)), { url: 'ws://127.0.0.1:1/ws', WS: WebSocket, storage: store() });
D.create(); check(await until(() => D.status === 'offline'), 'no server -> offline status');
const gd = D.g; const ch = gd.ents.find((e) => e.kind === 'chicken'); gd.hitMonster(ch, 1); check(ch.hp === ch.max - 1 && !gd.net, 'solo play unaffected while offline');
A.leave(); check(await until(() => B.members.length === 1 || C.members.length === 1), 'leave updates the roster');
for (const c of [A, B, C, D]) { clearTimeout(c.retryT); c.room = null; try { c.ws?.close(); } catch { /* */ } }
server.close(); await sleep(50);
console.log(failed ? `\n${failed} of ${n} co-op checks FAILED` : `\nall ${n} co-op checks passed`);
process.exit(failed ? 1 : 0);
