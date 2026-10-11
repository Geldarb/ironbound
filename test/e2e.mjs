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
const shot = (n) => page.screenshot({ path: `${SHOTS}/${process.env.SHOT_PREFIX || 'ib3'}-${n}.png` });
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
await G(() => { window.__ibFreeze = true; const g = window.__ib.game; g.snapshot(Date.now() - 3600 * 1000); localStorage.setItem('ironbound-save-v1', JSON.stringify(g.data)); });
await page.reload({ waitUntil: 'load' }); await sleep(800);
check(await G(() => !document.getElementById('modal').hidden && !!document.querySelector('#modalCard .welcome')), 'reload after 1h away shows the Welcome back popup');
check(await G((n) => window.__ib.game.count('copper_ore') > n + 20 && /Mining/.test(document.querySelector('#modalCard').textContent) && /1h/.test(document.querySelector('#modalCard').textContent), ore0), 'offline mining credited ore + xp in the summary');
await shot('welcome');
await tap('#modalCard #mX');
check(await G(() => document.getElementById('modal').hidden && window.__ib.game.targetEnt?.kind === 'copper'), 'popup closes and the hero resumes the target');
// map
await G(() => window.__ib.ui.close()); await tap('#nav [data-tab="map"]'); await sleep(200);
check(await G(() => document.querySelector('[data-area="quarry"]').disabled), 'Quarry locked below combat level 10');
await shot('map');
await G(() => { const g = window.__ib.game; for (const s of ['attack', 'strength', 'defence']) g.data.xp[s] = 4470; });
await G(() => window.__ib.ui.renderSheet()); await sleep(200); await tap('[data-area="quarry"]'); await sleep(400);
check(await G(() => window.__ib.game.data.area === 'quarry'), 'fast travel to the Quarry once combat level 10');
await G(() => { window.__ib.game.hero.x = 900; }); await sleep(300);
await shot('quarry');
// persistence
await G(() => window.__ib.game.data.hp = window.__ib.game.maxHp);
await page.reload({ waitUntil: 'load' }); await sleep(500);
check(await G(() => window.__ib.game.data.name === 'Aldric' && window.__ib.game.data.equip.weapon === 'bronze_dagger' && window.__ib.game.data.area === 'quarry'), 'progress persists across reload');
// landscape
await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(500);
await tap('#nav [data-tab="skills"]'); await sleep(300); await shot('landscape');
check(await G(() => document.querySelectorAll('#sheetBody .row[data-skill]').length === 9), 'Skills lists the 9 skills');
check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
await browser.close(); srv.kill();
console.log(failed ? `\n${failed} e2e check(s) FAILED` : '\ne2e smoke test passed');
process.exit(failed ? 1 : 0);
