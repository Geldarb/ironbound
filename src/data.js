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
  { id: 'paladins', name: 'Paladins', monsters: ['paladin', 'knight_of_ardougne'], amount: [8, 18], level: 40, xp: 70 },
];
export const SLAYER_MASTER = { name: 'Turael', blurb: 'Assigns Slayer tasks. Complete them for bonus XP and coins.' };
export const SPELLS = []; // filled in the OSRS standard spellbook block below
export const SPELL_BY_ID = {};

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
  { id: 'weapon', name: 'Weapon' }, { id: 'shield', name: 'Shield' }, { id: 'gloves', name: 'Gloves' }, { id: 'boots', name: 'Boots' }, { id: 'ammo', name: 'Ammo' },
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
/** Ranged / magic weapon kinds (not smithable, so kept out of WEAPON_KINDS). Styles may override the stance's XP split and
 *  effective-level bonus: `xp` = skills trained, `bonus` = +effective levels, `speed` = seconds off the interval. */
const RS = (stance, name, type, xp, bonus = {}, extra = {}) => ({ stance, name, type, xp, bonus, ...extra });
export const RANGED_KINDS = {
  bow: { name: 'Bow', interval: 1.8, a: {}, str: 0, two: true, reach: 170, ranged: true, blurb: 'Ranged: fires the arrows in your ammo slot (Ranged skill)',
    styles: [RS('accurate', 'Accurate', 'ranged', ['ranged'], { ranged: 3 }), RS('aggressive', 'Rapid', 'ranged', ['ranged'], {}, { speed: 0.3 }), RS('defensive', 'Longrange', 'ranged', ['ranged', 'defence'], { defence: 3 })] },
  staff: { name: 'Staff', interval: 2.4, a: {}, str: 0, two: true, reach: 150, magic: true, blurb: 'Magic: casts your autocast (or best) combat spell using runes',
    styles: [RS('accurate', 'Cast', 'magic', ['magic'], { magic: 3 }), RS('aggressive', 'Bash', 'crush', ['strength'], { strength: 3 }, { melee: true }), RS('defensive', 'Def. cast', 'magic', ['magic', 'defence'], { defence: 3 })] },
};
export const ALL_WEAPON_KINDS = { ...WEAPON_KINDS, ...RANGED_KINDS };
/** XP split for an active weapon style (ranged/magic styles carry their own) */
export const styleXp = (style) => (style?.xp ? style.xp.map((k) => [k, 1 / style.xp.length]) : stanceXp(style?.stance));
export const ARROW_IDS = []; // best first; filled in the OSRS ranged block below
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
add('coins', { name: 'Coins', stack: true, value: 1, art: 'coins' }); // restored: used by drops, shop, UI icons
add('enchant_gem', { name: 'Enchantment gem', stack: false, value: 1, art: 'gem', c: '#d9a6ff' });
add('clue_scroll', { name: 'Clue scroll', stack: false, value: 1, art: 'scroll', c: '#f5e6c8' });
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
// Magic staves/wands (fletched)
add('staff', { name: 'Staff', stack: false, value: 15, art: 'staff', c: '#b9824a', slot: 'weapon', req: { skill: 'magic', level: 1 }, interval: 2.4, wk: 'staff', two: true, bonus: { atk: 4, str: 0, def: 0, a: {}, mag: 4 } });
add('magic_staff', { name: 'Magic staff', stack: false, value: 200, art: 'staff', c: '#6a6ae8', slot: 'weapon', req: { skill: 'magic', level: 1 }, interval: 2.4, wk: 'staff', two: true, bonus: { atk: 10, str: 0, def: 0, a: {}, mag: 10 } });
add('air_staff', { name: 'Staff of air', stack: false, value: 1500, art: 'staff', c: '#a0d0e8', infinite: 'air_rune', slot: 'weapon', req: { skill: 'magic', level: 1 }, interval: 2.4, wk: 'staff', two: true, bonus: { atk: 10, str: 0, def: 0, a: {}, mag: 10 } });
// Leather / hides
add('cowhide', { name: 'Cowhide', stack: true, value: 3, art: 'pelt', c: '#c9b48a' });
add('soft_leather', { name: 'Soft leather', stack: true, value: 8, art: 'pelt', c: '#e8c8a0' });
add('hard_leather', { name: 'Hard leather', stack: true, value: 15, art: 'pelt', c: '#c9a46a' });
add('leather_body', { name: 'Leather body', stack: false, value: 25, art: 'body', c: '#c9a46a', slot: 'body', req: { skill: 'ranged', level: 1 }, def: 10, bonus: { atk: 0, str: 0, def: 10, a: {} } });
add('hardleather_body', { name: 'Hardleather body', stack: false, value: 60, art: 'body', c: '#b9824a', slot: 'body', req: { skill: 'ranged', level: 10 }, def: 18, bonus: { atk: 0, str: 0, def: 18, a: {} } });
add('studded_body', { name: 'Studded body', stack: false, value: 150, art: 'body', c: '#9a6a3a', slot: 'body', req: { skill: 'ranged', level: 20 }, def: 28, bonus: { atk: 0, str: 0, def: 28, a: {} } });
// Runes (Magic ammo, Runecrafting output) + essence
add('rune_essence', { name: 'Rune essence', stack: true, value: 2, art: 'ore', c: '#d8d0b8' });
add('ashes', { name: 'Ashes', stack: true, value: 2, art: 'ore', c: '#8a8a8a' });
add('steel_studs', { name: 'Steel studs', stack: true, value: 30, art: 'bar', c: '#c9d6e3' });
add('anti_dragon_shield', { name: 'Anti-dragon shield', stack: false, value: 20, art: 'shield', c: '#c9a46a', d: '#6a4a2a', slot: 'shield', req: { skill: 'defence', level: 1 }, antifire: true, bonus: { atk: 0, str: 0, def: 7, a: {} } });
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
  ['rat', 'Raw rat meat', 'Cooked rat meat', 2, 3, '#b08a80', 1, 20, 30],
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
RECIPES.push({ id: 'steel_studs', station: 'anvil', tier: 2, out: 'steel_studs', inputs: { steel_bar: 1 }, level: 36, xp: 37.5, chance: 1 });
for (const [i] of TIERS.entries()) {
  for (const [kind, k] of Object.entries(SMITH_KINDS)) {
    RECIPES.push({ id: `${TIERS[i].id}_${kind}`, station: 'anvil', tier: i, out: `${TIERS[i].id}_${kind}`, inputs: { [TIER_BAR[i]]: k.bars }, level: Math.min(99, k.smithLevel + TIER_SMITH[i]), xp: k.bars * BAR_XP[i], chance: 1 });
  }
}
/** Cooking: station 'cook' = campfire or range. Burn chance starts at 50% (fire) / 30% (range) at the required level and falls to 0 at `stop`. */
for (const c of COOKABLE) RECIPES.push({ id: `cook_${c.out}`, station: 'cook', skill: 'cooking', out: c.out, inputs: { [c.raw]: 1 }, level: c.level, stop: c.stop, xp: c.xp, chance: 1, burnt: 'burnt_food' });
// Fletching
RECIPES.push({ id: 'arrow_shaft', station: 'fletch', skill: 'fletching', out: 'arrow_shaft', inputs: { logs: 1 }, level: 1, xp: 5, chance: 1, n: 15 });
RECIPES.push({ id: 'headless_arrow', station: 'fletch', skill: 'fletching', out: 'headless_arrow', inputs: { arrow_shaft: 1, feather: 1 }, level: 1, xp: 1, chance: 1 });
RECIPES.push({ id: 'staff', station: 'fletch', skill: 'fletching', out: 'staff', inputs: { logs: 1 }, level: 1, xp: 12.5, chance: 1 });
// Crafting
RECIPES.push({ id: 'leather_body', station: 'craft', skill: 'crafting', out: 'leather_body', inputs: { soft_leather: 1 }, level: 14, xp: 25, chance: 1 });
RECIPES.push({ id: 'hardleather_body', station: 'craft', skill: 'crafting', out: 'hardleather_body', inputs: { hard_leather: 1 }, level: 28, xp: 35, chance: 1 });
RECIPES.push({ id: 'studded_body', station: 'craft', skill: 'crafting', out: 'studded_body', inputs: { hard_leather: 1, steel_studs: 1 }, level: 41, xp: 40, chance: 1 });
// Runecrafting (no altar station yet: usable from the Craft tab like fletching/crafting)

