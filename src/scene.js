// Canvas renderer + input for the side-scrolling area. The model lives in game.js; this only draws and translates taps.
import { AREAS, MONSTERS, NODES, STATIONS } from './data.js';
import { drawHero, drawMonster, drawNode, drawStation, drawSign, shade } from './art.js';

export const VIEW_H = 360, GROUND = 296;
/** Camera tuning. ZOOM scales the whole world (1 = old close-up view; <1 shows more of the area). GROUND_FRAC = how far down the scene the walk line sits. */
export const ZOOM = 0.7, ZOOM_MIN = 0.45, ZOOM_MAX = 1.1;
export const GROUND_FRAC = 0.62, GROUND_FRAC_SHEET = 0.36;
const ZKEY = 'ironbound-zoom';
export class Scene {
  constructor(canvas, game, lookIdx = 0) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.g = game; this.t = 0;
    this.floaters = []; this.flash = {}; this.k = 1; this.cam = 0; this.last = performance.now();
    this.look = lookIdx;
    let z = ZOOM; try { const v = parseFloat(localStorage.getItem(ZKEY)); if (v >= ZOOM_MIN && v <= ZOOM_MAX) z = v; } catch { /* ignore */ }
    this.zoom = z;
    canvas.addEventListener('pointerup', (e) => this.tap(e));
    this.resize();
  }
  setZoom(z) { this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * 100) / 100)); try { localStorage.setItem(ZKEY, String(this.zoom)); } catch { /* ignore */ } this.resize(); return this.zoom; }
  resize() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.max(1, Math.round(r.width * dpr)); this.cv.height = Math.max(1, Math.round(r.height * dpr));
    this.dpr = dpr; this.cssW = r.width; this.cssH = r.height;
    const kc = Math.max(0.3, Math.min(r.width / 250, r.height / 270) * this.zoom); // css px per world unit
    this.kc = kc; this.k = kc * dpr; this.viewW = r.width / kc;
    this.gf = this.gf ?? GROUND_FRAC; this.setOff();
  }
  /** world y shift so the ground sits at fraction gf of the scene (raised while a bottom sheet is open in portrait) */
  setOff() { this.offY = (this.cssH * this.gf) / this.kc - GROUND; }
  camera() { const w = AREAS[this.g.data.area].width; return Math.max(0, Math.min(w - this.viewW, this.g.hero.x - this.viewW / 2)); }
  tap(e) {
    const r = this.cv.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const k = this.kc, wx = this.cam + px / k, wy = py / k - this.offY;
    let best = null, bd = 1e9;
    const tolX = Math.max(34, 30 / k); // >= ~60px wide hit area on screen
    const padY = 22 / k;
    for (const en of this.g.ents) {
      const dx = Math.abs(en.x - wx);
      const top = en.type === 'node' ? 90 : 100;
      if (dx < tolX && wy > GROUND - top - padY && wy < GROUND + 30 + padY && dx < bd) { best = en; bd = dx; }
    }
    if (best) { this.g.select(best.id); this.last_tap = { id: best.id }; } else this.g.tapGround(wx);
    this.tapMark = { x: wx, t: 0.6, ent: !!best };
  }
  floater(x, text, color, kind = 'text', dy = 0) { this.floaters.push({ x: x + ((this.floaters.length * 37) % 41) - 20, y: GROUND - 90 - dy, text, color, kind, age: 0 }); if (this.floaters.length > 40) this.floaters.shift(); }
  onEvent(type, p) {
    if (type === 'hit') {
      const m = p.who === 'hero';
      this.floaters.push({ x: p.x + (m ? 0 : 0), y: GROUND - 78, text: String(p.dmg), color: p.miss ? '#4aa3ff' : '#e0463c', kind: 'splat', age: 0 });
      if (!m) this.flash[p.id] = 0.15;
    } else if (type === 'xp') this.floater(p.x, `+${Math.round(p.amount)} ${p.skill.slice(0, 3)}`, '#ffe27a', 'text', 6 + (this.floaters.length % 3) * 14);
    else if (type === 'loot') this.floater(p.x, `+${p.n} ${p.id.replace(/_/g, ' ')}`, '#fff', 'text', 66);
    else if (type === 'gatherfail') this.floater(p.x, '...', '#ddd', 'text', 30);
  }
  draw(now = performance.now()) {
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.t += dt;
    const { ctx, g } = this, area = AREAS[g.data.area];
    const k = this.k, W = this.cv.width, H = this.cv.height;
    const want = this.sheetOpen && this.cssH > this.cssW * 0.9 ? GROUND_FRAC_SHEET : GROUND_FRAC;
    this.gf += (want - this.gf) * Math.min(1, dt * 10); if (Math.abs(want - this.gf) < 0.002) this.gf = want; this.setOff();
    this.cam = this.camera();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, area.sky[0]); sky.addColorStop(1, area.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.translate(0, this.offY);
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < 5; i++) { const cx = ((i * 330 - this.cam * 0.12 + this.t * 6) % (this.viewW + 200)) - 100; ctx.beginPath(); ctx.ellipse(cx, 40 - this.offY + (i % 3) * 30, 50, 16, 0, 0, 6.28); ctx.ellipse(cx + 26, 32 - this.offY + (i % 3) * 30, 34, 14, 0, 0, 6.28); ctx.fill(); }
    // parallax hills
    for (const [layer, sp, amp, base] of [[0, 0.25, 40, 215], [1, 0.5, 28, 250]]) {
      ctx.fillStyle = area.hill[layer]; ctx.beginPath(); ctx.moveTo(0, 2000);
      for (let x = 0; x <= this.viewW + 20; x += 20) { const wx = x + this.cam * sp; ctx.lineTo(x, base - Math.sin(wx / (layer ? 90 : 140) + layer * 2) * amp * 0.5 - Math.sin(wx / 47) * amp * 0.2); }
      ctx.lineTo(this.viewW + 20, 2000); ctx.closePath(); ctx.fill();
    }
    // ground
    ctx.fillStyle = area.ground; ctx.fillRect(0, GROUND - 6, this.viewW, 2000);
    ctx.fillStyle = shade(area.ground, 1.12); ctx.fillRect(0, GROUND - 6, this.viewW, 5);
    const rows = Math.ceil((this.cssH * (1 - this.gf)) / this.kc / 24) + 1;
    for (let r = 0; r < rows; r++) {
      const y = GROUND + 14 + r * 24, step = 46 + r * 6;
      ctx.fillStyle = shade(area.ground, r % 2 ? 0.88 : 0.8);
      for (let i = Math.floor(this.cam / step) - 1; i < Math.floor((this.cam + this.viewW) / step) + 2; i++) {
        const h = (i * 2654435761 + r * 40503) >>> 0, x = i * step + (h % 30) - this.cam, yy = y + ((h >> 5) % 8);
        if (h % 3 === 0) { ctx.fillRect(x, yy, 16, 3); } else if (h % 3 === 1) { ctx.fillRect(x, yy - 4, 2, 5); ctx.fillRect(x + 4, yy - 6, 2, 7); ctx.fillRect(x + 8, yy - 3, 2, 4); } else { ctx.beginPath(); ctx.ellipse(x, yy, 5, 3, 0, 0, 6.28); ctx.fill(); }
      }
    }
    ctx.translate(-this.cam, 0); // (offY already applied)
    // entities
    const sorted = [...g.ents].sort((a, b) => a.x - b.x);
    const tgt = g.targetEnt;
    for (const e of sorted) {
      if (e.x < this.cam - 90 || e.x > this.cam + this.viewW + 90) continue;
      if (e.type === 'node') { const n = NODES[e.kind]; drawNode(ctx, e.kind, e.x, GROUND, 1.05, e.dead > 0, n.color); }
      else if (e.type === 'station') { drawStation(ctx, e.kind, e.x, GROUND, 1.1, this.t); this.label(e.x, STATIONS[e.kind].name); }
      else if (e.type === 'sign') { drawSign(ctx, e.x, GROUND, 1, AREAS[e.kind].name.split(' ').pop(), this.t, e.kind === 'meadow'); }
      else if (e.type === 'monster') {
        if (e.dead > 0) continue;
        const m = MONSTERS[e.kind];
        drawMonster(ctx, e.kind, e.x, GROUND, 1.05, { dir: e.x > g.hero.x ? -1 : 1, t: this.t, hit: this.flash[e.id] || 0, color: m.color });
        if (e.hp < e.max || tgt === e) this.bar(e.x, GROUND - 82, 44, e.hp / e.max, '#e0463c');
      }
      if (tgt === e) this.ring(e);
    }
    // hero
    const h = g.hero;
    const tn = tgt?.type === 'node' ? NODES[tgt.kind] : null;
    drawHero(ctx, h.x, GROUND, 1.05, { look: this.look, equip: g.data.equip, dir: h.dir, state: h.state, t: this.t, tool: tn ? tn.tool : null });
    this.bar(h.x, GROUND - 92, 46, g.data.hp / g.maxHp, '#3fb950');
    if (this.tapMark && this.tapMark.t > 0 && !this.tapMark.ent) { this.tapMark.t -= dt; ctx.strokeStyle = `rgba(255,255,255,${this.tapMark.t})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(this.tapMark.x, GROUND + 6, 16 * (1.6 - this.tapMark.t), 6 * (1.6 - this.tapMark.t), 0, 0, 6.28); ctx.stroke(); }
    // floaters
    ctx.textAlign = 'center';
    for (const f of this.floaters) {
      f.age += dt; const a = Math.max(0, 1 - f.age / 1.3);
      const y = f.y - f.age * 30;
      if (f.kind === 'splat') {
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(f.x, y, 12 / this.kc, 0, 6.28); ctx.fillStyle = f.color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `bold ${14 / this.kc}px system-ui,sans-serif`; ctx.textBaseline = 'middle'; ctx.fillText(f.text, f.x, y + 1);
      } else {
        ctx.globalAlpha = a; ctx.font = `bold ${13 / this.kc}px system-ui,sans-serif`; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 3 / this.kc; ctx.strokeStyle = 'rgba(30,20,40,.8)'; ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, y);
      }
    }
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    this.floaters = this.floaters.filter((f) => f.age < 1.3);
    for (const id in this.flash) { this.flash[id] -= dt; if (this.flash[id] <= 0) delete this.flash[id]; }
  }
  label(x, text) { const { ctx } = this, k = this.kc; ctx.font = `bold ${12 / k}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3 / k; ctx.strokeStyle = 'rgba(30,20,40,.75)'; ctx.strokeText(text, x, GROUND + 6 + 12 / k); ctx.fillStyle = '#fff'; ctx.fillText(text, x, GROUND + 6 + 12 / k); }
  bar(x, y, w, f, c) { const { ctx } = this; ctx.fillStyle = 'rgba(30,20,40,.8)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 8); ctx.fillStyle = '#5b1d1d'; ctx.fillRect(x - w / 2, y, w, 6); ctx.fillStyle = c; ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, f)), 6); }
  ring(e) {
    const { ctx } = this; const by = Math.sin(this.t * 6) * 3;
    ctx.fillStyle = '#ffe27a'; ctx.strokeStyle = '#2b2233'; ctx.lineWidth = 2;
    const top = e.type === 'node' ? 118 : e.type === 'monster' ? 98 : 110;
    ctx.beginPath(); ctx.moveTo(e.x, GROUND - top + by + 10); ctx.lineTo(e.x - 8, GROUND - top + by - 4); ctx.lineTo(e.x + 8, GROUND - top + by - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
