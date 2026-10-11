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
];
/** Global XP multiplier applied to every XP gain (combat + gathering + crafting). The level table itself is the real RuneScape one,
 *  so changing this never changes anyone's stored level. Single tunable: 3 => level 2 in ~3 chicken kills, level 10 in a few minutes. */
export const XP_RATE = 3;
/** Offline progress tuning */
export const OFFLINE = { minAway: 60, capHours: 3, efficiency: 0.5 };
export const SKILL_IDS = SKILLS.map((s) => s.id);
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const COMBAT_SKILLS = ['attack', 'strength', 'defence', 'hitpoints'];

// ---- combat styles (melee). `bonus` = which effective level gets +3; `xp` = skills that get the 4 xp per damage.
export const STANCES = [
  { id: 'accurate', name: 'Accurate', short: 'Acc', bonus: 'attack', xp: ['attack'], blurb: '+3 effective Attack. Trains Attack.' },
  { id: 'aggressive', name: 'Aggressive', short: 'Agg', bonus: 'strength', xp: ['strength'], blurb: '+3 effective Strength. Trains Strength.' },
  { id: 'defensive', name: 'Defensive', short: 'Def', bonus: 'defence', xp: ['defence'], blurb: '+3 effective Defence. Trains Defence.' },
];
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
  { id: 'weapon', name: 'Weapon' }, { id: 'shield', name: 'Shield' },
];
export const SLOT_IDS = SLOTS.map((s) => s.id);

// Demo pacing: attack intervals are shorter than RuneScape's 2.4s (a 'tick' is 0.3s here).
// per-tier bonus tables (index = tier). Weapons: attack + strength bonus and attack interval (seconds).
const SWORD = { atk: [4, 7, 11, 16, 22, 38], str: [5, 7, 11, 16, 22, 39] };
const DAGGER = { atk: [4, 7, 11, 16, 22, 38], str: [3, 5, 8, 12, 17, 28] };
const HELM = [3, 6, 9, 13, 18, 27], SHIELD = [5, 9, 13, 19, 26, 40], BODY = [10, 18, 25, 35, 48, 70], LEGS = [7, 12, 18, 26, 36, 52];
export const GEAR_KINDS = {
  dagger: { name: 'Dagger', slot: 'weapon', interval: 1.2, bars: 1, smithLevel: 1, xpBars: 1, art: 'dagger' },
  sword: { name: 'Sword', slot: 'weapon', interval: 1.5, bars: 1, smithLevel: 4, art: 'sword' },
  helm: { name: 'Med Helm', slot: 'head', bars: 1, smithLevel: 3, art: 'helm' },
  shield: { name: 'Kiteshield', slot: 'shield', bars: 2, smithLevel: 8, art: 'shield' },
  legs: { name: 'Platelegs', slot: 'legs', bars: 3, smithLevel: 16, art: 'legs' },
  body: { name: 'Platebody', slot: 'body', bars: 5, smithLevel: 18, art: 'body' },
};
// smithing level needed per tier (bronze 1, iron 15, steel 30 ...), added to the kind's own level offset
export const TIER_SMITH = [0, 14, 29, 49, 69, 84];
export const TIER_BAR = ['bronze_bar', 'iron_bar', 'steel_bar', 'mithril_bar', 'adamant_bar', 'rune_bar'];

