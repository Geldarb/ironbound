// Static game data. Everything is tables so tiers / skills / areas can be extended (steel..rune, ranged, magic) without touching rules.
export const SKILLS = [
  { id: 'attack', name: 'Attack', color: '#e0463c', short: 'Atk' },
  { id: 'strength', name: 'Strength', color: '#3fb950', short: 'Str' },
  { id: 'defence', name: 'Defence', color: '#3b8eea', short: 'Def' },
  { id: 'hitpoints', name: 'Hitpoints', color: '#ff6b81', short: 'HP' },
  { id: 'mining', name: 'Mining', color: '#c9773a', short: 'Min' },
  { id: 'smithing', name: 'Smithing', color: '#9aa3ad', short: 'Smi' },
  { id: 'woodcutting', name: 'Woodcutting', color: '#7a9a3a', short: 'Wdc' },
  { id: 'fishing', name: 'Fishing', color: '#4aa3e8', short: 'Fis' },
  { id: 'cooking', name: 'Cooking', color: '#e8a33a', short: 'Coo' },
  { id: 'prayer', name: 'Prayer', color: '#c9a227', short: 'Pra' },
];
/** Global XP multiplier applied to every XP gain (combat + gathering + crafting). The level table itself is the real RuneScape one,
 *  so changing this never changes anyone's stored level. Single tunable: 3 => level 2 in ~3 chicken kills, level 10 in a few minutes. */
export const XP_RATE = 3;
/** Offline progress tuning */
export const OFFLINE = { minAway: 60, capHours: 3, efficiency: 0.5 };
export const SKILL_IDS = SKILLS.map((s) => s.id);
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const COMBAT_SKILLS = ['attack', 'strength', 'defence', 'hitpoints'];

// ---- Prayer. Points drain while a prayer is active. Bones are buried for XP.
export const PRAYERS = [
  { id: 'thick_skin', name: 'Thick Skin', level: 1, drain: 0.4, blurb: '+5% Defence' },
  { id: 'burst_of_strength', name: 'Burst of Strength', level: 4, drain: 0.4, blurb: '+5% Strength' },
  { id: 'clarity_of_thought', name: 'Clarity of Thought', level: 7, drain: 0.4, blurb: '+5% Attack' },
  { id: 'rock_skin', name: 'Rock Skin', level: 10, drain: 0.6, blurb: '+10% Defence' },
  { id: 'superhuman_strength', name: 'Superhuman Strength', level: 13, drain: 0.6, blurb: '+10% Strength' },
  { id: 'improved_reflexes', name: 'Improved Reflexes', level: 16, drain: 0.6, blurb: '+10% Attack' },
];
export const PRAYER_BY_ID = Object.fromEntries(PRAYERS.map((p) => [p.id, p]));
/** Bone types: base XP when buried anywhere, altar XP (bonus), and EP chance per bone when used at the prayer altar. */
export const BONES = {
  bones: { name: 'Bones', xp: 4.5, altarXp: 9, epChance: 0.4, epFlat: 1 },
  big_bones: { name: 'Big bones', xp: 15, altarXp: 30, epChance: 0.6, epFlat: 2 },
};
export const BONE_XP = Object.fromEntries(Object.entries(BONES).map(([k, v]) => [k, v.xp]));

// ---- combat styles (melee). `bonus` = which effective level gets +3; `xp` = skills that get the 4 xp per damage.
export const STANCES = [
  { id: 'accurate', name: 'Accurate', short: 'Acc', bonus: { attack: 3 }, xp: ['attack'], blurb: '+3 effective Attack. Trains Attack.' },
  { id: 'aggressive', name: 'Aggressive', short: 'Agg', bonus: { strength: 3 }, xp: ['strength'], blurb: '+3 effective Strength. Trains Strength.' },
  { id: 'controlled', name: 'Controlled', short: 'Ctl', bonus: { attack: 1, strength: 1, defence: 1 }, xp: ['attack', 'strength', 'defence'], blurb: '+1 to Attack, Strength and Defence. Shares XP between all three.' },
  { id: 'defensive', name: 'Defensive', short: 'Def', bonus: { defence: 3 }, xp: ['defence'], blurb: '+3 effective Defence. Trains Defence.' },
];
/** XP split for a stance: [[skill, share]] (4 xp per damage * share) */
export const stanceXp = (id) => { const st = STANCES.find((x) => x.id === id) || STANCES[0]; return st.xp.map((k) => [k, 1 / st.xp.length]); };
export const STANCE_BY_ID = Object.fromEntries(STANCES.map((s) => [s.id, s]));

