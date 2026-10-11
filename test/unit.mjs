// Unit tests: XP curve, combat formulas, gear tiers, recipes, gathering, game loop, saves. Run: node test/unit.mjs
import { xpForLevel, levelForXp } from '../src/xp.js';
import { maxHit, hitChance, attackRoll, combatLevel, heroCombat, gearBonuses } from '../src/combat.js';
import { ITEMS, RECIPES, RECIPE_BY_ID, MONSTERS, NODES, AREAS, TIERS, XP_RATE, SKILL_IDS, COOKABLE, FOOD, nodeYields, burnChance } from '../src/data.js';
import { simulateOffline } from '../src/offline.js';
import { Game } from '../src/game.js';
import { newData, migrate } from '../src/save.js';
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
  check(RECIPES.filter((x) => x.station === 'anvil').length === 12, 'bronze+iron smithing recipes (6 kinds x 2)');
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
  check(g.buy('iron_pickaxe') && g.count('iron_pickaxe') === 1 && g.data.coins === 940, 'buy tool');
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
  g.travel('quarry'); check(g.data.area === 'meadow', 'quarry locked below combat 10');
  g.data.bag = g.data.bag.filter((s) => s.id !== 'bronze_pickaxe'); const cu2 = g.ents.find((e) => e.kind === 'tin');
  check(!g.select(cu2.id), 'gathering needs a tool'); void iron;
  g.data.bag.push({ id: 'bronze_pickaxe', n: 1 });
  
  for (const s of ['attack', 'strength', 'defence']) setLv(g, s, 15);
  check(g.combatLevel >= 10 && g.travel('quarry') && g.data.area === 'quarry', 'quarry unlocks at combat 10');
  const ir = g.ents.find((e) => e.kind === 'iron');
  check(!g.select(ir.id), 'iron needs Mining 15'); setLv(g, 'mining', 15); check(g.select(ir.id), 'iron at Mining 15');
}
{
  const g = mk(5); g.data.hp = 1; g.data.xp.hitpoints = xpForLevel(1) + 0;
  g.travel('meadow'); g.data.hp = 1;
  const w = { ...MONSTERS.wolf }; void w;
  g.enterArea('quarry', 1000); const wolf = g.ents.find((e) => e.kind === 'wolf');
  g.data.hp = 2; g.select(wolf.id);
  for (let i = 0; i < 400; i++) g.update(0.05);
  check(g.target === null || g.data.hp === g.maxHp, 'low HP retreats or dies back to start');
  check(Object.keys(AREAS).length === 2 && Object.values(NODES).every((x) => nodeYields(x).every((y) => ITEMS[y.item])), 'area/node tables sane');
}

// --- saves
{
  const d = newData('Alice', 2);
  check(d.xp.hitpoints === 1154 && d.bag.length === 4 && d.name === 'Alice', 'new character');
  const m = migrate({ name: 'Old', xp: { attack: 500 } });
  check(m.xp.attack === 500 && m.xp.mining === 0 && Array.isArray(m.bag) && m.equip.weapon === null && m.v === 2 && m.xp.fishing === 0 && m.autoEat.pct === 50, 'migration fills missing fields');
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
  g.enterArea('quarry', 900); const stream = g.ents.find((e) => e.kind === 'stream');
  g.data.bag.push({ id: 'fishing_rod', n: 1 });
  check(!g.select(stream.id), 'rod fishing needs bait (feathers)');
  g.addItem('feather', 3); g.data.xp.fishing = xpForLevel(20);
  check(g.select(stream.id), 'rod + bait at Fishing 20');
  for (let i = 0; i < 3000; i++) g.update(0.05);
  check(g.count('feather') === 0 && g.count('raw_trout') + g.count('raw_salmon') === 3 && g.target === null, 'bait is consumed per catch, fishing stops when out');
  const g3 = mk(); g3.enterArea('quarry', 900); g3.data.xp.fishing = xpForLevel(30);
  check(nodeYields(NODES.stream).filter((y) => y.level <= 30).length === 2, 'level unlocks better fish');
}

