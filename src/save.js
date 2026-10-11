// Single-slot localStorage save (versioned; the shape leaves room for more skills / slots later).
import { SKILL_IDS, SLOT_IDS, START_AREA } from './data.js';
export const SAVE_VERSION = 1;
export const SAVE_KEY = 'ironbound-save-v1';
export const LOOKS = [
  { skin: '#f2c9a0', hair: '#5a3a1e', shirt: '#3b8eea' },
  { skin: '#d9a273', hair: '#1f1a17', shirt: '#e0463c' },
  { skin: '#8d5a3b', hair: '#e8c34a', shirt: '#3fb950' },
  { skin: '#f6d9bf', hair: '#b5391f', shirt: '#9b59d0' },
];
export function newData(name, look = 0) {
  const xp = Object.fromEntries(SKILL_IDS.map((s) => [s, 0]));
  xp.hitpoints = 1154; // level 10, as in RuneScape
  return {
    v: SAVE_VERSION, name: String(name || 'Hero').slice(0, 14), look: look % LOOKS.length, xp, hp: 10,
    stance: 'accurate', coins: 0, area: START_AREA,
    bag: [{ id: 'bronze_pickaxe', n: 1 }, { id: 'bronze_axe', n: 1 }, { id: 'hammer', n: 1 }],
    bank: {}, equip: Object.fromEntries(SLOT_IDS.map((s) => [s, null])), visited: {}, stats: { kills: 0, played: 0 },
  };
}
/** Fills any missing field so older/partial saves load (add migrations here when SAVE_VERSION grows). */
export function migrate(d) {
  if (!d || typeof d !== 'object') return null;
  const base = newData(d.name, d.look);
  const out = { ...base, ...d, xp: { ...base.xp, ...(d.xp || {}) }, equip: { ...base.equip, ...(d.equip || {}) }, stats: { ...base.stats, ...(d.stats || {}) } };
  out.bag = Array.isArray(d.bag) ? d.bag.filter((s) => s && s.id && s.n > 0) : base.bag;
  out.bank = d.bank && typeof d.bank === 'object' ? d.bank : {};
  out.visited = d.visited && typeof d.visited === 'object' ? d.visited : {};
  out.v = SAVE_VERSION;
  return out;
}
export function loadSave(storage = globalThis.localStorage) {
  try { const raw = storage.getItem(SAVE_KEY); return raw ? migrate(JSON.parse(raw)) : null; } catch { return null; }
}
export function writeSave(data, storage = globalThis.localStorage) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
export function clearSave(storage = globalThis.localStorage) { try { storage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