// ---- equipment tiers (RuneScape names). reqLevel is the Attack (weapons) / Defence (armour) level needed.
export const TIERS = [
  { id: 'bronze', name: 'Bronze', req: 1, color: '#d08f55', dark: '#8a5a28' },
  { id: 'iron', name: 'Iron', req: 1, color: '#aab3bf', dark: '#5f6875' },
  { id: 'steel', name: 'Steel', req: 5, color: '#c9d6e3', dark: '#74869b' },
  { id: 'mithril', name: 'Mithril', req: 20, color: '#6a8ee8', dark: '#35508f' },
  { id: 'adamant', name: 'Adamant', req: 30, color: '#4cbf6b', dark: '#2a7a42' },
  { id: 'rune', name: 'Rune', req: 40, color: '#38c8d8', dark: '#17808c' },
];
export const TIER_IDX = Object.fromEntries(TIERS.map((t, i) => [t.id, i]));

export const SLOTS = [
  { id: 'head', name: 'Head' }, { id: 'body', name: 'Body' }, { id: 'legs', name: 'Legs' },
  { id: 'weapon', name: 'Weapon' }, { id: 'shield', name: 'Shield' }, { id: 'gloves', name: 'Gloves' }, { id: 'boots', name: 'Boots' },
];
export const SLOT_IDS = SLOTS.map((s) => s.id);

// Demo pacing: attack intervals are shorter than RuneScape's 2.4s (a 'tick' is 0.3s here).
// per-tier base tables (index = tier). Weapon stats = base * the kind's multipliers.
const ATKB = [4, 7, 11, 16, 22, 38], STRB = [5, 7, 11, 16, 22, 39];
const ARMOUR = { helm: [3, 6, 9, 13, 18, 27], shield: [5, 9, 13, 19, 26, 40], body: [10, 18, 25, 35, 48, 70], legs: [7, 12, 18, 26, 36, 52], boots: [2, 3, 5, 7, 10, 15], gloves: [2, 3, 5, 7, 10, 15] };
export const DMG_TYPES = ['stab', 'slash', 'crush'];
const S = (stance, name, type) => ({ stance, name, type });
/** Weapon kinds. a = attack-bonus multipliers per damage type, str = strength multiplier, interval = seconds per swing,
 *  two = two-handed (also takes the shield slot), reach = extra px of melee reach, styles = RS-like combat styles (name + damage type) per stance. */
