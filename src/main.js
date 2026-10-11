import { newData, loadSave, writeSave, clearSave, LOOKS } from './save.js';
import { Game } from './game.js';
import { Scene } from './scene.js';
import { UI } from './ui.js';
import { drawHero } from './art.js';
import { $ } from './dom.js';

let game = null, scene = null, ui = null, raf = 0, saveT = 0;

function start(data) {
  game = new Game(data);
  const cv = $('cv');
  if (!scene) {
    scene = new Scene(cv, game, data.look);
    window.addEventListener('resize', () => scene.resize());
    new ResizeObserver(() => scene.resize()).observe(cv);
  } else { scene.g = game; scene.look = data.look; scene.floaters = []; }
  ui = new UI(game, resetCharacter); ui.onSheet = (o) => { scene.sheetOpen = o; };
  game.on((t, p) => { scene.onEvent(t, p); if (t === 'level' || t === 'die' || t === 'area') writeSave(game.data); });
  window.__ib = { game, scene, ui };
  $('create').hidden = true;
  scene.resize();
  ui.updateTarget();
  let last = performance.now();
  cancelAnimationFrame(raf);
  const loop = (now) => {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    game.update(dt); scene.draw(now); ui.tick(dt);
    saveT += dt; game.data.stats.played += dt;
    if (saveT > 5) { saveT = 0; writeSave(game.data); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}
function resetCharacter() { cancelAnimationFrame(raf); clearSave(); window.__ib = null; showCreate(); }

function showCreate() {
  const box = $('create'); box.hidden = false;
  let look = 0;
  const pv = $('preview'), ctx = pv.getContext('2d'); let t = 0, pr = 0;
  const looks = $('looks'); looks.innerHTML = '';
  const redraw = () => { looks.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === look)); };
  LOOKS.forEach((L, i) => { const b = document.createElement('button'); b.style.background = `linear-gradient(135deg,${L.skin} 50%,${L.shirt} 50%)`; b.setAttribute('aria-label', `Look ${i + 1}`); b.onclick = () => { look = i; redraw(); }; looks.appendChild(b); });
  redraw();
  cancelAnimationFrame(pr);
  const anim = () => { t += 0.016; ctx.clearRect(0, 0, 160, 170); drawHero(ctx, 80, 150, 1.7, { look, state: 'idle', t, dir: 1, equip: {} }); if (!box.hidden) pr = requestAnimationFrame(anim); };
  anim();
  $('beginBtn').onclick = () => {
    const name = $('nameIn').value.trim();
    if (!name) { $('nameIn').focus(); $('nameIn').style.borderColor = '#e0463c'; return; }
    const data = newData(name, look); writeSave(data); start(data);
  };
}

const saved = loadSave();
if (saved) start(saved); else showCreate();
window.addEventListener('pagehide', () => { if (game) writeSave(game.data); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game) writeSave(game.data); });
