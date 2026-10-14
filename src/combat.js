// RuneScape-style melee formulas (pure functions, easy to unit test).
import { STANCE_BY_ID, ITEMS, SLOT_IDS, ALL_WEAPON_KINDS, UNARMED, DMG_TYPES } from './data.js';
import { levelForXp } from './xp.js';

/** effective level = level + 8 (+ stance bonus: +3 for the trained skill, +1 each when controlled) */
export const effLevel = (level, styleBonus = 0) => level + 8 + styleBonus;
/** RS max hit = floor(0.5 + effStr * (strBonus + 64) / 640) */
export const maxHit = (strLevel, strBonus, styleBonus = 0) => Math.floor(0.5 + (effLevel(strLevel, styleBonus) * (strBonus + 64)) / 640);
export const attackRoll = (atkLevel, atkBonus, styleBonus = 0) => effLevel(atkLevel, styleBonus) * (atkBonus + 64);
export const defenceRoll = (defLevel, defBonus, styleBonus = 0) => effLevel(defLevel, styleBonus) * (defBonus + 64);
/** RS hit chance from an attack roll vs a defence roll */
export function hitChance(atkRoll, defRoll) {
  return atkRoll > defRoll ? 1 - (defRoll + 2) / (2 * (atkRoll + 1)) : atkRoll / (2 * (defRoll + 1));
}
/** RS combat level (melee only for now: Ranged/Magic/Prayer slot in here later) */
export function combatLevel({ attack, strength, defence, hitpoints, ranged = 1, magic = 1, prayer = 1 }) {
  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
  const melee = 0.325 * (attack + strength), rng = 0.325 * Math.floor(ranged * 1.5), mag = 0.325 * Math.floor(magic * 1.5);
  return Math.floor(base + Math.max(melee, rng, mag));
}
export const gearBonuses = (equip) => {
  const b = { atk: 0, str: 0, def: 0, a: { stab: 0, slash: 0, crush: 0 } };
  for (const s of SLOT_IDS) {
    const it = ITEMS[equip?.[s]];
    if (!it?.bonus) continue;
    b.atk += it.bonus.atk; b.str += it.bonus.str; b.def += it.bonus.def;
    if (it.bonus.a) for (const t of DMG_TYPES) b.a[t] += it.bonus.a[t] || 0;
    b.rng = (b.rng || 0) + (it.bonus.rng || 0); b.mag = (b.mag || 0) + (it.bonus.mag || 0);
  }
  return b;
};
export const weaponKind = (equip) => { const w = ITEMS[equip?.weapon]; return (w && ALL_WEAPON_KINDS[w.wk]) || UNARMED; };
export const weaponInterval = (equip) => ITEMS[equip?.weapon]?.interval || UNARMED.interval;
/** the combat style the weapon offers for a stance (falls back to its first style, e.g. spears have no Accurate) */
export const activeStyle = (equip, stanceId) => { const st = weaponKind(equip).styles; return st.find((s) => s.stance === stanceId) || st[0]; };

export const NO_MODS = Object.freeze({ maxhit: 0, acc: 0, speed: 0, lifesteal: 0, crit: 0, xp: 0, drop: 0, burn: 0, def: 0, regen: 0, gather: 0, vs: {} });

/** Everything the fight needs about the hero, from levels (map skill->level), equipment, stance id and enchant modifier totals. */
export function heroCombat(levels, equip, stanceId, mods = NO_MODS, ctx = {}) {
  const style = activeStyle(equip, stanceId), st = STANCE_BY_ID[style.stance];
  const g = gearBonuses(equip), w = ITEMS[equip?.weapon];
  const sb = (skill) => (style.bonus ? style.bonus[skill] || 0 : st.bonus[skill] || 0);
  // ranged: Ranged level + bow accuracy, max hit from Ranged level + arrow strength. magic: Magic level + staff bonus, max hit = spell.
  let atkRoll, baseMax, ammo = null, spell = null;
  if (style.type === 'ranged') {
    ammo = ctx.ammo || null;
    atkRoll = attackRoll(levels.ranged || 1, g.rng || 0, sb('ranged'));
    baseMax = ammo ? maxHit(levels.ranged || 1, ITEMS[ammo]?.ammo || 0, sb('ranged')) : 0;
  } else if (style.type === 'magic') {
    spell = ctx.spell || null;
    atkRoll = attackRoll(levels.magic || 1, g.mag || 0, sb('magic'));
    baseMax = spell ? spell.maxHit : 0; // OSRS: standard spells have fixed max hits
  } else {
    atkRoll = attackRoll(levels.attack, g.a[style.type] || 0, sb('attack'));
    baseMax = maxHit(levels.strength, g.str, sb('strength'));
  }
  return {
    bonuses: g, style, stance: style.stance, type: style.type, mods, ammo, spell,
    maxHit: baseMax + (mods.maxhit && baseMax ? Math.max(1, Math.round(baseMax * mods.maxhit)) : 0),
    atkRoll: atkRoll * (1 + mods.acc),
    defRoll: defenceRoll(levels.defence, g.def, sb('defence')) * (1 + mods.def),
    interval: Math.round(((weaponInterval(equip) - (style.speed || 0)) * (1 - Math.min(0.4, mods.speed))) * 100) / 100,
    reach: style.melee ? 0 : w?.reach || weaponKind(equip).reach || 0, two: !!w?.two, weapon: weaponKind(equip),
  };
}
export const monsterDefRoll = (m, type = 'slash') => (m.def + 9) * (64 + (m.defB?.[type] || 0));
export const monsterAtkRoll = (m) => (m.atk + 9) * 64;
export const heroHitChance = (hc, m) => hitChance(hc.atkRoll, monsterDefRoll(m, hc.type));
export const monsterHitChance = (hc, m) => hitChance(monsterAtkRoll(m), hc.defRoll);
/** expected damage per second against a monster (used for offline progress and previews) */
export function expectedDps(hc, m) {
  const vs = 1 + (hc.mods.vs?.[m.family] || 0);
  const avg = (hc.maxHit / 2) * vs * (1 + 0.5 * hc.mods.crit) + hc.mods.burn * Math.ceil(hc.maxHit / 3);
  return (heroHitChance(hc, m) * avg) / hc.interval;
}
export { levelForXp };