export const WEAPON_KINDS = {
  dagger: { name: 'Dagger', interval: 1.2, bars: 1, lvl: 1, a: { stab: 1, slash: 0.55, crush: 0 }, str: 0.6, blurb: 'Fast, stab', styles: [S('accurate', 'Stab', 'stab'), S('aggressive', 'Slash', 'slash'), S('defensive', 'Block', 'stab')] },
  sword: { name: 'Sword', interval: 1.5, bars: 1, lvl: 4, a: { stab: 0.9, slash: 1, crush: 0 }, str: 1, blurb: 'Balanced', styles: [S('accurate', 'Stab', 'stab'), S('aggressive', 'Slash', 'slash'), S('defensive', 'Block', 'slash')] },
  scimitar: { name: 'Scimitar', interval: 1.2, bars: 2, lvl: 5, a: { stab: 0.3, slash: 1.25, crush: 0 }, str: 0.95, blurb: 'Fast, slash, best accuracy', styles: [S('accurate', 'Chop', 'slash'), S('aggressive', 'Slash', 'slash'), S('controlled', 'Lunge', 'stab'), S('defensive', 'Block', 'slash')] },
  longsword: { name: 'Longsword', interval: 1.5, bars: 2, lvl: 6, a: { stab: 0.95, slash: 1.1, crush: 0 }, str: 1.15, blurb: 'Solid slash and stab', styles: [S('accurate', 'Chop', 'slash'), S('aggressive', 'Slash', 'slash'), S('controlled', 'Lunge', 'stab'), S('defensive', 'Block', 'slash')] },
  mace: { name: 'Mace', interval: 1.5, bars: 1, lvl: 2, a: { stab: 0.3, slash: 0, crush: 1 }, str: 0.9, blurb: 'Crush', styles: [S('accurate', 'Pound', 'crush'), S('aggressive', 'Pummel', 'crush'), S('controlled', 'Spike', 'stab'), S('defensive', 'Block', 'crush')] },
  warhammer: { name: 'Warhammer', interval: 1.8, bars: 3, lvl: 9, a: { stab: 0, slash: 0, crush: 1.1 }, str: 1.6, blurb: 'Slow, heavy crush', styles: [S('accurate', 'Pound', 'crush'), S('aggressive', 'Pummel', 'crush'), S('defensive', 'Block', 'crush')] },
  axe: { name: 'Axe', interval: 1.5, bars: 1, lvl: 1, a: { stab: 0, slash: 1, crush: 0.7 }, str: 1.2, tool: 'axe', blurb: 'Slash, strong. Also chops trees', styles: [S('accurate', 'Chop', 'slash'), S('aggressive', 'Hack', 'slash'), S('controlled', 'Smash', 'crush'), S('defensive', 'Block', 'slash')] },
  battleaxe: { name: 'Battleaxe', interval: 1.8, bars: 3, lvl: 10, a: { stab: 0, slash: 1.2, crush: 0.8 }, str: 1.65, blurb: 'Slow, strong slash', styles: [S('accurate', 'Chop', 'slash'), S('aggressive', 'Hack', 'slash'), S('controlled', 'Smash', 'crush'), S('defensive', 'Block', 'slash')] },
  '2h': { name: '2h sword', interval: 2.1, bars: 3, lvl: 14, a: { stab: 0.8, slash: 1.4, crush: 0 }, str: 2, two: true, blurb: 'Slow, two-handed, huge hits', styles: [S('accurate', 'Chop', 'slash'), S('aggressive', 'Slash', 'slash'), S('controlled', 'Smash', 'crush'), S('defensive', 'Block', 'slash')] },
  spear: { name: 'Spear', interval: 1.5, bars: 1, lvl: 7, a: { stab: 1, slash: 0.7, crush: 0.7 }, str: 1, reach: 18, blurb: 'Reach, controlled', styles: [S('controlled', 'Lunge', 'stab'), S('aggressive', 'Swipe', 'slash'), S('defensive', 'Block', 'stab')] },
  halberd: { name: 'Halberd', interval: 2.1, bars: 2, lvl: 12, a: { stab: 1.2, slash: 1.1, crush: 0 }, str: 1.8, two: true, reach: 38, blurb: 'Long reach, two-handed', styles: [S('controlled', 'Jab', 'stab'), S('aggressive', 'Swipe', 'slash'), S('defensive', 'Fend', 'stab')] },
};
export const UNARMED = { name: 'Unarmed', interval: 1.5, a: { stab: 0, slash: 0, crush: 0 }, str: 0, blurb: 'Fists', styles: [S('accurate', 'Punch', 'crush'), S('aggressive', 'Kick', 'crush'), S('defensive', 'Block', 'crush')] };
export const ARMOUR_KINDS = {
  helm: { name: 'Med Helm', slot: 'head', bars: 1, lvl: 3, art: 'helm' },
  shield: { name: 'Kiteshield', slot: 'shield', bars: 2, lvl: 8, art: 'shield' },
  legs: { name: 'Platelegs', slot: 'legs', bars: 3, lvl: 16, art: 'legs' },
  body: { name: 'Platebody', slot: 'body', bars: 5, lvl: 18, art: 'body' },
  gloves: { name: 'Gauntlets', slot: 'gloves', bars: 1, lvl: 10, art: 'gloves' },
  boots: { name: 'Plate boots', slot: 'boots', bars: 1, lvl: 12, art: 'boots' },
};
export const GEAR_KINDS = { ...Object.fromEntries(Object.entries(WEAPON_KINDS).map(([k, w]) => [k, { ...w, slot: 'weapon', smithLevel: w.lvl, art: k }])), ...Object.fromEntries(Object.entries(ARMOUR_KINDS).map(([k, a]) => [k, { ...a, smithLevel: a.lvl }])) };
/** all kinds that can be smithed (gear + pickaxe) */
export const SMITH_KINDS = { ...GEAR_KINDS, pickaxe: { name: 'Pickaxe', bars: 2, smithLevel: 5, art: 'pickaxe', tool: 'pickaxe' } };
// smithing level needed per tier, added to the kind's own level (capped at 99)
export const TIER_SMITH = [0, 14, 29, 49, 69, 84];
export const BAR_XP = [12.5, 25, 37.5, 50, 62.5, 75];
export const TIER_BAR = ['bronze_bar', 'iron_bar', 'steel_bar', 'mithril_bar', 'adamant_bar', 'rune_bar'];