// ======================= OSRS ranged: bows, arrows, fletching =======================
add('bow_string', { name: 'Bow string', stack: true, value: 30, art: 'arrow', c: '#f3ead2' });
add('flax', { name: 'Flax', stack: true, value: 5, art: 'herb', c: '#8ab0e8' });
for (const [id, name, v] of [['maple_logs', 'Maple logs', 35], ['yew_logs', 'Yew logs', 80], ['magic_logs', 'Magic logs', 300]]) add(id, { name, stack: true, value: v, art: 'log', c: { maple_logs: '#c9803a', yew_logs: '#6a4a2a', magic_logs: '#4a7ac8' }[id] });
/** arrow tiers in order; a bow fires arrows up to its `maxArrow` tier (OSRS: e.g. yew bows fire rune arrows, normal bows only bronze/iron) */
export const ARROW_TIERS = [
  { id: 'bronze', name: 'Bronze', str: 7, fl: 1, xp: 1.3, tipLv: 5, tipXp: 12.5, bar: 'bronze_bar', v: 2, c: '#d08f55' },
  { id: 'iron', name: 'Iron', str: 10, fl: 15, xp: 2.5, tipLv: 20, tipXp: 25, bar: 'iron_bar', v: 5, c: '#aab3bf' },
  { id: 'steel', name: 'Steel', str: 16, fl: 30, xp: 5, tipLv: 35, tipXp: 37.5, bar: 'steel_bar', v: 12, c: '#c9d6e3' },
  { id: 'mithril', name: 'Mithril', str: 22, fl: 45, xp: 7.5, tipLv: 55, tipXp: 50, bar: 'mithril_bar', v: 30, c: '#6a8ee8' },
  { id: 'adamant', name: 'Adamant', str: 31, fl: 60, xp: 10, tipLv: 75, tipXp: 62.5, bar: 'adamant_bar', v: 80, c: '#4cbf6b' },
  { id: 'rune', name: 'Rune', str: 49, fl: 75, xp: 12.5, tipLv: 90, tipXp: 75, bar: 'rune_bar', v: 200, c: '#38c8d8' },
];
ARROW_TIERS.forEach((t, i) => {
  add(`${t.id}_arrowtips`, { name: `${t.name} arrowtips`, stack: true, value: Math.ceil(t.v / 2), art: 'arrow', c: t.c });
  add(`${t.id}_arrows`, { name: `${t.name} arrows`, stack: true, value: t.v, art: 'arrow', c: t.c, ammo: t.str, arrowTier: i, slot: 'ammo', bonus: { atk: 0, str: 0, def: 0, a: {}, rng: 0 }, req: { skill: 'ranged', level: [1, 1, 5, 20, 30, 40][i] } });
  RECIPES.push({ id: `${t.id}_arrowtips`, station: 'anvil', tier: Math.min(i, 5), out: `${t.id}_arrowtips`, inputs: { [t.bar]: 1 }, level: t.tipLv, xp: t.tipXp, chance: 1, n: 15 });
  RECIPES.push({ id: `${t.id}_arrows`, station: 'fletch', skill: 'fletching', out: `${t.id}_arrows`, inputs: { headless_arrow: 15, [`${t.id}_arrowtips`]: 15 }, level: t.fl, xp: Math.round(t.xp * 15 * 10) / 10, chance: 1, n: 15 });
});
ARROW_IDS.push(...ARROW_TIERS.map((t) => `${t.id}_arrows`).reverse());
/** bows: [logs, prefix, Ranged req, ranged attack, max arrow tier, [shortbow fletch lv, xp], [longbow fletch lv, xp]] (OSRS values) */
export const BOW_WOODS = [
  ['logs', '', 1, 8, 1, [5, 5], [10, 10], '#b9824a'], ['oak_logs', 'oak_', 5, 14, 2, [20, 16.5], [25, 25], '#9a6a3a'],
  ['willow_logs', 'willow_', 20, 20, 3, [35, 33.3], [40, 41.5], '#7a9a5a'], ['maple_logs', 'maple_', 30, 29, 4, [50, 50], [55, 58.3], '#c9803a'],
  ['yew_logs', 'yew_', 40, 47, 5, [65, 67.5], [70, 75], '#6a4a2a'], ['magic_logs', 'magic_', 50, 69, 5, [80, 83.3], [85, 91.5], '#4a7ac8'],
];
for (const [logs, pre, req, atk, maxArrow, sb, lb, c] of BOW_WOODS) {
  const wood = pre ? pre[0].toUpperCase() + pre.slice(1, -1) + ' ' : '';
  for (const [kind, f, interval, mult] of [['shortbow', sb, 1.8, 1], ['longbow', lb, 2.4, 1]]) {
    const id = `${pre}${kind}`, value = Math.round(40 * (1 + atk / 8) ** 1.6);
    add(`${id}_u`, { name: `${wood}${kind} (u)`.replace(/^./, (x) => x.toUpperCase()), stack: false, value: Math.round(value / 2), art: 'bow', c });
    add(id, { name: `${wood}${kind}`.replace(/^./, (x) => x.toUpperCase()), stack: false, value, art: 'bow', c, slot: 'weapon', req: { skill: 'ranged', level: req }, interval, wk: 'bow', two: true, maxArrow, reach: kind === 'longbow' ? 190 : 170, bonus: { atk: atk * mult, str: 0, def: 0, a: {}, rng: atk * mult } });
    RECIPES.push({ id: `${id}_u`, station: 'fletch', skill: 'fletching', out: `${id}_u`, inputs: { [logs]: 1 }, level: f[0], xp: f[1], chance: 1 });
    RECIPES.push({ id, station: 'fletch', skill: 'fletching', out: id, inputs: { [`${id}_u`]: 1, bow_string: 1 }, level: f[0], xp: f[1], chance: 1 });
  }
}
RECIPES.push({ id: 'bow_string', station: 'craft', skill: 'crafting', out: 'bow_string', inputs: { flax: 1 }, level: 10, xp: 15, chance: 1 });

