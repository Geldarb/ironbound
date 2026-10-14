// Two-browser co-op e2e: create/join by code, see each other, shared monster, chat, trade, reload-resume.
// node test/e2e-coop.mjs [baseURL]   (screenshots -> /workspace/ib8-*.png)
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs';
const require = createRequire(import.meta.url);
let puppeteer; try { puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core'); } catch { puppeteer = require('/workspace/tools/node_modules/puppeteer-core'); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.argv[2]; const PORT = 8473; const APP = BASE || `http://localhost:${PORT}/`; const OUT = process.env.SHOTS || '/workspace';
const srv = BASE ? null : spawn('node', ['server.js'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 50 && !BASE; i++) { try { if ((await fetch(APP)).ok) break; } catch { /* retry */ } await sleep(100); }
let failed = 0; const check = (c, m) => { console.log(c ? '  ok  -' : '  FAIL-', m); if (!c) failed++; };
const browser = await puppeteer.launch({ executablePath: ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p)), headless: 'new', args: ['--no-sandbox'] });
const errors = [];
async function player(name, look) {
  const ctx = await browser.createBrowserContext(); const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(APP, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear()); await page.goto(APP, { waitUntil: 'load' });
  await page.click(`#looks button:nth-child(${look})`); await page.type('#nameIn', name); await page.click('#beginBtn'); await sleep(500);
  await page.evaluate(() => { const g = window.__ib.game; for (const s of ['attack', 'strength', 'defence', 'hitpoints']) g.data.xp[s] = 20000; g.data.hp = g.maxHp; g.addItem('bronze_sword', 1); g.equip('bronze_sword'); g.addItem('bronze_shield', 1); g.equip('bronze_shield'); });
  return page;
}
const A = await player('Alice', 2), B = await player('Bob', 4);
const G = (p, fn, ...a) => p.evaluate(fn, ...a);
const until = async (p, fn, ms = 15000, arg) => { const t = Date.now(); while (Date.now() - t < ms) { if (await G(p, fn, arg)) return true; await sleep(150); } return false; };