export const ITEMS = {};
const add = (id, o) => { ITEMS[id] = { id, ...o }; };
// materials
add('coins', { name: 'Coins', stack: true, value: 1, art: 'coins' });
add('copper_ore', { name: 'Copper ore', stack: true, value: 4, art: 'ore', c: '#c9773a' });
add('tin_ore', { name: 'Tin ore', stack: true, value: 4, art: 'ore', c: '#b9c2cf' });
add('iron_ore', { name: 'Iron ore', stack: true, value: 12, art: 'ore', c: '#8f5a4a' });
add('logs', { name: 'Logs', stack: true, value: 4, art: 'log', c: '#b9824a' });
add('oak_logs', { name: 'Oak logs', stack: true, value: 10, art: 'log', c: '#9a6a3a' });
add('bones', { name: 'Bones', stack: true, value: 1, art: 'bones', c: '#f3ead2' });
add('feather', { name: 'Feather', stack: true, value: 2, art: 'feather', c: '#ffffff' });
add('wolf_pelt', { name: 'Wolf pelt', stack: true, value: 18, art: 'pelt', c: '#8a8f98' });
for (const [i, t] of TIERS.entries()) add(TIER_BAR[i], { name: `${t.name} bar`, stack: true, value: [10, 24, 50, 100, 200, 600][i], art: 'bar', c: t.color });
// tools (non-stackable; the best one in the bag is used automatically)
add('bronze_pickaxe', { name: 'Bronze pickaxe', tool: 'pickaxe', toolTier: 0, value: 20, art: 'pickaxe', c: TIERS[0].color });
add('iron_pickaxe', { name: 'Iron pickaxe', tool: 'pickaxe', toolTier: 1, value: 60, art: 'pickaxe', c: TIERS[1].color });
add('hammer', { name: 'Hammer', tool: 'hammer', toolTier: 0, value: 6, art: 'hammer', c: '#9aa3ad' });
add('bronze_axe', { name: 'Bronze axe', tool: 'axe', toolTier: 0, value: 20, art: 'axe', c: TIERS[0].color });
add('iron_axe', { name: 'Iron axe', tool: 'axe', toolTier: 1, value: 60, art: 'axe', c: TIERS[1].color });

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
// gear: generated for every tier so steel..rune exist as data (only bronze/iron have smithing recipes in the demo)
for (const [i, t] of TIERS.entries()) {
  for (const [kind, k] of Object.entries(GEAR_KINDS)) {
    const id = `${t.id}_${kind}`;
    const bonus = { atk: 0, str: 0, def: 0 };
    if (kind === 'sword') { bonus.atk = SWORD.atk[i]; bonus.str = SWORD.str[i]; }
    else if (kind === 'dagger') { bonus.atk = DAGGER.atk[i]; bonus.str = DAGGER.str[i]; }
    else bonus.def = { helm: HELM, shield: SHIELD, body: BODY, legs: LEGS }[kind][i];
    add(id, { name: `${t.name} ${k.name}`, slot: k.slot, kind, tier: i, bonus, interval: k.interval || 0, req: { skill: k.slot === 'weapon' ? 'attack' : 'defence', level: t.req }, value: Math.round((8 + k.bars * 10) * (1 + i * 1.6)), art: k.art, c: t.color, d: t.dark });
  }
}
export const isStackable = (id) => !!ITEMS[id]?.stack;