// ======================= OSRS standard spellbook =======================
/** runes: [id, name, colour, value, runecrafting level, rc xp per rune] (OSRS) */
export const RUNES = [
  ['air_rune', 'Air rune', '#d8eef8', 4, 1, 5], ['mind_rune', 'Mind rune', '#e8a040', 3, 2, 5.5], ['water_rune', 'Water rune', '#3b8eea', 4, 5, 6],
  ['earth_rune', 'Earth rune', '#8a6a3a', 4, 9, 6.5], ['fire_rune', 'Fire rune', '#e8453c', 4, 14, 7], ['body_rune', 'Body rune', '#4a7ae8', 3, 20, 7.5],
  ['cosmic_rune', 'Cosmic rune', '#e8e04a', 50, 27, 8], ['chaos_rune', 'Chaos rune', '#d8a020', 40, 35, 8.5], ['astral_rune', 'Astral rune', '#e8d0e8', 100, 40, 8.7],
  ['nature_rune', 'Nature rune', '#3fb950', 80, 44, 9], ['law_rune', 'Law rune', '#2a4ad8', 120, 54, 9.5], ['death_rune', 'Death rune', '#4a4a5a', 120, 65, 10],
  ['blood_rune', 'Blood rune', '#c8102e', 200, 77, 23.8], ['soul_rune', 'Soul rune', '#b8a8e8', 150, 90, 29.7], ['wrath_rune', 'Wrath rune', '#8a1a3a', 250, 95, 8],
];
for (const [id, name, c, v, lvl, xp] of RUNES) {
  add(id, { name, stack: true, value: v, art: 'rune', c, rune: true });
  RECIPES.push({ id: `rc_${id}`, station: 'runecraft', skill: 'runecrafting', out: id, inputs: { rune_essence: 1 }, level: lvl, xp, chance: 1 });
}
/** elemental staves supply unlimited runes of their element */
for (const [el, c] of [['water', '#3b8eea'], ['earth', '#8a6a3a'], ['fire', '#e8453c']]) add(`${el}_staff`, { name: `Staff of ${el}`, stack: false, value: 1500, art: 'staff', c, infinite: `${el}_rune`, slot: 'weapon', req: { skill: 'magic', level: 1 }, interval: 2.4, wk: 'staff', two: true, bonus: { atk: 10, str: 0, def: 0, a: {}, mag: 10 } });
const R = (o) => o;
// combat spells: OSRS level, runes, max hit, base xp
const ELEM = ['wind', 'water', 'earth', 'fire'];
const TIER_SPELLS = [
  ['strike', 'Strike', [1, 5, 9, 13], [2, 4, 6, 8], [5.5, 7.5, 9.5, 11.5], [{ air_rune: 1, mind_rune: 1 }, { water_rune: 1, air_rune: 1, mind_rune: 1 }, { earth_rune: 2, air_rune: 1, mind_rune: 1 }, { fire_rune: 3, air_rune: 2, mind_rune: 1 }]],
  ['bolt', 'Bolt', [17, 23, 29, 35], [9, 10, 11, 12], [13.5, 16.5, 19.5, 22.5], [{ air_rune: 2, chaos_rune: 1 }, { water_rune: 2, air_rune: 2, chaos_rune: 1 }, { earth_rune: 3, air_rune: 2, chaos_rune: 1 }, { fire_rune: 4, air_rune: 3, chaos_rune: 1 }]],
  ['blast', 'Blast', [41, 47, 53, 59], [13, 14, 15, 16], [25.5, 28.5, 31.5, 34.5], [{ air_rune: 3, death_rune: 1 }, { water_rune: 3, air_rune: 3, death_rune: 1 }, { earth_rune: 4, air_rune: 3, death_rune: 1 }, { fire_rune: 5, air_rune: 4, death_rune: 1 }]],
  ['wave', 'Wave', [62, 65, 70, 75], [17, 18, 19, 20], [36, 37.5, 40, 42.5], [{ air_rune: 5, blood_rune: 1 }, { water_rune: 7, air_rune: 5, blood_rune: 1 }, { earth_rune: 7, air_rune: 5, blood_rune: 1 }, { fire_rune: 7, air_rune: 5, blood_rune: 1 }]],
  ['surge', 'Surge', [81, 85, 90, 95], [21, 22, 23, 24], [44.5, 46.5, 48.5, 50.5], [{ air_rune: 7, wrath_rune: 1 }, { water_rune: 10, air_rune: 7, wrath_rune: 1 }, { earth_rune: 10, air_rune: 7, wrath_rune: 1 }, { fire_rune: 10, air_rune: 7, wrath_rune: 1 }]],
];
for (const [k, K, lv, mh, xp, runes] of TIER_SPELLS) ELEM.forEach((e, i) => SPELLS.push(R({ id: `${e}_${k}`, name: `${e[0].toUpperCase() + e.slice(1)} ${K}`, type: 'combat', elem: e, level: lv[i], maxHit: mh[i], xp: xp[i], runes: runes[i] })));
SPELLS.push({ id: 'crumble_undead', name: 'Crumble Undead', type: 'combat', elem: 'earth', undeadOnly: true, level: 39, maxHit: 15, xp: 24.5, runes: { earth_rune: 2, air_rune: 2, chaos_rune: 1 }, blurb: 'Undead only' });
SPELLS.push({ id: 'confuse', name: 'Confuse', type: 'curse', curse: 'confuse', level: 3, xp: 13, runes: { water_rune: 3, earth_rune: 2, body_rune: 1 }, blurb: "Target's accuracy -5%" });
SPELLS.push({ id: 'weaken', name: 'Weaken', type: 'curse', curse: 'weaken', level: 11, xp: 21, runes: { water_rune: 3, earth_rune: 2, body_rune: 1 }, blurb: "Target's max hit -5%" });
SPELLS.push({ id: 'curse', name: 'Curse', type: 'curse', curse: 'curse', level: 19, xp: 29, runes: { water_rune: 2, earth_rune: 3, body_rune: 1 }, blurb: "Target's defence -5%" });
SPELLS.push({ id: 'bind', name: 'Bind', type: 'bind', hold: 5, maxHit: 0, level: 20, xp: 30, runes: { earth_rune: 3, water_rune: 3, nature_rune: 2 }, blurb: 'Holds a melee target for 5s' });
SPELLS.push({ id: 'snare', name: 'Snare', type: 'bind', hold: 10, maxHit: 3, level: 50, xp: 60, runes: { earth_rune: 4, water_rune: 4, nature_rune: 3 }, blurb: 'Holds a melee target for 10s' });
SPELLS.push({ id: 'entangle', name: 'Entangle', type: 'bind', hold: 15, maxHit: 5, level: 79, xp: 89, runes: { earth_rune: 5, water_rune: 5, nature_rune: 4 }, blurb: 'Holds a melee target for 15s' });
SPELLS.push({ id: 'low_alch', name: 'Low Level Alchemy', type: 'alch', mult: 0.4, level: 21, xp: 31, runes: { fire_rune: 3, nature_rune: 1 }, blurb: 'Item -> 40% of its value in coins' });
SPELLS.push({ id: 'high_alch', name: 'High Level Alchemy', type: 'alch', mult: 0.6, level: 55, xp: 65, runes: { fire_rune: 5, nature_rune: 1 }, blurb: 'Item -> 60% of its value in coins' });
SPELLS.push({ id: 'varrock_tele', name: 'Varrock Teleport', type: 'tele', area: 'varrock', level: 25, xp: 35, runes: { fire_rune: 1, air_rune: 3, law_rune: 1 } });
SPELLS.push({ id: 'lumbridge_tele', name: 'Lumbridge Teleport', type: 'tele', area: 'lumby', level: 31, xp: 41, runes: { earth_rune: 1, air_rune: 3, law_rune: 1 } });
SPELLS.push({ id: 'falador_tele', name: 'Falador Teleport', type: 'tele', area: 'falador', level: 37, xp: 48, runes: { water_rune: 1, air_rune: 3, law_rune: 1 } });
SPELLS.push({ id: 'camelot_tele', name: 'Camelot Teleport', type: 'tele', area: 'camelot', level: 45, xp: 55.5, runes: { air_rune: 5, law_rune: 1 } });
SPELLS.push({ id: 'ardougne_tele', name: 'Ardougne Teleport', type: 'tele', area: 'ardougne', level: 51, xp: 61, runes: { water_rune: 2, law_rune: 2 } });
for (const sp of SPELLS) SPELL_BY_ID[sp.id] = sp;
export const UNDEAD = new Set(['skeleton', 'zombie']);
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
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'raw_beef', p: 1, n: [1, 1] }, { id: 'cowhide', p: 1, n: [1, 1] }, { id: 'coins', p: 0.3, n: [1, 5] }] },
  goblin: { name: 'Goblin', level: 2, hp: 5, atk: 1, def: 1, maxHit: 1, interval: 1.8, color: '#6fbf4a', family: 'humanoid', defB: { stab: 0, slash: 5, crush: 10 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [3, 12] }, { id: 'bronze_dagger', p: 0.03, n: [1, 1] }, { id: 'bronze_helm', p: 0.03, n: [1, 1] }, { id: 'bronze_mace', p: 0.03, n: [1, 1] }, { id: 'bronze_scimitar', p: 0.02, n: [1, 1] }, { id: 'bronze_spear', p: 0.02, n: [1, 1] }, { id: 'clue_scroll', p: 0.02, n: [1, 1] }] },
  wolf: { name: 'Wolf', level: 25, hp: 34, atk: 22, def: 18, maxHit: 4, interval: 1.8, color: '#8a8f98', family: 'beast', defB: { stab: 15, slash: 5, crush: 25 }, epChance: 0.12,
    drops: [{ id: 'wolf_bones', p: 1, n: [1, 1] }, { id: 'raw_wolf', p: 0.6, n: [1, 1] }, { id: 'wolf_pelt', p: 0.5, n: [1, 1] }, { id: 'coins', p: 0.4, n: [8, 30] }, { id: 'iron_sword', p: 0.03, n: [1, 1] }, { id: 'iron_scimitar', p: 0.02, n: [1, 1] }, { id: 'iron_mace', p: 0.02, n: [1, 1] }] },
  alpha_wolf: { name: 'Alpha wolf', level: 38, hp: 70, atk: 35, def: 30, maxHit: 8, interval: 1.8, color: '#4a4f5a', family: 'beast', defB: { stab: 30, slash: 20, crush: 40 }, boss: true, respawn: 45, epFlat: 8, epChance: 0,
    drops: [{ id: 'wolf_bones', p: 1, n: [1, 1] }, { id: 'wolf_pelt', p: 1, n: [1, 2] }, { id: 'coins', p: 1, n: [60, 160] }, { id: 'iron_2h', p: 0.15, n: [1, 1] }, { id: 'iron_longsword', p: 0.15, n: [1, 1] }, { id: 'steel_scimitar', p: 0.06, n: [1, 1] }] },
  hill_giant: { name: 'Hill giant', level: 28, hp: 40, atk: 25, def: 25, maxHit: 7, interval: 2.1, color: '#c9a27a', family: 'giant', defB: { stab: 25, slash: 30, crush: 0 }, epChance: 0.2,
    drops: [{ id: 'big_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.9, n: [20, 80] }, { id: 'steel_sword', p: 0.03, n: [1, 1] }, { id: 'steel_warhammer', p: 0.03, n: [1, 1] }, { id: 'steel_2h', p: 0.02, n: [1, 1] }, { id: 'steel_halberd', p: 0.02, n: [1, 1] }, { id: 'iron_battleaxe', p: 0.04, n: [1, 1] }, { id: 'coal', p: 0.3, n: [1, 3] }] },
  goblin_archer: { name: 'Goblin archer', style: 'ranged', proj: 'arrow', level: 5, hp: 8, atk: 4, def: 2, maxHit: 2, interval: 2.0, color: '#6fa83a', family: 'humanoid', defB: { stab: 0, slash: 4, crush: 6 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.6, n: [3, 12] }, { id: 'bronze_arrows', p: 0.5, n: [3, 10] }, { id: 'feather', p: 0.3, n: [2, 6] }, { id: 'shortbow', p: 0.03, n: [1, 1] }] },
  bat: { name: 'Bat', level: 5, hp: 6, atk: 3, def: 3, maxHit: 1, interval: 1.6, color: '#5a4a6a', family: 'beast', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.04,
    drops: [{ id: 'bat_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.4, n: [1, 4] }] },
  green_dragon: { name: 'Green dragon', style: 'melee', fire: { chance: 0.3, max: 30 }, level: 79, hp: 80, atk: 68, def: 68, maxHit: 12, interval: 2.4, color: '#3a8a4a', family: 'beast', defB: { stab: 40, slash: 40, crush: 40 }, boss: true, respawn: 60, epFlat: 15, epChance: 0,
    drops: [{ id: 'dragon_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 1, n: [200, 500] }, { id: 'steel_scimitar', p: 0.1, n: [1, 1] }] },
  skeleton: { name: 'Skeleton', level: 22, hp: 25, atk: 18, def: 15, maxHit: 4, interval: 1.8, color: '#e8e0d0', family: 'undead', defB: { stab: 10, slash: 15, crush: 5 }, epChance: 0.08,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.7, n: [10, 40] }, { id: 'bronze_arrows', p: 0.3, n: [5, 15] }, { id: 'iron_arrows', p: 0.15, n: [3, 8] }] },
  zombie: { name: 'Zombie', level: 18, hp: 22, atk: 15, def: 12, maxHit: 3, interval: 1.8, color: '#6a8a5a', family: 'undead', defB: { stab: 5, slash: 10, crush: 8 }, epChance: 0.07,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.6, n: [8, 30] }, { id: 'air_rune', p: 0.2, n: [3, 8] }, { id: 'mind_rune', p: 0.15, n: [2, 6] }] },
  imp: { name: 'Imp', style: 'magic', proj: 'fire', level: 5, hp: 8, atk: 4, def: 4, maxHit: 1, interval: 1.5, color: '#d8453c', family: 'beast', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.05,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.5, n: [2, 8] }, { id: 'fire_rune', p: 0.25, n: [2, 5] }, { id: 'mind_rune', p: 0.2, n: [1, 4] }] },
  giant_rat: { name: 'Giant rat', level: 6, hp: 10, atk: 5, def: 4, maxHit: 1, interval: 1.6, color: '#8a7a6a', family: 'beast', defB: { stab: 0, slash: 2, crush: 0 }, epChance: 0.04,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.4, n: [1, 5] }, { id: 'raw_rat', p: 0.5, n: [1, 1] }] },
  scorpion: { name: 'Scorpion', level: 14, hp: 17, atk: 11, def: 11, maxHit: 2, interval: 1.7, color: '#c8a050', family: 'beast', defB: { stab: 5, slash: 5, crush: 10 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.5, n: [5, 15] }] },
  al_kharid_warrior: { name: 'Al Kharid warrior', level: 9, hp: 19, atk: 7, def: 4, maxHit: 2, interval: 1.8, color: '#e8c070', family: 'humanoid', defB: { stab: 5, slash: 8, crush: 5 }, epChance: 0.07,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [10, 30] }, { id: 'bronze_scimitar', p: 0.05, n: [1, 1] }, { id: 'iron_scimitar', p: 0.02, n: [1, 1] }] },
  wizard: { name: 'Wizard', style: 'magic', proj: 'water', level: 9, hp: 12, atk: 8, def: 5, maxHit: 3, interval: 2.0, color: '#6a6ae8', family: 'humanoid', defB: { stab: 0, slash: 0, crush: 0 }, epChance: 0.1,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'air_rune', p: 0.6, n: [5, 12] }, { id: 'mind_rune', p: 0.5, n: [3, 8] }, { id: 'water_rune', p: 0.3, n: [2, 6] }, { id: 'coins', p: 0.4, n: [5, 20] }] },
  dark_wizard: { name: 'Dark wizard', style: 'magic', proj: 'fire', level: 20, hp: 24, atk: 16, def: 10, maxHit: 5, interval: 2.0, color: '#4a3a6a', family: 'humanoid', defB: { stab: 5, slash: 5, crush: 5 }, epChance: 0.15,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'air_rune', p: 0.7, n: [8, 18] }, { id: 'mind_rune', p: 0.6, n: [5, 12] }, { id: 'earth_rune', p: 0.4, n: [4, 10] }, { id: 'fire_rune', p: 0.3, n: [3, 8] }, { id: 'chaos_rune', p: 0.15, n: [1, 3] }, { id: 'coins', p: 0.5, n: [15, 40] }] },
  moss_giant: { name: 'Moss giant', level: 42, hp: 60, atk: 30, def: 30, maxHit: 6, interval: 2.1, color: '#4a6a3a', family: 'giant', defB: { stab: 20, slash: 25, crush: 15 }, epChance: 0.12,
    drops: [{ id: 'big_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [30, 80] }, { id: 'steel_sword', p: 0.05, n: [1, 1] }, { id: 'steel_arrows', p: 0.2, n: [5, 15] }, { id: 'nature_rune', p: 0.15, n: [3, 8] }] },
  fire_giant: { name: 'Fire giant', level: 86, hp: 111, atk: 65, def: 65, maxHit: 11, interval: 2.4, color: '#d8453c', family: 'giant', defB: { stab: 30, slash: 35, crush: 25 }, epChance: 0.18,
    drops: [{ id: 'big_bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.9, n: [50, 150] }, { id: 'fire_rune', p: 0.4, n: [10, 25] }, { id: 'steel_2h', p: 0.04, n: [1, 1] }, { id: 'rune_scimitar', p: 0.01, n: [1, 1] }] },
  greater_demon: { name: 'Greater demon', level: 92, hp: 87, atk: 76, def: 81, maxHit: 10, interval: 2.4, color: '#8a2a2a', family: 'beast', defB: { stab: 40, slash: 40, crush: 40 }, epChance: 0.2,
    drops: [{ id: 'ashes', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [40, 120] }, { id: 'death_rune', p: 0.3, n: [3, 8] }, { id: 'rune_helm', p: 0.02, n: [1, 1] }] },
  black_demon: { name: 'Black demon', level: 172, hp: 157, atk: 145, def: 152, maxHit: 16, interval: 2.4, color: '#2a1a1a', family: 'beast', defB: { stab: 50, slash: 50, crush: 50 }, epChance: 0.25,
    drops: [{ id: 'ashes', p: 1, n: [1, 1] }, { id: 'coins', p: 0.9, n: [100, 300] }, { id: 'death_rune', p: 0.4, n: [5, 12] }, { id: 'rune_body', p: 0.015, n: [1, 1] }] },
  steel_dragon: { name: 'Steel dragon', style: 'melee', fire: { chance: 0.3, max: 45 }, level: 246, hp: 160, atk: 210, def: 210, maxHit: 22, interval: 2.4, color: '#c9d6e3', family: 'beast', defB: { stab: 60, slash: 60, crush: 60 }, boss: true, respawn: 45, epFlat: 20, epChance: 0,
    drops: [{ id: 'dragon_bones', p: 1, n: [1, 1] }, { id: 'steel_bar', p: 0.8, n: [2, 5] }, { id: 'coins', p: 1, n: [200, 600] }, { id: 'rune_legs', p: 0.02, n: [1, 1] }] },
  iron_dragon: { name: 'Iron dragon', style: 'melee', fire: { chance: 0.3, max: 40 }, level: 189, hp: 165, atk: 165, def: 165, maxHit: 17, interval: 2.4, color: '#aab3bf', family: 'beast', defB: { stab: 50, slash: 50, crush: 50 }, boss: true, respawn: 40, epFlat: 12, epChance: 0,
    drops: [{ id: 'dragon_bones', p: 1, n: [1, 1] }, { id: 'iron_bar', p: 0.7, n: [2, 5] }, { id: 'coins', p: 1, n: [150, 400] }, { id: 'rune_axe', p: 0.015, n: [1, 1] }] },
  bronze_dragon: { name: 'Bronze dragon', style: 'melee', fire: { chance: 0.3, max: 35 }, level: 131, hp: 102, atk: 112, def: 112, maxHit: 14, interval: 2.4, color: '#d08f55', family: 'beast', defB: { stab: 40, slash: 40, crush: 40 }, boss: true, respawn: 35, epFlat: 8, epChance: 0,
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
  chaos_elemental: { name: 'Chaos elemental', style: 'magic', proj: 'chaos', level: 305, hp: 250, atk: 250, def: 200, maxHit: 28, interval: 2.4, color: '#6a3a6a', family: 'beast', defB: { stab: 50, slash: 50, crush: 50 }, boss: true, respawn: 90, epFlat: 30, epChance: 0,
    drops: [{ id: 'coins', p: 1, n: [500, 2000] }, { id: 'death_rune', p: 0.6, n: [10, 30] }, { id: 'chaos_rune', p: 0.5, n: [15, 40] }, { id: 'rune_body', p: 0.01, n: [1, 1] }] },
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
NODES.maple = { name: 'Maple tree', skill: 'woodcutting', tool: 'axe', level: 45, xp: 100, item: 'maple_logs', interval: 3, respawn: 9, chance: 0.33, color: '#c9803a' };
NODES.yew = { name: 'Yew tree', skill: 'woodcutting', tool: 'axe', level: 60, xp: 175, item: 'yew_logs', interval: 3.4, respawn: 14, chance: 0.28, color: '#3a5a2a' };
NODES.magic_tree = { name: 'Magic tree', skill: 'woodcutting', tool: 'axe', level: 75, xp: 250, item: 'magic_logs', interval: 3.8, respawn: 20, chance: 0.22, color: '#4a7ac8' };
NODES.flax = { name: 'Flax', skill: 'crafting', tool: null, level: 1, xp: 1, item: 'flax', interval: 1.6, respawn: 3, chance: 1, color: '#8ab0e8' };
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
      ['monster', 'goblin', 2100], ['monster', 'goblin_archer', 2180], ['monster', 'imp', 2260],
      ['sign', 'draynor', 2350], ['sign', 'falador', 60]
    ],
  },
  draynor: {
    name: 'Draynor', width: 2200, spawn: 160, req: null, sky: ['#c8e0c8', '#e8f0e8'], hill: ['#6a9a5a', '#4a7a3a'], ground: '#5a8a4a',
    entities: [
      ['sign', 'lumby', 80], ['station', 'bank', 280], ['station', 'store', 420],
      ['node', 'willow', 560], ['node', 'willow', 660], ['node', 'oak', 780],
      ['monster', 'zombie', 980], ['monster', 'zombie', 1080], ['monster', 'skeleton', 1200],
      ['monster', 'giant_rat', 1340], ['monster', 'giant_rat', 1440],
      ['node', 'iron', 1600], ['node', 'coal', 1700], ['node', 'stream', 1820], ['monster', 'bat', 1900],
      ['sign', 'port_sarim', 1990], ['sign', 'alkharid', 2100]
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
      ['sign', 'brimhaven_dungeon', 2040], ['sign', 'mage_tower', 2200]
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
      ['monster', 'wolf', 1000], ['monster', 'wolf', 1120], ['monster', 'alpha_wolf', 1300], ['monster', 'hill_giant', 1500], ['monster', 'hill_giant', 1650],
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
      ['node', 'adamant', 2000], ['node', 'runite', 2150], ['node', 'adamant', 2300],
      ['station', 'fire', 1800]
    ],
  },
  port_sarim: {
    name: 'Port Sarim', width: 2000, spawn: 150, req: null, sky: ['#a0d0e8', '#c0e0f8'], hill: ['#6a9ab0', '#4a7a90'], ground: '#5a8aa0',
    entities: [
      ['sign', 'lumby', 70], ['station', 'bank', 280], ['station', 'store', 420],
      ['monster', 'pirate', 600], ['monster', 'pirate', 700],
      ['monster', 'seagull', 850], ['monster', 'seagull', 950],
      ['node', 'pond', 1150], ['node', 'deep', 1350], ['node', 'cage', 1500],
      ['sign', 'draynor', 1900]
    ],
  },
};
// ---- Kandarin (OSRS style): Camelot & Seers' Village, East Ardougne market
Object.assign(MONSTERS, {
  unicorn: { name: 'Unicorn', level: 15, hp: 19, atk: 13, def: 12, maxHit: 2, interval: 2.0, color: '#f4f4fa', family: 'beast', defB: { stab: 4, slash: 4, crush: 4 }, epChance: 0.06,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'unicorn_horn', p: 1, n: [1, 1] }] },
  paladin: { name: 'Paladin', level: 62, hp: 57, atk: 54, def: 54, maxHit: 6, interval: 2.0, color: '#e8ecf0', family: 'humanoid', defB: { stab: 40, slash: 45, crush: 35 }, epChance: 0.1,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.9, n: [60, 160] }, { id: 'chaos_rune', p: 0.15, n: [5, 12] }, { id: 'mithril_arrows', p: 0.08, n: [5, 15] }, { id: 'adamant_sword', p: 0.02, n: [1, 1] }] },
  knight_of_ardougne: { name: 'Knight of Ardougne', level: 46, hp: 52, atk: 38, def: 38, maxHit: 5, interval: 2.0, color: '#aab3bf', family: 'humanoid', defB: { stab: 30, slash: 34, crush: 26 }, epChance: 0.08,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 0.8, n: [30, 90] }, { id: 'steel_arrows', p: 0.12, n: [5, 12] }, { id: 'mithril_sword', p: 0.02, n: [1, 1] }] },
  hero: { name: 'Hero', level: 69, hp: 82, atk: 60, def: 58, maxHit: 7, interval: 2.0, color: '#8a1a2a', family: 'humanoid', defB: { stab: 45, slash: 48, crush: 40 }, epChance: 0.12,
    drops: [{ id: 'bones', p: 1, n: [1, 1] }, { id: 'coins', p: 1, n: [100, 300] }, { id: 'law_rune', p: 0.15, n: [2, 5] }, { id: 'blood_rune', p: 0.08, n: [2, 4] }, { id: 'adamant_arrows', p: 0.1, n: [5, 12] }] },
});
add('unicorn_horn', { name: 'Unicorn horn', stack: true, value: 120, art: 'gem', c: '#f3d77a' });
Object.assign(AREAS, {
  camelot: { name: 'Camelot', width: 2600, spawn: 200, req: null, sky: ['#bcd8f0', '#e8f4ff'], hill: ['#6aa05a', '#4a803a'], ground: '#5f9a4a', entities: [
    ['sign', 'varrock', 80], ['station', 'bank', 300], ['station', 'store', 440], ['node', 'flax', 600], ['node', 'flax', 680], ['node', 'flax', 760],
    ['monster', 'unicorn', 950], ['monster', 'unicorn', 1060], ['node', 'maple', 1250], ['node', 'maple', 1350], ['monster', 'guard', 1520], ['node', 'yew', 1700], ['node', 'yew', 1800],
    ['monster', 'paladin', 2000], ['node', 'magic_tree', 2200], ['node', 'magic_tree', 2320], ['sign', 'ardougne', 2520]] },
  ardougne: { name: 'Ardougne', width: 2600, spawn: 200, req: null, sky: ['#c8cce0', '#ecebf4'], hill: ['#7a8a6a', '#5a6a4a'], ground: '#7a7a6a', entities: [
    ['sign', 'camelot', 80], ['station', 'bank', 300], ['station', 'store', 450], ['monster', 'thief', 650], ['monster', 'guard', 780], ['monster', 'thief', 900],
    ['station', 'fire', 1050], ['monster', 'knight_of_ardougne', 1200], ['monster', 'knight_of_ardougne', 1320], ['node', 'oak', 1500], ['node', 'willow', 1620],
    ['monster', 'paladin', 1820], ['monster', 'paladin', 1940], ['monster', 'hero', 2160], ['node', 'tree', 2320], ['sign', 'port_sarim', 2520]] },
});
AREAS.varrock.entities.push(['sign', 'camelot', 2150]);
AREAS.port_sarim.entities.push(['sign', 'ardougne', 1850]);
export const AREA_IDS = Object.keys(AREAS);
export const START_AREA = 'lumby';
/** monster attack style (melee unless set); protect prayers block the matching style */
export const monsterStyle = (m) => m.style || 'melee';
export const PROTECT = { melee: 'protect_from_melee', ranged: 'protect_from_missiles', magic: 'protect_from_magic' };
export const BAG_SLOTS = 28;
export const SHOP_BUY = ['hammer', 'bronze_pickaxe', 'bronze_axe', 'iron_pickaxe', 'iron_axe', 'bronze_dagger', 'bronze_scimitar', 'bronze_mace', 'small_net', 'fishing_rod', 'harpoon', 'lobster_pot', 'feather', 'anti_dragon_shield', 'shortbow', 'oak_shortbow', 'bronze_arrows', 'iron_arrows', 'air_rune', 'mind_rune', 'water_rune', 'earth_rune', 'fire_rune', 'chaos_rune', 'rune_essence'];
export const SELL_RATE = 0.5;
// higher-level trees + flax (OSRS fletching supply chain)
AREAS.falador.entities.push(['node', 'maple', 1480], ['node', 'maple', 1640]);
AREAS.varrock.entities.push(['node', 'yew', 1600], ['node', 'yew', 1800]);
AREAS.mage_tower.entities.push(['node', 'magic_tree', 1680]);
AREAS.port_sarim.entities.push(['node', 'flax', 1640], ['node', 'flax', 1720]);
// shop + drops for the OSRS ranged/magic content
SHOP_BUY.push('longbow', 'oak_longbow', 'willow_shortbow', 'steel_arrows', 'flax', 'bow_string', 'staff', 'air_staff', 'water_staff', 'earth_staff', 'fire_staff', 'body_rune', 'nature_rune', 'law_rune');
for (const [mon, drops] of Object.entries({
  skeleton: [['iron_arrows', 0.25, 4, 12], ['body_rune', 0.1, 2, 6]], zombie: [['body_rune', 0.15, 2, 5]], guard: [['steel_arrows', 0.2, 3, 10]],
  wizard: [['body_rune', 0.25, 2, 6]], dark_wizard: [['body_rune', 0.3, 3, 8], ['cosmic_rune', 0.1, 1, 3], ['law_rune', 0.08, 1, 3], ['nature_rune', 0.1, 1, 4]],
  moss_giant: [['law_rune', 0.1, 2, 4], ['cosmic_rune', 0.1, 2, 4]], hill_giant: [['nature_rune', 0.08, 2, 5], ['mithril_arrows', 0.05, 3, 8]],
  fire_giant: [['blood_rune', 0.08, 2, 5], ['rune_arrows', 0.04, 3, 8]], greater_demon: [['blood_rune', 0.12, 3, 8], ['rune_arrowtips', 0.06, 5, 15]],
  black_demon: [['blood_rune', 0.2, 5, 12], ['soul_rune', 0.08, 2, 6], ['rune_arrows', 0.08, 5, 15]],
  green_dragon: [['adamant_arrows', 0.1, 5, 12], ['yew_logs', 0.1, 3, 8], ['law_rune', 0.1, 2, 5]], bronze_dragon: [['adamant_arrowtips', 0.12, 5, 15]],
  iron_dragon: [['rune_arrowtips', 0.08, 5, 12], ['magic_logs', 0.05, 2, 5]], steel_dragon: [['rune_arrows', 0.1, 6, 15], ['wrath_rune', 0.05, 2, 5]],
  chaos_elemental: [['wrath_rune', 0.3, 5, 15], ['soul_rune', 0.3, 5, 15], ['astral_rune', 0.3, 5, 15]], pirate: [['iron_arrows', 0.2, 5, 12]],
})) if (MONSTERS[mon]) for (const [id, p, a, b] of drops) MONSTERS[mon].drops.push({ id, p, n: [a, b] });
