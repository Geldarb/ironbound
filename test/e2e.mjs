// End-to-end smoke test in headless Chrome at a 390x844 touch viewport.
// Usage: node test/e2e.mjs   (needs puppeteer-core: set PUPPETEER_PATH if not resolvable; CHROME_PATH for the browser)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer;
try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const CHROME = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
const PORT = +(process.env.PORT || 8127), APP = `http://localhost:${PORT}/`;
const SHOTS = process.env.SHOTS || '/workspace';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (c, m) => { console.log(c ? '  ok  -' : '  FAIL-', m); if (!c) failed++; };

const srv = spawn('node', ['server.js'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(APP)).ok) break; } catch { /* retry */ } await sleep(100); }
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const cdp = await page.createCDPSession();
const touch = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(50); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(150); };
const tap = async (sel) => { const r = await page.$eval(sel, (e) => { if (e.closest('#sheetBody')) e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height }; }); await touch(r.x, r.y); return r; };
const shot = (n) => page.screenshot({ path: `${SHOTS}/${process.env.SHOT_PREFIX || 'ib4e'}-${n}.png` });
const G = (fn, ...a) => page.evaluate(fn, ...a);
// screen position of a world entity kind (first match) or world x
const entPos = (kind) => G((k) => { const { game, scene } = window.__ib; const e = game.ents.find((x) => x.kind === k); const r = scene.cv.getBoundingClientRect(); const s = scene.kc; return { x: r.left + (e.x - scene.cam) * s, y: r.top + (296 + scene.offY - 40) * s, wx: e.x }; }, kind);
const tapEnt = async (kind) => { const p = await entPos(kind); await touch(p.x, p.y); };
const warpTo = (kind, off = -80) => G((k, o) => { const g = window.__ib.game; const e = g.ents.find((x) => x.kind === k); g.hero.x = e.x + o; g.hero.dest = null; }, kind, off);
const warp = (x) => G((x) => { window.__ib.game.hero.x = x; window.__ib.game.hero.dest = null; }, x);
const waitFor = async (fn, arg, ms = 40000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await G(fn, arg)) return true; await sleep(250); } return false; };

await page.goto(APP, { waitUntil: 'load' });
await G(() => localStorage.clear());
await page.goto(APP, { waitUntil: 'load' });
check(await G(() => !document.getElementById('create').hidden), 'character creation shown on first launch');
await shot('create');
await tap('#looks button:nth-child(3)'); await page.type('#nameIn', 'Aldric'); await tap('#beginBtn');
await sleep(400);
check(await G(() => document.getElementById('create').hidden && window.__ib.game.data.name === 'Aldric' && window.__ib.game.data.look === 2), 'name-only creation (+look) starts the game');
const lay = await G(() => { const r = document.getElementById('stage').getBoundingClientRect(); const n = document.getElementById('nav').getBoundingClientRect(); return { stage: r.height / innerHeight, navFits: n.right <= innerWidth + 0.5, navBtn: Math.min(...[...document.querySelectorAll('#nav button,.st')].map((b) => b.getBoundingClientRect().height)) }; });
check(lay.stage >= 0.6, `scene is ${(lay.stage * 100).toFixed(0)}% of the screen (>=60%)`);
check(lay.navFits && lay.navBtn >= 44, '44px touch targets, nav fits');

