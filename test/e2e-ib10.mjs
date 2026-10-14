// e2e: craft-menu icons, shield placement, Camelot + Ardougne (signs + teleports). Screenshots -> /workspace/ib10-*.png
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer; try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.argv[2], PORT = 8476, APP = BASE || `http://localhost:${PORT}/`, OUT = process.env.SHOTS || '/workspace';
const srv = BASE ? null : spawn('node', ['server.js'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 50 && !BASE; i++) { try { if ((await fetch(APP)).ok) break; } catch { /* retry */ } await sleep(100); }
let failed = 0; const check = (c, m) => { console.log(c ? '  ok  -' : '  FAIL-', m); if (!c) failed++; };
const browser = await puppeteer.launch({ executablePath: ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p)), headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(APP, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear()); await page.goto(APP, { waitUntil: 'load' });
await page.type('#nameIn', 'Lancelot'); await page.click('#beginBtn'); await sleep(500);
const G = (fn, ...a) => page.evaluate(fn, ...a);
const shot = (n) => page.screenshot({ path: `${OUT}/ib10-${n}.png` });
await G(() => { const g = window.__ib.game; for (const s of ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'fletching', 'crafting']) g.data.xp[s] = window.__ib.xpForLevel(70); g.data.hp = g.maxHp; });
// icons: every item icon has real coverage (not a hairline)
const thin = await G(async () => {
  const { iconURL } = await import('/src/art.js'); const { ITEMS } = await import('/src/data.js'); const bad = [];
  for (const id of Object.keys(ITEMS)) {
    const url = iconURL(id); const im = new Image(); im.src = url; await im.decode();
    const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, 48, 48).data; let n = 0, minX = 48, maxX = 0, minY = 48, maxY = 0;
    for (let i = 0; i < 48 * 48; i++) if (d[i * 4 + 3] > 40) { n++; const px = i % 48, py = (i / 48) | 0; minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); }
    if (n < 90 || maxX - minX < 9 || maxY - minY < 9) bad.push(`${id}:${n}`);
  }
  return bad;
});
check(thin.length === 0, `no hairline item icons${thin.length ? ': ' + thin.join(', ') : ''}`);
await G(() => { const g = window.__ib.game; g.addItem('yew_logs', 2); g.addItem('bow_string', 2); g.addItem('feather', 30); g.addItem('logs', 2); window.__ib.ui.open('craft'); });
await sleep(300); await G(() => { const b = [...document.querySelectorAll('#sheetBody button, #sheetBody [data-station]')].find((x) => /Fletch/i.test(x.textContent)); b?.click(); }); await sleep(300);
await G(() => document.querySelector('[data-recipe="oak_shortbow_u"]')?.scrollIntoView({ block: 'start' })); await sleep(200);
check(await G(() => [...document.querySelectorAll('#sheetBody .row img')].filter((i) => i.naturalWidth > 0).length >= 3), 'craft rows show item icons');
await shot('craft-icons');
await G(() => { window.__ib.ui.close(); window.__ib.ui.open('bag'); }); await sleep(250); await shot('bag-icons');
// shield
await G(() => { window.__ib.ui.close(); const g = window.__ib.game; for (const id of ['mithril_sword', 'mithril_shield', 'mithril_helm', 'mithril_body', 'mithril_legs']) { g.addItem(id, 1); g.equip(id); } const c = g.ents.find((e) => e.kind === 'cow'); g.hero.x = c.x - 70; g.select(c.id); window.__ib.scene.setZoom(1.4); });
await sleep(1800); await shot('shield');
await G(() => { window.__ib.game.clearTarget(); window.__ib.scene.setZoom(1); });
// Camelot via the Varrock sign
await G(() => { const g = window.__ib.game; g.travel('varrock'); const s = g.ents.find((e) => e.type === 'sign' && e.kind === 'camelot'); g.hero.x = s.x - 60; g.select(s.id); });
let ok = false; for (let i = 0; i < 40 && !ok; i++) { await sleep(200); ok = await G(() => window.__ib.game.data.area === 'camelot'); }
if (!ok) await G(() => { const g = window.__ib.game; const s = g.ents.find((e) => e.type === 'sign' && e.kind === 'camelot'); if (s && window.__ib.ui.openSign) window.__ib.ui.openSign(s); });
const viaSign = ok || await G(() => { const b = [...document.querySelectorAll('#modal button')].find((x) => /Camelot|Travel|Go/i.test(x.textContent)); if (b) b.click(); return !!b; }) && await (async () => { await sleep(400); return G(() => window.__ib.game.data.area === 'camelot'); })();
check(viaSign, 'Varrock sign leads to Camelot');
await G(() => { const g = window.__ib.game; if (g.data.area !== 'camelot') g.travel('camelot'); window.__ib.ui.closeModal(); const y = g.ents.find((e) => e.kind === 'yew'); g.hero.x = y.x - 140; g.hero.dest = null; });
await sleep(900); await shot('camelot');
await G(() => { const g = window.__ib.game; const p = g.ents.find((e) => e.kind === 'paladin'); g.hero.x = p.x - 120; g.select(p.id); }); await sleep(1500); await shot('camelot-paladin');
// Ardougne via the spellbook
await G(() => { const g = window.__ib.game; g.clearTarget(); g.addItem('water_rune', 2); g.addItem('law_rune', 2); window.__ib.ui.open('magic'); }); await sleep(300);
check(await G(() => !!document.querySelector('[data-spell="camelot_tele"]') && /Lv 51/.test(document.querySelector('[data-spell="ardougne_tele"]').textContent)), 'spellbook lists Camelot and Ardougne Teleport');
await G(() => document.querySelector('[data-spell="ardougne_tele"] [data-cast]').click()); await sleep(400);
check(await G(() => window.__ib.game.data.area === 'ardougne'), 'Ardougne Teleport cast from the spellbook');
await G(() => { window.__ib.ui.close(); const g = window.__ib.game; const k = g.ents.find((e) => e.kind === 'knight_of_ardougne'); g.hero.x = k.x - 160; g.hero.dest = null; }); await sleep(900); await shot('ardougne');
await G(() => { const g = window.__ib.game; const h = g.ents.find((e) => e.kind === 'hero'); g.hero.x = h.x - 230; g.hero.dest = null; }); await sleep(700); await shot('ardougne-east');
await G(() => window.__ib.ui.open('map')); await sleep(300);
check(await G(() => /Camelot/.test(document.getElementById('sheetBody').textContent) && /Ardougne/.test(document.getElementById('sheetBody').textContent)), 'world map lists Camelot and Ardougne');
check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close(); srv?.kill();
console.log(failed ? `\n${failed} checks FAILED` : '\nib10 e2e passed'); process.exit(failed ? 1 : 0);
