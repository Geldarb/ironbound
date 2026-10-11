// Canvas renderer + input for the side-scrolling area. The model lives in game.js; this only draws and translates taps.
import { AREAS, MONSTERS, NODES, STATIONS, RECIPES, ITEMS } from './data.js';
import { drawHero, drawMonster, drawNode, drawStation, drawSign, drawDecor, drawGround, DECOR, shade } from './art.js';

export const VIEW_H = 360, GROUND = 296;
/** approximate sprite heights (world units) for hit areas, HP bars and the target marker */
export const MON_H = { chicken: 46, cow: 52, goblin: 62, wolf: 54, hill_giant: 112, alpha_wolf: 82 };
/** Camera tuning. ZOOM scales the whole world (1 = old close-up view; <1 shows more of the area). GROUND_FRAC = how far down the scene the walk line sits. */
export const ZOOM = 0.7, ZOOM_MIN = 0.45, ZOOM_MAX = 1.1;
export const GROUND_FRAC = 0.62, GROUND_FRAC_SHEET = 0.36;
const ZKEY = 'ironbound-zoom';
export class Scene {
  constructor(canvas, game, lookIdx = 0) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.g = game; this.t = 0;
    this.floaters = []; this.flash = {}; this.fx = []; this.pending = []; this.ghosts = []; this.nodeHit = {}; this.pose = null; this.k = 1; this.cam = 0; this.last = performance.now();
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
      const top = en.type === 'node' ? 90 : (MON_H[en.kind] || 70) + 20;
      if (dx < tolX && wy > GROUND - top - padY && wy < GROUND + 30 + padY && dx < bd) { best = en; bd = dx; }
    }
    if (best) { this.g.select(best.id); this.last_tap = { id: best.id }; } else this.g.tapGround(wx);
    this.tapMark = { x: wx, t: 0.6, ent: !!best };
  }
  floater(x, text, color, kind = 'text', dy = 0) { this.floaters.push({ x: x + ((this.floaters.length * 37) % 41) - 20, y: GROUND - 90 - dy, text, color, kind, age: 0 }); if (this.floaters.length > 40) this.floaters.shift(); }
  /** particle burst. kinds: chip (wood), stone, spark, splash, crumb, smoke, star */
  burst(x, y, kind, n = 8, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 40 + Math.random() * 90;
      const base = { x, y, vx: Math.cos(a) * v * (kind === 'star' ? 1.3 : 1), vy: Math.sin(a) * v - (kind === 'smoke' ? 70 : 50), life: 0.5 + Math.random() * 0.4, age: 0, kind, color: color || '#fff', size: 2 + Math.random() * 3 };
      if (kind === 'chip') { base.color = ['#b8935c', '#8a5a30', '#d4b27a'][i % 3]; base.vx = (Math.random() - 0.3) * 90; }
      else if (kind === 'stone') { base.color = ['#9a9aa4', '#6d6d75', color || '#c9c9d0'][i % 3]; }
      else if (kind === 'spark') { base.color = ['#ffd34a', '#ff9a2e', '#fff3b0'][i % 3]; base.size = 1.6 + Math.random() * 1.6; }
      else if (kind === 'splash') { base.color = ['#bfe3ff', '#7ec8ff', '#fff'][i % 3]; base.vy = -60 - Math.random() * 70; base.vx *= 0.5; }
      else if (kind === 'crumb') { base.color = ['#e8a35a', '#c9893c', '#fff1c4'][i % 3]; base.size = 1.4 + Math.random() * 1.6; base.vy = -30 - Math.random() * 40; base.vx *= 0.4; }
      else if (kind === 'smoke') { base.color = 'rgba(70,70,70,.8)'; base.size = 4 + Math.random() * 4; base.vx *= 0.3; base.life = 0.9; }
      else if (kind === 'star') { base.color = color || ['#ffd34a', '#ff7a7a', '#7ad0ff', '#9dff8a', '#ffffff'][i % 5]; base.life = 0.9 + Math.random() * 0.4; base.size = 2.4; base.vy = Math.sin(a) * v * 1.1; }
      this.fx.push(base);
    }
    if (this.fx.length > 220) this.fx.splice(0, this.fx.length - 220);
  }
  later(delay, fn) { this.pending.push({ t: delay, fn }); }
  setPose(name, dur, extra = {}) { this.pose = { name, dur, t: 0, ...extra }; }
  onEvent(type, p) {
    const g = this.g, h = g.hero;
    if (type === 'hit') {
      const kind = p.burn ? 'burn' : p.crit ? 'crit' : p.miss ? 'miss' : 'hit';
      this.floaters.push({ x: p.x + (this.floaters.length % 3 - 1) * 8, y: GROUND - (p.who === 'hero' ? 66 : (MON_H[g.ent(p.id)?.kind] || 50) * 0.8), text: String(p.dmg), color: kind, kind: 'splat', age: 0 });
      if (p.who !== 'hero') { this.flash[p.id] = 0.15; if (!p.miss) this.burst(p.x, GROUND - 30, 'spark', 4, '#ffffff'); }
    } else if (type === 'xp') { const hh = this.floaters.filter((f) => f.kind === 'xp' && f.age < 0.5).length; this.floaters.push({ x: p.x + 36, y: GROUND - 96 - hh * 16, text: `+${Math.round(p.amount)}`, sk: p.skill.slice(0, 3), color: '#ff981f', kind: 'xp', age: 0 }); }
    else if (type === 'loot') { const n = this.floaters.filter((f) => f.kind === 'text' && f.age < 0.6).length; this.floater(p.x, `+${p.n} ${p.id.replace(/_/g, ' ')}`, '#fff', 'text', 66 + n * 16); }
    else if (type === 'ep') this.floater(h.x, `+${p.n} EP`, '#d9a6ff', 'text', 40 + (this.floaters.length % 3) * 12);
    else if (type === 'heal') {
      if (p.id === 'lifesteal') this.floaters.push({ x: p.x, y: GROUND - 74, text: String(p.n), color: 'heal', kind: 'splat', age: 0 });
      else { this.floaters.push({ x: p.x, y: GROUND - 74, text: String(p.n), color: 'heal', kind: 'splat', age: 0 }); const it = ITEMS[p.id]; this.setPose('eat', 0.9, { item: it?.art === 'meat' ? 'meat' : 'fish', c: it?.c }); this.later(0.3, () => this.burst(h.x + 10 * h.dir, GROUND - 56, 'crumb', 6)); this.later(0.55, () => this.burst(h.x + 10 * h.dir, GROUND - 56, 'crumb', 5)); }
    } else if (type === 'gatherfail') this.floater(p.x, '...', '#ddd', 'text', 30);
    else if (type === 'swing' && p.gather) {
      const x = p.x, fish = ['net', 'rod', 'harpoon', 'cage'].includes(p.kind);
      this.later(fish ? 0.12 : 0.2, () => {
        this.nodeHit[`${x}`] = 0.25;
        if (p.kind === 'axe') this.burst(x, GROUND - 40, 'chip', 8);
        else if (p.kind === 'pickaxe') { this.burst(x, GROUND - 28, 'stone', 6, NODES[p.node]?.color); this.burst(x, GROUND - 30, 'spark', 4); }
        else if (fish) this.burst(x, GROUND - 4, 'splash', 9);
      });
    } else if (type === 'kill') { const m = MONSTERS[p.kind]; this.ghosts.push({ kind: p.kind, x: p.x, t: 0, dir: p.x > h.x ? -1 : 1, color: m.color, seed: p.x }); this.burst(p.x, GROUND - 24, 'smoke', 5); }
    else if (type === 'die') { this.ghosts.push({ hero: true, x: p.x ?? h.x, t: 0, dir: h.dir }); }
    else if (type === 'level') {
      this.setPose('cheer', 1.0);
      for (let i = 0; i < 4; i++) this.later(i * 0.22, () => this.burst(h.x + (i - 1.5) * 18, GROUND - 120 - (i % 2) * 20, 'star', 16));
      this.floater(h.x, `${p.skill[0].toUpperCase() + p.skill.slice(1)} ${p.level}!`, '#ffe27a', 'text', 34);
    } else if (type === 'craft' || type === 'craftfail') {
      const r = RECIPES.find((x) => x.out === p.id) || RECIPES.find((x) => x.burnt && x.out === p.id);
      if (!r) return;
      if (r.station === 'cook') { const it = ITEMS[r.out]; this.setPose('cook', 1.0, { item: it?.art === 'meat' ? 'meat' : 'fish', c: it?.c }); this.later(0.6, () => type === 'craftfail' ? this.burst(h.x + 36 * h.dir, GROUND - 40, 'smoke', 8) : this.burst(h.x + 36 * h.dir, GROUND - 40, 'spark', 5)); }
      else { this.setPose('smith', 0.9); for (const d of [0.35, 0.7]) this.later(d, () => this.burst(h.x + 36 * h.dir, GROUND - 28, 'spark', 8)); }
    }
  }
  entTop(e) { return e.type === 'monster' ? (MON_H[e.kind] || 60) : e.type === 'node' ? (NODES[e.kind]?.tool === 'pickaxe' ? 52 : ['tree', 'oak'].includes(e.kind) ? 100 : 26) : 110; }
  draw(now = performance.now()) {
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.t += dt;
    const { ctx, g } = this, area = AREAS[g.data.area], aid = g.data.area;
    const k = this.k, W = this.cv.width, H = this.cv.height;
    const want = this.sheetOpen && this.cssH > this.cssW * 0.9 ? GROUND_FRAC_SHEET : GROUND_FRAC;
    this.gf += (want - this.gf) * Math.min(1, dt * 10); if (Math.abs(want - this.gf) < 0.002) this.gf = want; this.setOff();
    this.cam = this.camera();
    // timers
    for (const q of this.pending) q.t -= dt;
    for (const q of this.pending.filter((x) => x.t <= 0)) q.fn();
    this.pending = this.pending.filter((x) => x.t > 0);
    if (this.pose) { this.pose.t += dt; if (this.pose.t >= this.pose.dur) this.pose = null; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, area.sky[0]); sky.addColorStop(1, area.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.translate(0, this.offY);
    // sun + blocky clouds
    if (aid !== 'quarry') { ctx.fillStyle = 'rgba(255,240,170,.55)'; ctx.beginPath(); ctx.arc(this.viewW * 0.8, 70 - this.offY * 0.3, 26, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(255,250,210,.9)'; ctx.beginPath(); ctx.arc(this.viewW * 0.8, 70 - this.offY * 0.3, 18, 0, 6.28); ctx.fill(); }
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 330 - this.cam * 0.12 + this.t * 6) % (this.viewW + 200)) - 100, cy = 40 - this.offY + (i % 3) * 30;
      ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.fillRect(cx, cy, 64, 10); ctx.fillRect(cx + 10, cy - 8, 40, 8); ctx.fillRect(cx - 8, cy + 6, 70, 6);
      ctx.fillStyle = 'rgba(200,215,235,.6)'; ctx.fillRect(cx, cy + 8, 64, 3);
    }
    // parallax hills (jagged ranges in the quarry/peaks), with a tree line in the meadow
    const jag = aid !== 'meadow';
    for (const [layer, sp, amp, base] of [[0, 0.25, 40, 215], [1, 0.5, 28, 250]]) {
      ctx.fillStyle = area.hill[layer]; ctx.beginPath(); ctx.moveTo(0, 2000);
      for (let x = 0; x <= this.viewW + 20; x += jag ? 14 : 20) {
        const wx = x + this.cam * sp; let y = base - Math.sin(wx / (layer ? 90 : 140) + layer * 2) * amp * 0.5 - Math.sin(wx / 47) * amp * 0.2;
        if (jag) y = base - Math.abs(Math.sin(wx / (layer ? 75 : 120) + layer)) * amp * (aid === 'peaks' ? 1.9 : 1.2) - Math.sin(wx / 31) * 4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(this.viewW + 20, 2000); ctx.closePath(); ctx.fill();
    }
    if (aid === 'meadow') { ctx.fillStyle = shade(area.hill[1], 0.8); for (let i = Math.floor(this.cam * 0.5 / 38) - 1; i < Math.floor((this.cam * 0.5 + this.viewW) / 38) + 2; i++) { const hx = i * 38 - this.cam * 0.5 + (i % 3) * 7, hh = 8 + ((i * 7) % 6); ctx.beginPath(); ctx.arc(hx, 236 - Math.sin((hx + this.cam * 0.5) / 90 + 2) * 14 - hh * 0.3, 9 + hh * 0.4, 0, 6.28); ctx.fill(); } }
    // ground: grass tiles, path
    drawGround(ctx, area, this.cam, this.viewW, GROUND, 2000, this.t, aid);
    ctx.translate(-this.cam, 0); // (offY already applied)
    for (const d of DECOR[aid] || []) { const x1 = d[0] === 'fence' ? d[2] : d[1]; if (x1 < this.cam - 120 || d[1] > this.cam + this.viewW + 120) continue; drawDecor(ctx, d, GROUND - 2, this.t); }
    // entities
    const sorted = [...g.ents].sort((a, b) => a.x - b.x);
    const tgt = g.targetEnt, h = g.hero;
    for (const e of sorted) {
      if (e.x < this.cam - 120 || e.x > this.cam + this.viewW + 120) continue;
      if (e.type === 'node') { const n = NODES[e.kind]; drawNode(ctx, e.kind, e.x, GROUND, 1.05, e.dead > 0, n.color, this.t, this.nodeHit[`${e.x}`] || 0); }
      else if (e.type === 'station') { drawStation(ctx, e.kind, e.x, GROUND, 1.1, this.t); this.label(e.x, STATIONS[e.kind].short || STATIONS[e.kind].name); }
      else if (e.type === 'sign') { drawSign(ctx, e.x, GROUND, 1, AREAS[e.kind].name.split(' ').pop(), this.t, e.x < AREAS[aid].width / 2); }
      else if (e.type === 'monster') {
        if (e.dead > 0) continue;
        const m = MONSTERS[e.kind];
        drawMonster(ctx, e.kind, e.x, GROUND, 1.05, { dir: e.x > h.x ? -1 : 1, t: this.t, hit: this.flash[e.id] || 0, color: m.color, swing: e.swing > 0 ? 1 - e.swing / 0.3 : null, seed: e.x });
        if (e.hp < e.max || tgt === e) { this.bar(e.x, GROUND - this.entTop(e) - 14, 44, e.hp / e.max); if (m.boss) this.boss(e.x, GROUND - this.entTop(e) - 26, m.name); }
      }
      if (tgt === e) this.ring(e);
    }
    // ghosts (death animations)
    for (const gh of this.ghosts) {
      gh.t += dt; const u = gh.t / 0.8; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - u);
      ctx.translate(gh.x, GROUND); ctx.rotate(gh.dir * -1.4 * Math.min(1, u * 1.6) * (gh.hero ? 1 : 1)); ctx.translate(-gh.x, -GROUND);
      if (gh.hero) drawHero(ctx, gh.x, GROUND, 1.05, { look: this.look, equip: g.data.equip, dir: gh.dir, state: 'idle', t: 0 });
      else drawMonster(ctx, gh.kind, gh.x, GROUND, 1.05, { dir: gh.dir, t: 0, color: gh.color, seed: gh.seed });
      ctx.restore();
    }
    this.ghosts = this.ghosts.filter((x) => x.t < 0.8);
    // hero
    const tn = tgt?.type === 'node' ? NODES[tgt.kind] : null, hc = g.combat;
    const swingP = h.swing > 0 && h.swingDur ? 1 - h.swing / h.swingDur : null;
    const toolInfo = tn ? g.toolInfo(tn.tool) : null;
    const pose = this.pose ? { name: this.pose.name, p: this.pose.t / this.pose.dur, item: this.pose.item, c: this.pose.c } : null;
    drawHero(ctx, h.x, GROUND, 1.05, { look: this.look, equip: g.data.equip, dir: h.dir, state: pose ? 'idle' : h.state, t: this.t, tool: tn ? tn.tool : null, toolId: toolInfo?.item.id, swingP: pose ? null : swingP, atkType: hc.type, two: hc.two, hurt: h.hurt, pose, aim: tgt ? Math.max(30, Math.abs(tgt.x - h.x) * h.dir * 1 + 4) * (tgt.x >= h.x ? 1 : 1) : 60 });
    const inFight = h.state === 'attack' || h.hurt > 0 || g.data.hp < g.maxHp;
    if (inFight) this.bar(h.x, GROUND - 92, 46, g.data.hp / g.maxHp);
    if (this.tapMark && this.tapMark.t > 0 && !this.tapMark.ent) { this.tapMark.t -= dt; ctx.strokeStyle = `rgba(255,255,255,${this.tapMark.t})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(this.tapMark.x, GROUND + 6, 16 * (1.6 - this.tapMark.t), 6 * (1.6 - this.tapMark.t), 0, 0, 6.28); ctx.stroke(); }
    // particles
    for (const q of this.fx) {
      q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.kind === 'smoke' ? -10 : q.kind === 'star' ? 90 : 260) * dt;
      const a = Math.max(0, 1 - q.age / q.life); ctx.globalAlpha = a; ctx.fillStyle = q.color;
      if (q.kind === 'smoke') { ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1 + q.age), 0, 6.28); ctx.fill(); }
      else if (q.kind === 'star') { ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); ctx.fillRect(q.x - q.size * 1.2, q.y - 0.5, q.size * 2.4, 1); ctx.fillRect(q.x - 0.5, q.y - q.size * 1.2, 1, q.size * 2.4); }
      else ctx.fillRect(q.x, q.y, q.size, q.size);
    }
    ctx.globalAlpha = 1; this.fx = this.fx.filter((q) => q.age < q.life);
    // floaters
    ctx.textAlign = 'center';
    const kc = this.kc;
    for (const f of this.floaters) {
      f.age += dt; const a = Math.max(0, 1 - f.age / 1.3);
      const y = f.y - f.age * (f.kind === 'splat' ? 14 : 30);
      ctx.globalAlpha = a;
      if (f.kind === 'splat') this.hitsplat(f.x, y, f.text, f.color);
      else if (f.kind === 'xp') { ctx.font = `bold ${14 / kc}px system-ui,sans-serif`; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 3.4 / kc; ctx.strokeStyle = 'rgba(20,12,4,.9)'; const t1 = f.text; ctx.strokeText(t1, f.x, y); ctx.fillStyle = f.color; ctx.fillText(t1, f.x, y); ctx.font = `bold ${10 / kc}px system-ui,sans-serif`; ctx.strokeText(f.sk, f.x, y + 11 / kc); ctx.fillStyle = '#ffe2b0'; ctx.fillText(f.sk, f.x, y + 11 / kc); }
      else { ctx.font = `bold ${13 / kc}px system-ui,sans-serif`; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 3 / kc; ctx.strokeStyle = 'rgba(30,20,40,.8)'; ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, y); }
    }
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    this.floaters = this.floaters.filter((f) => f.age < 1.3);
    for (const id in this.flash) { this.flash[id] -= dt; if (this.flash[id] <= 0) delete this.flash[id]; }
    for (const id in this.nodeHit) { this.nodeHit[id] -= dt; if (this.nodeHit[id] <= 0) delete this.nodeHit[id]; }
  }
  /** RuneScape-style hitsplat: a spiky coloured burst with the number inside (blue = miss) */
  hitsplat(x, y, text, kind) {
    const { ctx } = this, kc = this.kc, r = Math.max(11, 13 / kc * 1.0);
    const col = { hit: ['#d4231c', '#7a0f0a'], miss: ['#3b78d8', '#1a3a7a'], crit: ['#f0a010', '#8a5200'], burn: ['#ff7a1e', '#7a2a00'], heal: ['#2fa84a', '#14501f'] }[kind] || ['#d4231c', '#7a0f0a'];
    ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.2832, rr = i % 2 ? r * 0.82 : r * 1.12; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92); } ctx.closePath();
    ctx.fillStyle = col[0]; ctx.fill(); ctx.lineWidth = 2 / kc * 1.1; ctx.strokeStyle = col[1]; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.45, r * 0.25, -0.5, 0, 6.28); ctx.fill();
    ctx.font = `bold ${14 / kc}px system-ui,sans-serif`; ctx.textBaseline = 'middle'; ctx.lineWidth = 3 / kc; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(text, x, y + 1 / kc); ctx.fillStyle = '#fff'; ctx.fillText(text, x, y + 1 / kc);
  }
  label(x, text) { const { ctx } = this, k = this.kc; ctx.font = `bold ${12 / k}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3 / k; ctx.strokeStyle = 'rgba(30,20,40,.75)'; ctx.strokeText(text, x, GROUND + 6 + 12 / k); ctx.fillStyle = '#fff'; ctx.fillText(text, x, GROUND + 6 + 12 / k); }
  /** RS-style health bar: green over red, black border */
  bar(x, y, w, f) { const { ctx } = this; ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 - 1.5, y - 1.5, w + 3, 9); ctx.fillStyle = '#c0261c'; ctx.fillRect(x - w / 2, y, w, 6); ctx.fillStyle = '#1fb62b'; ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, f)), 6); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, f)), 2); }
  boss(x, y, name) { const { ctx } = this, k = this.kc; ctx.font = `bold ${11 / k}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3 / k; ctx.strokeStyle = 'rgba(30,20,40,.85)'; ctx.strokeText(`BOSS · ${name}`, x, y); ctx.fillStyle = '#ff9d2e'; ctx.fillText(`BOSS · ${name}`, x, y); }
  ring(e) {
    const { ctx } = this; const by = Math.sin(this.t * 6) * 3;
    ctx.fillStyle = '#ffe27a'; ctx.strokeStyle = '#2b2233'; ctx.lineWidth = 2;
    const top = this.entTop(e) + (e.type === 'monster' ? 40 : 22);
    ctx.beginPath(); ctx.moveTo(e.x, GROUND - top + by + 10); ctx.lineTo(e.x - 8, GROUND - top + by - 4); ctx.lineTo(e.x + 8, GROUND - top + by - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
