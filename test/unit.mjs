// Unit tests: XP curve, combat formulas, gear tiers, recipes, gathering, game loop, saves. Run: node test/unit.mjs
import { xpForLevel, levelForXp } from '../src/xp.js';
import { maxHit, hitChance, attackRoll, combatLevel, heroCombat, gearBonuses } from '../src/combat.js';
import { ITEMS, RECIPES, RECIPE_BY_ID, MONSTERS, NODES, AREAS, TIERS } from '../src/data.js';
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
  check(g.data.xp.smithing > 30 && near(g.data.xp.smithing, 31.25), 'smelting xp 6.25 each');
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
  g.tapGround(400); for (let i = 0; i < 400; i++) g.update(0.05);
  check(Math.abs(g.hero.x - 400) < 4 && g.hero.state === 'idle', 'tap-to-walk reaches the destination');
  const chick = g.ents.find((e) => e.kind === 'chicken');
  check(g.select(chick.id) && g.target === chick.id, 'select monster');
  for (let i = 0; i < 1200; i++) g.update(0.05);
  check(g.data.stats.kills >= 3, `auto-attack repeats on the same target (kills ${g.data.stats.kills})`);
  check(g.data.xp.attack > 0 && g.data.xp.hitpoints > 1154 && g.count('bones') >= 3, 'xp + bones from kills');
  check(g.data.xp.strength === 0 && g.data.xp.defence === 0, 'accurate trains Attack only');
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
  check(Object.keys(AREAS).length === 2 && Object.values(NODES).every((x) => ITEMS[x.item]), 'area/node tables sane');
}

// --- saves
{
  const d = newData('Alice', 2);
  check(d.xp.hitpoints === 1154 && d.bag.length === 3 && d.name === 'Alice', 'new character');
  const m = migrate({ name: 'Old', xp: { attack: 500 } });
  check(m.xp.attack === 500 && m.xp.mining === 0 && Array.isArray(m.bag) && m.equip.weapon === null && m.v === 1, 'migration fills missing fields');
  const g = new Game(JSON.parse(JSON.stringify(d))); g.data.xp.mining = 300;
  const g2 = new Game(migrate(JSON.parse(JSON.stringify(g.data))));
  check(g2.level('mining') === levelForXp(300) && g2.data.hp <= g2.maxHp, 'save round-trip');
}
console.log(failed ? `\n${failed} of ${n} FAILED` : `\nall ${n} unit checks passed`);
process.exit(failed ? 1 : 0);
