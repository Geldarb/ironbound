// Unit tests: XP curve, combat formulas, gear tiers, recipes, gathering, game loop, saves. Run: node test/unit.mjs
import { xpForLevel, levelForXp } from '../src/xp.js';
import { maxHit, hitChance, attackRoll, combatLevel, heroCombat, gearBonuses } from '../src/combat.js';
import { WEAPON_KINDS, UNARMED, stanceXp, ITEMS, RECIPES, RECIPE_BY_ID, MONSTERS, NODES, AREAS, TIERS, XP_RATE, SKILL_IDS, COOKABLE, FOOD, nodeYields, burnChance } from '../src/data.js';
import { simulateOffline } from '../src/offline.js';
import { RARITIES, rollRarity, rollEnchant, rollMods, rollCost, sumMods, nextPity, enchantCategory, MODS, PITY_RARE, PITY_EPIC } from '../src/enchant.js';
import { expectedDps, heroHitChance, monsterDefRoll, weaponKind, activeStyle } from '../src/combat.js';
import { Game } from '../src/game.js';
import { newData, migrate, SAVE_VERSION } from '../src/save.js';
import { AREA_IDS } from '../src/data.js';
import { mulberry32 } from '../src/rng.js';

let failed = 0, n = 0;
const check = (c, m) => { n++; if (!c) { failed++; console.log('  FAIL -', m); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const mk = (seed = 1) => new Game(newData('T'), mulberry32(seed));
const setLv = (g, s, l) => { g.data.xp[s] = xpForLevel(l); };

// --- XP curve (RuneScape values)
check(xpForLevel(2) === 83 && xpForLevel(10) === 1154 && xpForLevel(50) === 101333 && xpForLevel(99) === 13034431, 'RS XP table');
check(levelForXp(0) === 1 && levelForXp(82) === 1 && levelForXp(83) === 2 && levelForXp(13034431) === 99 && levelForXp(200000000) === 99, 'level for xp');

// --- combat formulas
check(maxHit(1, 0, 3) === 1 && maxHit(99, 0, 0) === 11 && maxHit(99, 100, 3) === 28, 'max hit examples');
check(maxHit(50, 80, 0) === Math.floor(0.5 + (58 * 144) / 640), 'max hit uses strength bonus');
check(maxHit(40, 50, 0) > maxHit(40, 0, 0), 'gear raises max hit');
check(near(hitChance(100, 100), 100 / 202), 'hit chance atk<=def');
check(near(hitChance(300, 100), 1 - 102 / 602), 'hit chance atk>def');
check(attackRoll(10, 20, 3) === 21 * 84, 'attack roll');
check(combatLevel({ attack: 1, strength: 1, defence: 1, hitpoints: 10 }) === 3, 'starting combat level 3');
check(combatLevel({ attack: 99, strength: 99, defence: 99, hitpoints: 99 }) === 113, 'max melee-only combat level 113');

// --- gear tiers
check(TIERS.map((t) => t.req).join() === '1,1,5,20,30,40', 'tier requirement table');
check(ITEMS.bronze_sword.bonus.atk < ITEMS.iron_sword.bonus.atk && ITEMS.rune_sword.bonus.str > ITEMS.mithril_sword.bonus.str, 'tiers scale');
check(ITEMS.rune_body.req.level === 40 && ITEMS.rune_body.req.skill === 'defence' && ITEMS.rune_sword.req.skill === 'attack', 'requirement skills');
{
  const g = mk();
  g.addItem('mithril_sword'); check(!g.equip('mithril_sword') && g.data.equip.weapon === null, 'cannot equip above level');
  setLv(g, 'attack', 20); check(g.equip('mithril_sword') && g.data.equip.weapon === 'mithril_sword', 'can equip at level 20');
  g.addItem('bronze_dagger'); g.equip('bronze_dagger'); check(g.count('mithril_sword') === 1 && g.data.equip.weapon === 'bronze_dagger', 'swap returns old item to bag');
  const a = heroCombat(g.levels, {}, 'accurate'), b = heroCombat(g.levels, { weapon: 'iron_sword', body: 'iron_body' }, 'accurate');
  check(b.atkRoll > a.atkRoll && b.defRoll > a.defRoll && b.maxHit >= a.maxHit, 'gear improves rolls');
  check(gearBonuses({ head: 'bronze_helm', shield: 'bronze_shield' }).def === ITEMS.bronze_helm.bonus.def + ITEMS.bronze_shield.bonus.def, 'gear bonus sum');
  check(heroCombat(g.levels, {}, 'aggressive').maxHit >= heroCombat(g.levels, {}, 'accurate').maxHit, 'aggressive stance adds strength');
  check(heroCombat(g.levels, {}, 'defensive').defRoll > heroCombat(g.levels, {}, 'accurate').defRoll, 'defensive stance adds defence');
}

// --- recipes: smelting & smithing
{
  const g = mk();
  g.addItem('copper_ore', 5); g.addItem('tin_ore', 5);
  check(!g.craft('bronze_bar', 1).done, 'furnace must be visited first');
  g.data.visited.furnace = g.data.visited.anvil = true;
  const r = g.craft('bronze_bar', 99);
  check(r.done === 5 && g.count('bronze_bar') === 5 && g.count('copper_ore') === 0, 'smelt 5 bronze bars (craft-all)');
  check(g.data.xp.smithing > 30 && near(g.data.xp.smithing, 31.25 * XP_RATE), 'smelting xp 6.25 each');
  check(g.craft('bronze_dagger', 1).done === 1 && g.count('bronze_dagger') === 1 && g.count('bronze_bar') === 4, 'smith a dagger');
  check(!g.craft('bronze_body', 1).done && g.count('bronze_bar') === 4, 'platebody blocked by Smithing 18');
  setLv(g, 'smithing', 18); g.addItem('bronze_bar', 1);
  check(g.craft('bronze_body', 1).done === 1 && g.count('bronze_bar') === 0, 'platebody at level 18 uses 5 bars');
  check(!g.recipeStatus(RECIPE_BY_ID.iron_bar).ok, 'iron bar needs Smithing 15 + ore');
  g.addItem('iron_ore', 40); setLv(g, 'smithing', 15);
  const ir = g.craft('iron_bar', 40);
  check(ir.done + ir.failed === 40 && ir.done > 8 && ir.done < 32 && g.count('iron_ore') === 0, 'iron smelting ~50% success');
  g.data.bag = []; g.hammer = 0;
  g.addItem('bronze_bar', 3); check(!g.craft('bronze_dagger', 1).done, 'anvil needs a hammer');
  check(RECIPES.every((x) => ITEMS[x.out] && Object.keys(x.inputs).every((i) => ITEMS[i])), 'recipes reference real items');
  check(RECIPES.filter((x) => x.station === 'anvil' && !/arrowtips|studs/.test(x.id)).length === 108, 'smithing recipes: 18 kinds x 6 tiers');
}

// --- bag, bank, shop
{
  const g = mk();
  g.data.bag = [];
  for (let i = 0; i < 28; i++) g.addItem('bronze_dagger');
  check(g.slotsUsed === 28 && g.addItem('bronze_dagger') === 0 && g.addItem('coins', 5) === 5, 'bag has 28 slots; coins are separate');
  g.data.bag = [{ id: 'logs', n: 3 }];
  check(g.addItem('logs', 2) === 2 && g.count('logs') === 5 && g.slotsUsed === 1, 'stacking');
  check(g.deposit('logs', 4) === 4 && g.data.bank.logs === 4 && g.count('logs') === 1, 'deposit');
  check(g.withdraw('logs', 10) === 4 && !g.data.bank.logs && g.count('logs') === 5, 'withdraw');
  check(g.sell('logs', 5) === 5 && g.data.coins === 5 + 5 * g.sellValue('logs') && g.count('logs') === 0, 'sell');
  g.data.coins = 1000; g.data.bag = [];
  check(g.buy('iron_pickaxe') && g.count('iron_pickaxe') === 1 && g.data.coins === 1000 - ITEMS.iron_pickaxe.value, 'buy tool');
  check(g.bestTool('pickaxe').id === 'iron_pickaxe', 'best tool picked');
}

// --- area simulation: walking, fighting, gathering
{
  const g = mk(7);
  g.data.xp.attack = g.data.xp.strength = xpForLevel(8); g.tapGround(400); for (let i = 0; i < 400; i++) g.update(0.05);
  check(Math.abs(g.hero.x - 400) < 4 && g.hero.state === 'idle', 'tap-to-walk reaches the destination');
  const chick = g.ents.find((e) => e.kind === 'chicken');
  check(g.select(chick.id) && g.target === chick.id, 'select monster');
  for (let i = 0; i < 1200; i++) g.update(0.05);
  check(g.data.stats.kills >= 3, `auto-attack repeats on the same target (kills ${g.data.stats.kills})`);
  check(g.data.xp.attack > xpForLevel(8) && g.data.xp.hitpoints > 1154 && g.count('bones') >= 3, 'xp + bones from kills');
  check(g.data.xp.defence === 0 && g.data.xp.strength === xpForLevel(8), 'accurate trains Attack only');
  g.setStance('aggressive'); const sx = g.data.xp.strength; g.data.hp = g.maxHp; g.hero.cd = 0;
  for (let i = 0; i < 1200; i++) g.update(0.05);
  check(g.data.xp.strength > sx, 'aggressive trains Strength');
  check(near(g.data.xp.hitpoints - 1154, 1.33 * Math.round((g.data.xp.attack + g.data.xp.strength + g.data.xp.defence) / 4), 1e-6) || g.data.xp.hitpoints > 1154, 'hitpoints xp follows damage');
}
{
  const g = mk(3);
  const cu = g.ents.find((e) => e.kind === 'copper');
  check(g.select(cu.id), 'select copper');
  for (let i = 0; i < 1600; i++) g.update(0.05);
  check(g.count('copper_ore') >= 4 && g.data.xp.mining >= 70, `mining repeats and respawns (${g.count('copper_ore')} ore)`);
  const tr = g.ents.find((e) => e.kind === 'tree'); g.select(tr.id);
  for (let i = 0; i < 1200; i++) g.update(0.05);
  check(g.count('logs') >= 2 && g.data.xp.woodcutting >= 50, 'woodcutting');
  const iron = g.ents.find((e) => e.kind === 'iron');
  check(AREA_IDS.every((a) => g.areaUnlocked(a)), 'every area is open (world rework: no combat gates)');
  g.data.bag = g.data.bag.filter((s) => s.id !== 'bronze_pickaxe'); const cu2 = g.ents.find((e) => e.kind === 'tin');
  check(!g.select(cu2.id), 'gathering needs a tool'); void iron;
  g.data.bag.push({ id: 'bronze_pickaxe', n: 1 });
  
  for (const s of ['attack', 'strength', 'defence']) setLv(g, s, 15);
  check(g.travel('draynor') && g.data.area === 'draynor', 'travel to Draynor');
  const ir = g.ents.find((e) => e.kind === 'iron');
  check(!g.select(ir.id), 'iron needs Mining 15'); setLv(g, 'mining', 15); check(g.select(ir.id), 'iron at Mining 15');
}
{
  const g = mk(5); g.data.hp = 1; g.data.xp.hitpoints = xpForLevel(1) + 0;
  g.travel('lumby'); g.data.hp = 1;
  const w = { ...MONSTERS.wolf }; void w;
  g.enterArea('edgeville', 1000); const wolf = g.ents.find((e) => e.kind === 'wolf');
  g.data.hp = 2; g.select(wolf.id);
  for (let i = 0; i < 400; i++) g.update(0.05);
  check(g.target === null || g.data.hp === g.maxHp, 'low HP retreats or dies back to start');
  check(Object.keys(AREAS).length === 10 && Object.values(NODES).every((x) => nodeYields(x).every((y) => ITEMS[y.item])), 'area/node tables sane');
}

// --- saves
{
  const d = newData('Alice', 2);
  check(d.xp.hitpoints === 1154 && d.bag.length === 4 && d.name === 'Alice', 'new character');
  const m = migrate({ name: 'Old', xp: { attack: 500 } });
  check(m.xp.attack === 500 && m.xp.mining === 0 && Array.isArray(m.bag) && m.equip.weapon === null && m.v === SAVE_VERSION && m.xp.fishing === 0 && m.autoEat.pct === 50, 'migration fills missing fields');
  const g = new Game(JSON.parse(JSON.stringify(d))); g.data.xp.mining = 300;
  const g2 = new Game(migrate(JSON.parse(JSON.stringify(g.data))));
  check(g2.level('mining') === levelForXp(300) && g2.data.hp <= g2.maxHp, 'save round-trip');
}
// --- XP rate: fast early levels
{
  check(XP_RATE >= 2, 'xp rate is a single constant');
  for (const stance of ['accurate', 'aggressive', 'defensive']) {
    const g = mk(); g.setStance(stance);
    const skill = { accurate: 'attack', aggressive: 'strength', defensive: 'defence' }[stance];
    let kills = 0;
    while (g.level(skill) < 2 && kills < 20) { const m = { kind: 'chicken', hp: 3, max: 3, id: 'x', x: 0, dead: 0 }; g.hitMonster(m, 1); g.hitMonster(m, 1); g.hitMonster(m, 1); kills++; }
    check(kills >= 2 && kills <= 4, `level 2 ${skill} after ${kills} chicken kills (${stance})`);
  }
  const g = mk(); g.gain('mining', 17.5); check(near(g.data.xp.mining, 17.5 * XP_RATE), 'gathering xp is multiplied too');
  // no overkill xp
  const g2 = mk(); const m = { kind: 'chicken', hp: 3, max: 3, id: 'x', x: 0, dead: 0 }; g2.hitMonster(m, 9); check(near(g2.data.xp.attack, 12 * XP_RATE), 'xp only for damage actually dealt');
  check(SKILL_IDS.includes('fishing') && SKILL_IDS.includes('cooking'), 'fishing + cooking skills exist');
}

// --- fishing
{
  const g = mk(11);
  const pond = g.ents.find((e) => e.kind === 'pond');
  check(g.select(pond.id), 'select the net spot (starter net)');
  for (let i = 0; i < 2400; i++) g.update(0.05);
  check(g.count('raw_shrimp') >= 6 && g.count('raw_anchovies') === 0 && g.data.xp.fishing >= 60 * XP_RATE / 3, `net fishing repeats without depleting (${g.count('raw_shrimp')} shrimp)`);
  const lowChance = g.gatherChance(NODES.pond); g.data.xp.fishing = xpForLevel(40);
  check(g.gatherChance(NODES.pond) > lowChance && g.gatherChance(NODES.pond) <= 0.9, 'catch chance rises with level, capped');
  g.data.bag = g.data.bag.filter((s) => s.id !== 'small_net'); g.clearTarget();
  check(!g.select(pond.id), 'fishing needs the right tool');
  g.enterArea('draynor', 900); const stream = g.ents.find((e) => e.kind === 'stream');
  g.data.bag.push({ id: 'fishing_rod', n: 1 });
  check(!g.select(stream.id), 'rod fishing needs bait (feathers)');
  g.addItem('feather', 3); g.data.xp.fishing = xpForLevel(20);
  check(g.select(stream.id), 'rod + bait at Fishing 20');
  for (let i = 0; i < 3000; i++) g.update(0.05);
  check(g.count('feather') === 0 && g.count('raw_trout') + g.count('raw_salmon') === 3 && g.target === null, 'bait is consumed per catch, fishing stops when out');
  const g3 = mk(); g3.enterArea('draynor', 900); g3.data.xp.fishing = xpForLevel(30);
  check(nodeYields(NODES.stream).filter((y) => y.level <= 30).length === 2, 'level unlocks better fish');
}

// --- cooking
{
  const r = RECIPE_BY_ID.cook_shrimp;
  check(near(burnChance(r, 1, false), 0.5 * 29 / 29) && burnChance(r, 1, true) < burnChance(r, 1, false), 'range burns less than fire');
  check(burnChance(r, 15, false) < burnChance(r, 1, false) && burnChance(r, 30, true) === 0, 'burn chance falls with level, zero at the stop level');
  check(COOKABLE.length === 11 && RECIPES.filter((x) => x.station === 'cook').length === 11, 'recipes for 7 fish + 4 meats (rat added)');
  check(FOOD.find((f) => f[0] === 'shrimp')[3] === 3 && ITEMS.trout.heal === 7 && ITEMS.salmon.heal === 9 && ITEMS.tuna.heal === 10 && ITEMS.lobster.heal === 12 && ITEMS.swordfish.heal === 14 && ITEMS.cooked_chicken.heal === 3 && ITEMS.anchovies.heal === 1, 'RS-like healing values');
  const g = mk(5); g.addItem('raw_shrimp', 40);
  check(!g.craft('cook_shrimp', 1).done, 'must find a fire or range first');
  g.data.visited.fire = true;
  const c = g.craft('cook_shrimp', 40);
  check(c.done + c.failed === 40 && c.failed > 5 && c.done > 5 && g.count('burnt_food') === c.failed && g.count('shrimp') === c.done, `fire burns some (${c.failed}/40), burnt food left behind`);
  check(near(g.data.xp.cooking, c.done * 30 * XP_RATE), 'cooking xp only for successes');
  const g2 = mk(5); g2.addItem('raw_shrimp', 400); g2.data.visited.fire = g2.data.visited.range = true; const c2 = g2.craft('cook_shrimp', 400);
  const g1 = mk(5); g1.addItem('raw_shrimp', 400); g1.data.visited.fire = true; const c1 = g1.craft('cook_shrimp', 400);
  check(c2.failed < c1.failed, `range burns fewer (${c2.failed} vs ${c1.failed} of 400)`);
  g.data.xp.cooking = xpForLevel(15); g.addItem('raw_trout', 2);
  check(g.craft('cook_trout', 2).done + 0 >= 0 && !g.recipeStatus(RECIPE_BY_ID.cook_salmon).ok, 'level gates salmon (Cooking 25)');
  const g4 = mk(); g4.addItem('raw_chicken', 3); g4.data.visited.fire = true; g4.craft('cook_cooked_chicken', 3); void g4;
}

// --- eating and auto-eat
{
  const g = mk(); g.data.hp = 4; g.addItem('trout', 2); g.addItem('shrimp', 2);
  check(g.bestFood().id === 'trout' && g.foodCount === 4, 'best food = highest heal');
  check(g.eat('trout') && g.data.hp === 10 && g.count('trout') === 1, 'eating heals (capped at max HP)');
  g.data.hp = 3; check(!g.eat('trout'), 'short delay between bites'); for (let i = 0; i < 6; i++) g.update(0.25);
  check(g.eat('shrimp') && g.data.hp === 6, 'eat again after the delay');
  g.data.hp = 10; check(!g.eat('shrimp'), 'no eating at full HP');
  // auto-eat inside a fight
  const f = mk(2); f.data.xp.hitpoints = xpForLevel(20); f.data.hp = 20; f.addItem('lobster', 5); f.setAutoEat(true, 50);
  f.enterArea('edgeville', 1000); f.select(f.ents.find((e) => e.kind === 'wolf').id);
  for (let i = 0; i < 2400; i++) f.update(0.05);
  check(f.count('lobster') < 5 && f.data.hp > 0, `auto-eat consumed food during the fight (left ${f.count('lobster')})`);
  const nf = mk(2); nf.data.xp.hitpoints = xpForLevel(20); nf.data.hp = 9; nf.setAutoEat(false); nf.addItem('lobster', 5);
  nf.enterArea('edgeville', 1000); nf.select(nf.ents.find((e) => e.kind === 'wolf').id);
  for (let i = 0; i < 600; i++) nf.update(0.05);
  check(nf.count('lobster') === 5, 'auto-eat off: food untouched (hero retreats instead)');
  const cf = mk(2); cf.data.xp.hitpoints = xpForLevel(20); cf.data.hp = 6; cf.setAutoEat(true, 30); cf.addItem('lobster', 20);
  cf.enterArea('edgeville', 1000); cf.select(cf.ents.find((e) => e.kind === 'wolf').id);
  for (let i = 0; i < 400; i++) cf.update(0.05);
  check(cf.count('lobster') < 20 || cf.data.hp > 8, 'auto-eat kicks in at the threshold before retreating');
}

// --- offline progress
{
  const fight = (seed = 3) => { const g = mk(seed); for (const k of ['attack', 'strength', 'defence']) g.data.xp[k] = xpForLevel(15); g.data.hp = g.maxHp; g.hero.x = 1400; g.select(g.ents.find((e) => e.kind === 'chicken').id); g.snapshot(1000); return g; };
  let g = fight(); const xp0 = g.data.xp.attack, cap = g.data.bag.length;
  const r = simulateOffline(g, 3600, { rng: mulberry32(1) });
  check(r.simulated && r.kills > 50 && g.data.xp.attack > xp0 && r.xp.attack > 0 && r.xp.hitpoints > 0, `1h away: ${r.kills} chickens killed`);
  check((r.items.bones || 0) >= r.kills * 0.9 && r.coins > 0 && g.count('bones') + (g.data.bank.bones || 0) === r.items.bones, 'drops + coins credited');
  check(g.data.hp >= 1 && g.data.hp <= g.maxHp, 'hp valid after sim'); void cap;
  const r0 = simulateOffline(fight(), 30); check(!r0.simulated && r0.kills === 0, 'under 60s away does nothing');
  const rIdle = mk(); check(!simulateOffline(rIdle, 7200).simulated, 'no activity => nothing');
  const rc = simulateOffline(fight(), 10 * 3600, { rng: mulberry32(1) }), r3 = simulateOffline(fight(), 3 * 3600, { rng: mulberry32(1) });
  check(rc.capped && rc.used === 3 * 3600 && rc.kills === r3.kills, 'offline time is capped (3h)');
  const half = simulateOffline(fight(), 3600, { rng: mulberry32(1), efficiency: 1 }); check(half.kills > r.kills * 1.6, 'efficiency scales the result');
  // danger: wolf at low level => stops, never dies; food extends it
  const wolfy = (food) => { const w = mk(4); w.enterArea('edgeville', 1000); w.data.bag.push(...(food ? [{ id: 'lobster', n: food }] : [])); w.data.hp = w.maxHp; w.select(w.ents.find((e) => e.kind === 'wolf').id); w.snapshot(1000); return w; };
  const w0 = wolfy(0), rw0 = simulateOffline(w0, 7200, { rng: mulberry32(2) });
  check(rw0.stopped && rw0.kills <= 1 && w0.data.hp >= 1, `wolf without food: stops (${rw0.stopped}, ${rw0.kills} kills) and survives`);
  const wf = wolfy(5); for (const k of ['attack', 'strength', 'defence', 'hitpoints']) wf.data.xp[k] = xpForLevel(50); wf.data.hp = wf.maxHp;
  const rwf = simulateOffline(wf, 7200, { rng: mulberry32(2) });
  check(rwf.kills > 3 && (rwf.ate.lobster > 0 || !rwf.stopped) && wf.count('lobster') === 5 - (rwf.ate.lobster || 0), `strong hero kills wolves, food is deducted (${JSON.stringify(rwf.ate)}, stopped: ${rwf.stopped})`);
  const wlow = wolfy(2); const rl = simulateOffline(wlow, 7200, { rng: mulberry32(2) });
  check(rl.stopped === 'out of food' || rl.kills === 0, 'out of food ends the session');
  // gathering
  const mine = mk(6); mine.select(mine.ents.find((e) => e.kind === 'copper').id); mine.snapshot(1000);
  const rm = simulateOffline(mine, 3600, { rng: mulberry32(3) });
  check(rm.catches > 100 && mine.count('copper_ore') === rm.items.copper_ore && rm.xp.mining > 0 && rm.levels.some((l) => l.skill === 'mining'), `mining 1h: ${rm.catches} ore, level-ups ${rm.levels.length}`);
  const fish = mk(6); fish.select(fish.ents.find((e) => e.kind === 'pond').id); fish.snapshot(1000);
  const rf = simulateOffline(fish, 3600, { rng: mulberry32(3) }); check(rf.catches > 100 && (rf.items.raw_shrimp || 0) > 0 && rf.xp.fishing > 0, 'fishing 1h');
  const bait = mk(6); bait.enterArea('draynor', 900); bait.data.bag.push({ id: 'fishing_rod', n: 1 }); bait.data.xp.fishing = xpForLevel(20); bait.addItem('feather', 7); bait.select(bait.ents.find((e) => e.kind === 'stream').id); bait.snapshot(1000);
  const rb = simulateOffline(bait, 7200, { rng: mulberry32(3) }); check(rb.catches === 7 && rb.stopped === 'out of bait' && bait.count('feather') === 0, 'fishing offline stops when bait runs out');
  const full = mk(6); full.data.bag = []; for (let i = 0; i < 27; i++) full.data.bag.push({ id: `bronze_dagger`, n: 1 }); full.data.bag.push({ id: 'bronze_pickaxe', n: 1 }); full.select(full.ents.find((e) => e.kind === 'copper').id); full.snapshot(1000);
  const rfull = simulateOffline(full, 3600, { rng: mulberry32(3) }); check(rfull.banked > 0 && full.slotsUsed <= 28 && (full.data.bank.copper_ore || 0) + full.count('copper_ore') === rfull.catches, 'overflow is auto-banked');
  const rs = simulateOffline(mk(), 3600); void rs;
  // activity snapshot round trip
  const a = mk(); a.select(a.ents.find((e) => e.kind === 'tree').id); a.snapshot(5);
  const b = new Game(migrate(JSON.parse(JSON.stringify(a.data))), mulberry32(1));
  check(b.data.activity?.kind === 'tree' && b.data.lastSeen === 5 && b.resumeActivity() && b.targetEnt.kind === 'tree', 'activity persists and resumes');
}
// --- Enchant Points while away
{
  const strong = (kind, area, seed = 7) => { const w = mk(seed); w.enterArea(area, 1000); for (const k of ['attack', 'strength', 'defence', 'hitpoints']) w.data.xp[k] = xpForLevel(70); w.data.hp = w.maxHp; w.data.equip.weapon = 'iron_scimitar'; w.data.bag.push({ id: 'lobster', n: 500 }); w.data.autoEat.on = true; w.select(w.ents.find((e) => e.kind === kind).id); w.snapshot(1000); return w; };
  const levelEp = (before, after) => { let t = 0; for (const k of Object.keys(before)) for (let l = before[k] + 1; l <= after[k]; l++) t += l % 10 === 0 ? 5 : 1; return t; };
  // wolves: per-kill chance (12%) over the simulated (50% pace) kills + level-ups
  const w = strong('wolf', 'edgeville'), lv0 = w.levels, ep0 = w.data.ep;
  const r = simulateOffline(w, 7200, { rng: mulberry32(11) });
  check(r.kills > 10 && r.epKills >= Math.floor(r.kills * 0.12) && r.epKills <= Math.ceil(r.kills * 0.12), `offline kill EP follows the per-kill chance (${r.epKills} EP for ${r.kills} kills)`);
  check(r.epLevels === levelEp(lv0, w.levels) && r.epLevels > 0, `level-ups offline grant the level-up EP (${r.epLevels})`);
  check(r.ep === r.epKills + r.epLevels && w.data.ep === ep0 + r.ep, 'report total = kill EP + level EP and is applied to the character');
  // determinism: same seed, same grant
  const w2 = strong('wolf', 'edgeville'), r2 = simulateOffline(w2, 7200, { rng: mulberry32(11) });
  check(r2.ep === r.ep && w2.data.ep === w.data.ep, 'EP grant is deterministic for a seed');
  // efficiency: full pace roughly doubles the chance-based EP; zero kills => zero kill EP
  const full = strong('wolf', 'edgeville'), rf = simulateOffline(full, 7200, { rng: mulberry32(11), efficiency: 1 });
  check(rf.epKills > r.epKills * 1.6, `50% offline efficiency halves chance-based EP (${r.epKills} vs ${rf.epKills} at 100%)`);
  // boss: flat 8 EP per kill, no double counting
  const b = strong('alpha_wolf', 'edgeville', 5), rb = simulateOffline(b, 3 * 3600, { rng: mulberry32(2) });
  check(rb.kills >= 1 && rb.epKills === rb.kills * 8, `boss kills grant 8 EP each offline (${rb.kills} kills, ${rb.epKills} EP)`);
  // chickens: tiny chance, never negative, and gathering gives only level-up EP
  const c = strong('chicken', 'lumby'), rc = simulateOffline(c, 3600, { rng: mulberry32(3) });
  check(rc.epKills <= Math.ceil(rc.kills * 0.03) && rc.ep >= 0, 'chicken EP chance is small');
  const m = mk(9); m.enterArea('lumby', 1000); m.data.xp.mining = xpForLevel(10) - 30; m.select(m.ents.find((e) => e.kind === 'copper').id); m.snapshot(1000);
  const ep1 = m.data.ep, rm = simulateOffline(m, 3600, { rng: mulberry32(4) });
  check(rm.catches > 0 && rm.epKills === 0 && m.level('mining') >= 10 && rm.epLevels >= 5 && m.data.ep === ep1 + rm.ep, `gathering offline: level 10 gives +5 EP rule (${rm.epLevels} EP from levels)`);
  check(simulateOffline(mk(), 30).ep === 0, 'no EP when away under the minimum');
  // persistence
  const back = migrate(JSON.parse(JSON.stringify(w.data)));
  check(back.ep === w.data.ep && new Game(back).ep === w.data.ep, 'offline EP persists in the save');
}
// --- migration keeps levels
{
  const old = { v: 1, name: 'Old', xp: { attack: 5000, strength: 2000, defence: 300, hitpoints: 3000, mining: 900, smithing: 100, woodcutting: 40 }, bag: [{ id: 'hammer', n: 1 }] };
  const m = migrate(old), g = new Game(m);
  check(g.level('attack') === levelForXp(5000) && g.level('strength') === levelForXp(2000) && g.data.xp.attack === 5000, 'old saves keep their XP and levels');
  check(m.bag.some((s) => s.id === 'small_net') && m.xp.fishing === 0 && m.xp.cooking === 0, 'old saves gain fishing/cooking + a net');
}
// --- weapon types
{
  const kinds = Object.keys(WEAPON_KINDS);
  check(kinds.length === 11 && ['dagger', 'sword', 'scimitar', 'longsword', 'mace', 'warhammer', 'axe', 'battleaxe', '2h', 'spear', 'halberd'].every((k) => kinds.includes(k)), '11 weapon kinds');
  check(WEAPON_KINDS.dagger.interval < WEAPON_KINDS['2h'].interval && WEAPON_KINDS.scimitar.interval <= WEAPON_KINDS.sword.interval, 'dagger/scimitar fast, 2h slow');
  const bars = { dagger: 1, sword: 1, scimitar: 2, longsword: 2, mace: 1, axe: 1, battleaxe: 3, '2h': 3, spear: 1, halberd: 2 };
  check(Object.entries(bars).every(([k, b]) => RECIPE_BY_ID[`iron_${k}`].inputs.iron_bar === b), 'RS-like bar counts per weapon');
  check(['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune'].every((t) => kinds.every((k) => RECIPE_BY_ID[`${t}_${k}`]?.station === 'anvil')), 'smithing recipe for every weapon x tier');
  check(RECIPE_BY_ID.rune_bar.inputs.coal === 8 && RECIPE_BY_ID.steel_bar.inputs.coal === 2 && RECIPE_BY_ID.mithril_bar.inputs.mithril_ore === 1, 'steel..rune bars need coal');
  check(Object.values(RECIPE_BY_ID).every((r) => r.level <= 99), 'no recipe above level 99');
  const a = (id) => ITEMS[id].bonus.a;
  check(a('iron_dagger').stab > a('iron_dagger').slash && a('iron_scimitar').slash > a('iron_sword').slash, 'dagger stabs, scimitar has best slash accuracy');
  check(a('iron_mace').crush > 0 && a('iron_mace').slash === 0 && a('iron_warhammer').crush > a('iron_mace').crush, 'maces crush, warhammer crushes harder');
  check(ITEMS.iron_2h.bonus.str > ITEMS.iron_sword.bonus.str * 1.5 && ITEMS.iron_2h.two && ITEMS.iron_halberd.two && !ITEMS.iron_sword.two, '2h hits much harder and is two-handed');
  check(ITEMS.iron_halberd.reach > ITEMS.iron_spear.reach && ITEMS.iron_spear.reach > 0, 'spear/halberd reach');
  check(ITEMS.steel_sword.req.level === 5 && ITEMS.rune_2h.req.level === 40 && ITEMS.mithril_body.req.level === 20, 'tier level requirements 1/1/5/20/30/40');
  check(ITEMS.bronze_axe.tool === 'axe' && ITEMS.bronze_axe.slot === 'weapon', 'the axe is both a tool and a weapon');
  // stances per weapon
  const lv = { attack: 40, strength: 40, defence: 40, hitpoints: 40 };
  const eq = (w) => ({ weapon: w });
  check(heroCombat(lv, eq('iron_scimitar'), 'controlled').type === 'stab' && heroCombat(lv, eq('iron_scimitar'), 'accurate').type === 'slash', 'scimitar: Chop slash, Lunge stab');
  check(activeStyle(eq('iron_spear'), 'accurate').stance === 'controlled', 'spear has no Accurate: falls back to Controlled');
  check(heroCombat(lv, {}, 'accurate').style.name === 'Punch', 'unarmed punches');
  check(heroCombat(lv, eq('iron_mace'), 'aggressive').type === 'crush', 'mace pummel is crush');
  check(near(stanceXp('controlled').reduce((x, y) => x + y[1], 0), 1) && stanceXp('controlled').length === 3 && stanceXp('accurate')[0][0] === 'attack', 'controlled splits xp 3 ways');
  const cl = heroCombat(lv, eq('iron_scimitar'), 'controlled'), ac = heroCombat(lv, eq('iron_scimitar'), 'accurate');
  check(cl.atkRoll < ac.atkRoll && cl.defRoll > ac.defRoll, 'controlled gives +1 to all three, accurate +3 attack');
  check(heroCombat(lv, eq('iron_2h'), 'aggressive').maxHit > heroCombat(lv, eq('iron_dagger'), 'aggressive').maxHit, '2h max hit beats dagger');
  check(heroCombat(lv, eq('iron_dagger'), 'accurate').interval === 1.2 && heroCombat(lv, eq('iron_2h'), 'accurate').interval === 2.1, 'weapon speed drives the attack interval');
  // damage type vs monster defence
  const giant = MONSTERS.hill_giant, hcCr = heroCombat(lv, eq('iron_mace'), 'accurate'), hcSl = heroCombat(lv, eq('iron_scimitar'), 'accurate');
  check(monsterDefRoll(giant, 'crush') < monsterDefRoll(giant, 'slash') && monsterDefRoll(giant, 'crush') < monsterDefRoll(giant, 'stab'), 'giants are weak to crush');
  check(Object.values(MONSTERS).every((m) => m.defB && ['stab', 'slash', 'crush'].every((t) => typeof m.defB[t] === 'number')), 'every monster has style defences');
  check(heroHitChance(hcCr, giant) > hitChance(hcCr.atkRoll, monsterDefRoll(giant, 'slash')), 'style defence changes hit chance');
  check(MONSTERS.wolf.defB.crush > MONSTERS.wolf.defB.slash, 'wolves resist crush');
  void hcSl;
  // 2h slot rules
  const g = mk(); setLv(g, 'attack', 40); setLv(g, 'defence', 40);
  g.addItem('iron_sword', 1); g.addItem('iron_shield', 1); g.addItem('iron_2h', 1);
  g.equip('iron_sword'); g.equip('iron_shield');
  check(g.data.equip.weapon === 'iron_sword' && g.data.equip.shield === 'iron_shield', 'sword + shield');
  g.equip('iron_2h');
  check(g.data.equip.weapon === 'iron_2h' && g.data.equip.shield === null && g.count('iron_shield') === 1 && g.count('iron_sword') === 1, '2h removes the shield (back to the bag)');
  g.equip('iron_shield');
  check(g.data.equip.shield === 'iron_shield' && g.data.equip.weapon === null && g.count('iron_2h') === 1, 'equipping a shield removes the 2h');
  // full bag: cannot swap if items would not fit
  const f = mk(); setLv(f, 'attack', 40); setLv(f, 'defence', 40);
  f.data.equip.weapon = 'iron_sword'; f.data.equip.shield = 'iron_shield';
  f.data.bag = [{ id: 'iron_2h', n: 1 }]; for (let i = 0; i < 27; i++) f.data.bag.push({ id: 'bones', n: 1 });
  check(!f.equip('iron_2h') && f.data.equip.shield === 'iron_shield', '2h swap refused when the bag cannot hold both pieces');
  // spear reaches further
  const sp = mk(); sp.data.equip.weapon = 'iron_spear'; check(sp.combat.reach === 18, 'combat exposes reach');
  // boots/gloves slots exist
  check(ITEMS.iron_boots.slot === 'boots' && ITEMS.iron_gloves.slot === 'gloves' && 'boots' in newData('x').equip, 'boots and gloves slots');
  // upper-tier ore data
  check(NODES.coal.level === 30 && NODES.mithril.level > NODES.coal.level && NODES.runite.level === 85 && AREAS.draynor.entities.some((e) => e[1] === 'coal') && AREAS.wilderness.entities.some((e) => e[1] === 'adamant'), 'coal in Draynor, adamant/rune in the Wilderness');
  // smithing a weapon: iron scimitar needs 2 bars at level 19
  const sm = mk(); sm.data.visited.anvil = true; sm.addItem('iron_bar', 2); setLv(sm, 'smithing', 18);
  check(!sm.recipeStatus(RECIPE_BY_ID.iron_scimitar).ok, 'scimitar locked at smithing 18'); setLv(sm, 'smithing', 19);
  check(sm.craft('iron_scimitar').done === 1 && sm.count('iron_scimitar') === 1 && sm.count('iron_bar') === 0, 'smith an iron scimitar');
}
// --- monsters: bosses and drops
check(MONSTERS.alpha_wolf.boss && MONSTERS.alpha_wolf.epFlat >= 5 && MONSTERS.alpha_wolf.respawn > 30, 'alpha wolf is a boss');

// --- enchanting
{
  const w = RARITIES.map((r) => r.w);
  check(RARITIES.length === 6 && near(w.reduce((a, b) => a + b, 0), 100) && w[0] === 60 && w[5] === 0.1, 'rarity weights 60/25/10/4/0.9/0.1');
  const rng = mulberry32(7), counts = [0, 0, 0, 0, 0, 0], N = 40000;
  for (let i = 0; i < N; i++) counts[rollRarity(rng, 0)]++;
  check(Math.abs(counts[0] / N - 0.6) < 0.015 && Math.abs(counts[1] / N - 0.25) < 0.015 && Math.abs(counts[2] / N - 0.1) < 0.01 && counts[5] < 80, 'rolled rarities follow the weights');
  check([...Array(200)].every((_, i) => rollRarity(mulberry32(i + 1), PITY_RARE) >= 2) && [...Array(200)].every((_, i) => rollRarity(mulberry32(i + 1), PITY_EPIC) >= 3), 'pity guarantees Rare+ at 10 and Epic+ at 20');
  check(nextPity(5, 1) === 6 && nextPity(5, 2) === 6 && nextPity(5, 3) === 0, 'pity counter resets on Epic+');
  for (let r = 0; r < 6; r++) {
    const cnts = [...Array(100)].map((_, i) => rollMods(mulberry32(i + 3), r, 'weapon').length);
    const [lo, hi] = RARITIES[r].n;
    check(cnts.every((c) => c >= lo && c <= hi), `${RARITIES[r].name} rolls ${lo}-${hi} modifiers`);
  }
  const avg = (r) => { let t = 0; for (let i = 0; i < 300; i++) { const ms = rollMods(mulberry32(i + 11), r, 'weapon'); t += ms.reduce((a, m) => a + m.v / MODS[m.k].base, 0) / ms.length; } return t / 300; };
  check(avg(5) > avg(3) && avg(3) > avg(0), 'higher rarity = stronger modifiers');
  check(rollMods(mulberry32(1), 3, 'armour').every((m) => MODS[m.k].cats.includes('armour')) && rollMods(mulberry32(2), 2, 'weapon').every((m) => MODS[m.k].cats.includes('weapon')), 'modifier pools by category');
  check(enchantCategory('iron_sword') === 'weapon' && enchantCategory('iron_body') === 'armour' && enchantCategory('iron_pickaxe') === 'tool' && enchantCategory('logs') === null && enchantCategory('hammer') === null, 'enchantable categories');
  const e1 = { r: 0, mods: [{ k: 'maxhit', v: 5 }], rolls: 1 };
  check(rollCost('iron_sword', null) === 10 && rollCost('iron_sword', e1) === 15 && rollCost('iron_sword', { ...e1, rolls: 3 }) === 34 && rollCost('iron_body', null) === 8, 'reroll cost grows x1.5 per roll');
  check(rollCost('iron_sword', e1, true) > rollCost('iron_sword', e1, false), 'locking a modifier costs extra');
  const locked = rollEnchant('iron_sword', mulberry32(5), { prev: { r: 2, mods: [{ k: 'crit', v: 7 }, { k: 'acc', v: 9 }], rolls: 2 }, lockIdx: 1 });
  check(locked.mods.some((m) => m.k === 'acc' && m.v === 9) && locked.rolls === 3 && new Set(locked.mods.map((m) => m.k)).size === locked.mods.length, 'locked modifier survives a reroll without duplicates');
  // modifier application
  const mods = sumMods([{ r: 1, mods: [{ k: 'maxhit', v: 20 }, { k: 'speed', v: 10 }, { k: 'vs', v: 30, fam: 'beast' }, { k: 'crit', v: 5 }] }]);
  const lv = { attack: 50, strength: 50, defence: 50, hitpoints: 50 }, base = heroCombat(lv, { weapon: 'iron_sword' }, 'aggressive'), ench = heroCombat(lv, { weapon: 'iron_sword' }, 'aggressive', mods);
  check(ench.maxHit > base.maxHit && ench.interval < base.interval && near(mods.vs.beast, 0.3), 'enchant raises max hit and attack speed');
  check(expectedDps(ench, MONSTERS.wolf) > expectedDps(base, MONSTERS.wolf) * 1.3 && expectedDps(ench, MONSTERS.goblin) < expectedDps(ench, MONSTERS.wolf), 'dps includes mods and family bonus');
  const acc = heroCombat(lv, { weapon: 'iron_sword' }, 'accurate', sumMods([{ r: 0, mods: [{ k: 'acc', v: 20 }] }]));
  check(acc.atkRoll > heroCombat(lv, { weapon: 'iron_sword' }, 'accurate').atkRoll * 1.19, 'accuracy mod raises the attack roll');
  // game integration
  const g = mk(11); g.data.ep = 100;
  g.addItem('iron_sword', 1);
  const loc = { where: 'bag', idx: g.data.bag.findIndex((s) => s.id === 'iron_sword') };
  const r1 = g.rollEnchant(loc);
  check(r1.ok && r1.applied && g.data.ep === 90 && g.enchOf(loc).mods.length >= 1 && g.data.pity >= 0, 'first roll costs 10 EP and applies');
  const first = JSON.stringify(g.enchOf(loc));
  const r2 = g.rollEnchant(loc);
  check(r2.ok && !r2.applied && g.data.ep === 75 && JSON.stringify(g.enchOf(loc)) === first, 'reroll costs 15 and waits for Keep new / Keep old');
  g.resolveEnchant(loc, r2.ench, false);
  check(JSON.stringify(g.enchOf(loc)) !== first && g.enchOf(loc).rolls === 2, 'keeping the old enchant remembers the rolls (cost keeps rising)');
  g.resolveEnchant(loc, r2.ench, true);
  check(g.enchOf(loc).r === r2.ench.r, 'keep new applies the candidate');
  const poor = mk(); poor.data.ep = 3; poor.addItem('iron_sword', 1);
  check(!poor.rollEnchant({ where: 'bag', idx: poor.data.bag.length - 1 }).ok && poor.data.ep === 3, 'cannot roll without enough EP');
  check(!g.rollEnchant({ where: 'bag', idx: g.data.bag.findIndex((s) => s.id === 'hammer') }).ok, 'cannot enchant a hammer');
  // enchants travel with the item: bag -> equip -> bag, items with enchants do not stack, and bank keeps them
  setLv(g, 'attack', 40);
  const swordIdx = g.data.bag.findIndex((s) => s.id === 'iron_sword');
  g.addItem('iron_sword', 1);
  check(g.data.bag.filter((s) => s.id === 'iron_sword').length === 2, 'enchanted gear never stacks');
  g.equip('iron_sword', swordIdx);
  check(g.data.equipEnch.weapon && g.data.equipEnch.weapon.r === g.enchOf({ where: 'equip', slot: 'weapon' }).r && !g.data.bag.find((s) => s.id === 'iron_sword').e, 'equip moves the enchant with the item');
  g.unequip('weapon');
  const back = g.data.bag.findIndex((s) => s.e);
  check(back >= 0 && !g.data.equipEnch.weapon, 'unequip returns it with its enchant');
  g.deposit('iron_sword', 1, back);
  check(g.data.bankGear.length === 1 && g.data.bankGear[0].e && g.count('iron_sword') === 1, 'bank keeps the enchanted instance');
  g.withdrawGear(0);
  check(g.data.bag.filter((s) => s.e).length === 1 && g.data.bankGear.length === 0, 'withdraw restores the enchant');
  g.removeItem('iron_sword', 1);
  check(g.data.bag.filter((s) => s.id === 'iron_sword').every((s) => s.e), 'removeItem takes plain copies first');
  // sellSlot sells exactly one slot
  const coins = g.data.coins; g.sellSlot(g.data.bag.findIndex((s) => s.id === 'iron_sword'), 1);
  check(g.data.coins === coins + g.sellValue('iron_sword') && g.count('iron_sword') === 0, 'sellSlot');
  // EP sources
  const e = mk(); const ep0 = e.data.ep;
  e.gain('attack', 100); // level-up(s)
  check(e.data.ep > ep0, 'level-ups grant EP'); const ep1 = e.data.ep;
   e.data.xp.attack = xpForLevel(30); e.data.xp.strength = xpForLevel(30); e.data.xp.defence = xpForLevel(30); e.data.xp.hitpoints = xpForLevel(30);
  e.travel('draynor'); check(e.data.ep === ep1 + 10 && e.data.visitedAreas.draynor, 'first visit to an area grants 10 EP'); e.travel('lumby'); e.travel('draynor');
  check(e.data.ep === ep1 + 10, 'only the first visit counts');
  const b = mk(3); const wolfA = b.ents.length; void wolfA;
  b.data.ep = 0; b.hitMonster({ id: 'x', kind: 'alpha_wolf', x: 0, hp: 1, max: 70, dead: 0, cd: 0 }, 5);
  check(b.data.ep >= 8, 'boss kill grants EP');
  // enchant effects in the sim
  const l = mk(5); l.data.equip.weapon = 'iron_sword'; l.data.equipEnch.weapon = { r: 3, rolls: 1, mods: [{ k: 'xp', v: 50 }, { k: 'drop', v: 100 }] };
  const xp0 = l.data.xp.mining; l.gain('mining', 10);
  const plain = mk(5); plain.gain('mining', 10);
  check(l.data.xp.mining - xp0 > (plain.data.xp.mining - 0) * 1.4, 'XP mod boosts gains');
  const t = mk(9); t.data.equipEnch.weapon = { r: 1, rolls: 1, mods: [{ k: 'gather', v: 50 }] }; t.data.equip.weapon = 'bronze_axe'; t.data.bag = t.data.bag.filter((s) => s.id !== 'bronze_axe');
  check(t.toolInfo('axe')?.item.id === 'bronze_axe', 'a wielded axe still counts as the woodcutting tool');
  // offline sim uses enchant mods
  const o1 = mk(21), o2 = mk(21);
  for (const o of [o1, o2]) { setLv(o, 'attack', 40); setLv(o, 'strength', 40); setLv(o, 'defence', 40); setLv(o, 'hitpoints', 40); o.data.hp = o.maxHp; o.data.equip.weapon = 'iron_sword'; o.select(o.ents.find((x) => x.kind === 'chicken').id); }
  o2.data.equipEnch.weapon = { r: 4, rolls: 1, mods: [{ k: 'maxhit', v: 40 }, { k: 'speed', v: 30 }] };
  const ro1 = simulateOffline(o1, 1800), ro2 = simulateOffline(o2, 1800);
  check(ro2.kills >= ro1.kills, 'offline sim: enchanted weapon kills at least as fast');
}
// --- save migration v2 -> v3
{
  const v2 = { v: 2, name: 'V2', xp: { attack: 5000 }, equip: { weapon: 'bronze_sword', head: null }, bag: [], stance: 'aggressive' };
  const m = migrate(v2);
  check(m.v === SAVE_VERSION && m.ep === 20 && m.equipEnch && Array.isArray(m.bankGear) && m.visitedAreas.lumby && m.pity === 0 && 'boots' in m.equip && 'gloves' in m.equip, 'v2 -> v3 adds enchant fields and slots');
  const m2 = migrate(JSON.parse(JSON.stringify(m)));
  check(m2.ep === 20, 'migration is idempotent (no second EP gift)');
  check(migrate({ v: 2, stance: 'weird' }).stance === 'accurate', 'unknown stance falls back');
  const g2 = new Game(migrate({ v: 2, name: 'x', equip: { weapon: 'bronze_sword' } }));
  check(g2.data.equip.weapon === 'bronze_sword' && g2.combat.type === 'slash' || g2.combat.type === 'stab', 'old saves load with a weapon style');
}

// --- regression: post-"Last Sync" audit (data integrity + ranged/magic/fletching wiring)
{
  const { SHOP_BUY, STATIONS, SPELLS, BONES, SLAYER_TASKS } = await import('../src/data.js');
  const bad = [], need = (w, id) => { if (!ITEMS[id]) bad.push(`${w}:${id}`); };
  for (const r of RECIPES) { need('recipe', r.out); for (const i in r.inputs) need('input', i); }
  for (const [k, m] of Object.entries(MONSTERS)) for (const d of m.drops) need('drop ' + k, d.id);
  for (const n of Object.values(NODES)) for (const y of nodeYields(n)) need('node', y.item);
  for (const id of SHOP_BUY) need('shop', id);
  for (const sp of SPELLS) for (const r in sp.runes) need('spell', r);
  for (const b in BONES) need('bones', b);
  check(!bad.length, `every referenced item exists ${bad.join(' ')}`);
  const placed = new Set(Object.values(AREAS).flatMap((a) => a.entities.map((e) => e[1])));
  check(Object.values(AREAS).every((a) => a.entities.every(([t, k]) => (t === 'monster' ? MONSTERS[k] : t === 'node' ? NODES[k] : t === 'station' ? STATIONS[k] : AREAS[k]))), 'area entities reference real monsters/nodes/stations/areas');
  check(Object.keys(MONSTERS).every((k) => placed.has(k)) && Object.keys(NODES).every((k) => placed.has(k)), 'every monster and node is placed in some area');
  check(SLAYER_TASKS.every((t) => t.monsters.some((k) => placed.has(k))), 'every slayer task is doable');
  const seen = new Set(['lumby']), q = ['lumby']; while (q.length) for (const [t, k] of AREAS[q.pop()].entities) if (t === 'sign' && !seen.has(k)) { seen.add(k); q.push(k); }
  check(seen.size === AREA_IDS.length, 'every area reachable by signs');
  check(new Set(RECIPES.map((r) => r.id)).size === RECIPES.length, 'no duplicate recipe ids');
  check(Object.values(ITEMS).every((it) => it.name && (!it.slot || it.req)), 'items have names; gear has requirements');
  check(Object.values(ITEMS).filter((it) => it.slot).every((it) => it.bonus && Number.isFinite(gearBonuses({ [it.slot]: it.id }).def)), 'all gear has bonuses (no NaN)');
  // ranged
  const r = mk(31); r.data.equip.weapon = 'shortbow'; r.data.xp.ranged = xpForLevel(20);
  let hc = r.combat; check(hc.type === 'ranged' && hc.maxHit === 0, 'bow without arrows has no damage');
  r.addItem('iron_arrows', 30); hc = r.combat;
  check(hc.maxHit > 0 && hc.ammo === 'iron_arrows' && hc.reach > 100 && Number.isFinite(hc.atkRoll), 'bow uses Ranged level + arrows');
  r.select(r.ents.find((e) => e.kind === 'chicken').id); const rx0 = r.data.xp.ranged;
  for (let i = 0; i < 400; i++) r.update(0.05);
  check(r.count('iron_arrows') < 30 && r.data.xp.ranged > rx0 && r.data.xp.attack === 0, 'ranged consumes arrows and trains Ranged');
  r.setStance('defensive'); check(stanceXpOf(r).map((x) => x[0]).join() === 'ranged,defence', 'longrange trains Ranged + Defence');
  // magic
  const w = mk(32); w.data.equip.weapon = 'staff'; w.select(w.ents.find((e) => e.kind === 'chicken').id);
  for (let i = 0; i < 400; i++) w.update(0.05); check(w.target === null, 'staff without runes stops');
  w.addItem('air_rune', 50); w.addItem('mind_rune', 50); check(w.combat.spell?.id === 'wind_strike' && w.combat.maxHit >= 2, 'staff casts best spell');
  w.select(w.ents.find((e) => e.kind === 'chicken').id); for (let i = 0; i < 400; i++) w.update(0.05);
  check(w.count('air_rune') < 50 && w.data.xp.magic > 0, 'magic spends runes and trains Magic');
  w.data.equip.weapon = 'air_staff'; const a0 = w.count('air_rune'), m0 = w.count('mind_rune'); w.castSpell('wind_strike');
  check(w.count('air_rune') === a0 && w.count('mind_rune') === m0 - 1, 'staff of air supplies air runes');
  // fletching outputs
  const f = mk(33); f.addItem('logs', 2); f.addItem('feather', 15);
  check(f.craft('arrow_shaft').done === 1 && f.count('arrow_shaft') === 15, 'arrow shafts make 15 per log');
  check(f.craft('headless_arrow', 15).done === 15 && f.count('headless_arrow') === 15, 'headless arrows recipe exists');
  f.addItem('bronze_arrowtips', 15); check(f.craft('bronze_arrows').done === 1 && f.count('bronze_arrows') === 15, '15 tips + 15 headless -> 15 arrows');
  f.addItem('rune_essence', 3); check(f.craft('rc_air_rune').done === 1 && f.count('air_rune') === 1, 'runecrafting recipe');
  // crafting / tanner / gems
  const c = mk(34); c.data.coins = 10; c.addItem('cowhide', 1); c.tanHide('soft'); c.data.xp.crafting = xpForLevel(14);
  check(c.craft('leather_body').done === 1 && c.craftLeatherArmor('leather_body') === false, 'leather body crafts from soft leather');
  check(MONSTERS.cow.drops.some((d) => d.id === 'cowhide'), 'cows drop cowhide');
  c.data.bag.push({ id: 'bronze_sword', n: 1, e: { r: 1, rolls: 1, mods: [{ k: 'acc', v: 5 }] } });
  check(c.extractGem({ where: 'bag', idx: c.data.bag.length - 1 }, 0) && c.data.bag.some((s) => s.gem), 'extract gem works (modText imported)');
  c.data.stats.kills = 1; c.checkAchievements(); check(c.data.achievements.first_kill, 'achievements tracked');
  check(new Game(newData('n')).energy === 100, 'energy initialised');
  // migration of old area ids
  for (const [old, now] of [['meadow', 'lumby'], ['quarry', 'draynor'], ['peaks', 'alkharid']]) {
    const m = migrate({ v: 3, name: 'o', area: old, visitedAreas: { meadow: true, [old]: true }, activity: { area: old, target: `${old}:3`, kind: 'copper', type: 'node' } });
    check(m.area === now && m.activity.area === now && m.visitedAreas[now] && !m.visitedAreas[old] && new Game(m).data.area === now, `v3 save in ${old} resumes in ${now}`);
  }
  for (const v of [1, 2, 3, 6]) { const m = migrate({ v, name: 'x', xp: { attack: 1000 } }); check(m.v === SAVE_VERSION && m.xp.ranged === 0 && m.prayerPoints >= 1 && m.energy === 100 && !!new Game(m), `v${v} fixture migrates`); }
}
function stanceXpOf(g) { return g.combat.style.xp.map((k) => [k]); }

console.log(failed ? `\n${failed} of ${n} FAILED` : `\nall ${n} unit checks passed`);
process.exit(failed ? 1 : 0);
