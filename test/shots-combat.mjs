// Live combat screenshots (monster projectiles) -> /workspace/ib7-*.png  (node test/shots-combat.mjs [baseURL])
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer; try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.argv[2]; const PORT = 8472; const APP = BASE || `http://localhost:${PORT}/`;
const srv = BASE ? null : spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await sleep(BASE ? 0 : 700);
const browser = await puppeteer.launch({ executablePath: ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p)), headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(APP, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear()); await page.goto(APP, { waitUntil: 'load' });
await page.type('#nameIn', 'Ranger'); await page.click('#beginBtn'); await sleep(500);
const G = (fn, ...a) => page.evaluate(fn, ...a);
async function fight(area, kind, file, setup) {
  await G((area, kind, setup) => {
    const g = window.__ib.game; g.travel(area); for (const s of ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer']) g.data.xp[s] = 1e6; g.data.hp = 999;
    if (setup === 'bow') { g.addItem('shortbow', 1); g.addItem('bronze_arrows', 500); g.equip?.('shortbow'); g.data.equip.weapon = 'shortbow'; g.data.equip.ammo = 'bronze_arrows'; }
    if (setup === 'staff') { g.data.equip.weapon = 'staff'; g.addItem('air_rune', 500); g.addItem('mind_rune', 500); g.addItem('fire_rune', 500); g.addItem('chaos_rune', 500); }
    const e = g.ents.find((x) => x.kind === kind); g.hero.x = e.x - (setup ? 170 : 150); g.hero.dest = null; g.select(e.id);
  }, area, kind, setup);
  let got = false;
  for (let i = 0; i < 160 && !got; i++) { await sleep(60); got = await G(() => window.__ib.scene.proj.some((p) => p.t > 0.08 && p.t < p.dur - 0.05)); }
  await G(() => { window.__ib.game.data.hp = 999; });
  await page.screenshot({ path: `/workspace/${file}.png` }); console.log(file, got ? 'projectile captured' : 'no projectile');
}
await fight('lumby', 'goblin_archer', 'ib7-ranged-attack');
await fight('mage_tower', 'dark_wizard', 'ib7-magic-attack');
await fight('wilderness', 'green_dragon', 'ib7-dragonfire');
await G(() => { window.__ib.game.clearTarget(); });
await fight('lumby', 'goblin', 'ib7-hero-bow', 'bow');
console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no page errors');
await browser.close(); srv?.kill();
