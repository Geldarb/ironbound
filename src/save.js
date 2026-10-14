// Single-slot localStorage save (versioned; the shape leaves room for more skills / slots later).
import { SKILL_IDS, SLOT_IDS, START_AREA, AREAS, ARROW_IDS } from './data.js';
import { levelForXp } from './xp.js';
/** v7: the old map (meadow/quarry/peaks) was replaced; send old area ids to the closest new area */
export const AREA_RENAMES = { meadow: 'lumby', quarry: 'draynor', peaks: 'alkharid' };
export const SAVE_VERSION = 8;
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
    bag: [{ id: 'bronze_pickaxe', n: 1 }, { id: 'bronze_axe', n: 1 }, { id: 'hammer', n: 1 }, { id: 'small_net', n: 1 }],
    bank: {}, equip: Object.fromEntries(SLOT_IDS.map((s) => [s, null])), visited: {}, stats: { kills: 0, played: 0 },
    autoEat: { on: true, pct: 50 }, lastSeen: 0, activity: null,
    ep: 20, pity: 0, equipEnch: {}, bankGear: [], visitedAreas: { [START_AREA]: true },
    prayerPoints: 1, activePrayers: [],
    slayerTask: null, slayerStreak: 0,
    energy: 100, special: 100, achievements: {},
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
  out.autoEat = { ...base.autoEat, ...(d.autoEat || {}) };
  out.activity = d.activity && typeof d.activity === 'object' ? d.activity : null;
  out.lastSeen = Number(d.lastSeen) || 0;
  // v1 -> v2: fishing/cooking skills start at 0 (filled above); everyone gets the starter net. Levels are untouched (the XP table is unchanged; only gain rates changed).
  if ((d.v || 1) < 2 && !out.bag.some((x) => x.id === 'small_net') && out.bag.length < 28) out.bag.push({ id: 'small_net', n: 1 });
  out.equipEnch = d.equipEnch && typeof d.equipEnch === 'object' ? d.equipEnch : {};
  out.bankGear = Array.isArray(d.bankGear) ? d.bankGear : [];
  // v6 -> v7: remap retired area ids (current area, saved activity, visited list) so old saves resume in the new world
  const ren = (a) => AREA_RENAMES[a] || a;
  out.area = AREAS[ren(out.area)] ? ren(out.area) : START_AREA;
  if (out.activity) out.activity = { ...out.activity, area: ren(out.activity.area) };
  const va = {}; for (const k of Object.keys(d.visitedAreas || {})) if (d.visitedAreas[k] && AREAS[ren(k)]) va[ren(k)] = true;
  out.visitedAreas = { [START_AREA]: true, ...va, [out.area]: true };
  out.pity = Number(d.pity) || 0;
  // v2 -> v3: Enchant Points arrive (everyone gets a 20 EP welcome gift), weapons gain styles (stance ids stay valid), boots/gloves slots start empty
  out.ep = (d.v || 1) < 3 ? 20 + (Number(d.ep) || 0) : Number(d.ep) || 0;
  if (!['accurate', 'aggressive', 'controlled', 'defensive'].includes(out.stance)) out.stance = 'accurate';
  // v3 -> v4: Prayer skill + prayer points
  if ((d.v || 1) < 4) {
    out.xp.prayer = out.xp.prayer || 0;
    out.prayerPoints = levelForXp(out.xp.prayer || 0);
  }
  out.prayerPoints = Math.min(levelForXp(out.xp.prayer || 0), Math.max(0, Number(out.prayerPoints) || 0)) || (d.prayerPoints === 0 ? 0 : 1);
  out.activePrayers = Array.isArray(d.activePrayers) ? d.activePrayers.filter((id) => typeof id === 'string') : [];
  // v4 -> v5: Slayer skill + task
  if ((d.v || 1) < 5) {
    out.xp.slayer = out.xp.slayer || 0;
    out.slayerTask = null;
    out.slayerStreak = 0;
  }
  out.slayerTask = d.slayerTask && typeof d.slayerTask === 'object' ? d.slayerTask : null;
  out.slayerStreak = Number(d.slayerStreak) || 0;
  // v5 -> v6: Magic, Ranged, Crafting, Fletching, Runecraft, energy, special, achievements
  if ((d.v || 1) < 6) {
    out.xp.ranged = out.xp.ranged || 0;
    out.xp.magic = out.xp.magic || 0;
    out.xp.crafting = out.xp.crafting || 0;
    out.xp.fletching = out.xp.fletching || 0;
    out.xp.runecrafting = out.xp.runecrafting || 0;
    out.energy = 100;
    out.special = 100;
    out.achievements = {};
  }
  out.energy = Number.isFinite(d.energy) ? Math.max(0, Math.min(100, d.energy)) : 100;
  out.special = Number.isFinite(d.special) ? Math.max(0, Math.min(100, d.special)) : 100;
  out.achievements = d.achievements && typeof d.achievements === 'object' ? d.achievements : {};
  // v8: ammo slot. Arrows used to be drawn from the bag: quiver the best stack the save already has.
  out.ammoN = Number.isInteger(d.ammoN) && d.ammoN > 0 && out.equip.ammo ? d.ammoN : 0;
  if (!out.ammoN) out.equip.ammo = null;
  if ((d.v || 0) < 8 && !out.equip.ammo && Array.isArray(out.bag)) {
    const best = ARROW_IDS.find((id) => out.bag.some((s) => s.id === id));
    if (best) { const n = out.bag.filter((s) => s.id === best).reduce((a, s) => a + (s.n || 0), 0); out.bag = out.bag.filter((s) => s.id !== best); out.equip.ammo = best; out.ammoN = n; }
  }
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