export const ITEMS = {};
const add = (id, o) => { ITEMS[id] = { id, ...o }; };
// materials
add('coins', { name: 'Coins', stack: true, value: 1, art: 'coins' });
add('copper_ore', { name: 'Copper ore', stack: true, value: 4, art: 'ore', c: '#c9773a' });
add('tin_ore', { name: 'Tin ore', stack: true, value: 4, art: 'ore', c: '#b9c2cf' });
add('iron_ore', { name: 'Iron ore', stack: true, value: 12, art: 'ore', c: '#8f5a4a' });
add('coal', { name: 'Coal', stack: true, value: 20, art: 'ore', c: '#33343a' });
add('mithril_ore', { name: 'Mithril ore', stack: true, value: 50, art: 'ore', c: '#4a68c8' });
add('adamant_ore', { name: 'Adamantite ore', stack: true, value: 100, art: 'ore', c: '#3aa05a' });
add('runite_ore', { name: 'Runite ore', stack: true, value: 300, art: 'ore', c: '#38c8d8' });
add('logs', { name: 'Logs', stack: true, value: 4, art: 'log', c: '#b9824a' });
add('oak_logs', { name: 'Oak logs', stack: true, value: 10, art: 'log', c: '#9a6a3a' });
add('enchant_gem', { name: 'Enchantment gem', stack: false, value: 50, art: 'gem', c: '#b266ff' });
add('bones', { name: 'Bones', stack: true, value: 1, art: 'bones', c: '#f3ead2' });
add('big_bones', { name: 'Big bones', stack: true, value: 8, art: 'bones', c: '#e8dcc0' });
add('feather', { name: 'Feather', stack: true, value: 2, art: 'feather', c: '#ffffff' });
add('wolf_pelt', { name: 'Wolf pelt', stack: true, value: 18, art: 'pelt', c: '#8a8f98' });
for (const [i, t] of TIERS.entries()) add(TIER_BAR[i], { name: `${t.name} bar`, stack: true, value: [10, 24, 50, 100, 200, 600][i], art: 'bar', c: t.color });
// tools (non-stackable; the best one in the bag is used automatically)
add('hammer', { name: 'Hammer', tool: 'hammer', toolTier: 0, value: 6, art: 'hammer', c: '#9aa3ad' });

