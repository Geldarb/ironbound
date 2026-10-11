// Enchanting: Enchant Points (EP) are spent at the altar to roll random modifiers onto weapons, armour and tools.
// An enchant is stored per item instance: { r: rarityIndex, mods: [{ k, v, fam? }], rolls: n }. All maths here is pure + seedable.
import { ITEMS } from './data.js';
import { NO_MODS } from './combat.js';

export const RARITIES = [
  { id: 'common', name: 'Common', w: 60, n: [1, 1], scale: 1, color: '#b8bec6' },
  { id: 'uncommon', name: 'Uncommon', w: 25, n: [1, 2], scale: 1.5, color: '#4ec35b' },
  { id: 'rare', name: 'Rare', w: 10, n: [2, 2], scale: 2.2, color: '#4aa3ff' },
  { id: 'epic', name: 'Epic', w: 4, n: [2, 3], scale: 3, color: '#b266ff' },
  { id: 'legendary', name: 'Legendary', w: 0.9, n: [3, 3], scale: 4.2, color: '#ff9d2e' },
  { id: 'mythic', name: 'Mythic', w: 0.1, n: [3, 3], scale: 6, color: '#ff4d6d' },
];
export const PITY_RARE = 10, PITY_EPIC = 20;
export const FAMILIES = { beast: 'beasts', humanoid: 'humanoids', giant: 'giants' };
/** modifier pool: base value (as a % at Common) and where it can roll. cats: weapon | armour | tool */
export const MODS = {
  maxhit: { name: 'Max hit', base: 4, cats: ['weapon'], fmt: (v) => `+${v}% max hit` },
  acc: { name: 'Accuracy', base: 4, cats: ['weapon'], fmt: (v) => `+${v}% accuracy` },
  speed: { name: 'Attack speed', base: 3, cats: ['weapon'], cap: 40, fmt: (v) => `+${v}% attack speed` },
  lifesteal: { name: 'Lifesteal', base: 3, cats: ['weapon'], fmt: (v) => `${v}% lifesteal` },
  crit: { name: 'Critical', base: 3, cats: ['weapon'], cap: 60, fmt: (v) => `${v}% crit chance (x1.5)` },
  vs: { name: 'Slayer', base: 8, cats: ['weapon'], fmt: (v, m) => `+${v}% damage vs ${FAMILIES[m.fam] || m.fam}` },
  burn: { name: 'Burn', base: 6, cats: ['weapon'], cap: 60, fmt: (v) => `${v}% burn proc` },
  xp: { name: 'Experience', base: 3, cats: ['weapon', 'armour', 'tool'], fmt: (v) => `+${v}% XP` },
  drop: { name: 'Fortune', base: 4, cats: ['weapon', 'armour', 'tool'], fmt: (v) => `+${v}% drop chance` },
  def: { name: 'Defence', base: 4, cats: ['armour'], fmt: (v) => `+${v}% defence` },
  regen: { name: 'Regeneration', base: 8, cats: ['armour'], fmt: (v) => `+${v}% HP regen` },
  gather: { name: 'Gathering', base: 6, cats: ['tool'], fmt: (v) => `+${v}% gather speed` },
};
export const BASE_COST = { weapon: 10, armour: 8, tool: 5 };
export const REROLL_GROWTH = 1.5;
export const LOCK_SURCHARGE = 0.5; // lock one modifier: +50% of the reroll cost (min 5)

/** which enchant category an item belongs to, or null when it cannot be enchanted */
export function enchantCategory(id) {
  const it = ITEMS[id];
  if (!it) return null;
  if (it.slot === 'weapon') return 'weapon';
  if (it.slot) return 'armour';
  if (it.tool && it.tier != null) return 'tool';
  return null;
}
export const isEnchantable = (id) => !!enchantCategory(id);
export const rarityOf = (e) => (e ? RARITIES[e.r] : null);

/** rarity index for a roll. `pity` = rolls since the last Epic+: >= 10 guarantees Rare+, >= 20 guarantees Epic+ */
export function rollRarity(rng, pity = 0) {
  const min = pity >= PITY_EPIC ? 3 : pity >= PITY_RARE ? 2 : 0;
  const ws = RARITIES.map((r, i) => (i < min ? 0 : r.w));
  let t = ws.reduce((a, b) => a + b, 0), x = rng() * t;
  for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x < 0) return i; }
  return ws.length - 1;
}
export const nextPity = (pity, rarity) => (rarity >= 3 ? 0 : pity + 1);

function rollValue(k, rarity, rng) {
  const m = MODS[k], v = m.base * RARITIES[rarity].scale * (0.8 + rng() * 0.4);
  return Math.min(m.cap || 1000, Math.max(1, Math.round(v * 10) / 10));
}
/** roll `count` distinct modifier kinds for a category (keeping `locked` mods as they are) */
export function rollMods(rng, rarity, cat, isTool = false, locked = []) {
  const [lo, hi] = RARITIES[rarity].n;
  const count = Math.max(locked.length, lo + Math.floor(rng() * (hi - lo + 1)));
  const mods = locked.map((m) => ({ ...m }));
  const pool = Object.keys(MODS).filter((k) => (MODS[k].cats.includes(cat) || (isTool && MODS[k].cats.includes('tool'))) && !mods.some((m) => m.k === k));
  while (mods.length < count && pool.length) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const mod = { k, v: rollValue(k, rarity, rng) };
    if (k === 'vs') mod.fam = Object.keys(FAMILIES)[Math.floor(rng() * 3)];
    mods.push(mod);
  }
  return mods;
}
/** a full enchant for an item id. lockIdx: index of a modifier of `prev` to keep. pity: current pity counter */
export function rollEnchant(id, rng, { pity = 0, prev = null, lockIdx = -1 } = {}) {
  const cat = enchantCategory(id), it = ITEMS[id];
  const r = rollRarity(rng, pity);
  const locked = prev && lockIdx >= 0 && prev.mods[lockIdx] ? [prev.mods[lockIdx]] : [];
  return { r, mods: rollMods(rng, r, cat, !!it.tool, locked), rolls: (prev?.rolls || 0) + 1 };
}
/** EP cost of the next roll on an enchant (null = fresh item) */
export function rollCost(id, ench, lock = false) {
  const base = BASE_COST[enchantCategory(id)] || 10;
  const c = Math.round(base * Math.pow(REROLL_GROWTH, ench?.rolls || 0));
  return c + (lock && ench ? Math.max(5, Math.round(c * LOCK_SURCHARGE)) : 0);
}
export const modText = (m) => MODS[m.k].fmt(m.v, m);
export const enchantTitle = (e) => (e ? `${RARITIES[e.r].name} enchant` : '');

/** sum enchant modifiers into the fractions the combat code uses (0.05 = 5%) */
export function sumMods(enchants) {
  const out = { ...NO_MODS, vs: {} };
  for (const e of enchants) {
    if (!e) continue;
    for (const m of e.mods) {
      if (m.k === 'vs') out.vs[m.fam] = (out.vs[m.fam] || 0) + m.v / 100;
      else out[m.k] = Math.min((MODS[m.k].cap || 1000) / 100, (out[m.k] || 0) + m.v / 100);
    }
  }
  return out;
}
