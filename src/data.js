// Static game data. Everything is tables so tiers / skills / areas can be extended (steel..rune, ranged, magic) without touching rules.
export const SKILLS = [
  { id: 'attack', name: 'Attack', color: '#e0463c', short: 'Atk' },
  { id: 'strength', name: 'Strength', color: '#3fb950', short: 'Str' },
  { id: 'defence', name: 'Defence', color: '#3b8eea', short: 'Def' },
  { id: 'hitpoints', name: 'Hitpoints', color: '#ff6b81', short: 'HP' },
  { id: 'ranged', name: 'Ranged', color: '#4aaf6a', short: 'Rng' },
  { id: 'magic', name: 'Magic', color: '#6a6ae8', short: 'Mag' },
  { id: 'mining', name: 'Mining', color: '#c9773a', short: 'Min' },
  { id: 'smithing', name: 'Smithing', color: '#9aa3ad', short: 'Smi' },
  { id: 'woodcutting', name: 'Woodcutting', color: '#7a9a3a', short: 'Wdc' },
  { id: 'fishing', name: 'Fishing', color: '#4aa3e8', short: 'Fis' },
  { id: 'cooking', name: 'Cooking', color: '#e8a33a', short: 'Coo' },
  { id: 'crafting', name: 'Crafting', color: '#c98a4a', short: 'Cft' },
  { id: 'fletching', name: 'Fletching', color: '#7aaf4a', short: 'Flt' },
  { id: 'runecrafting', name: 'Runecraft', color: '#9a6ae8', short: 'Rnc' },
  { id: 'prayer', name: 'Prayer', color: '#c9a227', short: 'Pra' },
  { id: 'slayer', name: 'Slayer', color: '#8a3a9a', short: 'Sly' },
];
/** Global XP multiplier applied to every XP gain (combat + gathering + crafting). The level table itself is the real RuneScape one,
 *  so changing this never changes anyone's stored level. Single tunable: 3 => level 2 in ~3 chicken kills, level 10 in a few minutes. */
export const XP_RATE = 3;
/** Offline progress tuning */
export const OFFLINE = { minAway: 60, capHours: 3, efficiency: 0.5 };
export const SKILL_IDS = SKILLS.map((s) => s.id);
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const COMBAT_SKILLS = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic'];

// ---- Prayer. Points drain while a prayer is active. Bones are buried for XP.
export const PRAYERS = [
  { id: 'thick_skin', name: 'Thick Skin', level: 1, drain: 0.4, blurb: '+5% Defence' },
  { id: 'burst_of_strength', name: 'Burst of Strength', level: 4, drain: 0.4, blurb: '+5% Strength' },
  { id: 'clarity_of_thought', name: 'Clarity of Thought', level: 7, drain: 0.4, blurb: '+5% Attack' },
  { id: 'rock_skin', name: 'Rock Skin', level: 10, drain: 0.6, blurb: '+10% Defence' },
  { id: 'superhuman_strength', name: 'Superhuman Strength', level: 13, drain: 0.6, blurb: '+10% Strength' },
  { id: 'improved_reflexes', name: 'Improved Reflexes', level: 16, drain: 0.6, blurb: '+10% Attack' },
  { id: 'rapid_heal', name: 'Rapid Heal', level: 22, drain: 0.5, blurb: '+2x HP regen' },
  { id: 'protect_from_melee', name: 'Protect from Melee', level: 43, drain: 1.2, blurb: 'Halves melee damage taken' },
  { id: 'protect_from_missiles', name: 'Protect from Missiles', level: 40, drain: 1.2, blurb: 'Halves ranged damage taken' },
  { id: 'protect_from_magic', name: 'Protect from Magic', level: 37, drain: 1.2, blurb: 'Halves magic damage taken' },
  { id: 'steel_skin', name: 'Steel Skin', level: 28, drain: 0.8, blurb: '+15% Defence' },
  { id: 'ultimate_strength', name: 'Ultimate Strength', level: 31, drain: 0.8, blurb: '+15% Strength' },
  { id: 'incredible_reflexes', name: 'Incredible Reflexes', level: 34, drain: 0.8, blurb: '+15% Attack' },
  { id: 'eagle_eye', name: 'Eagle Eye', level: 44, drain: 0.8, blurb: '+15% Ranged' },
  { id: 'mystic_might', name: 'Mystic Might', level: 45, drain: 0.8, blurb: '+15% Magic' },
];
export const PRAYER_BY_ID = Object.fromEntries(PRAYERS.map((p) => [p.id, p]));
/** Bone types: base XP when buried anywhere, altar XP (bonus), and EP chance per bone when used at the prayer altar. */
export const BONES = {
  bones: { name: 'Bones', xp: 4.5, altarXp: 9, epChance: 0.4, epFlat: 1 },
  big_bones: { name: 'Big bones', xp: 15, altarXp: 30, epChance: 0.6, epFlat: 2 },
  bat_bones: { name: 'Bat bones', xp: 5.3, altarXp: 11, epChance: 0.45, epFlat: 1 },
  dragon_bones: { name: 'Dragon bones', xp: 72, altarXp: 144, epChance: 0.8, epFlat: 4 },
  wolf_bones: { name: 'Wolf bones', xp: 12, altarXp: 24, epChance: 0.5, epFlat: 1 },
};
export const BONE_XP = Object.fromEntries(Object.entries(BONES).map(([k, v]) => [k, v.xp]));