// tap-to-walk
const x0 = await G(() => window.__ib.game.hero.x);
const cv = await G(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
await touch(cv.x + cv.w - 30, cv.y + cv.h * 0.82); await sleep(1500);
const x1 = await G(() => window.__ib.game.hero.x);
check(x1 > x0 + 100, `tap-to-walk moves the hero (${Math.round(x0)} -> ${Math.round(x1)})`);

// stance buttons
await tap('.st[data-stance="aggressive"]');
check(await G(() => window.__ib.game.data.stance === 'aggressive'), 'stance switch (Aggressive)');
await tap('.st[data-stance="accurate"]');

// fight a chicken
await G(() => { const g = window.__ib.game; g.data.xp.attack = 388; g.data.xp.strength = 388; g.data.hp = g.maxHp; }); // level 5 so the fight is not at the mercy of lucky rolls
await warpTo('chicken', -120); await sleep(200);
await tapEnt('chicken'); await sleep(300);
check(await G(() => { const sc = window.__ib.scene; return sc.kc * 60 >= 44 && sc.kc < 1.2; }), 'zoomed-out camera keeps >=44px monster/node hit areas');
check(await G(() => window.__ib.game.targetEnt?.kind === 'chicken' && document.querySelector('#target .tp')?.textContent.includes('Chicken')), 'tapping a monster selects it and shows the target panel');
check(await waitFor(() => window.__ib.game.data.stats.kills >= 2, null, 90000), 'hero auto-attacks and repeats (2 kills)');
await shot('fight');
const fx = await G(() => { const g = window.__ib.game; return { atk: g.data.xp.attack, hp: g.data.xp.hitpoints, bones: g.count('bones') }; });
check(fx.atk > 0 && fx.hp > 1154 && fx.bones >= 2, `xp + loot gained (atk ${fx.atk}, bones ${fx.bones})`);

// mine copper + tin, chop tree
await G(() => { const g = window.__ib.game; g.clearTarget(); g.data.hp = g.maxHp; });
await warpTo('copper', -100); await sleep(150); await tapEnt('copper');
check(await waitFor(() => window.__ib.game.count('copper_ore') >= 1, null, 40000), 'auto-mines copper');
await shot('mining');
await G(() => window.__ib.game.clearTarget()); await warpTo('tin', -100); await sleep(150); await tapEnt('tin');
check(await waitFor(() => window.__ib.game.count('tin_ore') >= 1, null, 40000), 'auto-mines tin');
await G(() => window.__ib.game.clearTarget()); await warpTo('tree', -100); await sleep(150); await tapEnt('tree');
check(await waitFor(() => window.__ib.game.count('logs') >= 1, null, 40000), 'auto-chops a tree');
await G(() => { const g = window.__ib.game; g.clearTarget(); g.addItem('copper_ore', 4); g.addItem('tin_ore', 4); g.data.xp.smithing = 0; });
check(await G(() => window.__ib.game.data.xp.mining > 0 && window.__ib.game.data.xp.woodcutting > 0), 'mining + woodcutting xp');

// furnace
await warpTo('furnace', -70); await sleep(150); await tapEnt('furnace'); await sleep(600);
check(await G(() => window.__ib.ui.sheet === 'craft' && document.querySelector('[data-recipe="bronze_bar"]')), 'tapping the furnace opens the smelting menu');
await sleep(600);
check(await G(() => { const sc = window.__ib.scene, h = window.__ib.game.hero; const r = sc.cv.getBoundingClientRect(); const y = r.top + (296 + sc.offY) * sc.kc; return y < document.getElementById('sheet').getBoundingClientRect().top; }), 'hero stays visible above the open bottom sheet');
await shot('craft');
await tap('[data-recipe="bronze_bar"] [data-n="99"]');
check(await G(() => window.__ib.game.count('bronze_bar') >= 5), 'smelt bronze bars (copper + tin)');
// anvil
await G(() => window.__ib.ui.close()); await warpTo('anvil', -70); await sleep(150); await tapEnt('anvil'); await sleep(600);
check(await G(() => window.__ib.ui.sheet === 'craft' && window.__ib.ui.craftMenu === 'anvil'), 'tapping the anvil opens smithing');
await tap('[data-recipe="bronze_dagger"] [data-n="1"]');
check(await G(() => window.__ib.game.count('bronze_dagger') === 1), 'smith a bronze dagger');
check(await G(() => document.querySelector('[data-recipe="bronze_body"]').classList.contains('off')), 'platebody greyed out until Smithing 18');
// equip
await tap('#nav [data-tab="bag"]'); await tap('.cell[data-item="bronze_dagger"]'); await tap('#mEq');
check(await G(() => window.__ib.game.data.equip.weapon === 'bronze_dagger'), 'equip the dagger from the bag');
await tap('#nav [data-tab="gear"]'); await sleep(200);
check(await G(() => document.getElementById('sheetBody').textContent.includes('Bronze dagger')), 'gear screen shows equipped bonuses');
await shot('gear');
// bank + shop
await G(() => window.__ib.ui.close()); await warpTo('bank', -70); await sleep(150); await tapEnt('bank'); await sleep(500);
check(await G(() => window.__ib.ui.mode.bank === true), 'bank chest opens the bank');
await tap('.cell[data-item="logs"]'); if (await G(() => !!document.querySelector('[data-k]'))) await tap('[data-k]:last-of-type');
check(await G(() => window.__ib.game.data.bank.logs >= 1), 'deposit into the bank');
await G(() => window.__ib.ui.close()); await G(() => window.__ib.game.addItem('bones', 5));
await warpTo('store', -70); await sleep(150); await tapEnt('store'); await sleep(500);
const c0 = await G(() => window.__ib.game.data.coins);
await tap('[data-item="bones"] [data-k]:last-child');
check(await G((c) => window.__ib.game.data.coins > c, c0), 'sell items to the general store');

// fishing: net spot -> raw shrimp
await G(() => window.__ib.ui.close()); await warpTo('pond', -100); await sleep(150); await tapEnt('pond'); await sleep(300);
check(await G(() => window.__ib.game.targetEnt?.kind === 'pond' && document.querySelector('#target .tp')?.textContent.includes('Fishing spot')), 'tapping the fishing spot shows its target panel');
check(await waitFor(() => window.__ib.game.count('raw_shrimp') >= 1, null, 60000), 'auto-fishes shrimp with the small net');
await shot('fishing');
check(await G(() => window.__ib.game.data.xp.fishing > 0), 'fishing xp');
// cooking at the campfire
await G(() => { const g = window.__ib.game; g.clearTarget(); g.addItem('raw_shrimp', 12); });
await warpTo('fire', -70); await sleep(150); await tapEnt('fire'); await sleep(600);
check(await G(() => window.__ib.ui.sheet === 'craft' && window.__ib.ui.craftMenu === 'cook' && document.querySelector('[data-recipe="cook_shrimp"]')), 'tapping the campfire opens the cooking menu');
await shot('cooking');
const sh0 = await G(() => window.__ib.game.count('shrimp'));
await tap('[data-recipe="cook_shrimp"] [data-n="99"]');
check(await G((n) => window.__ib.game.count('shrimp') > n && window.__ib.game.data.xp.cooking > 0, sh0), 'cook shrimp (xp gained)');
// eating from the food chip
await G(() => { window.__ib.ui.close(); window.__ib.game.data.hp = 3; }); await sleep(400);
check(await G(() => document.getElementById('hudFoodT').textContent.startsWith(String(window.__ib.game.foodCount))), 'food chip shows the food count');
await shot('food');
await tap('#hudFood');
check(await G(() => window.__ib.game.data.hp > 3), 'tapping the food chip eats and heals');
// offline progress: mine, then pretend the tab was closed for an hour
await warpTo('copper', -100); await sleep(150); await tapEnt('copper'); await sleep(500);
const ore0 = await G(() => window.__ib.game.count('copper_ore'));
const epBefore = await G(() => window.__ib.game.data.ep);
await G(() => { window.__ibFreeze = true; const g = window.__ib.game; g.snapshot(Date.now() - 3600 * 1000); localStorage.setItem('ironbound-save-v1', JSON.stringify(g.data)); });
await page.reload({ waitUntil: 'load' }); await sleep(800);
check(await G(() => !document.getElementById('modal').hidden && !!document.querySelector('#modalCard .welcome')), 'reload after 1h away shows the Welcome back popup');
check(await G((n) => window.__ib.game.count('copper_ore') > n + 20 && /Mining/.test(document.querySelector('#modalCard').textContent) && /1h/.test(document.querySelector('#modalCard').textContent), ore0), 'offline mining credited ore + xp in the summary');
const epLine = await G(() => { const l = document.querySelector('#modalCard .welcome [data-ep]'); return l ? Number(l.querySelector('b').textContent.replace(/[^0-9]/g, '')) : null; });
check(epLine > 0 && await G((a) => window.__ib.game.data.ep === a[0] + a[1] && document.getElementById('hudEpT').textContent === String(Math.floor(window.__ib.game.data.ep)), [epBefore, epLine]), `Welcome back lists "Enchant Points +${epLine}" and the HUD EP counter matches`);
check(await G(() => JSON.parse(localStorage.getItem('ironbound-save-v1')).ep === window.__ib.game.data.ep), 'offline EP is saved');
await page.screenshot({ path: `${SHOTS}/ib5-welcome-ep.png` });
await shot('welcome');
await tap('#modalCard #mX');
check(await G(() => document.getElementById('modal').hidden && window.__ib.game.targetEnt?.kind === 'copper'), 'popup closes and the hero resumes the target');
// weapon types: stance row follows the weapon, 2h takes the shield slot
await G(() => window.__ib.ui.close());
await G(() => { const g = window.__ib.game, X = window.__ib.xpForLevel; g.data.xp.attack = X(30); g.data.xp.defence = X(30); g.data.xp.smithing = Math.max(g.data.xp.smithing, X(25)); for (const id of ['iron_scimitar', 'iron_2h', 'iron_shield']) g.addItem(id, 1); g.equip('iron_scimitar'); });
await sleep(200);
check(await G(() => document.querySelectorAll('#stanceRow .st').length === 4 && /Lunge/.test(document.getElementById('stanceRow').textContent)), 'scimitar stance row: Chop / Slash / Lunge / Block');
await G(() => window.__ib.game.equip('bronze_dagger')); await sleep(200);
check(await G(() => document.querySelectorAll('#stanceRow .st').length === 3), 'dagger stance row has 3 styles');
await G(() => window.__ib.game.equip('iron_shield'));
await tap('#nav [data-tab="bag"]'); await tap('.cell[data-item="iron_2h"]'); await shot('inspect-2h'); await tap('#mEq'); await sleep(250);
check(await G(() => { const g = window.__ib.game; return g.data.equip.weapon === 'iron_2h' && g.data.equip.shield === null && g.count('iron_shield') === 1; }), 'equipping a 2h sword unequips the shield');
check(await G(() => /Smash/.test(document.getElementById('stanceRow').textContent)), '2h stance row shows Smash');
// smithing lists every weapon type per tier
await G(() => window.__ib.ui.close()); await G(() => { const ui = window.__ib.ui; ui.craftMenu = 'anvil'; ui.smithTier = 0; window.__ib.game.data.visited.anvil = true; ui.open('craft'); }); await sleep(250);
check(await G(() => document.querySelectorAll('[data-recipe]').length >= 18 && !!document.querySelector('[data-recipe="bronze_halberd"]') && !!document.querySelector('[data-recipe="bronze_battleaxe"]')), 'anvil lists 18 bronze recipes (11 weapon types + armour + pickaxe)');
await G(() => { const ui = window.__ib.ui; ui.smithTier = 3; ui.renderSheet(); }); await sleep(150);
check(await G(() => document.querySelectorAll('[data-recipe]').length >= 18 && /Mithril bar/.test(document.querySelector('[data-recipe="mithril_dagger"]').textContent)), 'tier chips switch to Mithril recipes');
await shot('smithing-tiers');
// enchanting altar: roll an enchant on the scimitar
await G(() => window.__ib.ui.close());
await tap('#nav [data-tab="gear"]'); await tap('#toAltar'); await sleep(250);
const ep0 = await G(() => window.__ib.game.data.ep);
await tap('[data-loc][data-item="iron_scimitar"] button'); await sleep(250);
check(await G(() => !!document.querySelector('[data-altar-item="iron_scimitar"]')), 'altar shows the selected item');
await tap('#rollBtn'); await sleep(300);
const en = await G(() => { const g = window.__ib.game; const s = g.data.bag.find((x) => x.id === 'iron_scimitar'); return { ep: g.data.ep, e: s?.e }; });
check(en.e && en.e.mods.length >= 1 && en.ep === ep0 - 10, 'first enchant roll costs 10 EP and applies a rarity + modifiers');
await shot('altar-enchanted');
await G(() => window.__ib.ui.close());
await tap('#nav [data-tab="bag"]'); await sleep(200);
check(await G(() => !!document.querySelector('.cell.ench[data-item="iron_scimitar"]')), 'enchanted gear gets a rarity border in the bag');
await G(() => window.__ib.ui.close());
// scene draw cost (software-rendered headless Chrome is a pessimistic proxy for a phone)
const ms = await G(() => { const sc = window.__ib.scene; const t0 = performance.now(); for (let i = 0; i < 40; i++) sc.draw(performance.now() + i * 16); return (performance.now() - t0) / 40; });
check(ms < 25, `scene draws in ${ms.toFixed(1)}ms/frame`);
await G(() => { const g = window.__ib.game; g.equip('bronze_dagger'); g.data.xp.attack = 0; g.data.xp.defence = 0; });
// map
await G(() => window.__ib.ui.close()); await tap('#nav [data-tab="map"]'); await sleep(200);
check(await G(() => document.querySelectorAll('[data-area]').length === Object.keys(window.__ib.AREAS).length), 'map lists every area');
await shot('map');
// tour EVERY area: travel via the map button, draw, select each monster + node kind once (exercises art + target panel)
for (const id of await G(() => Object.keys(window.__ib.AREAS))) {
  await G(() => window.__ib.ui.close()); await tap('#nav [data-tab="map"]'); await sleep(150);
  if (await G((a) => window.__ib.game.data.area !== a[0], [id])) { await tap(`[data-area="${id}"]`); await sleep(250); }
  const ok = await G((a) => { const g = window.__ib.game; if (g.data.area !== a[0]) return 'no travel';
    const kinds = new Set(); for (const e of g.ents) if ((e.type === 'monster' || e.type === 'node') && !kinds.has(e.kind)) { kinds.add(e.kind); g.select(e.id); window.__ib.ui.updateTarget(); g.hero.x = e.x - 40; window.__ib.scene.draw(performance.now()); g.update(0.1); }
    g.clearTarget(); return 'ok'; }, [id]);
  check(ok === 'ok', `area ${id}: travel, draw, select every monster/node`);
  if (['draynor', 'brimhaven_dungeon', 'wilderness'].includes(id)) { await G(() => window.__ib.ui.close()); await sleep(200); await page.screenshot({ path: `/workspace/ib6-area-${id}.png` }); }
}
await G(() => window.__ib.game.travel('draynor')); await sleep(300);
await shot('quarry');
// persistence
await G(() => window.__ib.game.data.hp = window.__ib.game.maxHp);
await page.reload({ waitUntil: 'load' }); await sleep(500);
check(await G(() => window.__ib.game.data.name === 'Aldric' && window.__ib.game.data.equip.weapon === 'bronze_dagger' && window.__ib.game.data.area === 'draynor'), 'progress persists across reload');
// landscape
await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(500);
await tap('#nav [data-tab="skills"]'); await sleep(300); await shot('landscape');
check(await G(() => document.querySelectorAll('#sheetBody .row[data-skill]').length === 16), 'Skills lists all 16 skills (incl. Ranged, Magic, Prayer, Crafting, Fletching, Runecraft, Slayer)');
// new systems: fletching menu, bow + arrows in combat, staff + runes, prayer/magic tabs, tanner
await G(() => { const g = window.__ib.game; g.travel('lumby'); g.addItem('logs', 3); g.addItem('feather', 15); g.addItem('bronze_arrowtips', 15); g.addItem('shortbow', 1); g.addItem('staff', 1); g.data.coins += 50; window.__ib.ui.close(); window.__ib.ui.craftMenu = 'fletch'; window.__ib.ui.open('craft'); }); await sleep(250);
check(await G(() => !!document.querySelector('[data-recipe="arrow_shaft"]') && !!document.querySelector('[data-recipe="headless_arrow"]') && !!document.querySelector('[data-recipe="shortbow"]')), 'Fletching menu lists shafts, headless arrows and bows');
await page.screenshot({ path: '/workspace/ib6-fletching.png' });
check(await G(() => { const g = window.__ib.game; g.craft('arrow_shaft'); g.craft('headless_arrow', 15); g.craft('bronze_arrows'); return g.count('bronze_arrows') === 15; }), 'fletch 15 bronze arrows from log + feathers + tips');
await G(() => { const g = window.__ib.game; window.__ib.ui.close(); g.equip('shortbow'); g.setStance('accurate'); }); await sleep(250);
check(await G(() => /Accurate/.test(document.getElementById('stanceRow').textContent) && /Rapid/.test(document.getElementById('stanceRow').textContent) && /Rng/.test(document.getElementById('stanceRow').textContent)), 'stance row shows Accurate/Rapid/Longrange for bows');
await G(() => { const g = window.__ib.game, c = g.ents.find((e) => e.kind === 'chicken'); g.hero.x = c.x - 120; g.select(c.id); }); await sleep(2500);
check(await G(() => window.__ib.game.count('bronze_arrows') < 15 && window.__ib.game.data.xp.ranged > 0), 'bow fires arrows and trains Ranged');
await page.screenshot({ path: '/workspace/ib6-ranged.png' });
await G(() => { const g = window.__ib.game; g.clearTarget(); g.equip('staff'); g.addItem('air_rune', 30); g.addItem('mind_rune', 30); g.setStance('accurate'); const c = g.ents.find((e) => e.kind === 'chicken' && e.dead <= 0) || g.ents.find((e) => e.kind === 'cow'); g.select(c.id); }); await sleep(3000);
check(await G(() => window.__ib.game.count('mind_rune') < 30 && window.__ib.game.data.xp.magic > 0), 'staff casts Wind Strike with runes and trains Magic');
await G(() => { window.__ib.game.clearTarget(); window.__ib.ui.open('magic'); }); await sleep(250);
check(await G(() => document.querySelectorAll('#sheetBody [data-spell]').length >= 5), 'Magic tab lists spells');
await page.screenshot({ path: '/workspace/ib6-magic.png' });
await G(() => window.__ib.ui.open('prayer')); await sleep(200);
check(await G(() => /Prayer points/.test(document.getElementById('sheetBody').textContent)), 'Prayer tab renders');
await G(() => { window.__ib.ui.close(); window.__ib.ui.openTanner(); }); await sleep(150);
check(await G(() => !!document.getElementById('tanSoft')), 'tanner dialog opens'); await G(() => window.__ib.ui.closeModal());
check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
await browser.close(); srv.kill();
console.log(failed ? `\n${failed} e2e check(s) FAILED` : '\ne2e smoke test passed');
process.exit(failed ? 1 : 0);
