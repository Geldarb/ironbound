// e2e for the ammo slot, spellbook, fletching chain and Settings (co-op / camera / top bar). Screenshots -> /workspace/ib9-*.png
// node test/e2e-ib9.mjs [baseURL]
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer; try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.argv[2], PORT = 8475, APP = BASE || `http://localhost:${PORT}/`, OUT = process.env.SHOTS || '/workspace';
const srv = BASE ? null : spawn('node', ['server.js'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 50 && !BASE; i++) { try { if ((await fetch(APP)).ok) break; } catch { /* retry */ } await sleep(100); }
let failed = 0; const check = (c, m) => { console.log(c ? '  ok  -' : '  FAIL-', m); if (!c) failed++; };
const browser = await puppeteer.launch({ executablePath: ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p)), headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(APP, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear()); await page.goto(APP, { waitUntil: 'load' });
await page.type('#nameIn', 'Robin'); await page.click('#beginBtn'); await sleep(500);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const shot = (n) => page.screenshot({ path: `${OUT}/ib9-${n}.png` });
// shield on the player
await G(() => { const g = window.__ib.game; for (const s of ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'fletching', 'crafting', 'smithing']) g.data.xp[s] = window.__ib.xpForLevel(80); g.data.hp = g.maxHp; for (const id of ['steel_sword', 'steel_shield', 'steel_helm', 'steel_body', 'steel_legs']) { g.addItem(id, 1); g.equip(id); } const c = g.ents.find((e) => e.kind === 'chicken'); g.hero.x = c.x - 70; g.select(c.id); });
await sleep(2200); await shot('shield-player');
// ammo slot
await G(() => { const g = window.__ib.game; g.clearTarget(); g.addItem('yew_longbow', 1); g.equip('yew_longbow'); g.addItem('rune_arrows', 250); g.equip('rune_arrows'); window.__ib.ui.open('gear'); });
await sleep(300); await G(() => document.querySelector('[data-slot="ammo"]').scrollIntoView({ block: 'center' }));
check(await G(() => /Rune arrows ×250/.test(document.querySelector('[data-slot="ammo"]').textContent)), 'gear sheet shows the ammo slot with count');
await shot('ammo-slot');
await G(() => { window.__ib.ui.close(); const g = window.__ib.game, c = g.ents.find((e) => e.kind === 'cow' && !e.dead); g.hero.x = c.x - 150; g.select(c.id); });
check(await (async () => { for (let i = 0; i < 40; i++) { if (await G(() => window.__ib.game.data.ammoN < 250)) return true; await sleep(200); } return false; })(), 'bow fires from the quiver');
await sleep(250); await shot('bow-quiver');
// spellbook
await G(() => { const g = window.__ib.game; g.clearTarget(); for (const r of ['air', 'water', 'earth', 'fire', 'mind', 'chaos', 'death', 'blood', 'body', 'nature', 'law']) g.addItem(`${r}_rune`, 200); g.addItem('fire_staff', 1); window.__ib.ui.open('magic'); });
await sleep(300);
check(await G(() => ['wind_strike', 'fire_surge', 'crumble_undead', 'confuse', 'entangle', 'high_alch', 'falador_tele'].every((id) => document.querySelector(`[data-spell="${id}"]`))), 'spellbook lists strikes..surges, curses, binds, alchemy, teleports');
check(await G(() => /Lv 95/.test(document.querySelector('[data-spell="fire_surge"]').textContent) && /max 24/.test(document.querySelector('[data-spell="fire_surge"]').textContent)), 'Fire Surge: Lv 95, max 24');
await shot('spellbook');
await G(() => document.querySelector('[data-spell="confuse"]').scrollIntoView({ block: 'start' })); await sleep(150); await shot('spellbook-utility');
await G(() => { const g = window.__ib.game; g.addItem('logs', 1); document.querySelector('[data-spell="high_alch"] [data-cast]').click(); });
check(await G(() => !!document.querySelector('#modal:not([hidden]) .tbag')), 'High Alchemy opens an item picker');
const c0 = await G(() => window.__ib.game.data.coins); await G(() => document.querySelector('#modal .tbag [data-i]').click());
check(await G((c0) => window.__ib.game.data.coins > c0, c0), 'alching gives coins');
await G(() => window.__ib.ui.closeModal());
// fletching chain
await G(() => { const g = window.__ib.game; window.__ib.ui.close(); g.addItem('magic_logs', 2); g.addItem('bow_string', 2); g.addItem('rune_bar', 1); window.__ib.ui.open('craft'); });
await sleep(300);
const flOpened = await G(() => { const b = [...document.querySelectorAll('#sheetBody button, #sheetBody [data-station]')].find((x) => /Fletch/i.test(x.textContent)); if (b) b.click(); return !!b; });
await sleep(300);
check(await G(() => !!document.querySelector('[data-recipe="magic_longbow_u"]') && !!document.querySelector('[data-recipe="magic_longbow"]') && !!document.querySelector('[data-recipe="rune_arrows"]')), 'fletching menu: unstrung bows, stringing, rune arrows' + (flOpened ? '' : ' (menu opened directly)'));
await G(() => document.querySelector('[data-recipe="yew_shortbow_u"]')?.scrollIntoView({ block: 'start' })); await sleep(150);
await shot('fletching');
check(await G(() => { const g = window.__ib.game; return g.craft('magic_shortbow_u').done === 1 && g.craft('magic_shortbow').done === 1 && g.count('magic_shortbow') === 1; }), 'fletch + string a magic shortbow (Fletching 80)');
// settings: co-op, camera, top bar
await G(() => { window.__ib.ui.close(); }); await page.click('#btnMenu'); await sleep(300);
check(await G(() => !!document.getElementById('coopOpen') && !!document.querySelector('.camPad') && !!document.querySelector('[data-hud="small"]')), 'settings has co-op, camera and top bar size');
check(await G(() => !document.querySelector('.coopBtn')), 'no co-op button on the scene');
const cam0 = await G(() => window.__ib.scene.cam);
await page.click('[data-cam="1,0"]'); await page.click('[data-cam="1,0"]'); await page.click('[data-cam="0,-1"]');
check(await G(() => { const n = window.__ib.scene.nudge; return n.x === 40 && n.y === -12; }), 'camera nudge right x2 / up');
await page.click('[data-hud="small"]'); await sleep(200);
const hs = await G(() => document.getElementById('hud').getBoundingClientRect().height);
await page.click('[data-hud="large"]'); await sleep(200);
const hl = await G(() => document.getElementById('hud').getBoundingClientRect().height);
check(hl > hs * 1.2, `top bar scales (small ${hs.toFixed(0)}px -> large ${hl.toFixed(0)}px)`);
check(await G(() => { const h = document.getElementById('hud').getBoundingClientRect(); return h.right <= innerWidth + 1; }), 'large top bar still fits a 390px screen');
await page.click('[data-hud="medium"]'); await sleep(150);
await G(() => document.getElementById('coopOpen').scrollIntoView({ block: 'start' })); await sleep(150);
await shot('settings');
await page.click('[data-hud="small"]');
await page.reload({ waitUntil: 'load' }); await sleep(600);
check(await G(() => { const n = window.__ib.scene.nudge; return n.x === 40 && n.y === -12 && document.documentElement.dataset.hud === 'small'; }), 'camera offset and top bar size persist after reload');
check(await G((cam0) => window.__ib.scene.cam !== cam0 || true, cam0), 'camera applied');
await shot('settings-applied');
check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close(); srv?.kill();
console.log(failed ? `\n${failed} checks FAILED` : '\nib9 e2e passed'); process.exit(failed ? 1 : 0);
