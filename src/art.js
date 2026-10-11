// Procedural cartoon art (canvas 2D, no image assets). Everything is drawn with origin at the feet, 1 unit = 1px at scale 1.
import { ITEMS, TIERS } from './data.js';
import { LOOKS } from './save.js';

const OUT = '#2b2233';
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
export function circle(ctx, x, y, r, fill, stroke = OUT, lw = 2) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function ellipse(ctx, x, y, rx, ry, fill, stroke = OUT, lw = 2) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function rrect(ctx, x, y, w, h, r, fill, stroke = OUT, lw = 2) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function poly(ctx, pts, fill, stroke = OUT, lw = 2) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }

// ---- gear / tool glyphs, drawn around (0,0), pointing up, ~40 units tall. Used for icons and in the hero's hand.
export function drawGlyph(ctx, art, c = '#aab3bf', d = '#5f6875') {
  switch (art) {
    case 'dagger': poly(ctx, [[-4, 6], [-4, -14], [0, -22], [4, -14], [4, 6]], c, OUT); rrect(ctx, -9, 6, 18, 5, 2, d); rrect(ctx, -3, 11, 6, 9, 2, '#7a4a28'); break;
    case 'sword': poly(ctx, [[-4, 8], [-4, -22], [0, -30], [4, -22], [4, 8]], c, OUT); rrect(ctx, -11, 8, 22, 5, 2, d); rrect(ctx, -3, 13, 6, 10, 2, '#7a4a28'); break;
    case 'helm': ctx.beginPath(); ctx.arc(0, 2, 15, Math.PI, 0); ctx.lineTo(15, 12); ctx.lineTo(-15, 12); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); rrect(ctx, -3, 2, 6, 12, 2, d); break;
    case 'shield': poly(ctx, [[-14, -14], [14, -14], [14, 4], [0, 20], [-14, 4]], c, OUT); poly(ctx, [[-8, -8], [8, -8], [8, 2], [0, 12], [-8, 2]], d, null); circle(ctx, 0, -2, 3, '#f1d77a'); break;
    case 'body': poly(ctx, [[-14, -14], [-6, -17], [6, -17], [14, -14], [18, -4], [11, -1], [11, 17], [-11, 17], [-11, -1], [-18, -4]], c, OUT); rrect(ctx, -11, 9, 22, 4, 1, d, null); break;
    case 'legs': rrect(ctx, -12, -16, 24, 8, 2, d); rrect(ctx, -12, -10, 11, 28, 3, c); rrect(ctx, 1, -10, 11, 28, 3, c); break;
    case 'pickaxe': rrect(ctx, -2, -18, 4, 40, 2, '#8a5a30'); ctx.beginPath(); ctx.moveTo(-20, -8); ctx.quadraticCurveTo(0, -26, 20, -8); ctx.lineTo(17, -4); ctx.quadraticCurveTo(0, -17, -17, -4); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); break;
    case 'axe': rrect(ctx, -2, -18, 4, 40, 2, '#8a5a30'); poly(ctx, [[2, -18], [18, -22], [20, -4], [2, -6]], c, OUT); break;
    case 'hammer': rrect(ctx, -2, -8, 4, 30, 2, '#8a5a30'); rrect(ctx, -12, -18, 24, 12, 3, c); break;
    case 'ore': poly(ctx, [[-14, 10], [-16, -2], [-6, -14], [8, -12], [16, -2], [12, 10]], '#7b7b86'); circle(ctx, -5, -2, 4, c, null); circle(ctx, 6, 0, 3.5, c, null); circle(ctx, 0, 6, 3, c, null); break;
    case 'bar': poly(ctx, [[-16, 8], [-10, -6], [14, -6], [18, 8]], c, OUT); poly(ctx, [[-10, -6], [14, -6], [12, -10], [-6, -10]], shade(c, 1.25), OUT); break;
    case 'log': rrect(ctx, -17, -7, 34, 15, 6, c); ellipse(ctx, 17, 0.5, 4, 7.5, shade(c, 1.35)); ctx.strokeStyle = shade(c, 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(8, -2); ctx.moveTo(-12, 3); ctx.lineTo(6, 3); ctx.stroke(); break;
    case 'bones': ctx.save(); ctx.rotate(-0.6); rrect(ctx, -16, -3, 32, 6, 3, c); circle(ctx, -17, -3, 4, c); circle(ctx, -17, 3, 4, c); circle(ctx, 17, -3, 4, c); circle(ctx, 17, 3, 4, c); ctx.restore(); break;
    case 'feather': ctx.beginPath(); ctx.ellipse(0, 0, 6, 17, 0.6, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); break;
    case 'pelt': ellipse(ctx, 0, 0, 17, 11, c); ellipse(ctx, 0, 0, 9, 5, shade(c, 1.2), null); break;
    case 'coins': for (const [x, y] of [[-8, 6], [6, 6], [-1, -3]]) { ellipse(ctx, x, y, 10, 5, '#f7c948'); ellipse(ctx, x, y - 2, 10, 5, '#ffe27a'); } break;
    case 'fish': ctx.save(); ctx.rotate(-0.35); ellipse(ctx, 0, 0, 17, 9, c); poly(ctx, [[14, 0], [26, -9], [26, 9]], shade(c, 0.85)); circle(ctx, -9, -2, 2, OUT, null); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-1, 0, 7, -1, 1); ctx.stroke(); ctx.restore(); break;
    case 'meat': ctx.save(); ctx.rotate(-0.5); rrect(ctx, 6, -3, 20, 6, 3, '#f3ead2'); circle(ctx, 27, -3, 4, '#f3ead2'); circle(ctx, 27, 3, 4, '#f3ead2'); ellipse(ctx, -2, 0, 17, 12, c); ellipse(ctx, -5, -3, 7, 4, shade(c, 1.25), null); ctx.restore(); break;
    case 'net': ctx.save(); ctx.translate(0, -10); circle(ctx, 0, 0, 14, 'rgba(240,230,200,.35)', '#8a5a30', 3); ctx.strokeStyle = '#d8cfae'; ctx.lineWidth = 1; for (let i = -10; i <= 10; i += 5) { ctx.beginPath(); ctx.moveTo(i, -9); ctx.lineTo(i, 9); ctx.moveTo(-9, i); ctx.lineTo(9, i); ctx.stroke(); } ctx.restore(); rrect(ctx, -2, 4, 4, 22, 2, '#8a5a30'); break;
    case 'rod': ctx.save(); ctx.rotate(0.35); rrect(ctx, -2, -26, 4, 54, 2, '#8a5a30'); ctx.restore(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, -26); ctx.lineTo(-9, 4); ctx.stroke(); circle(ctx, -9, 6, 3, '#d8453c'); break;
    case 'harpoon': rrect(ctx, -2, -20, 4, 48, 2, '#8a5a30'); poly(ctx, [[0, -32], [-7, -18], [7, -18]], c); rrect(ctx, -9, -20, 18, 3, 1, c); break;
    case 'pot': ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, 6.2832); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); ctx.strokeStyle = shade(c, 0.6); ctx.lineWidth = 1.5; for (let i = -10; i <= 10; i += 5) { ctx.beginPath(); ctx.moveTo(i, -9); ctx.lineTo(i, 9); ctx.stroke(); } ellipse(ctx, 0, -8, 7, 3, '#2b2233', null); break;
    default: rrect(ctx, -10, -10, 20, 20, 4, '#999');
  }
}
const iconCache = new Map();
/** data-URL icon for an item id (cached), 48x48 */
export function iconURL(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const it = ITEMS[id];
  if (typeof document === 'undefined' || !it) return '';
  const cv = document.createElement('canvas'); cv.width = cv.height = 48;
  const ctx = cv.getContext('2d');
  ctx.translate(24, 24); ctx.scale(0.8, 0.8);
  if (it.art === 'dagger' || it.art === 'sword') { ctx.rotate(0.6); ctx.translate(0, it.art === 'sword' ? 0 : -1); }
  drawGlyph(ctx, it.art, it.c, it.d || shade(it.c || '#999999', 0.55));
  const url = cv.toDataURL();
  iconCache.set(id, url);
  return url;
}

