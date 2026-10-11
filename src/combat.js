// RuneScape-style melee formulas (pure functions, easy to unit test).
import { STANCE_BY_ID, ITEMS, SLOT_IDS } from './data.js';
import { levelForXp } from './xp.js';

/** effective level = level + 8 (+3 when the stance trains that skill) */
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
export function combatLevel({ attack, strength, defence, hitpoints }) {
  const base = 0.25 * (defence + hitpoints);
  const melee = 0.325 * (attack + strength);
  return Math.floor(base + melee);
}
export const gearBonuses = (equip) => {
  const b = { atk: 0, str: 0, def: 0 };
  for (const s of SLOT_IDS) {
    const it = ITEMS[equip?.[s]];
    if (it?.bonus) { b.atk += it.bonus.atk; b.str += it.bonus.str; b.def += it.bonus.def; }
  }
  return b;
};
export const weaponInterval = (equip) => ITEMS[equip?.weapon]?.interval || 1.5;

/** Everything the fight needs about the hero, from levels (map skill->level), equipment and stance id. */
export function heroCombat(levels, equip, stanceId) {
  const st = STANCE_BY_ID[stanceId] || STANCE_BY_ID.accurate;
  const g = gearBonuses(equip);
  const sb = (skill) => (st.bonus === skill ? 3 : 0);
  return {
    bonuses: g,
    maxHit: maxHit(levels.strength, g.str, sb('strength')),
    atkRoll: attackRoll(levels.attack, g.atk, sb('attack')),
    defRoll: defenceRoll(levels.defence, g.def, sb('defence')),
    interval: weaponInterval(equip),
  };
}
export const monsterDefRoll = (m) => (m.def + 9) * 64;
export const monsterAtkRoll = (m) => (m.atk + 9) * 64;
export const heroHitChance = (hc, m) => hitChance(hc.atkRoll, monsterDefRoll(m));
export const monsterHitChance = (hc, m) => hitChance(monsterAtkRoll(m), hc.defRoll);
export { levelForXp };