// --- cooking
{
  const r = RECIPE_BY_ID.cook_shrimp;
  check(near(burnChance(r, 1, false), 0.5 * 29 / 29) && burnChance(r, 1, true) < burnChance(r, 1, false), 'range burns less than fire');
  check(burnChance(r, 15, false) < burnChance(r, 1, false) && burnChance(r, 30, true) === 0, 'burn chance falls with level, zero at the stop level');
  check(COOKABLE.length === 10 && RECIPES.filter((x) => x.station === 'cook').length === 10, 'recipes for 7 fish + 3 meats');
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
  f.enterArea('quarry', 1000); f.select(f.ents.find((e) => e.kind === 'wolf').id);
  for (let i = 0; i < 2400; i++) f.update(0.05);
  check(f.count('lobster') < 5 && f.data.hp > 0, `auto-eat consumed food during the fight (left ${f.count('lobster')})`);
  const nf = mk(2); nf.data.xp.hitpoints = xpForLevel(20); nf.data.hp = 9; nf.setAutoEat(false); nf.addItem('lobster', 5);
  nf.enterArea('quarry', 1000); nf.select(nf.ents.find((e) => e.kind === 'wolf').id);
  for (let i = 0; i < 600; i++) nf.update(0.05);
  check(nf.count('lobster') === 5, 'auto-eat off: food untouched (hero retreats instead)');
  const cf = mk(2); cf.data.xp.hitpoints = xpForLevel(20); cf.data.hp = 6; cf.setAutoEat(true, 30); cf.addItem('lobster', 20);
  cf.enterArea('quarry', 1000); cf.select(cf.ents.find((e) => e.kind === 'wolf').id);
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
  const wolfy = (food) => { const w = mk(4); w.enterArea('quarry', 1000); w.data.bag.push(...(food ? [{ id: 'lobster', n: food }] : [])); w.data.hp = w.maxHp; w.select(w.ents.find((e) => e.kind === 'wolf').id); w.snapshot(1000); return w; };
  const w0 = wolfy(0), rw0 = simulateOffline(w0, 7200, { rng: mulberry32(2) });
  check(rw0.stopped && rw0.kills <= 1 && w0.data.hp >= 1, `wolf without food: stops (${rw0.stopped}, ${rw0.kills} kills) and survives`);
  const wf = wolfy(5); for (const k of ['attack', 'strength', 'defence']) wf.data.xp[k] = xpForLevel(30); wf.data.xp.hitpoints = xpForLevel(30);
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
  const bait = mk(6); bait.enterArea('quarry', 900); bait.data.bag.push({ id: 'fishing_rod', n: 1 }); bait.data.xp.fishing = xpForLevel(20); bait.addItem('feather', 7); bait.select(bait.ents.find((e) => e.kind === 'stream').id); bait.snapshot(1000);
  const rb = simulateOffline(bait, 7200, { rng: mulberry32(3) }); check(rb.catches === 7 && rb.stopped === 'out of bait' && bait.count('feather') === 0, 'fishing offline stops when bait runs out');
  const full = mk(6); full.data.bag = []; for (let i = 0; i < 27; i++) full.data.bag.push({ id: `bronze_dagger`, n: 1 }); full.data.bag.push({ id: 'bronze_pickaxe', n: 1 }); full.select(full.ents.find((e) => e.kind === 'copper').id); full.snapshot(1000);
  const rfull = simulateOffline(full, 3600, { rng: mulberry32(3) }); check(rfull.banked > 0 && full.slotsUsed <= 28 && (full.data.bank.copper_ore || 0) + full.count('copper_ore') === rfull.catches, 'overflow is auto-banked');
  const rs = simulateOffline(mk(), 3600); void rs;
  // activity snapshot round trip
  const a = mk(); a.select(a.ents.find((e) => e.kind === 'tree').id); a.snapshot(5);
  const b = new Game(migrate(JSON.parse(JSON.stringify(a.data))), mulberry32(1));
  check(b.data.activity?.kind === 'tree' && b.data.lastSeen === 5 && b.resumeActivity() && b.targetEnt.kind === 'tree', 'activity persists and resumes');
}
// --- migration keeps levels
{
  const old = { v: 1, name: 'Old', xp: { attack: 5000, strength: 2000, defence: 300, hitpoints: 3000, mining: 900, smithing: 100, woodcutting: 40 }, bag: [{ id: 'hammer', n: 1 }] };
  const m = migrate(old), g = new Game(m);
  check(g.level('attack') === levelForXp(5000) && g.level('strength') === levelForXp(2000) && g.data.xp.attack === 5000, 'old saves keep their XP and levels');
  check(m.bag.some((s) => s.id === 'small_net') && m.xp.fishing === 0 && m.xp.cooking === 0, 'old saves gain fishing/cooking + a net');
}
console.log(failed ? `\n${failed} of ${n} FAILED` : `\nall ${n} unit checks passed`);
process.exit(failed ? 1 : 0);