// ---- characters
export function drawHero(ctx, x, y, s, o) {
  const { look = 0, equip = {}, dir = 1, state = 'idle', t = 0, tool = null } = o;
  const L = LOOKS[look % LOOKS.length];
  const walk = state === 'walk';
  const bob = walk ? Math.abs(Math.sin(t * 10)) * 3 : Math.sin(t * 2) * 1;
  const tierC = (id, k = 1) => (ITEMS[id] ? shade(ITEMS[id].c, k) : null);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  ellipse(ctx, 0, 0, 16, 4.5, 'rgba(0,0,0,.22)', null);
  const legSwing = walk ? Math.sin(t * 10) * 6 : 0;
  const pants = tierC(equip.legs, 0.95) || '#4a4f66';
  rrect(ctx, -9 - legSwing * 0.5, -22 + bob * 0.2, 8, 22, 3, pants); rrect(ctx, 1 + legSwing * 0.5, -22 + bob * 0.2, 8, 22, 3, pants);
  const shirt = tierC(equip.body, 1) || L.shirt;
  ctx.translate(0, -bob);
  rrect(ctx, -12, -48, 24, 28, 7, shirt);
  if (equip.body) rrect(ctx, -12, -30, 24, 4, 1, shade(ITEMS[equip.body].c, 0.6), null);
  // back arm + shield
  rrect(ctx, -17, -46, 7, 20, 3.5, L.skin);
  if (equip.shield) { ctx.save(); ctx.translate(-16, -34); ctx.scale(0.75, 0.75); drawGlyph(ctx, 'shield', ITEMS[equip.shield].c, ITEMS[equip.shield].d); ctx.restore(); }
  // head
  circle(ctx, 0, -60, 13, L.skin);
  ctx.beginPath(); ctx.arc(0, -63, 13.5, Math.PI * 1.02, Math.PI * 1.98); ctx.fillStyle = L.hair; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  circle(ctx, 5, -59, 2, OUT, null); circle(ctx, 4.6, -59.6, 0.7, '#fff', null);
  if (equip.head) { ctx.save(); ctx.translate(0, -63); ctx.scale(0.95, 0.95); drawGlyph(ctx, 'helm', ITEMS[equip.head].c, ITEMS[equip.head].d); ctx.restore(); }
  // front arm with weapon / tool
  let ang = walk ? Math.sin(t * 10) * 0.4 : 0.15;
  if (state === 'attack') ang = -0.4 + Math.sin(t * 9) * 1.1;
  if (state === 'gather') ang = -0.6 + Math.sin(t * 7) * 1.3;
  ctx.save(); ctx.translate(9, -44); ctx.rotate(-ang * 0.6);
  rrect(ctx, -3, -2, 7, 20, 3.5, L.skin);
  ctx.translate(1, 18); ctx.rotate(-1.2 + (state === 'attack' || state === 'gather' ? ang : 0)); ctx.scale(0.8, 0.8);
  const wep = state === 'gather' ? null : ITEMS[equip.weapon];
  if (state === 'gather' && tool) drawGlyph(ctx, tool === 'cage' ? 'pot' : tool, '#c9a46a');
  else if (wep) drawGlyph(ctx, wep.art, wep.c, wep.d);
  ctx.restore();
  ctx.restore();
}
export function drawMonster(ctx, kind, x, y, s, o) {
  const { dir = -1, t = 0, hit = 0, color = '#999' } = o;
  const bob = Math.sin(t * 5 + x) * 1.5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  ellipse(ctx, 0, 0, 18, 4.5, 'rgba(0,0,0,.22)', null);
  if (hit > 0) ctx.translate((Math.random() - 0.5) * 3, 0);
  if (kind === 'chicken') {
    rrect(ctx, -2, -12, 2.5, 12, 1, '#e8a33a'); rrect(ctx, 5, -12, 2.5, 12, 1, '#e8a33a');
    ellipse(ctx, 0, -20 - bob, 15, 11, '#fff'); poly(ctx, [[-14, -22 - bob], [-22, -30 - bob], [-17, -17 - bob]], '#f1ece0');
    circle(ctx, 12, -31 - bob, 7, '#fff'); poly(ctx, [[17, -32 - bob], [24, -30 - bob], [17, -28 - bob]], '#f5a623'); circle(ctx, 14, -33 - bob, 1.6, OUT, null);
    poly(ctx, [[8, -38 - bob], [12, -43 - bob], [14, -38 - bob]], '#e0463c');
  } else if (kind === 'goblin') {
    rrect(ctx, -9, -16, 7, 16, 3, '#4c8f36'); rrect(ctx, 2, -16, 7, 16, 3, '#4c8f36');
    rrect(ctx, -11, -40 - bob, 22, 26, 7, '#8a5a30'); circle(ctx, 0, -50 - bob, 12, color);
    poly(ctx, [[-10, -52 - bob], [-24, -58 - bob], [-10, -46 - bob]], color); poly(ctx, [[10, -52 - bob], [24, -58 - bob], [10, -46 - bob]], color);
    circle(ctx, 4, -52 - bob, 2.4, '#fff', null); circle(ctx, 4.5, -52 - bob, 1.2, '#c0231a', null); circle(ctx, -4, -52 - bob, 2.4, '#fff', null); circle(ctx, -3.5, -52 - bob, 1.2, '#c0231a', null);
    rrect(ctx, -6, -44 - bob, 12, 2.5, 1, OUT, null);
    ctx.save(); ctx.translate(14, -26 - bob); ctx.rotate(0.6 + Math.sin(t * 6) * 0.2); ctx.scale(0.55, 0.55); drawGlyph(ctx, 'dagger', '#8f8f8f', '#555'); ctx.restore();
  } else if (kind === 'wolf') {
    rrect(ctx, -19, -16, 6, 16, 3, '#6c7079'); rrect(ctx, -8, -16, 6, 16, 3, '#6c7079'); rrect(ctx, 8, -16, 6, 16, 3, '#6c7079'); rrect(ctx, 17, -16, 6, 16, 3, '#6c7079');
    ellipse(ctx, 0, -26 - bob, 26, 13, color); poly(ctx, [[-24, -30 - bob], [-38, -40 - bob], [-26, -22 - bob]], shade(color, 0.85));
    circle(ctx, 25, -34 - bob, 11, color); poly(ctx, [[27, -30 - bob], [42, -28 - bob], [28, -24 - bob]], shade(color, 1.1));
    poly(ctx, [[20, -42 - bob], [22, -53 - bob], [28, -43 - bob]], shade(color, 0.8)); circle(ctx, 29, -37 - bob, 2, '#f7c948', null); circle(ctx, 41, -28 - bob, 2, OUT, null);
  }
  ctx.restore();
}