// ---- Slayer tasks. assigned by the Slayer master. amount scales with level.
export const SLAYER_TASKS = [
  { id: 'chickens', name: 'Chickens', monsters: ['chicken'], amount: [15, 30], level: 1, xp: 8 },
  { id: 'cows', name: 'Cows', monsters: ['cow'], amount: [10, 25], level: 1, xp: 10 },
  { id: 'goblins', name: 'Goblins', monsters: ['goblin'], amount: [15, 30], level: 1, xp: 12 },
  { id: 'wolves', name: 'Wolves', monsters: ['wolf', 'alpha_wolf'], amount: [8, 20], level: 15, xp: 25 },
  { id: 'hill_giants', name: 'Hill giants', monsters: ['hill_giant'], amount: [5, 15], level: 20, xp: 40 },
  { id: 'bats', name: 'Bats', monsters: ['bat'], amount: [12, 25], level: 5, xp: 12 },
  { id: 'dragons', name: 'Green dragons', monsters: ['green_dragon'], amount: [3, 8], level: 40, xp: 120 },
];
export const SLAYER_MASTER = { name: 'Turael', blurb: 'Assigns Slayer tasks. Complete them for bonus XP and coins.' };
export const SPELLS = [
  { id: 'wind_strike', name: 'Wind Strike', level: 1, runes: { air_rune: 1, mind_rune: 1 }, maxHit: 2, xp: 5.5, blurb: 'Basic air spell' },
  { id: 'water_strike', name: 'Water Strike', level: 5, runes: { water_rune: 1, air_rune: 1, mind_rune: 1 }, maxHit: 4, xp: 7.5, blurb: 'Water spell' },
  { id: 'earth_strike', name: 'Earth Strike', level: 9, runes: { earth_rune: 2, air_rune: 1, mind_rune: 1 }, maxHit: 6, xp: 9.5, blurb: 'Earth spell' },
  { id: 'fire_strike', name: 'Fire Strike', level: 13, runes: { fire_rune: 3, air_rune: 2, mind_rune: 1 }, maxHit: 8, xp: 11.5, blurb: 'Fire spell' },
  { id: 'wind_bolt', name: 'Wind Bolt', level: 17, runes: { air_rune: 2, chaos_rune: 1 }, maxHit: 9, xp: 13.5, blurb: 'Stronger air spell' },
];
export const SPELL_BY_ID = Object.fromEntries(SPELLS.map((s) => [s.id, s]));

export const ACHIEVEMENTS = [
  { id: 'first_kill', name: 'First blood', desc: 'Kill any monster', reward: { coins: 50 }, check: (g) => g.data.stats.kills >= 1 },
  { id: 'kill_100', name: 'Slayer of beasts', desc: 'Kill 100 monsters', reward: { coins: 250 }, check: (g) => g.data.stats.kills >= 100 },
  { id: 'mine_100', name: 'Miner', desc: 'Mine 100 ore', reward: { xp: { mining: 200 } }, check: (g) => (g.data.stats.mined || 0) >= 100 },
  { id: 'slayer_5', name: 'Slayer apprentice', desc: 'Complete 5 Slayer tasks', reward: { coins: 200 }, check: (g) => (g.data.slayerStreak || 0) >= 5 },
  { id: 'slayer_25', name: 'Slayer expert', desc: 'Complete 25 Slayer tasks', reward: { coins: 1000 }, check: (g) => (g.data.slayerStreak || 0) >= 25 },
  { id: 'magic_10', name: 'Apprentice mage', desc: 'Reach Magic level 10', reward: { coins: 100 }, check: (g) => g.level('magic') >= 10 },
  { id: 'ranged_10', name: 'Archer', desc: 'Reach Ranged level 10', reward: { coins: 100 }, check: (g) => g.level('ranged') >= 10 },
];

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