add('small_net', { name: 'Small fishing net', tool: 'net', toolTier: 0, value: 10, art: 'net', c: '#c9a46a' });
add('fishing_rod', { name: 'Fishing rod', tool: 'rod', toolTier: 0, value: 25, art: 'rod', c: '#c9a46a' });
add('harpoon', { name: 'Harpoon', tool: 'harpoon', toolTier: 0, value: 60, art: 'harpoon', c: '#b9c2cf' });
add('lobster_pot', { name: 'Lobster pot', tool: 'cage', toolTier: 0, value: 50, art: 'pot', c: '#b9824a' });
// fish & meat: [id, raw name, cooked name, healing, cooked value, raw colour, cook level, burn-free level, cook xp]
export const FOOD = [
  ['shrimp', 'Raw shrimp', 'Shrimp', 3, 5, '#f2a58a', 1, 30, 30],
  ['anchovies', 'Raw anchovies', 'Anchovies', 1, 4, '#9fb2c8', 1, 30, 30],
  ['trout', 'Raw trout', 'Trout', 7, 14, '#c9a38a', 15, 40, 70],
  ['salmon', 'Raw salmon', 'Salmon', 9, 20, '#e8826a', 25, 50, 90],
  ['tuna', 'Raw tuna', 'Tuna', 10, 30, '#6a8ee8', 30, 55, 100],
  ['lobster', 'Raw lobster', 'Lobster', 12, 45, '#d8453c', 40, 60, 120],
  ['swordfish', 'Raw swordfish', 'Swordfish', 14, 70, '#9ab0d8', 45, 65, 140],
];
export const MEAT = [
  ['chicken', 'Raw chicken', 'Cooked chicken', 3, 4, '#f3c9b0', 1, 20, 30],
  ['beef', 'Raw beef', 'Cooked beef', 3, 4, '#c0504d', 1, 20, 30],
  ['wolf', 'Raw wolf meat', 'Cooked wolf meat', 3, 6, '#9a6a60', 1, 25, 40],
];
export const COOKABLE = [];
for (const [id, raw, cooked, heal, val, c, lvl, stop, xp] of FOOD) {
  add(`raw_${id}`, { name: raw, stack: true, value: Math.max(1, Math.floor(val / 2)), art: 'fish', c });
  add(id, { name: cooked, stack: true, value: val, heal, art: 'fish', c: shadeHex(c), cooked: true });
  COOKABLE.push({ raw: `raw_${id}`, out: id, level: lvl, stop, xp });
}
for (const [id, raw, cooked, heal, val, c, lvl, stop, xp] of MEAT) {
  add(`raw_${id}`, { name: raw, stack: true, value: 2, art: 'meat', c });
  add(`cooked_${id}`, { name: cooked, stack: true, value: val, heal, art: 'meat', c: shadeHex(c), cooked: true });
  COOKABLE.push({ raw: `raw_${id}`, out: `cooked_${id}`, level: lvl, stop, xp });
}
add('burnt_food', { name: 'Burnt food', stack: true, value: 1, art: 'fish', c: '#2e2a2a' });
export const isFood = (id) => !!ITEMS[id]?.heal;
function shadeHex(h) { const n = parseInt(h.slice(1), 16); const f = (v) => Math.round(v * 0.7).toString(16).padStart(2, '0'); return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`; }
// gear: generated for every tier and kind. Weapons carry per-type attack bonuses `a`; `bonus.atk` is the headline (best type).
for (const [i, t] of TIERS.entries()) {
  for (const [kind, k] of Object.entries(SMITH_KINDS)) {
    const id = `${t.id}_${kind}`, w = WEAPON_KINDS[kind];
    const bonus = { atk: 0, str: 0, def: 0, a: { stab: 0, slash: 0, crush: 0 } };
    if (w) { for (const ty of DMG_TYPES) bonus.a[ty] = Math.round(ATKB[i] * w.a[ty]); bonus.atk = Math.max(...DMG_TYPES.map((ty) => bonus.a[ty])); bonus.str = Math.round(STRB[i] * w.str); }
    else if (ARMOUR[kind]) bonus.def = ARMOUR[kind][i];
    const it = { name: `${t.name} ${k.name.toLowerCase()}`, kind, tier: i, bonus, value: Math.round((8 + k.bars * 10) * (1 + i * 1.6)), art: k.art, c: t.color, d: t.dark };
    if (k.slot) { it.slot = k.slot; it.req = { skill: w ? 'attack' : 'defence', level: t.req }; }
    if (w) { it.interval = w.interval; it.two = !!w.two; it.reach = w.reach || 0; it.wk = kind; }
    if (k.tool) { it.tool = k.tool; it.toolTier = i; }
    add(id, it);
  }
}
export const isStackable = (id) => !!ITEMS[id]?.stack;

// ---- recipes. furnace: smelt (success < 1 loses the ore); anvil: smith gear
export const RECIPES = [
  { id: 'bronze_bar', station: 'furnace', out: 'bronze_bar', inputs: { copper_ore: 1, tin_ore: 1 }, level: 1, xp: 6.25, chance: 1 },
  { id: 'iron_bar', station: 'furnace', out: 'iron_bar', inputs: { iron_ore: 1 }, level: 15, xp: 12.5, chance: 0.5 },
];
for (const [id, o] of Object.entries({ steel_bar: [{ iron_ore: 1, coal: 2 }, 30, 17.5], mithril_bar: [{ mithril_ore: 1, coal: 4 }, 50, 30], adamant_bar: [{ adamant_ore: 1, coal: 6 }, 70, 37.5], rune_bar: [{ runite_ore: 1, coal: 8 }, 85, 50] })) RECIPES.push({ id, station: 'furnace', out: id, inputs: o[0], level: o[1], xp: o[2], chance: 1 });
for (const [i] of TIERS.entries()) {
  for (const [kind, k] of Object.entries(SMITH_KINDS)) {
    RECIPES.push({ id: `${TIERS[i].id}_${kind}`, station: 'anvil', tier: i, out: `${TIERS[i].id}_${kind}`, inputs: { [TIER_BAR[i]]: k.bars }, level: Math.min(99, k.smithLevel + TIER_SMITH[i]), xp: k.bars * BAR_XP[i], chance: 1 });
  }
}
/** Cooking: station 'cook' = campfire or range. Burn chance starts at 50% (fire) / 30% (range) at the required level and falls to 0 at `stop`. */
for (const c of COOKABLE) RECIPES.push({ id: `cook_${c.out}`, station: 'cook', skill: 'cooking', out: c.out, inputs: { [c.raw]: 1 }, level: c.level, stop: c.stop, xp: c.xp, chance: 1, burnt: 'burnt_food' });
export const burnChance = (r, cookLevel, onRange) => (cookLevel >= r.stop ? 0 : (onRange ? 0.3 : 0.5) * ((r.stop - cookLevel) / Math.max(1, r.stop - r.level)));
export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
export const STATIONS = {
  fire: { name: 'Campfire', menu: 'Cooking', blurb: 'Cook raw food. Fires burn more food than a range.' },
  range: { name: 'Range', menu: 'Cooking', blurb: 'Cook raw food. A range burns less than a campfire.' },
  furnace: { name: 'Furnace', menu: 'Smelting', blurb: 'Smelt ore into bars.' },
  anvil: { name: 'Anvil', menu: 'Smithing', blurb: 'Hammer bars into gear. Needs a hammer.' },
  altar: { name: 'Enchanting altar', short: 'Altar', menu: 'Enchanting', blurb: 'Spend Enchant Points to roll random enchantments.' },
  prayer_altar: { name: 'Prayer altar', short: 'Prayer', menu: 'Prayer', blurb: 'Bury bones here for bonus Prayer XP and a chance of Enchant Points.' },
  bank: { name: 'Bank chest', short: 'Bank', menu: 'Bank' },
  store: { name: 'General store', menu: 'Shop' },
};

// ---- monsters (melee). hp/atk/str/def are RuneScape-style levels; maxHit is the strongest hit.
export const MONSTERS = {
  chicken: { name: 'Chicken', level: 1, hp: 3, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#f7f1df', family: 'beast', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.03,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_chicken', p: 0.8, n: [1, 1] }, { id: 'feather', p: 0.6, n: [2, 6] }, { id: 'coins', p: 0.5, n: [1, 3] }] },
  cow: { name: 'Cow', level: 2, hp: 8, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#e8e0d0', family: 'beast', defB: { stab: 0, slash: 0, crush: 5 }, epChance: 0.05,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_beef', p: 1, n: [1, 1] }, { id: 'coins', p: 0.3, n: [1, 5] }] },
  goblin: { name: 'Goblin', level: 2, hp: 5, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#6fbf4a', family: 'humanoid', defB: { stab: 0, slash: 5, crush: 10 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [3, 12] }, { id: 'bronze_dagger', p: 0.03, n: [1, 1] }, { id: 'bronze_helm', p: 0.03, n: [1, 1] }, { id: 'bronze_mace', p: 0.03, n: [1, 1] }, { id: 'bronze_scimitar', p: 0.02, n: [1, 1] }, { id: 'bronze_spear', p: 0.02, n: [1, 1] }] },
  wolf: { name: 'Wolf', level: 25, hp: 34, atk: 22, def: 18, maxHit: 4, interval: 1.8, color: '#8a8f98', family: 'beast', defB: { stab: 15, slash: 5, crush: 25 }, epChance: 0.12,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_wolf', p: 0.6, n: [1, 1] }, { id: 'wolf_pelt', p: 0.5, n: [1, 1] }, { id: 'coins', p: 0.4, n: [8, 30] }, { id: 'iron_sword', p: 0.03, n: [1, 1] }, { id: 'iron_scimitar', p: 0.02, n: [1, 1] }, { id: 'iron_mace', p: 0.02, n: [1, 1] }] },
  alpha_wolf: { name: 'Alpha wolf', level: 38, hp: 70, atk: 35, def: 30, maxHit: 8, interval: 1.8, color: '#4a4f5a', family: 'beast', defB: { stab: 30, slash: 20, crush: 40 }, boss: true, respawn: 45, epFlat: 8, epChance: 0,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'wolf_pelt', p: 1, n: [1, 2] }, { id: 'coins', p: 1, n: [60, 160] }, { id: 'iron_2h', p: 0.15, n: [1, 1] }, { id: 'iron_longsword', p: 0.15, n: [1, 1] }, { id: 'steel_scimitar', p: 0.06, n: [1, 1] }] },
  hill_giant: { name: 'Hill giant', level: 28, hp: 40, atk: 25, def: 25, maxHit: 7, interval: 2.1, color: '#c9a27a', family: 'giant', defB: { stab: 25, slash: 30, crush: 0 }, epChance: 0.2,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'big_bones', p: 0.15, n: [1, 1] }, { id: 'coins', p: 0.9, n: [20, 80] }, { id: 'steel_sword', p: 0.03, n: [1, 1] }, { id: 'steel_warhammer', p: 0.03, n: [1, 1] }, { id: 'steel_2h', p: 0.02, n: [1, 1] }, { id: 'steel_halberd', p: 0.02, n: [1, 1] }, { id: 'iron_battleaxe', p: 0.04, n: [1, 1] }, { id: 'coal', p: 0.3, n: [1, 3] }] },
};
// ---- resource nodes. chance = base success per attempt at the required level (+1.2% per level above, capped 90%).
export const NODES = {
  copper: { name: 'Copper rocks', skill: 'mining', tool: 'pickaxe', level: 1, xp: 17.5, item: 'copper_ore', interval: 2, respawn: 4, chance: 0.45, color: '#c9773a' },
  tin: { name: 'Tin rocks', skill: 'mining', tool: 'pickaxe', level: 1, xp: 17.5, item: 'tin_ore', interval: 2, respawn: 4, chance: 0.45, color: '#b9c2cf' },
  iron: { name: 'Iron rocks', skill: 'mining', tool: 'pickaxe', level: 15, xp: 35, item: 'iron_ore', interval: 2.4, respawn: 6, chance: 0.4, color: '#8f5a4a' },
  tree: { name: 'Tree', skill: 'woodcutting', tool: 'axe', level: 1, xp: 25, item: 'logs', interval: 2.2, respawn: 5, chance: 0.5, color: '#46a64a' },
  coal: { name: 'Coal rocks', skill: 'mining', tool: 'pickaxe', level: 30, xp: 50, item: 'coal', interval: 2.6, respawn: 6, chance: 0.4, color: '#33343a' },
  mithril: { name: 'Mithril rocks', skill: 'mining', tool: 'pickaxe', level: 55, xp: 80, item: 'mithril_ore', interval: 3, respawn: 9, chance: 0.35, color: '#4a68c8' },
  adamant: { name: 'Adamantite rocks', skill: 'mining', tool: 'pickaxe', level: 70, xp: 95, item: 'adamant_ore', interval: 3.2, respawn: 12, chance: 0.3, color: '#3aa05a' },
  runite: { name: 'Runite rocks', skill: 'mining', tool: 'pickaxe', level: 85, xp: 125, item: 'runite_ore', interval: 3.6, respawn: 20, chance: 0.25, color: '#38c8d8' },
  oak: { name: 'Oak tree', skill: 'woodcutting', tool: 'axe', level: 15, xp: 37.5, item: 'oak_logs', interval: 2.6, respawn: 7, chance: 0.4, color: '#2f8a3a' },
};

export const FISH_NODES = {
  pond: { name: 'Fishing spot (net)', skill: 'fishing', tool: 'net', level: 1, interval: 2.4, respawn: 0, chance: 0.5, color: '#4aa3e8',
    yields: [{ item: 'raw_shrimp', level: 1, xp: 10 }, { item: 'raw_anchovies', level: 15, xp: 40 }] },
  stream: { name: 'Fishing spot (rod)', skill: 'fishing', tool: 'rod', bait: 'feather', level: 20, interval: 2.6, respawn: 0, chance: 0.45, color: '#5ab8d8',
    yields: [{ item: 'raw_trout', level: 20, xp: 50 }, { item: 'raw_salmon', level: 30, xp: 70 }] },
  deep: { name: 'Deep water (harpoon)', skill: 'fishing', tool: 'harpoon', level: 35, interval: 3, respawn: 0, chance: 0.4, color: '#2a6fb8',
    yields: [{ item: 'raw_tuna', level: 35, xp: 80 }, { item: 'raw_swordfish', level: 50, xp: 100 }] },
  cage: { name: 'Lobster spot (pot)', skill: 'fishing', tool: 'cage', level: 40, interval: 3, respawn: 0, chance: 0.4, color: '#2f86c8',
    yields: [{ item: 'raw_lobster', level: 40, xp: 90 }] },
};
Object.assign(NODES, FISH_NODES);
/** what a node can give (mining/woodcutting nodes have a single `item`) */
export const nodeYields = (n) => n.yields || [{ item: n.item, level: n.level, xp: n.xp }];
// ---- areas: side-scrolling maps. entities: [type, kind, x]  (type: monster|node|station|sign)
export const AREAS = {
  meadow: {
    name: 'Starter Meadow', width: 2300, spawn: 160, req: { combat: 1 }, sky: ['#bfe8ff', '#e8f7ff'], hill: ['#8fd48a', '#6fbf6a'], ground: '#59b857',
    entities: [['station', 'altar', 225], ['station', 'prayer_altar', 380], ['station', 'bank', 520], ['station', 'store', 640], ['station', 'range', 760], ['station', 'furnace', 860], ['station', 'anvil', 960],
      ['node', 'pond', 830], ['node', 'tree', 930], ['node', 'tree', 1020], ['station', 'fire', 1100], ['node', 'copper', 1190], ['node', 'tin', 1270],
      ['monster', 'chicken', 1430], ['monster', 'chicken', 1510], ['monster', 'cow', 1650], ['monster', 'cow', 1730], ['monster', 'goblin', 1870], ['monster', 'goblin', 1960], ['sign', 'quarry', 2190]],
  },
  quarry: {
    name: 'Stony Quarry', width: 2300, spawn: 160, req: { combat: 10 }, sky: ['#d7d3cf', '#efe9e1'], hill: ['#b7ada0', '#9b9186'], ground: '#a08e78',
    entities: [['sign', 'meadow', 70], ['node', 'iron', 400], ['node', 'iron', 490], ['node', 'coal', 580], ['node', 'coal', 660], ['node', 'oak', 770], ['node', 'oak', 850], ['station', 'fire', 930], ['node', 'stream', 1030],
      ['monster', 'wolf', 1180], ['monster', 'wolf', 1350], ['monster', 'alpha_wolf', 1540], ['node', 'deep', 1720], ['node', 'cage', 1820], ['node', 'copper', 1950], ['node', 'tin', 2030], ['sign', 'peaks', 2220]],
  },
  peaks: {
    name: 'Windy Peaks', width: 2000, spawn: 160, req: { combat: 20 }, sky: ['#cfe3f5', '#f1f7fc'], hill: ['#a9b8c9', '#8a9bb0'], ground: '#8f9aa6',
    entities: [['sign', 'quarry', 70], ['node', 'coal', 300], ['node', 'coal', 380], ['node', 'mithril', 560], ['node', 'mithril', 640], ['node', 'adamant', 830], ['node', 'adamant', 910], ['node', 'runite', 1060],
      ['monster', 'hill_giant', 1240], ['monster', 'hill_giant', 1420], ['monster', 'hill_giant', 1600], ['station', 'fire', 1790]],
  },
};
export const AREA_IDS = Object.keys(AREAS);
export const START_AREA = 'meadow';
export const BAG_SLOTS = 28;
export const SHOP_BUY = ['hammer', 'bronze_pickaxe', 'bronze_axe', 'iron_pickaxe', 'iron_axe', 'bronze_dagger', 'bronze_scimitar', 'bronze_mace', 'small_net', 'fishing_rod', 'harpoon', 'lobster_pot', 'feather'];
export const SELL_RATE = 0.5;