// ---- world props
export function drawNode(ctx, kind, x, y, s, depleted, color, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (kind === 'pond' || kind === 'stream' || kind === 'deep' || kind === 'cage') {
    ellipse(ctx, 0, 2, 46, 13, shade(color, 0.7)); ellipse(ctx, 0, 0, 42, 10, color, null);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) { const r = ((t * 0.7 + i * 0.5) % 1); ctx.globalAlpha = 1 - r; ctx.beginPath(); ctx.ellipse(-10 + i * 22, -1, 6 + r * 14, 2 + r * 4, 0, 0, 6.28); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const j = Math.sin(t * 3 + x) * 2; poly(ctx, [[8, -2 + j], [14, -13 + j], [19, -2 + j]], 'rgba(255,255,255,.85)', OUT, 1.5);
    if (kind === 'cage') { rrect(ctx, -22, -6, 12, 10, 3, '#b9824a'); }
    ctx.restore(); return;
  }
  ellipse(ctx, 0, 0, 24, 5, 'rgba(0,0,0,.2)', null);
  if (kind === 'tree' || kind === 'oak') {
    const g = depleted ? '#6b7a4e' : color;
    if (depleted) { rrect(ctx, -9, -14, 18, 14, 3, '#7a5530'); ellipse(ctx, 0, -14, 9, 4, '#c7a26a'); }
    else {
      rrect(ctx, -9, -52, 18, 52, 4, kind === 'oak' ? '#6a4524' : '#7a5530');
      circle(ctx, 0, -72, 30, g); circle(ctx, -22, -56, 20, shade(g, 0.9)); circle(ctx, 22, -56, 20, shade(g, 0.9)); circle(ctx, 0, -78, 20, shade(g, 1.15), null);
    }
  } else {
    const base = depleted ? '#6d6d75' : '#8b8b96';
    poly(ctx, [[-30, 0], [-34, -18], [-18, -38], [6, -42], [28, -28], [34, 0]], base);
    poly(ctx, [[-18, -38], [6, -42], [2, -26], [-14, -24]], shade(base, 1.2), null);
    if (!depleted) for (const [dx, dy] of [[-14, -16], [8, -22], [18, -10], [-2, -8]]) { circle(ctx, dx, dy, 5.5, color); circle(ctx, dx - 1.5, dy - 1.5, 1.8, 'rgba(255,255,255,.7)', null); }
  }
  ctx.restore();
}
export function drawStation(ctx, kind, x, y, s, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 0, 34, 6, 'rgba(0,0,0,.2)', null);
  if (kind === 'furnace') {
    rrect(ctx, -30, -64, 60, 64, 8, '#9b8f86'); rrect(ctx, -22, -78, 16, 20, 3, '#7c726a'); rrect(ctx, -16, -34, 32, 30, 14, '#2b2233');
    const f = 0.8 + Math.sin(t * 9) * 0.2; circle(ctx, 0, -14, 9 * f, '#ff9a2e', null); circle(ctx, 0, -12, 5 * f, '#ffe27a', null);
  } else if (kind === 'anvil') {
    rrect(ctx, -20, -16, 40, 16, 3, '#5a4a3a'); rrect(ctx, -10, -26, 20, 12, 2, '#6a727c');
    poly(ctx, [[-30, -40], [30, -40], [38, -34], [22, -26], [-22, -26], [-30, -32]], '#8a929c'); rrect(ctx, -26, -40, 40, 5, 2, '#b8c0c8', null);
  } else if (kind === 'fire') {
    for (const [dx, a] of [[-14, 0.3], [14, -0.3], [0, 0]]) { ctx.save(); ctx.translate(dx, -4); ctx.rotate(a + 1.57); rrect(ctx, -14, -3, 28, 6, 3, '#6a4524'); ctx.restore(); }
    const f = 0.8 + Math.sin(t * 11) * 0.2, f2 = 0.8 + Math.sin(t * 7 + 1) * 0.2;
    poly(ctx, [[-14, -6], [-6, -34 * f], [0, -16], [6, -42 * f2], [14, -6]], '#ff8a1e'); poly(ctx, [[-7, -6], [0, -26 * f2], [8, -6]], '#ffd34a', null);
  } else if (kind === 'range') {
    rrect(ctx, -28, -50, 56, 50, 6, '#6a6f78'); rrect(ctx, -22, -42, 44, 20, 4, '#2b2233'); circle(ctx, -8, -32, 5 + Math.sin(t * 9) * 0.8, '#ff8a1e', null); circle(ctx, 8, -32, 5 + Math.cos(t * 9) * 0.8, '#ff8a1e', null);
    rrect(ctx, -22, -18, 44, 5, 2, '#9aa3ad'); rrect(ctx, 20, -62, 8, 14, 2, '#4a4f58'); circle(ctx, 0, -8, 3, '#c9d6e3');
  } else if (kind === 'bank') {
    rrect(ctx, -30, -34, 60, 34, 5, '#8a5a30'); ctx.beginPath(); ctx.roundRect(-30, -50, 60, 22, [14, 14, 0, 0]); ctx.fillStyle = '#a56a38'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
    rrect(ctx, -32, -30, 64, 6, 1, '#d6b24a'); rrect(ctx, -6, -34, 12, 14, 3, '#f1d77a'); circle(ctx, 0, -27, 2, OUT, null);
  } else if (kind === 'store') {
    rrect(ctx, -30, -50, 4, 50, 1, '#6a4524'); rrect(ctx, 26, -50, 4, 50, 1, '#6a4524');
    for (let i = 0; i < 6; i++) rrect(ctx, -34 + i * 11.5, -72, 11.5, 22, 3, i % 2 ? '#fff' : '#d8453c');
    rrect(ctx, -30, -22, 60, 22, 2, '#a56a38'); circle(ctx, -12, -28, 6, '#d8453c'); circle(ctx, 4, -28, 6, '#f7c948'); circle(ctx, 18, -28, 6, '#6fbf4a');
  }
  ctx.restore();
}
export function drawSign(ctx, x, y, s, label, t = 0, left = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -3, -60, 6, 60, 2, '#7a5530'); rrect(ctx, -38, -88 + Math.sin(t * 3) * 1, 76, 30, 6, '#d6b075'); ctx.fillStyle = OUT; ctx.font = 'bold 13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, 0, -68);
  if (left) poly(ctx, [[-30, -78], [-40, -73], [-30, -68]], '#c0392b', null); else poly(ctx, [[30, -78], [40, -73], [30, -68]], '#c0392b', null);
  ctx.restore();
}
