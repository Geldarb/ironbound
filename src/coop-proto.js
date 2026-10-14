// Co-op wire protocol shared by the browser client and the Node server (no DOM / Node APIs).
// Client -> server: {t:'create'|'join'|'resume'|'leave'|'msg'|'dmg'|'ping', ...}.
// `msg` payloads (d.k) are relayed to room peers after validation; the server stamps `from` so identities can't be forged.
// `dmg` is handled by the server itself: it owns shared monster HP per room+area so kills are shared.
export const MAX_PLAYERS = 4;
export const CODE_LEN = 5;
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
export const NAME_MAX = 14;
export const MAX_RAW = 8000;
export const PEER_KINDS = new Set(['st', 'chat', 'trade_req', 'trade_res', 'trade_offer', 'trade_ready', 'trade_cancel']);
const LIMIT = { st: 900, trade_offer: 4000 }, DEFAULT_LIMIT = 600;

export function generateCode(rand = Math.random, len = CODE_LEN) { let s = ''; for (let i = 0; i < len; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length) % CODE_ALPHABET.length]; return s; }
export const normalizeCode = (c) => String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
export const validCode = (c) => typeof c === 'string' && c.length === CODE_LEN && [...c].every((ch) => CODE_ALPHABET.includes(ch));
export function cleanName(n) { return String(n ?? 'Hero').replace(/[\u0000-\u001f<>&"']/g, '').trim().slice(0, NAME_MAX) || 'Hero'; }
const isStr = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
function depthOf(v, d = 0) { if (d > 7) return d; if (v && typeof v === 'object') { let m = d; for (const k of Object.keys(v)) m = Math.max(m, depthOf(v[k], d + 1)); return m; } return d; }

/** stable hash of a trade (both offers) so the server only commits when both sides agreed to the same thing */
export function tradeHash(offers) { const s = JSON.stringify(offers); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

export function validateClientFrame(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return { ok: false, err: 'bad_frame' };
  switch (m.t) {
    case 'ping': case 'leave': case 'create': return { ok: true };
    case 'join': return validCode(normalizeCode(m.code)) ? { ok: true } : { ok: false, err: 'bad_code' };
    case 'resume': return isStr(m.id, 12) && isStr(m.token, 64) && validCode(normalizeCode(m.code)) ? { ok: true } : { ok: false, err: 'bad_resume' };
    case 'dmg': return isStr(m.area, 40) && isInt(m.id, 0, 1e6) && isInt(m.dmg, 0, 500) && isInt(m.max, 1, 10000) && typeof m.respawn === 'number' && m.respawn > 0 && m.respawn <= 600 ? { ok: true } : { ok: false, err: 'bad_dmg' };
    case 'msg': break;
    default: return { ok: false, err: 'unknown_type' };
  }
  const d = m.d;
  if (!d || typeof d !== 'object' || Array.isArray(d) || typeof d.k !== 'string') return { ok: false, err: 'bad_payload' };
  if (!PEER_KINDS.has(d.k)) return { ok: false, err: 'unknown_kind' };
  if (m.to !== undefined && !isStr(m.to, 12)) return { ok: false, err: 'bad_to' };
  if (depthOf(d) > 6) return { ok: false, err: 'too_deep' };
  if (JSON.stringify(d).length > (LIMIT[d.k] ?? DEFAULT_LIMIT)) return { ok: false, err: 'too_big' };
  if (d.k === 'chat' && !isStr(d.x, 120)) return { ok: false, err: 'bad_chat' };
  if (d.k.startsWith('trade_') && !isStr(d.tid, 40)) return { ok: false, err: 'bad_tid' };
  if (d.k === 'trade_ready' && (typeof d.ok !== 'boolean' || !isStr(d.to, 12) || (d.ok && !isStr(d.h, 20)))) return { ok: false, err: 'bad_ready' };
  return { ok: true };
}

export class RateLimiter {
  constructor({ rate = 40, burst = 80, now = () => Date.now() } = {}) { this.rate = rate; this.burst = burst; this.now = now; this.tokens = burst; this.ts = now(); }
  take(cost = 1) { const t = this.now(); this.tokens = Math.min(this.burst, this.tokens + ((t - this.ts) / 1000) * this.rate); this.ts = t; if (this.tokens < cost) return false; this.tokens -= cost; return true; }
}