// Equipment bonuses (OSRS-style). atk/str/def are generic; a is per damage type.
const BONUS = (atk = 0, str = 0, def = 0, a = {}) => ({ atk, str, def, a });
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
add('willow_logs', { name: 'Willow logs', stack: true, value: 20, art: 'log', c: '#7a9a5a' });
add('arrow_shaft', { name: 'Arrow shafts', stack: true, value: 1, art: 'arrow', c: '#c9a46a' });
add('headless_arrow', { name: 'Headless arrows', stack: true, value: 2, art: 'arrow', c: '#e8d8c0' });
// Bows
add('shortbow', { name: 'Shortbow', stack: false, value: 50, art: 'bow', c: '#b9824a', slot: 'weapon', req: { skill: 'ranged', level: 1 }, interval: 1.8, wk: 'bow', two: true });
add('oak_shortbow', { name: 'Oak shortbow', stack: false, value: 100, art: 'bow', c: '#9a6a3a', slot: 'weapon', req: { skill: 'ranged', level: 5 }, interval: 1.8, wk: 'bow', two: true });
add('willow_shortbow', { name: 'Willow shortbow', stack: false, value: 200, art: 'bow', c: '#7a9a5a', slot: 'weapon', req: { skill: 'ranged', level: 20 }, interval: 1.8, wk: 'bow', two: true });
add('longbow', { name: 'Longbow', stack: false, value: 80, art: 'bow', c: '#b9824a', slot: 'weapon', req: { skill: 'ranged', level: 5 }, interval: 2.4, wk: 'bow', two: true });
add('oak_longbow', { name: 'Oak longbow', stack: false, value: 160, art: 'bow', c: '#9a6a3a', slot: 'weapon', req: { skill: 'ranged', level: 10 }, interval: 2.4, wk: 'bow', two: true });
// Arrowheads (smithable)
add('bronze_arrowtips', { name: 'Bronze arrowtips', stack: true, value: 1, art: 'arrow', c: '#d08f55' });
add('iron_arrowtips', { name: 'Iron arrowtips', stack: true, value: 3, art: 'arrow', c: '#aab3bf' });
add('steel_arrowtips', { name: 'Steel arrowtips', stack: true, value: 8, art: 'arrow', c: '#c9d6e3' });
add('mithril_arrowtips', { name: 'Mithril arrowtips', stack: true, value: 20, art: 'arrow', c: '#6a8ee8' });
// Arrows
add('bronze_arrows', { name: 'Bronze arrows', stack: true, value: 2, art: 'arrow', c: '#d08f55' });
add('iron_arrows', { name: 'Iron arrows', stack: true, value: 5, art: 'arrow', c: '#aab3bf' });
add('steel_arrows', { name: 'Steel arrows', stack: true, value: 12, art: 'arrow', c: '#c9d6e3' });
add('mithril_arrows', { name: 'Mithril arrows', stack: true, value: 30, art: 'arrow', c: '#6a8ee8' });
// Magic staves/wands (fletched)
add('staff', { name: 'Staff', stack: false, value: 15, art: 'staff', c: '#b9824a', slot: 'weapon', req: { skill: 'magic', level: 1 }, interval: 2.4, wk: 'staff', two: true });
add('magic_staff', { name: 'Magic staff', stack: false, value: 200, art: 'staff', c: '#6a6ae8', slot: 'weapon', req: { skill: 'magic', level: 1 }, interval: 2.4, wk: 'staff', two: true });
add('air_staff', { name: 'Staff of air', stack: false, value: 1500, art: 'staff', c: '#a0d0e8', slot: 'weapon', req: { skill: 'magic', level: 1 }, interval: 2.4, wk: 'staff', two: true });
// Leather / hides
add('cowhide', { name: 'Cowhide', stack: true, value: 3, art: 'pelt', c: '#c9b48a' });
add('soft_leather', { name: 'Soft leather', stack: true, value: 8, art: 'pelt', c: '#e8c8a0' });
add('hard_leather', { name: 'Hard leather', stack: true, value: 15, art: 'pelt', c: '#c9a46a' });
add('leather_body', { name: 'Leather body', stack: false, value: 25, art: 'body', c: '#c9a46a', slot: 'body', req: { skill: 'ranged', level: 1 }, def: 10 });
add('hardleather_body', { name: 'Hardleather body', stack: false, value: 60, art: 'body', c: '#b9824a', slot: 'body', req: { skill: 'ranged', level: 10 }, def: 18 });
add('studded_body', { name: 'Studded body', stack: false, value: 150, art: 'body', c: '#9a6a3a', slot: 'body', req: { skill: 'ranged', level: 20 }, def: 28 });
add('bones', { name: 'Bones', stack: true, value: 1, art: 'bones', c: '#f3ead2' });
add('big_bones', { name: 'Big bones', stack: true, value: 8, art: 'bones', c: '#e8dcc0' });
add('bat_bones', { name: 'Bat bones', stack: true, value: 3, art: 'bones', c: '#d8c8a8' });
add('dragon_bones', { name: 'Dragon bones', stack: true, value: 40, art: 'bones', c: '#c8b898' });
add('wolf_bones', { name: 'Wolf bones', stack: true, value: 6, art: 'bones', c: '#e0d4b8' });
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
// Arrowtips
RECIPES.push({ id: 'bronze_arrowtips', station: 'anvil', tier: 0, out: 'bronze_arrowtips', inputs: { bronze_bar: 1 }, level: 5, xp: 12.5, chance: 1, n: 15 });
RECIPES.push({ id: 'iron_arrowtips', station: 'anvil', tier: 1, out: 'iron_arrowtips', inputs: { iron_bar: 1 }, level: 20, xp: 25, chance: 1, n: 15 });
RECIPES.push({ id: 'steel_arrowtips', station: 'anvil', tier: 2, out: 'steel_arrowtips', inputs: { steel_bar: 1 }, level: 35, xp: 37.5, chance: 1, n: 15 });
RECIPES.push({ id: 'mithril_arrowtips', station: 'anvil', tier: 3, out: 'mithril_arrowtips', inputs: { mithril_bar: 1 }, level: 55, xp: 50, chance: 1, n: 15 });
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
  tanner: { name: 'Hide tanner', menu: 'Tanner', blurb: 'Tans cowhides into soft or hard leather.' },
};