const openCoop = async (p) => { await G(p, () => window.__ib.coopUI.close()); await p.click('#btnMenu'); await sleep(250); await p.evaluate(() => document.getElementById('coopOpen').scrollIntoView({ block: 'center' })); await p.click('#coopOpen'); await sleep(150); };
check(await G(A, () => !document.getElementById('coopBtn') && !document.querySelector('#stage > button.coopBtn')), 'no co-op button on the scene (moved to Settings)');
await openCoop(A); await A.click('#coopCreate');
check(await until(A, () => !!window.__ib.coop.room?.code && !!document.getElementById('coopRoomCode')), 'A creates a room and sees the code');
const code = await G(A, () => window.__ib.coop.room.code);
await openCoop(B); await B.type('#coopCode', code.toLowerCase()); await B.click('#coopJoin');
check(await until(B, () => window.__ib.coop.active && window.__ib.coop.members.length === 2), `B joins room ${code}`);
await G(A, () => { window.__ib.coopUI.close(); window.__ib.ui.close?.(); }); await G(B, () => { window.__ib.coopUI.close(); window.__ib.ui.close?.(); });
check(await G(A, () => document.getElementById('btnMenu').classList.contains('on')), 'settings button shows the connected ring');
// meet at a goblin in Lumbridge
const place = (p, off) => G(p, (off) => { const g = window.__ib.game; const e = g.ents.find((x) => x.kind === 'goblin'); g.hero.x = e.x + off; g.hero.dest = null; g.select(e.id); }, off);
await place(A, -60); await place(B, -100);
check(await until(A, () => window.__ib.coop.peersHere().some((p) => p.n === 'Bob' && p.eq.weapon === 'bronze_sword')) && await until(B, () => window.__ib.coop.peersHere().some((p) => p.n === 'Alice')), 'both see each other (name, gear) in the same area');
check(await until(A, () => window.__ib.coop.peersHere().some((p) => p.swingT > 0), 8000), "A sees Bob's attack animation");
await B.evaluate(() => window.__ib.coop.say('Nice hit!'));
await sleep(500); await A.screenshot({ path: `${OUT}/ib8-two-players.png` }); await B.screenshot({ path: `${OUT}/ib8-two-players-bob.png` });
check(await G(A, () => document.getElementById('coopTicker').textContent.includes('Nice hit!')), 'chat shows in the scene ticker');
check(await until(A, () => { const g = window.__ib.game; return g.data.stats.kills >= 1; }, 30000) && await until(B, () => window.__ib.game.data.stats.kills >= 1, 8000), 'shared goblin kill credited to both');
const hpSync = await G(A, async () => { const g = window.__ib.game; const e = g.ents.find((x) => x.kind === 'chicken' && !x.dead); g.clearTarget(); g.hitMonster(e, 1); return e.id; });
await G(B, () => window.__ib.game.clearTarget());
check(await until(B, (id) => { const e = window.__ib.game.ent(id); return e && e.hp === e.max - 1; }, 5000, hpSync), 'monster HP is shared between screens');
// room sheet + chat
await openCoop(A); await A.type('#coopMsg', 'Want to trade?'); await A.click('#coopSend');
check(await until(B, () => window.__ib.coop.chat.some((c) => c.x === 'Want to trade?')), 'chat from the room sheet arrives');
await A.screenshot({ path: `${OUT}/ib8-room.png` });
// trade
await G(A, () => { window.__ib.game.addItem('logs', 6); window.__ib.game.addItem('shrimp', 3); }); await G(B, () => { window.__ib.game.data.coins = 500; });
const before = { a: await G(A, () => ({ logs: window.__ib.game.count('logs'), coins: window.__ib.game.data.coins })), b: await G(B, () => ({ logs: window.__ib.game.count('logs'), coins: window.__ib.game.data.coins })) };
await A.click('[data-trade]');
check(await until(B, () => !!document.getElementById('invYes')), 'B gets a trade request'); await B.click('#invYes');
check(await until(A, () => !!document.querySelector('.trade')) && await until(B, () => !!document.querySelector('.trade')), 'two-sided trade window opens for both');
await A.evaluate(() => { const i = window.__ib.game.data.bag.findIndex((s) => s.id === 'logs'); document.querySelector(`[data-off="${i}"]`).click(); });
await sleep(300); await A.evaluate(() => { const i = window.__ib.game.data.bag.findIndex((s) => s.id === 'shrimp'); document.querySelector(`[data-off="${i}"]`).click(); });
await B.evaluate(() => { const i = document.getElementById('tradeCoins'); i.value = '120'; document.getElementById('tradeSetCoins').click(); });
check(await until(B, () => document.querySelectorAll('.tside')[1].querySelectorAll('.cell').length === 2) && await until(A, () => document.querySelectorAll('.tside')[1].textContent.includes('120')), 'offers appear on both sides');
await A.click('#tradeAccept'); check(await until(B, () => document.getElementById('tradeStatus').textContent.includes('accepted')), 'B sees "Other player accepted"');
await sleep(300); await B.screenshot({ path: `${OUT}/ib8-trade.png` }); await A.screenshot({ path: `${OUT}/ib8-trade-alice.png` });
await B.click('#tradeAccept');
check(await until(A, () => !window.__ib.coop.trade) && await until(B, () => !window.__ib.coop.trade), 'trade completes after both confirm');
const after = { a: await G(A, () => ({ logs: window.__ib.game.count('logs'), coins: window.__ib.game.data.coins, shrimp: window.__ib.game.count('shrimp') })), b: await G(B, () => ({ logs: window.__ib.game.count('logs'), coins: window.__ib.game.data.coins, shrimp: window.__ib.game.count('shrimp') })) };
check(after.a.logs === before.a.logs - 6 && after.b.logs === before.b.logs + 6 && after.a.coins === before.a.coins + 120 && after.b.coins === before.b.coins - 120 && after.b.shrimp >= 3, 'items/coins moved exactly once');
// reload -> resume
await B.reload({ waitUntil: 'load' });
check(await until(B, () => window.__ib?.coop?.active && window.__ib.coop.room.code !== undefined, 15000) && await until(A, () => window.__ib.coop.members.every((m) => !m.away)), 'B reloads and rejoins the same room');
check(await until(A, () => window.__ib.coop.peersHere().some((p) => p.n === 'Bob'), 8000), 'B visible again after reconnect');
await openCoop(A); await A.click('#coopLeave');
check(await until(B, () => window.__ib.coop.members.length === 1), 'leaving updates the roster');
check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close(); srv?.kill();
console.log(failed ? `\n${failed} co-op e2e checks FAILED` : '\nco-op e2e passed'); process.exit(failed ? 1 : 0);
