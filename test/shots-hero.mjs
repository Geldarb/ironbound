// Hero pose sheet (shield / quiver placement across poses) -> /workspace/ib9-shield.png
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer; try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const PORT = 8474, srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const browser = await puppeteer.launch({ executablePath: ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p)), headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.evaluate(async () => {
  const A = await import('/src/art.js');
  document.body.innerHTML = ''; const W = 900, H = 400; const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99`; document.body.appendChild(cv);
  const ctx = cv.getContext('2d'); ctx.scale(2, 2); ctx.fillStyle = '#cfeaff'; ctx.fillRect(0, 0, W, H); ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  const eq = { weapon: 'steel_sword', shield: 'steel_shield', body: 'steel_body', head: 'steel_helm', legs: 'steel_legs' };
  const rows = [
    [['idle', { state: 'idle', t: 0.3 }], ['idle 2', { state: 'idle', t: 1.6 }], ['walk a', { state: 'walk', t: 0.05 }], ['walk b', { state: 'walk', t: 0.2 }], ['walk c', { state: 'walk', t: 0.36 }], ['left', { state: 'idle', t: 0.3, dir: -1 }]],
    [['slash .2', { state: 'attack', swingP: 0.2, atkType: 'slash' }], ['slash .5', { state: 'attack', swingP: 0.5, atkType: 'slash' }], ['stab .5', { state: 'attack', swingP: 0.5, atkType: 'stab' }], ['crush .4', { state: 'attack', swingP: 0.4, atkType: 'crush' }], ['crush .8', { state: 'attack', swingP: 0.8, atkType: 'crush' }], ['bow + quiver', { state: 'attack', swingP: 0.4, atkType: 'ranged', two: true, eq: { weapon: 'yew_longbow', ammo: 'rune_arrows', body: 'leather_body' } }]],
  ];
  rows.forEach((r, ri) => r.forEach(([lbl, o], i) => { const x = 75 + i * 150, y = 170 + ri * 200; ctx.fillStyle = '#6ab04c'; ctx.fillRect(x - 60, y, 120, 5); A.drawHero(ctx, x, y, 1.6, { look: 1, equip: o.eq || eq, dir: o.dir || 1, two: !!o.two, ...o }); ctx.fillStyle = '#222'; ctx.fillText(lbl, x, y + 20); }));
});
await page.screenshot({ path: '/workspace/ib9-shield.png', clip: { x: 0, y: 0, width: 900, height: 400 } });
console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'hero sheet ok');
await browser.close(); srv.kill();
