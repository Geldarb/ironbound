// Screenshot tour (390x844 touch): node test/shots.mjs  -> /workspace/ib4-*.png (override with SHOTS / SHOT_PREFIX)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer;
try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const CHROME = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
const PORT = +(process.env.PORT || 8131), APP = `http://localhost:${PORT}/`;
const OUT = process.env.SHOTS || '/workspace', PFX = process.env.SHOT_PREFIX || 'ib4';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(APP)).ok) break; } catch { /* retry */ } await sleep(100); }
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const cdp = await page.createCDPSession();
const touch = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(50); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(150); };
const tap = async (sel) => { const r = await page.$eval(sel, (e) => { if (e.closest('#sheetBody')) e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }); await touch(r.x, r.y); };
const G = (fn, ...a) => page.evaluate(fn, ...a);
const shot = async (n, clip) => { await page.screenshot({ path: `${OUT}/${PFX}-${n}.png`, ...(clip ? { clip, captureBeyondViewport: false } : {}) }); console.log('shot', n); };
const warpTo = (kind, off = -80) => G((k, o) => { const g = window.__ib.game; const e = g.ents.find((x) => x.kind === k); g.hero.x = e.x + o; g.hero.dest = null; }, kind, off);
const select = (kind, i = 0) => G((k, i) => { const g = window.__ib.game; const e = g.ents.filter((x) => x.kind === k)[i]; g.select(e.id); }, kind, i);
const setXp = (o) => G((o) => { const g = window.__ib.game; for (const [k, l] of Object.entries(o)) g.data.xp[k] = window.__ib.xpForLevel(l); g.data.hp = g.maxHp; g.emit('change'); }, o);
const give = (items) => G((items) => { const g = window.__ib.game; for (const [id, n] of items) g.addItem(id, n); g.emit('change'); }, items);

await page.goto(APP, { waitUntil: 'load' }); await G(() => localStorage.clear()); await page.goto(APP, { waitUntil: 'load' });
await tap('#looks button:nth-child(2)'); await page.type('#nameIn', 'Aldric'); await tap('#beginBtn'); await sleep(500);
await G(() => document.getElementById('toasts').innerHTML = '');
export { page, G, tap, touch, shot, warpTo, select, setXp, give, sleep, errors, browser, srv, cdp };
const MODE = process.argv[2] || 'all';
if (MODE === 'all' || MODE === 'tour') await (await import('./shots-tour.mjs')).default({ page, G, tap, touch, shot, warpTo, select, setXp, give, sleep });
if (MODE === 'art') await (await import('./shots-art.mjs')).default({ page, G, tap, touch, shot });
if (MODE === 'layout') {
  await G(() => { const g = window.__ib.game; g.data.ep = 50; g.equip; });
  for (const [w, h, n] of [[360, 640, 'small'], [844, 390, 'landscape']]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(500);
    await shot(`layout-${n}`);
    const lay = await G(() => ({ navFits: document.getElementById('nav').getBoundingClientRect().right <= innerWidth + 0.5, minBtn: Math.min(...[...document.querySelectorAll('#nav button,.st')].map((b) => b.getBoundingClientRect().height)), stage: document.getElementById('stage').getBoundingClientRect().height / innerHeight }));
    console.log(n, JSON.stringify(lay));
    await tap('#nav [data-tab="gear"]'); await sleep(300); await shot(`layout-${n}-gear`); await G(() => window.__ib.ui.close());
  }
}
console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no page errors');
await browser.close(); srv.kill();