// ---- recipes. furnace: smelt (success < 1 loses the ore); anvil: smith gear
export const RECIPES = [
  { id: 'bronze_bar', station: 'furnace', out: 'bronze_bar', inputs: { copper_ore: 1, tin_ore: 1 }, level: 1, xp: 6.25, chance: 1 },
  { id: 'iron_bar', station: 'furnace', out: 'iron_bar', inputs: { iron_ore: 1 }, level: 15, xp: 12.5, chance: 0.5 },
];
for (const [i, t] of TIERS.slice(0, 2).entries()) {
  for (const [kind, k] of Object.entries(GEAR_KINDS)) {
    RECIPES.push({ id: `${t.id}_${kind}`, station: 'anvil', out: `${t.id}_${kind}`, inputs: { [TIER_BAR[i]]: k.bars }, level: k.smithLevel + TIER_SMITH[i], xp: k.bars * [12.5, 25][i], chance: 1 });
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
  bank: { name: 'Bank chest', menu: 'Bank' },
  store: { name: 'General store', menu: 'Shop' },
};

// ---- monsters (melee). hp/atk/str/def are RuneScape-style levels; maxHit is the strongest hit.
export const MONSTERS = {
  chicken: { name: 'Chicken', level: 1, hp: 3, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#f7f1df',
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_chicken', p: 0.8, n: [1, 1] }, { id: 'feather', p: 0.6, n: [2, 6] }, { id: 'coins', p: 0.5, n: [1, 3] }] },
  cow: { name: 'Cow', level: 2, hp: 8, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#e8e0d0',
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_beef', p: 1, n: [1, 1] }, { id: 'coins', p: 0.3, n: [1, 5] }] },
  goblin: { name: 'Goblin', level: 2, hp: 5, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#6fbf4a',
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [3, 12] }, { id: 'bronze_dagger', p: 0.03, n: [1, 1] }, { id: 'bronze_helm', p: 0.03, n: [1, 1] }] },
  wolf: { name: 'Wolf', level: 25, hp: 34, atk: 22, def: 18, maxHit: 4, interval: 1.8, color: '#8a8f98',
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_wolf', p: 0.6, n: [1, 1] }, { id: 'wolf_pelt', p: 0.5, n: [1, 1] }, { id: 'coins', p: 0.4, n: [8, 30] }, { id: 'iron_sword', p: 0.03, n: [1, 1] }] },
};
// ---- resource nodes. chance = base success per attempt at the required level (+1.2% per level above, capped 90%).
export const NODES = {
  copper: { name: 'Copper rocks', skill: 'mining', tool: 'pickaxe', level: 1, xp: 17.5, item: 'copper_ore', interval: 2, respawn: 4, chance: 0.45, color: '#c9773a' },
  tin: { name: 'Tin rocks', skill: 'mining', tool: 'pickaxe', level: 1, xp: 17.5, item: 'tin_ore', interval: 2, respawn: 4, chance: 0.45, color: '#b9c2cf' },
  iron: { name: 'Iron rocks', skill: 'mining', tool: 'pickaxe', level: 15, xp: 35, item: 'iron_ore', interval: 2.4, respawn: 6, chance: 0.4, color: '#8f5a4a' },
  tree: { name: 'Tree', skill: 'woodcutting', tool: 'axe', level: 1, xp: 25, item: 'logs', interval: 2.2, respawn: 5, chance: 0.5, color: '#46a64a' },
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
    entities: [['station', 'bank', 300], ['station', 'store', 430], ['station', 'range', 520], ['station', 'furnace', 610], ['station', 'anvil', 720],
      ['node', 'pond', 830], ['node', 'tree', 930], ['node', 'tree', 1020], ['station', 'fire', 1100], ['node', 'copper', 1190], ['node', 'tin', 1270],
      ['monster', 'chicken', 1430], ['monster', 'chicken', 1510], ['monster', 'cow', 1650], ['monster', 'cow', 1730], ['monster', 'goblin', 1870], ['monster', 'goblin', 1960], ['sign', 'quarry', 2190]],
  },
  quarry: {
    name: 'Stony Quarry', width: 2100, spawn: 160, req: { combat: 10 }, sky: ['#d7d3cf', '#efe9e1'], hill: ['#b7ada0', '#9b9186'], ground: '#a08e78',
    entities: [['sign', 'meadow', 70], ['node', 'iron', 400], ['node', 'iron', 490], ['node', 'oak', 650], ['node', 'oak', 740], ['station', 'fire', 830], ['node', 'stream', 930],
      ['monster', 'wolf', 1080], ['monster', 'wolf', 1260], ['monster', 'wolf', 1440], ['node', 'deep', 1600], ['node', 'cage', 1700], ['node', 'copper', 1830], ['node', 'tin', 1910]],
  },
};
export const AREA_IDS = Object.keys(AREAS);
export const START_AREA = 'meadow';
export const BAG_SLOTS = 28;
export const SHOP_BUY = ['hammer', 'bronze_pickaxe', 'bronze_axe', 'iron_pickaxe', 'iron_axe', 'small_net', 'fishing_rod', 'harpoon', 'lobster_pot', 'feather'];
export const SELL_RATE = 0.5;