// ---- monsters (melee). hp/atk/str/def are RuneScape-style levels; maxHit is the strongest hit.
export const MONSTERS = {
  chicken: { name: 'Chicken', level: 1, hp: 3, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#f7f1df', family: 'beast', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.03,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_chicken', p: 0.8, n: [1, 1] }, { id: 'feather', p: 0.6, n: [2, 6] }, { id: 'coins', p: 0.5, n: [1, 3] }] },
  cow: { name: 'Cow', level: 2, hp: 8, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#e8e0d0', family: 'beast', defB: { stab: 0, slash: 0, crush: 5 }, epChance: 0.05,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_beef', p: 1, n: [1, 1] }, { id: 'coins', p: 0.3, n: [1, 5] }] },
  goblin: { name: 'Goblin', level: 2, hp: 5, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#6fbf4a', family: 'humanoid', defB: { stab: 0, slash: 5, crush: 10 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [3, 12] }, { id: 'bronze_dagger', p: 0.03, n: [1, 1] }, { id: 'bronze_helm', p: 0.03, n: [1, 1] }, { id: 'bronze_mace', p: 0.03, n: [1, 1] }, { id: 'bronze_scimitar', p: 0.02, n: [1, 1] }, { id: 'bronze_spear', p: 0.02, n: [1, 1] }, { id: 'clue_scroll', p: 0.02, n: [1, 1] }] },
  wolf: { name: 'Wolf', level: 25, hp: 34, atk: 22, def: 18, maxHit: 4, interval: 1.8, color: '#8a8f98', family: 'beast', defB: { stab: 15, slash: 5, crush: 25 }, epChance: 0.12,
    drops: [{ id: 'wolf_bones', p: 1, n: [1, 1] }, { id: 'raw_wolf', p: 0.6, n: [1, 1] }, { id: 'wolf_pelt', p: 0.5, n: [1, 1] }, { id: 'coins', p: 0.4, n: [8, 30] }, { id: 'iron_sword', p: 0.03, n: [1, 1] }, { id: 'iron_scimitar', p: 0.02, n: [1, 1] }, { id: 'iron_mace', p: 0.02, n: [1, 1] }] },
  alpha_wolf: { name: 'Alpha wolf', level: 38, hp: 70, atk: 35, def: 30, maxHit: 8, interval: 1.8, color: '#4a4f5a', family: 'beast', defB: { stab: 30, slash: 20, crush: 40 }, boss: true, respawn: 45, epFlat: 8, epChance: 0,
    drops: [{ id: 'wolf_bones', p: 1, n: [1, 1] }, { id: 'wolf_pelt', p: 1, n: [1, 2] }, { id: 'coins', p: 1, n: [60, 160] }, { id: 'iron_2h', p: 0.15, n: [1, 1] }, { id: 'iron_longsword', p: 0.15, n: [1, 1] }, { id: 'steel_scimitar', p: 0.06, n: [1, 1] }] },
  hill_giant: { name: 'Hill giant', level: 28, hp: 40, atk: 25, def: 25, maxHit: 7, interval: 2.1, color: '#c9a27a', family: 'giant', defB: { stab: 25, slash: 30, crush: 0 }, epChance: 0.2,
    drops: [{ id: 'big_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.9, n: [20, 80] }, { id: 'steel_sword', p: 0.03, n: [1, 1] }, { id: 'steel_warhammer', p: 0.03, n: [1, 1] }, { id: 'steel_2h', p: 0.02, n: [1, 1] }, { id: 'steel_halberd', p: 0.02, n: [1, 1] }, { id: 'iron_battleaxe', p: 0.04, n: [1, 1] }, { id: 'coal', p: 0.3, n: [1, 3] }] },
  bat: { name: 'Bat', level: 5, hp: 6, atk: 3, def: 3, maxHit: 1, interval: 1.6, color: '#5a4a6a', family: 'beast', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.04,
    drops: [{ id: 'bat_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.4, n: [1, 4] }] },
  green_dragon: { name: 'Green dragon', level: 79, hp: 80, atk: 68, def: 68, maxHit: 12, interval: 2.4, color: '#3a8a4a', family: 'beast', defB: { stab: 40, slash: 40, crush: 40 }, boss: true, respawn: 60, epFlat: 15, epChance: 0,
    drops: [{ id: 'dragon_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 1, n: [200, 500] }, { id: 'steel_scimitar', p: 0.1, n: [1, 1] }] },
  skeleton: { name: 'Skeleton', level: 22, hp: 25, atk: 18, def: 15, maxHit: 4, interval: 1.8, color: '#e8e0d0', family: 'undead', defB: { stab: 10, slash: 15, crush: 5 }, epChance: 0.08,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.7, n: [10, 40] }, { id: 'bronze_arrows', p: 0.3, n: [5, 15] }, { id: 'iron_arrows', p: 0.15, n: [3, 8] }] },
  zombie: { name: 'Zombie', level: 18, hp: 22, atk: 15, def: 12, maxHit: 3, interval: 1.8, color: '#6a8a5a', family: 'undead', defB: { stab: 5, slash: 10, crush: 8 }, epChance: 0.07,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.6, n: [8, 30] }, { id: 'air_rune', p: 0.2, n: [3, 8] }, { id: 'mind_rune', p: 0.15, n: [2, 6] }] },
  imp: { name: 'Imp', level: 5, hp: 8, atk: 4, def: 4, maxHit: 1, interval: 1.5, color: '#d8453c', family: 'beast', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.05,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.5, n: [2, 8] }, { id: 'fire_rune', p: 0.25, n: [2, 5] }, { id: 'mind_rune', p: 0.2, n: [1, 4] }] },
  giant_rat: { name: 'Giant rat', level: 6, hp: 10, atk: 5, def: 4, maxHit: 1, interval: 1.6, color: '#8a7a6a', family: 'beast', defB: { stab: 0, slash: 2, crush: 0 }, epChance: 0.04,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.4, n: [1, 5] }, { id: 'raw_rat', p: 0.5, n: [1, 1] }] },
  scorpion: { name: 'Scorpion', level: 14, hp: 17, atk: 11, def: 11, maxHit: 2, interval: 1.7, color: '#c8a050', family: 'beast', defB: { stab: 5, slash: 5, crush: 10 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.5, n: [5, 15] }] },
  al_kharid_warrior: { name: 'Al Kharid warrior', level: 9, hp: 19, atk: 7, def: 4, maxHit: 2, interval: 1.8, color: '#e8c070', family: 'humanoid', defB: { stab: 5, slash: 8, crush: 5 }, epChance: 0.07,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [10, 30] }, { id: 'bronze_scimitar', p: 0.05, n: [1, 1] }, { id: 'iron_scimitar', p: 0.02, n: [1, 1] }] },
  wizard: { name: 'Wizard', level: 9, hp: 12, atk: 8, def: 5, maxHit: 3, interval: 2.0, color: '#6a6ae8', family: 'humanoid', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.1,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'air_rune', p: 0.6, n: [5, 12] }, { id: 'mind_rune', p: 0.5, n: [3, 8] }, { id: 'water_rune', p: 0.3, n: [2, 6] }, { id: 'coins', p: 0.4, n: [5, 20] }] },
  dark_wizard: { name: 'Dark wizard', level: 20, hp: 24, atk: 16, def: 10, maxHit: 5, interval: 2.0, color: '#4a3a6a', family: 'humanoid', defB: { stab: 5, slash: 5, crush: 5 }, epChance: 0.15,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'air_rune', p: 0.7, n: [8, 18] }, { id: 'mind_rune', p: 0.6, n: [5, 12] }, { id: 'earth_rune', p: 0.4, n: [4, 10] }, { id: 'fire_rune', p: 0.3, n: [3, 8] }, { id: 'chaos_rune', p: 0.15, n: [1, 3] }, { id: 'coins', p: 0.5, n: [15, 40] }] },
  moss_giant: { name: 'Moss giant', level: 42, hp: 60, atk: 30, def: 30, maxHit: 6, interval: 2.1, color: '#4a6a3a', family: 'giant', defB: { stab: 20, slash: 25, crush: 15 }, epChance: 0.12,
    drops: [{ id: 'big_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [30, 80] }, { id: 'steel_sword', p: 0.05, n: [1, 1] }, { id: 'steel_arrows', p: 0.2, n: [5, 15] }, { id: 'nature_rune', p: 0.15, n: [3, 8] }] },
  fire_giant: { name: 'Fire giant', level: 86, hp: 111, atk: 65, def: 65, maxHit: 11, interval: 2.4, color: '#d8453c', family: 'giant', defB: { stab: 30, slash: 35, crush: 25 }, epChance: 0.18,
    drops: [{ id: 'big_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.9, n: [50, 150] }, { id: 'fire_rune', p: 0.4, n: [10, 25] }, { id: 'steel_2h', p: 0.04, n: [1, 1] }, { id: 'rune_scimitar', p: 0.01, n: [1, 1] }] },
  greater_demon: { name: 'Greater demon', level: 92, hp: 87, atk: 76, def: 81, maxHit: 10, interval: 2.4, color: '#8a2a2a', family: 'beast', defB: { stab: 40, slash: 40, crush: 40 }, epChance: 0.2,
    drops: [{ id: 'ashes', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [40, 120] }, { id: 'death_rune', p: 0.3, n: [3, 8] }, { id: 'rune_full_helm', p: 0.02, n: [1, 1] }] },
  black_demon: { name: 'Black demon', level: 172, hp: 157, atk: 145, def: 152, maxHit: 16, interval: 2.4, color: '#2a1a1a', family: 'beast', defB: { stab: 50, slash: 50, crush: 50 }, epChance: 0.25,
    drops: [{ id: 'ashes', p: 1, n: [1, 1] }, { id: 'coins', p: 0.9, n: [100, 300] }, { id: 'death_rune', p: 0.4, n: [5, 12] }, { id: 'rune_chainbody', p: 0.015, n: [1, 1] }] },
  steel_dragon: { name: 'Steel dragon', level: 246, hp: 160, atk: 210, def: 210, maxHit: 22, interval: 2.4, color: '#c9d6e3', family: 'beast', defB: { stab: 60, slash: 60, crush: 60 }, boss: true, respawn: 45, epFlat: 20, epChance: 0,
    drops: [{ id: 'dragon_bones', p: 1, n: [1, 1] }, { id: 'steel_bar', p: 0.8, n: [2, 5] }, { id: 'coins', p: 1, n: [200, 600] }, { id: 'rune_platelegs', p: 0.02, n: [1, 1] }] },
  iron_dragon: { name: 'Iron dragon', level: 189, hp: 165, atk: 165, def: 165, maxHit: 17, interval: 2.4, color: '#aab3bf', family: 'beast', defB: { stab: 50, slash: 50, crush: 50 }, boss: true, respawn: 40, epFlat: 12, epChance: 0,
    drops: [{ id: 'dragon_bones', p: 1, n: [1, 1] }, { id: 'iron_bar', p: 0.7, n: [2, 5] }, { id: 'coins', p: 1, n: [150, 400] }, { id: 'rune_axe', p: 0.015, n: [1, 1] }] },
  bronze_dragon: { name: 'Bronze dragon', level: 131, hp: 102, atk: 112, def: 112, maxHit: 14, interval: 2.4, color: '#d08f55', family: 'beast', defB: { stab: 40, slash: 40, crush: 40 }, boss: true, respawn: 35, epFlat: 8, epChance: 0,
    drops: [{ id: 'dragon_bones', p: 1, n: [1, 1] }, { id: 'bronze_bar', p: 0.6, n: [2, 5] }, { id: 'coins', p: 1, n: [100, 300] }, { id: 'rune_longsword', p: 0.02, n: [1, 1] }] },
  white_knight: { name: 'White Knight', level: 36, hp: 42, atk: 30, def: 30, maxHit: 5, interval: 1.8, color: '#f0f0f0', family: 'humanoid', defB: { stab: 15, slash: 20, crush: 10 }, epChance: 0.08,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.7, n: [15, 40] }, { id: 'steel_sword', p: 0.04, n: [1, 1] }, { id: 'steel_helm', p: 0.03, n: [1, 1] }] },
  guard: { name: 'Guard', level: 21, hp: 22, atk: 19, def: 18, maxHit: 3, interval: 1.8, color: '#6a8a4a', family: 'humanoid', defB: { stab: 10, slash: 12, crush: 8 }, epChance: 0.05,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.6, n: [5, 20] }, { id: 'iron_sword', p: 0.03, n: [1, 1] }] },
  thief: { name: 'Thief', level: 14, hp: 17, atk: 12, def: 10, maxHit: 2, interval: 1.6, color: '#5a4a3a', family: 'humanoid', defB: { stab: 5, slash: 8, crush: 5 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [10, 30] }, { id: 'bronze_dagger', p: 0.05, n: [1, 1] }] },
  pirate: { name: 'Pirate', level: 23, hp: 25, atk: 20, def: 18, maxHit: 3, interval: 1.8, color: '#8a4a3a', family: 'humanoid', defB: { stab: 8, slash: 10, crush: 6 }, epChance: 0.07,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.7, n: [8, 25] }, { id: 'iron_scimitar', p: 0.04, n: [1, 1] }] },
  seagull: { name: 'Seagull', level: 2, hp: 4, atk: 1, def: 1, maxHit: 1, interval: 1.5, color: '#e8e8e8', family: 'beast', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.02,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'feather', p: 0.5, n: [2, 5] }] },
  chaos_elemental: { name: 'Chaos elemental', level: 305, hp: 250, atk: 250, def: 200, maxHit: 28, interval: 2.4, color: '#6a3a6a', family: 'beast', defB: { stab: 50, slash: 50, crush: 50 }, boss: true, respawn: 90, epFlat: 30, epChance: 0,
    drops: [{ id: 'coins', p: 1, n: [500, 2000] }, { id: 'death_rune', p: 0.6, n: [10, 30] }, { id: 'chaos_rune', p: 0.5, n: [15, 40] }, { id: 'rune_platebody', p: 0.01, n: [1, 1] }] },
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
  willow: { name: 'Willow tree', skill: 'woodcutting', tool: 'axe', level: 30, xp: 67.5, item: 'willow_logs', interval: 2.8, respawn: 8, chance: 0.35, color: '#3a7a4a' },
  rune_essence: { name: 'Rune essence rocks', skill: 'mining', tool: 'pickaxe', level: 1, xp: 5, item: 'rune_essence', interval: 2.0, respawn: 3, chance: 0.6, color: '#c8c0a8' },
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
  lumby: {
    name: 'Lumby', width: 2400, spawn: 200, req: null, sky: ['#bfe8ff', '#e8f7ff'], hill: ['#8fd48a', '#6fbf6a'], ground: '#59b857',
    entities: [
      ['station', 'altar', 180], ['station', 'prayer_altar', 280], ['station', 'bank', 420], ['station', 'store', 560],
      ['station', 'range', 800], ['station', 'furnace', 920], ['station', 'anvil', 1040],
      ['node', 'pond', 1160], ['node', 'tree', 1260], ['node', 'tree', 1360], ['station', 'fire', 1460],
      ['node', 'copper', 1560], ['node', 'tin', 1640],
      ['monster', 'chicken', 1740], ['monster', 'chicken', 1820], ['monster', 'cow', 1920], ['monster', 'cow', 2000],
      ['monster', 'goblin', 2100], ['monster', 'goblin', 2180], ['monster', 'imp', 2260],
      ['sign', 'draynor', 2350]
    ],
  },
  draynor: {
    name: 'Draynor', width: 2200, spawn: 160, req: null, sky: ['#c8e0c8', '#e8f0e8'], hill: ['#6a9a5a', '#4a7a3a'], ground: '#5a8a4a',
    entities: [
      ['sign', 'lumby', 80], ['station', 'bank', 280], ['station', 'store', 420],
      ['node', 'willow', 560], ['node', 'willow', 660], ['node', 'oak', 780],
      ['monster', 'zombie', 980], ['monster', 'zombie', 1080], ['monster', 'skeleton', 1200],
      ['monster', 'giant_rat', 1340], ['monster', 'giant_rat', 1440],
      ['node', 'iron', 1600], ['node', 'coal', 1700],
      ['sign', 'alkharid', 2100]
    ],
  },
  alkharid: {
    name: 'Al Kharid', width: 2300, spawn: 160, req: null, sky: ['#f0e0a0', '#f8f0c8'], hill: ['#d0b060', '#b09040'], ground: '#c8a050',
    entities: [
      ['sign', 'draynor', 80], ['station', 'bank', 300], ['station', 'store', 450], ['station', 'tanner', 560],
      ['node', 'copper', 600], ['node', 'tin', 700], ['node', 'iron', 850], ['node', 'iron', 950],
      ['monster', 'scorpion', 1150], ['monster', 'scorpion', 1250], ['monster', 'al_kharid_warrior', 1400],
      ['monster', 'al_kharid_warrior', 1500],
      ['node', 'coal', 1700], ['node', 'mithril', 1850],
      ['sign', 'mage_tower', 2200]
    ],
  },
  mage_tower: {
    name: 'Mage Tower', width: 1800, spawn: 140, req: null, sky: ['#a0c0e8', '#c8e0f8'], hill: ['#6a8ab0', '#4a6a90'], ground: '#5a7a9a',
    entities: [
      ['sign', 'alkharid', 70], ['station', 'altar', 250],
      ['monster', 'wizard', 450], ['monster', 'wizard', 550], ['monster', 'dark_wizard', 700],
      ['node', 'rune_essence', 900], ['node', 'rune_essence', 1000],
      ['monster', 'imp', 1200], ['monster', 'imp', 1300],
      ['station', 'fire', 1500]
    ],
  },
  brimhaven_dungeon: {
    name: 'Brimhaven Dungeon', width: 2600, spawn: 150, req: null, sky: ['#4a3a2a', '#6a5a4a'], hill: ['#3a2a1a', '#2a1a0a'], ground: '#5a4a3a',
    entities: [
      ['sign', 'alkharid', 80],
      ['monster', 'moss_giant', 300], ['monster', 'moss_giant', 420],
      ['monster', 'fire_giant', 560], ['monster', 'fire_giant', 680],
      ['monster', 'greater_demon', 840], ['monster', 'greater_demon', 960],
      ['monster', 'black_demon', 1120], ['monster', 'black_demon', 1240],
      ['monster', 'steel_dragon', 1420], ['monster', 'steel_dragon', 1540],
      ['monster', 'iron_dragon', 1700], ['monster', 'iron_dragon', 1820],
      ['monster', 'bronze_dragon', 1980],
      ['station', 'fire', 2200]
    ],
  },
  falador: {
    name: 'Falador', width: 2200, spawn: 160, req: null, sky: ['#d0e0f0', '#e8f0f8'], hill: ['#8aa0b0', '#6a8090'], ground: '#7a90a0',
    entities: [
      ['sign', 'lumby', 70], ['station', 'bank', 280], ['station', 'store', 420],
      ['monster', 'white_knight', 600], ['monster', 'white_knight', 700],
      ['monster', 'guard', 850], ['monster', 'guard', 950],
      ['node', 'iron', 1150], ['node', 'coal', 1250],
      ['sign', 'varrock', 2100]
    ],
  },
  varrock: {
    name: 'Varrock', width: 2400, spawn: 180, req: null, sky: ['#c8d8c8', '#e0f0e0'], hill: ['#6a8a5a', '#4a6a3a'], ground: '#5a7a4a',
    entities: [
      ['sign', 'falador', 80], ['station', 'bank', 300], ['station', 'store', 450],
      ['monster', 'guard', 650], ['monster', 'guard', 750],
      ['monster', 'thief', 900], ['monster', 'thief', 1000],
      ['node', 'tree', 1200], ['node', 'tree', 1300],
      ['sign', 'edgeville', 2300]
    ],
  },
  edgeville: {
    name: 'Edgeville', width: 2000, spawn: 140, req: null, sky: ['#b0c0d0', '#d0e0f0'], hill: ['#5a6a7a', '#3a4a5a'], ground: '#4a5a6a',
    entities: [
      ['sign', 'varrock', 70], ['station', 'bank', 250], ['station', 'store', 400],
      ['monster', 'guard', 550], ['monster', 'skeleton', 700], ['monster', 'skeleton', 800],
      ['sign', 'wilderness', 1900]
    ],
  },
  wilderness: {
    name: 'Wilderness', width: 2800, spawn: 120, req: null, sky: ['#6a4a3a', '#8a6a5a'], hill: ['#4a2a1a', '#3a1a0a'], ground: '#5a3a2a',
    entities: [
      ['sign', 'edgeville', 60],
      ['monster', 'dark_wizard', 250], ['monster', 'dark_wizard', 350],
      ['monster', 'greater_demon', 500], ['monster', 'black_demon', 650],
      ['monster', 'chaos_elemental', 850],
      ['monster', 'green_dragon', 1050], ['monster', 'green_dragon', 1150],
      ['monster', 'moss_giant', 1350], ['monster', 'fire_giant', 1500],
      ['station', 'fire', 1800]
    ],
  },
  port_sarim: {
    name: 'Port Sarim', width: 2000, spawn: 150, req: null, sky: ['#a0d0e8', '#c0e0f8'], hill: ['#6a9ab0', '#4a7a90'], ground: '#5a8aa0',
    entities: [
      ['sign', 'lumby', 70], ['station', 'bank', 280], ['station', 'store', 420],
      ['monster', 'pirate', 600], ['monster', 'pirate', 700],
      ['monster', 'seagull', 850], ['monster', 'seagull', 950],
      ['node', 'pond', 1150],
      ['sign', 'draynor', 1900]
    ],
  },
};
export const AREA_IDS = Object.keys(AREAS);
export const START_AREA = 'lumby';
export const BAG_SLOTS = 28;
export const SHOP_BUY = ['hammer', 'bronze_pickaxe', 'bronze_axe', 'iron_pickaxe', 'iron_axe', 'bronze_dagger', 'bronze_scimitar', 'bronze_mace', 'small_net', 'fishing_rod', 'harpoon', 'lobster_pot', 'feather', 'shortbow', 'oak_shortbow', 'bronze_arrows', 'iron_arrows', 'air_rune', 'mind_rune', 'water_rune', 'earth_rune', 'fire_rune', 'chaos_rune', 'rune_essence'];
export const SELL_RATE = 0.5;
