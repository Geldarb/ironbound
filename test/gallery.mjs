// Monster art gallery -> /workspace/ib7-*.png  (node test/gallery.mjs)
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer; try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const PORT = 8471, srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const browser = await puppeteer.launch({ executablePath: ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p)), headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
async function draw(file, w, h, rows) {
  await page.evaluate(async (w, h, rows) => {
    const A = await import('/src/art.js'), D = await import('/src/data.js');
    document.body.innerHTML = ''; const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; cv.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:9`; document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(2, 2); const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#bfe8ff'); g.addColorStop(1, '#e8f7ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (const r of rows) { ctx.fillStyle = '#6ab04c'; ctx.fillRect(0, r.y, w, 6); ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      for (const it of r.items) { A.drawMonster(ctx, it.k, it.x, r.y, it.s || 1, { dir: 1, t: it.t ?? 1.3, color: D.MONSTERS[it.k]?.color || '#999', swing: it.sw ?? null, seed: it.x }); if (!r.nolabel) { ctx.fillStyle = '#222'; ctx.fillText(it.k.replace(/_/g, ' '), it.x, r.y + 18); } } }
  }, w, h, rows);
  await page.screenshot({ path: `/workspace/${file}.png`, clip: { x: 0, y: 0, width: w, height: h } });
}
await draw('ib7-green-dragon', 420, 300, [{ y: 260, nolabel: true, items: [{ k: 'green_dragon', x: 210, s: 1.9 }] }]);
await draw('ib7-dragons', 780, 230, [{ y: 200, items: ['green_dragon', 'bronze_dragon', 'iron_dragon', 'steel_dragon'].map((k, i) => ({ k, x: 110 + i * 190, s: 0.95, sw: i % 2 ? 0.5 : null })) }]);
const ks = ['chicken', 'cow', 'goblin', 'goblin_archer', 'giant_rat', 'imp', 'bat', 'seagull', 'scorpion', 'wolf', 'alpha_wolf', 'skeleton', 'zombie', 'thief', 'pirate', 'guard', 'al_kharid_warrior', 'white_knight', 'wizard', 'dark_wizard'];
await draw('ib7-monsters', 780, 420, [{ y: 190, items: ks.slice(0, 10).map((k, i) => ({ k, x: 45 + i * 76 })) }, { y: 390, items: ks.slice(10).map((k, i) => ({ k, x: 45 + i * 76 })) }]);
await draw('ib7-big', 780, 260, [{ y: 230, items: ['hill_giant', 'moss_giant', 'fire_giant', 'greater_demon', 'black_demon', 'chaos_elemental'].map((k, i) => ({ k, x: 70 + i * 128, s: 0.85 })) }]);
await draw('ib7-attacks', 780, 200, [{ y: 170, items: ['goblin_archer', 'dark_wizard', 'skeleton', 'scorpion', 'wolf', 'hill_giant', 'imp'].map((k, i) => ({ k, x: 60 + i * 110, sw: 0.5, s: k === 'hill_giant' ? 0.7 : 1 })) }]);
console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'gallery ok');
await browser.close(); srv.kill();
