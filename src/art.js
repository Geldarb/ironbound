// Procedural cartoon art (canvas 2D, no image assets). Everything is drawn with origin at the feet, 1 unit = 1px at scale 1.
import { ITEMS, TIERS } from './data.js';
import { LOOKS } from './save.js';
import { MONSTER_ART, MON_HEIGHT } from './monsters.js';

export const OUT = '#2b2233';
export function shade(col, f) {
  let r, g, b;
  if (col[0] === '#') { const n = parseInt(col.length === 4 ? col.replace(/./g, (m, i) => (i ? m + m : m)).slice(1) : col.slice(1), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
  else { const m = col.match(/[\d.]+/g) || [128, 128, 128]; r = +m[0]; g = +m[1]; b = +m[2]; }
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}
export function circle(ctx, x, y, r, fill, stroke = OUT, lw = 2) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function ellipse(ctx, x, y, rx, ry, fill, stroke = OUT, lw = 2) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function rrect(ctx, x, y, w, h, r, fill, stroke = OUT, lw = 2) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function poly(ctx, pts, fill, stroke = OUT, lw = 2) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }

/** blade pointing up from y=top: base at y=8 grows to the tip; hilt helpers draw below */
function blade(ctx, c, d, base, len, w, fuller) {
  poly(ctx, [[-w, base], [-w, base - len + 6], [0, base - len], [w, base - len + 6], [w, base]], c, OUT, 1.6);
  poly(ctx, [[0, base], [0, base - len + 1], [w, base - len + 6], [w, base]], shade(c, 1.3), null); // lit half
  if (fuller) { ctx.strokeStyle = shade(d, 0.9); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, base - 2); ctx.lineTo(0, base - len * 0.7); ctx.stroke(); }
}
function guard(ctx, y, d, w) { rrect(ctx, -w, y, w * 2, 4.5, 2, d); rrect(ctx, -w, y, w * 2, 1.6, 1, shade(d, 1.4), null); }
function grip(ctx, y, len) { rrect(ctx, -2.4, y + 4, 4.8, len, 2, '#7a4a28'); circle(ctx, 0, y + 5 + len, 3.2, '#d6b24a', OUT, 1.4); }
/** where the hand holds each weapon glyph (distance below the glyph origin) */
export const GRIP = { dagger: 15, sword: 18, longsword: 19, scimitar: 18, '2h': 27, mace: 16, warhammer: 16, axe: 10, battleaxe: 14, spear: 8, halberd: 10, pickaxe: 8, hammer: 8, net: 12, rod: 12, harpoon: 8, pot: 0, fish: 0, meat: 0, bow: 0, staff: 4 };
// ---- gear / tool glyphs, drawn around (0,0), pointing up, ~40 units tall. Used for icons and in the hero's hand.
export function drawGlyph(ctx, art, c = '#aab3bf', d = '#5f6875') {
  switch (art) {
    case 'helm': ctx.beginPath(); ctx.arc(0, 2, 15, Math.PI, 0); ctx.lineTo(15, 12); ctx.lineTo(-15, 12); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); rrect(ctx, -3, 2, 6, 12, 2, d); break;
    case 'shield': poly(ctx, [[-14, -14], [14, -14], [14, 4], [0, 20], [-14, 4]], c, OUT); poly(ctx, [[-8, -8], [8, -8], [8, 2], [0, 12], [-8, 2]], d, null); circle(ctx, 0, -2, 3, '#f1d77a'); break;
    case 'body': poly(ctx, [[-14, -14], [-6, -17], [6, -17], [14, -14], [18, -4], [11, -1], [11, 17], [-11, 17], [-11, -1], [-18, -4]], c, OUT); rrect(ctx, -11, 9, 22, 4, 1, d, null); break;
    case 'legs': rrect(ctx, -12, -16, 24, 8, 2, d); rrect(ctx, -12, -10, 11, 28, 3, c); rrect(ctx, 1, -10, 11, 28, 3, c); break;
    case 'dagger': blade(ctx, c, d, 7, 20, 3.2, 0.3); guard(ctx, 6, d, 8); grip(ctx, 8, 7); break;
    case 'sword': blade(ctx, c, d, 8, 31, 4, 0.4); guard(ctx, 8, d, 12); grip(ctx, 10, 8); break;
    case 'longsword': blade(ctx, c, d, 8, 39, 4.3, 0.45); guard(ctx, 8, d, 15); grip(ctx, 11, 8); break;
    case 'scimitar': {
      ctx.beginPath(); ctx.moveTo(-3.5, 8); ctx.bezierCurveTo(-9, -8, -6, -26, 6, -34); ctx.bezierCurveTo(4, -22, 8, -8, 3.5, 8); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1, 6); ctx.bezierCurveTo(-5, -8, -2, -24, 5, -32); ctx.strokeStyle = shade(c, 1.4); ctx.lineWidth = 1.4; ctx.stroke();
      guard(ctx, 8, d, 11); grip(ctx, 10, 8); break;
    }
    case '2h': blade(ctx, c, d, 8, 56, 5.5, 0.5); guard(ctx, 8, d, 24); grip(ctx, 19, 8); circle(ctx, 0, 28, 4, d, OUT, 1.5); break;
    case 'mace': rrect(ctx, -2.2, -8, 4.4, 36, 2, '#8a5a30'); circle(ctx, 0, -14, 8.5, c); circle(ctx, -2.5, -17, 3, shade(c, 1.35), null);
      for (let i = 0; i < 6; i++) { const a = i * 1.047; poly(ctx, [[Math.cos(a - 0.25) * 8, -14 + Math.sin(a - 0.25) * 8], [Math.cos(a) * 13, -14 + Math.sin(a) * 13], [Math.cos(a + 0.25) * 8, -14 + Math.sin(a + 0.25) * 8]], d, OUT, 1.2); } break;
    case 'warhammer': rrect(ctx, -2.2, -14, 4.4, 44, 2, '#8a5a30'); rrect(ctx, -14, -28, 28, 16, 2.5, c); rrect(ctx, 6, -28, 8, 16, 2.5, d); rrect(ctx, -14, -28, 28, 4, 2, shade(c, 1.3), null); poly(ctx, [[-14, -22], [-22, -20], [-14, -17]], d, OUT, 1.4); break;
    case 'axe': rrect(ctx, -2.2, -20, 4.4, 46, 2, '#8a5a30'); poly(ctx, [[2, -22], [14, -28], [21, -20], [20, -6], [14, -2], [2, -8]], c, OUT, 1.8); poly(ctx, [[14, -26], [20, -19], [19, -7], [15, -4]], shade(c, 1.35), null); break;
    case 'battleaxe': rrect(ctx, -2.2, -26, 4.4, 56, 2, '#8a5a30');
      poly(ctx, [[2, -28], [16, -36], [26, -26], [25, -6], [16, 0], [2, -10]], c, OUT, 1.8); poly(ctx, [[-2, -28], [-16, -36], [-26, -26], [-25, -6], [-16, 0], [-2, -10]], shade(c, 0.9), OUT, 1.8);
      poly(ctx, [[17, -33], [24, -25], [23, -8], [17, -3]], shade(c, 1.35), null); poly(ctx, [[0, -38], [-3, -28], [3, -28]], d, OUT, 1.2); break;
    case 'spear': rrect(ctx, -2, -30, 4, 70, 2, '#8a5a30'); poly(ctx, [[0, -56], [-6.5, -36], [-2, -31], [2, -31], [6.5, -36]], c, OUT, 1.6); poly(ctx, [[0, -52], [-1, -36], [3, -36]], shade(c, 1.4), null); rrect(ctx, -3, -31, 6, 3, 1, d); break;
    case 'halberd': rrect(ctx, -2, -34, 4, 76, 2, '#8a5a30'); poly(ctx, [[0, -62], [-3.5, -42], [3.5, -42]], c, OUT, 1.5);
      poly(ctx, [[2, -42], [20, -40], [24, -26], [18, -16], [2, -26]], c, OUT, 1.8); poly(ctx, [[18, -38], [23, -26], [17, -18]], shade(c, 1.35), null); poly(ctx, [[-2, -34], [-12, -26], [-2, -24]], d, OUT, 1.3); break;
    case 'gloves': rrect(ctx, -10, -2, 20, 10, 2, d); rrect(ctx, -9, -14, 18, 14, 4, c); for (const x of [-7, -2, 3]) rrect(ctx, x, -17, 4, 6, 1.5, c, OUT, 1.2); break;
    case 'boots': poly(ctx, [[-8, -14], [4, -14], [4, 0], [14, 4], [14, 12], [-8, 12]], c, OUT); rrect(ctx, -8, 8, 22, 5, 1.5, d); rrect(ctx, -8, -14, 12, 4, 1, shade(c, 1.3), null); break;
    case 'pickaxe': rrect(ctx, -2, -18, 4, 40, 2, '#8a5a30'); ctx.beginPath(); ctx.moveTo(-20, -8); ctx.quadraticCurveTo(0, -26, 20, -8); ctx.lineTo(17, -4); ctx.quadraticCurveTo(0, -17, -17, -4); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); break;
    case 'hammer': rrect(ctx, -2, -8, 4, 30, 2, '#8a5a30'); rrect(ctx, -12, -18, 24, 12, 3, c); break;
    case 'ore': poly(ctx, [[-14, 10], [-16, -2], [-6, -14], [8, -12], [16, -2], [12, 10]], '#7b7b86'); circle(ctx, -5, -2, 4, c, null); circle(ctx, 6, 0, 3.5, c, null); circle(ctx, 0, 6, 3, c, null); break;
    case 'bar': poly(ctx, [[-16, 8], [-10, -6], [14, -6], [18, 8]], c, OUT); poly(ctx, [[-10, -6], [14, -6], [12, -10], [-6, -10]], shade(c, 1.25), OUT); break;
    case 'log': rrect(ctx, -17, -7, 34, 15, 6, c); ellipse(ctx, 17, 0.5, 4, 7.5, shade(c, 1.35)); ctx.strokeStyle = shade(c, 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(8, -2); ctx.moveTo(-12, 3); ctx.lineTo(6, 3); ctx.stroke(); break;
    case 'bones': ctx.save(); ctx.rotate(-0.55); rrect(ctx, -18, -3, 36, 6, 3, c, OUT, 1.5); circle(ctx, -19, -3, 4.5, c, OUT, 1.2); circle(ctx, -19, 3, 4.5, c, OUT, 1.2); circle(ctx, 19, -3, 4.5, c, OUT, 1.2); circle(ctx, 19, 3, 4.5, c, OUT, 1.2); ctx.restore(); break;
    case 'bow': rrect(ctx, -2, -20, 4, 40, 2, '#8a5a30'); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 14, -1.2, 1.2); ctx.stroke(); break;
    case 'arrow': rrect(ctx, -1, -16, 2, 32, 1, '#8a5a30'); poly(ctx, [[0, -20], [-3, -14], [3, -14]], c); break;
    case 'rune': circle(ctx, 0, 0, 10, c, OUT, 1.5); circle(ctx, 0, 0, 4, shade(c, 1.3), null); break;
    case 'staff': rrect(ctx, -2, -22, 4, 44, 2, '#8a5a30'); circle(ctx, 0, -26, 6, c, OUT, 1.5); circle(ctx, 0, -26, 3, shade(c, 1.3), null); break;
    case 'scroll': rrect(ctx, -10, -14, 20, 28, 2, c, OUT, 1.5); ctx.strokeStyle = shade(c, 0.7); ctx.lineWidth = 1; for (let i = -8; i <= 8; i += 4) { ctx.beginPath(); ctx.moveTo(-6, i); ctx.lineTo(6, i); ctx.stroke(); } break;
    case 'gem': {
      const shade = (h) => { const n = parseInt(h.slice(1), 16); const f = (v) => Math.round(v * 0.7).toString(16).padStart(2, '0'); return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`; };
      poly(ctx, [[0, -16], [12, -4], [8, 14], [-8, 14], [-12, -4]], c); poly(ctx, [[0, -16], [12, -4], [0, 2]], shade(c), null); break;
    }
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
const BLADES = new Set(['dagger', 'sword', 'longsword', 'scimitar', '2h', 'spear', 'halberd', 'mace', 'warhammer', 'axe', 'battleaxe']);
const ICON_SCALE = { '2h': 0.5, spear: 0.42, halberd: 0.4, longsword: 0.66, battleaxe: 0.7, warhammer: 0.75, sword: 0.75, scimitar: 0.85, mace: 0.8, axe: 0.85 };
/** data-URL icon for an item id (cached), 48x48 */
export function iconURL(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const it = ITEMS[id];
  if (typeof document === 'undefined' || !it) return '';
  const cv = document.createElement('canvas'); cv.width = cv.height = 48;
  const ctx = cv.getContext('2d');
  ctx.translate(24, 24); ctx.scale(ICON_SCALE[it.art] || 0.8, ICON_SCALE[it.art] || 0.8);
  if (BLADES.has(it.art)) { ctx.rotate(0.7); ctx.translate(0, ['2h', 'spear', 'halberd'].includes(it.art) ? -4 : 3); }
  drawGlyph(ctx, it.art, it.c, it.d || shade(it.c || '#999999', 0.55));
  const url = cv.toDataURL();
  iconCache.set(id, url);
  return url;
}
/** small stone-and-gold tab icons for the nav bar (cached data URLs, 40x40 drawn at 20css px) */
const tabCache = new Map();
export function tabIcon(name) {
  if (tabCache.has(name)) return tabCache.get(name);
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas'); cv.width = cv.height = 40;
  const ctx = cv.getContext('2d'); ctx.translate(20, 20);
  const G = '#ffb84a', D = '#7a4a12', S = '#c9d0d8';
  switch (name) {
    case 'gear': ctx.scale(0.62, 0.62); ctx.rotate(0.7); drawGlyph(ctx, 'sword', S, '#8a929c'); break;
    case 'skills': for (let i = 0; i < 3; i++) { rrect(ctx, -13 + i * 9.5, 10 - (i + 1) * 7, 7, (i + 1) * 7 + 4, 1.5, G, OUT, 1.5); } break;
    case 'bag': ellipse(ctx, 0, 4, 12, 11, '#b9824a'); rrect(ctx, -6, -10, 12, 6, 2, '#8a5a30'); ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.stroke(); break;
    case 'craft': ctx.save(); ctx.scale(0.6, 0.6); ctx.rotate(0.6); drawGlyph(ctx, 'hammer', S, '#8a929c'); ctx.restore(); rrect(ctx, -12, 6, 24, 6, 2, '#6a727c'); break;
    case 'map': poly(ctx, [[-13, -9], [-5, -12], [4, -9], [13, -12], [13, 10], [4, 13], [-5, 10], [-13, 13]], '#e3d3a4', OUT, 1.6); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(0, -2); ctx.lineTo(8, 5); ctx.stroke(); break;
    case 'coop': circle(ctx, -6, -5, 5, '#f2c9a0'); circle(ctx, 6, -5, 5, '#d9a273'); rrect(ctx, -12, 1, 12, 11, 4, '#3b8eea'); rrect(ctx, 0, 1, 12, 11, 4, '#e0463c'); break;
    case 'settings': ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 9 : 13; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = S; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke(); circle(ctx, 0, 0, 4.5, '#3b342b', OUT, 1.4); break;
    case 'prayer': poly(ctx, [[0, -14], [11, -4], [7, 12], [-7, 12], [-11, -4]], '#ffe27a', OUT, 1.6); poly(ctx, [[0, -8], [5, -2], [0, 8], [-5, -2]], '#c9a227', null); break;
    case 'magic': ctx.save(); ctx.rotate(0.6); rrect(ctx, -2, -6, 4, 22, 2, '#8a5a30', OUT, 1.2); ctx.restore(); circle(ctx, -5, -9, 6, '#6a6ae8', OUT, 1.5); circle(ctx, -6, -10, 2.5, '#c8c8ff', null); break;
    default: circle(ctx, 0, 0, 8, G);
  }
  const url = cv.toDataURL(); tabCache.set(name, url); return url;
}

// ================= characters =================
const lerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const ease = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
/** keyframe interpolation: kf(p, [[p0, v0], [p1, v1], ...]) with smoothing */
export function kf(p, pts) {
  if (p <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (p <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], ease((p - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])));
  return pts[pts.length - 1][1];
}
// arm angle keyframes (radians, 0 = hanging, +ve = swung forward, PI = straight up), thrust and body lean, per attack animation
export const ATTACK_ANIMS = {
  stab: { arm: [[0, 0.4], [0.25, 0.9], [0.45, 1.6], [0.62, 1.6], [1, 0.4]], push: [[0, 0], [0.25, -3], [0.45, 10], [0.62, 10], [1, 0]], lean: [[0, 0], [0.25, -2], [0.45, 4], [0.62, 4], [1, 0]] },
  slash: { arm: [[0, 0.4], [0.3, 2.5], [0.4, 2.6], [0.62, 0.1], [0.8, 0.25], [1, 0.4]], push: [[0, 0], [1, 0]], lean: [[0, 0], [0.35, -3], [0.62, 4], [1, 0]], trail: [0.4, 0.66] },
  crush: { arm: [[0, 0.4], [0.4, 2.9], [0.5, 2.9], [0.62, 0.7], [0.8, 0.6], [1, 0.4]], push: [[0, 0], [1, 0]], lean: [[0, 0], [0.4, -4], [0.62, 7], [1, 0]], trail: [0.5, 0.66] },
  twoH: { arm: [[0, 0.3], [0.35, 2.2], [0.45, 2.35], [0.7, -0.2], [0.85, 0.3], [1, 0.3]], push: [[0, 0], [1, 0]], lean: [[0, 0], [0.35, -7], [0.7, 9], [1, 0]], trail: [0.45, 0.75] },
};
const WEAPON_ANIM_OF_TYPE = { stab: 'stab', slash: 'slash', crush: 'crush' };

/** limb helper: pivot at (px,py), swing forward by `ang` radians */
export function limb(ctx, px, py, ang, fn) { ctx.save(); ctx.translate(px, py); ctx.rotate(-ang); fn(); ctx.restore(); }
function skinBlock(ctx, x, y, w, h, skin) { rrect(ctx, x, y, w, h, 2, skin); rrect(ctx, x, y + h * 0.55, w, h * 0.45, 2, shade(skin, 0.86), null); }

/** Blocky RuneScape-style adventurer (original art). Origin = feet. Faces +x (mirrored by `dir`). */
export function drawHero(ctx, x, y, s, o) {
  const { look = 0, equip = {}, dir = 1, state = 'idle', t = 0, tool = null, toolId = null, swingP = null, atkType = 'slash', two = false, wkind = null, hurt = 0, pose = null, aim = 60 } = o;
  const L = LOOKS[look % LOOKS.length];
  const walk = state === 'walk';
  const wi = ITEMS[equip.weapon], isTier = (id) => ITEMS[id];
  const tier = (id, f = 1) => shade(ITEMS[id].c, f), dark = (id) => ITEMS[id].d || shade(ITEMS[id].c, 0.6);
  // ---- pose
  let armF = 0.12 + Math.sin(t * 2) * 0.04, armB = -0.08 - Math.sin(t * 2) * 0.04, legF = 0, legB = 0, lean = 0, push = 0, wRot = -1.15, bodyDy = 0, trail = null, item = null, itemSc = 1, lookDown = 0;
  const breathe = Math.sin(t * 2.2) * 0.8;
  let mode = null, wGlyph = wi ? wi.art : null, wColor = wi ? [wi.c, wi.d] : null, bothHands = two;
  if (walk) { const sw = Math.sin(t * 10); legF = sw * 0.62; legB = -sw * 0.62; armF = -sw * 0.55; armB = sw * 0.55; bodyDy = -Math.abs(Math.cos(t * 10)) * 2.2; wRot = -1.0; }
  if (state === 'attack' && swingP != null) { mode = atkType === 'ranged' ? 'shoot' : atkType === 'magic' ? 'cast' : bothHands ? 'twoH' : WEAPON_ANIM_OF_TYPE[atkType] || 'slash'; }
  else if (state === 'gather' && swingP != null) {
    wGlyph = tool === 'cage' ? 'pot' : tool; const ti = toolId && ITEMS[toolId]; wColor = ti ? [ti.c, ti.d] : ['#c9a46a', '#7a5530']; bothHands = false;
    mode = { pickaxe: 'crush', axe: 'slash', net: 'net', rod: 'rod', harpoon: 'stab', cage: 'net' }[tool] || 'stab';
  } else if (state === 'gather') { wGlyph = tool === 'cage' ? 'pot' : tool; const ti = toolId && ITEMS[toolId]; wColor = ti ? [ti.c, ti.d] : ['#c9a46a', '#7a5530']; if (tool === 'rod') { armF = 1.1; wRot = -0.1; } }
  if (wi?.wk === 'bow' && !mode && !walk && state !== 'gather') { armF = 0.5; wRot = -Math.PI / 2; } // bow held ready
  if (pose) {
    const p = pose.p;
    if (pose.name === 'eat') { armF = kf(p, [[0, 0.3], [0.25, 2.5], [0.7, 2.45], [1, 0.3]]); lookDown = 0; item = pose.item || 'fish'; itemSc = 0.45; wGlyph = null; lean = Math.sin(p * 20) * 0.8; }
    else if (pose.name === 'cook') { armF = 1.05 + Math.sin(p * 18) * 0.12; item = pose.item || 'fish'; itemSc = 0.55; wGlyph = null; lean = 2; }
    else if (pose.name === 'smith') { mode = 'crush'; wGlyph = 'hammer'; wColor = ['#aab3bf', '#5f6875']; bothHands = false; }
    else if (pose.name === 'cheer') { armF = 2.9; armB = 2.7 + Math.sin(p * 30) * 0.2; wGlyph = null; bodyDy = -Math.abs(Math.sin(p * 14)) * 3; }
  }
  const ap = pose && (pose.name === 'smith') ? pose.p : swingP;
  if (mode && ap != null) {
    if (ATTACK_ANIMS[mode]) { const A = ATTACK_ANIMS[mode]; armF = kf(ap, A.arm); push = kf(ap, A.push); lean = kf(ap, A.lean); wRot = lerp(-1.15, 0, ap < 0.5 ? ap / 0.3 : 1 - (ap - 0.62) / 0.38); trail = A.trail && ap > A.trail[0] && ap < A.trail[1] ? { u: (ap - A.trail[0]) / (A.trail[1] - A.trail[0]) } : null; if (mode === 'stab') wRot = lerp(-1.15, 0.0, kf(ap, [[0, 0], [0.3, 1], [0.7, 1], [1, 0]])); }
    else if (mode === 'shoot') { armF = kf(ap, [[0, 0.6], [0.2, 1.55], [0.8, 1.55], [1, 0.6]]); wRot = -Math.PI / 2; bothHands = false; armB = kf(ap, [[0, 0.3], [0.2, 1.35], [0.55, 1.15], [0.62, 1.5], [1, 0.3]]); lean = kf(ap, [[0, 0], [0.55, -2], [0.65, 1], [1, 0]]); }
    else if (mode === 'cast') { armF = kf(ap, [[0, 0.4], [0.35, 2.6], [0.6, 1.45], [1, 0.4]]); wRot = kf(ap, [[0, -1.15], [0.35, -0.2], [0.6, -0.1], [1, -1.15]]); bothHands = false; armB = kf(ap, [[0, 0], [0.4, 1.2], [0.6, 0.9], [1, 0]]); lean = kf(ap, [[0, 0], [0.35, -3], [0.6, 4], [1, 0]]); }
    else if (mode === 'net') { armF = kf(ap, [[0, 0.9], [0.4, 1.45], [0.7, 1.0], [1, 0.9]]); wRot = -0.5; lean = kf(ap, [[0, 0], [0.4, 3], [1, 0]]); }
    else if (mode === 'rod') { armF = kf(ap, [[0, 1.1], [0.25, 2.0], [0.5, 0.9], [1, 1.1]]); wRot = kf(ap, [[0, -0.2], [0.25, 0.6], [0.5, -0.5], [1, -0.2]]); lean = kf(ap, [[0, 0], [0.5, 3], [1, 0]]); }
    if (bothHands) armB = armF * 0.85;
    else if (!pose && mode !== 'shoot' && mode !== 'cast') armB = lerp(-0.1, 0.5, 0.5 + 0.5 * Math.sin(ap * 6.28));
  }
  if (hurt > 0) { lean -= 5 * Math.min(1, hurt / 0.2); armF -= 0.2; }
  const hip = -24, sho = -49;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  if (hurt > 0) ctx.rotate(-0.06 * Math.min(1, hurt / 0.2));
  ellipse(ctx, 0, 0, 15, 4, 'rgba(0,0,0,.25)', null);
  // ---- legs (far, near)
  const bootC = equip.boots ? tier(equip.boots) : '#5b3e24', bootD = equip.boots ? dark(equip.boots) : '#3a2614';
  const legC = equip.legs ? tier(equip.legs, 0.95) : L.pants || '#4a4f66';
  const leg = (px, ang, far) => limb(ctx, px, hip + bodyDy, ang, () => {
    const lc = far ? shade(legC.startsWith('#') ? legC : '#4a4f66', 0.8) : legC;
    rrect(ctx, -4.5, -1, 9, 25, 2, equip.legs ? (far ? shade(ITEMS[equip.legs].c, 0.78) : tier(equip.legs, 0.95)) : lc);
    if (equip.legs) { rrect(ctx, -4.5, 9, 9, 3, 1, dark(equip.legs), null); rrect(ctx, 0.5, -1, 4, 24, 1, 'rgba(255,255,255,.12)', null); }
    rrect(ctx, -5, 17, 10, 8, 2, far ? shade(bootC.startsWith('#') ? bootC : '#5b3e24', 0.8) : bootC); rrect(ctx, -5, 23, 12, 3, 1.2, bootD, null);
  });
  leg(-3.5, legB, true); leg(3.5, legF, false);
  ctx.save(); ctx.translate(lean * 0.4, bodyDy + breathe * 0.12);
  // ---- quiver on the back when arrows are equipped
  if (equip.ammo && ITEMS[equip.ammo]) { ctx.save(); ctx.translate(-10 + lean * 0.3, sho + 6); ctx.rotate(-0.45); rrect(ctx, -4, -10, 8, 22, 2, '#7a4a28'); rrect(ctx, -4, -4, 8, 3, 1, '#5a3418', null); for (let i = -1; i <= 1; i++) { rrect(ctx, i * 2.6 - 1, -16, 2, 7, 1, '#f3ead2', null); rrect(ctx, i * 2.6 - 0.8, -10, 1.6, 2, 0.5, ITEMS[equip.ammo].c, null); } ctx.restore(); }
  // ---- far arm (off hand; carries the shield)
  const sleeveC = equip.body ? tier(equip.body, 0.8) : shade(L.shirt, 0.82), skinD = shade(L.skin, 0.82);
  limb(ctx, -9 + lean * 0.3, sho + 2, armB, () => {
    rrect(ctx, -3.5, -2, 7, 22, 2.5, skinD); rrect(ctx, -3.5, -2, 7, equip.body ? 14 : 9, 2.5, sleeveC);
    if (equip.gloves) { rrect(ctx, -4, 16, 8, 7, 2, shade(ITEMS[equip.gloves].c, 0.8)); } else rrect(ctx, -3, 18, 6, 5, 2, skinD);
  });
  // ---- torso
  const shirt = equip.body ? tier(equip.body) : L.shirt;
  ctx.save(); ctx.translate(lean * 0.4, 0); ctx.scale(1, 1 + breathe * 0.012);
  rrect(ctx, -11, sho - 2, 22, 27, 3, shirt); rrect(ctx, -11, sho + 14, 22, 11, 2, shade(shirt, 0.84), null); rrect(ctx, -11, sho - 2, 5, 27, 2, 'rgba(0,0,0,.14)', null);
  rrect(ctx, -11, sho + 21, 22, 4, 1.5, equip.body ? dark(equip.body) : '#6b4a2a', null); circle(ctx, 0, sho + 23, 2.2, '#d6b24a', null);
  if (equip.body) { const b = ITEMS[equip.body]; poly(ctx, [[-7, sho + 1], [7, sho + 1], [5, sho + 12], [-5, sho + 12]], shade(b.c, 1.18), null); rrect(ctx, -2, sho + 1, 4, 20, 1, shade(b.c, 0.7), null); rrect(ctx, -11, sho - 3, 22, 4, 2, dark(equip.body), null); }
  ctx.restore();
  // ---- shield on the off hand
  // strapped to the off-hand forearm: follows the far arm's swing (walk, attack, idle) instead of floating on the torso
  if (equip.shield && !two && ITEMS[equip.shield]) {
    const px = -9 + lean * 0.3, py = sho + 2, hx = px + 13 * Math.sin(armB), hy = py + 13 * Math.cos(armB);
    ctx.save(); ctx.translate(hx - 1, hy - 1); ctx.rotate(-armB * 0.35); ctx.scale(0.78, 0.78); drawGlyph(ctx, 'shield', ITEMS[equip.shield].c, ITEMS[equip.shield].d); ctx.restore();
  }
  // ---- head (blocky)
  const hy = sho - 3 - (lookDown ? 1 : 0);
  ctx.save(); ctx.translate(lean * 0.6 + (pose && pose.name === 'eat' ? 0 : 0), 0);
  rrect(ctx, -3, hy, 6, 4, 1, skinD, null);
  skinBlock(ctx, -10, hy - 19, 20, 20, L.skin);
  rrect(ctx, -10, hy - 19, 20, 20, 3, null, OUT, 2);
  // hair: cap + back block
  rrect(ctx, -11, hy - 21, 22, 9, 3, L.hair); rrect(ctx, -11, hy - 14, 6, 13, 2, L.hair); rrect(ctx, -11, hy - 21, 22, 3, 2, shade(L.hair, 1.25), null);
  // face
  rrect(ctx, 3, hy - 10, 4, 5, 1, OUT, null); rrect(ctx, 4, hy - 10, 1.5, 2, 0.5, '#fff', null); rrect(ctx, 9, hy - 8, 3, 3, 1, shade(L.skin, 0.92), null);
  if (pose && pose.name === 'eat' && Math.sin(pose.p * 40) > 0) rrect(ctx, 4, hy - 4, 5, 2, 1, '#6b2a2a', null); else rrect(ctx, 4, hy - 4, 5, 1.6, 0.8, '#7a3a2a', null);
  if (equip.head) { const hi = ITEMS[equip.head]; rrect(ctx, -11.5, hy - 23, 23, 13, 4, tier(equip.head)); rrect(ctx, -11.5, hy - 23, 23, 4, 3, shade(hi.c, 1.3), null); rrect(ctx, -11.5, hy - 13, 23, 3, 1, dark(equip.head), null); rrect(ctx, 6, hy - 14, 4, 10, 1.5, tier(equip.head, 0.85)); rrect(ctx, -11.5, hy - 12, 5, 12, 2, tier(equip.head, 0.8)); rrect(ctx, -11.5, hy - 23, 23, 13, 4, null, OUT, 1.8); }
  ctx.restore();
  // ---- near arm + weapon / tool / food
  const armLen = 21;
  const heldGlyph = wGlyph;
  if (trail && heldGlyph) { // swoosh behind the weapon
    const R = armLen + (heldGlyph === '2h' ? 44 : 30), tail = armF + (mode === 'crush' ? 1.0 : 1.4);
    ctx.save(); ctx.translate(9 + lean * 0.3, sho + 2); ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - trail.u)})`; ctx.lineWidth = heldGlyph === '2h' ? 7 : 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, R, Math.PI / 2 - tail, Math.PI / 2 - armF); ctx.stroke(); ctx.restore();
  }
  limb(ctx, 9 + lean * 0.3, sho + 2, armF, () => {
    rrect(ctx, -3.5, -2, 7, 22, 2.5, L.skin); rrect(ctx, -3.5, 8, 7, 12, 2.5, shade(L.skin, 0.9), null); rrect(ctx, -3.5, -2, 7, equip.body ? 14 : 9, 2.5, equip.body ? tier(equip.body, 0.95) : shade(L.shirt, 0.95));
    if (equip.body) rrect(ctx, -4.5, -3, 9, 5, 2, dark(equip.body), null);
    if (equip.gloves) { rrect(ctx, -4.5, 15, 9, 8, 2, tier(equip.gloves)); rrect(ctx, -4.5, 15, 9, 3, 1, dark(equip.gloves), null); } else rrect(ctx, -3.5, 17, 7, 6, 2, L.skin);
    ctx.translate(0, 20 + push);
    if (heldGlyph && GRIP[heldGlyph] != null) {
      ctx.rotate(Math.PI + wRot);
      const sc = heldGlyph === 'pot' ? 0.6 : 0.85; ctx.scale(sc, sc); ctx.translate(0, -GRIP[heldGlyph]);
      drawGlyph(ctx, heldGlyph, wColor?.[0] || '#aab3bf', wColor?.[1] || '#5f6875');
      if (mode === 'cast' && ap > 0.25 && ap < 0.7) { ctx.globalAlpha = 0.6; circle(ctx, 0, -26, 10 + Math.sin(ap * 30) * 2, '#bfe0ff', null); ctx.globalAlpha = 1; }
      if (mode === 'shoot' && ap > 0.15 && ap < 0.6) { ctx.strokeStyle = '#f3ead2'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1, -12); ctx.lineTo(-12, 0); ctx.lineTo(-1, 12); ctx.stroke(); ctx.fillStyle = '#8a5a30'; ctx.fillRect(-13, -1, 22, 2); }
    } else if (item) { ctx.rotate(Math.PI / 2); ctx.scale(itemSc, itemSc); drawGlyph(ctx, item === 'meat' ? 'meat' : 'fish', pose?.c || '#e8a35a'); }
  });
  ctx.restore();
  // fishing line
  if (state === 'gather' && (tool === 'rod')) {
    const sw = swingP != null ? kf(swingP, [[0, 1.1], [0.25, 2.0], [0.5, 0.9], [1, 1.1]]) : 1.1;
    const tipx = 9 + Math.sin(sw) * (armLen + 6) + Math.sin(sw - 0.1 + 1.3) * 0.5 * 24, tipy = sho + 2 + Math.cos(sw) * armLen - 26;
    const bx = aim, by = -4 + Math.sin(t * 3) * 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.quadraticCurveTo((tipx + bx) / 2, Math.max(tipy, by) + 14, bx, by); ctx.stroke();
    circle(ctx, bx, by, 2.8, '#d8453c', OUT, 1); circle(ctx, bx, by - 1.5, 1.4, '#fff', null);
  }
  // small station props for crafting poses
  if (pose && (pose.name === 'cook' || pose.name === 'smith')) {
    ctx.save(); ctx.translate(36, 0); ctx.scale(0.55, 0.55); drawStation(ctx, pose.name === 'cook' ? 'fire' : 'anvil', 0, 0, 1, t); ctx.restore();
  }
  ctx.restore();
}

// ================= monsters =================
/** Simple blocky creatures. o = { dir, t, hit, color, swing: 0..1 progress of the attack animation or null } */
export function drawMonster(ctx, kind, x, y, s, o) {
  const { dir = -1, t = 0, hit = 0, color = '#999', swing = null, seed = 0 } = o;
  const bob = Math.sin(t * 4 + seed) * 1.2, ph = swing == null ? 0 : Math.sin(swing * Math.PI); // 0..1..0 over the attack
  const lunge = ph * 9;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const big = Math.max(1, (MON_HEIGHT[kind] || 60) / 75);
  ellipse(ctx, 0, 0, 20 * big, 4.5 * big, 'rgba(0,0,0,.25)', null);
  if (hit > 0) { ctx.translate((Math.random() - 0.5) * 3, 0); ctx.rotate(-0.05); }
  ctx.translate(lunge * big, 0);
  const dk = (c, f = 0.8) => shade(c, f);
  if (kind === 'chicken') {
    const step = Math.sin(t * 6 + seed) * 2;
    rrect(ctx, -4 + step, -12, 2.6, 12, 1, '#e8a33a'); rrect(ctx, 3 - step, -12, 2.6, 12, 1, '#e8a33a'); rrect(ctx, -6 + step, -2, 6, 2, 1, '#e8a33a', null); rrect(ctx, 1 - step, -2, 6, 2, 1, '#e8a33a', null);
    rrect(ctx, -13, -29 - bob, 26, 18, 4, '#fbf8ee'); rrect(ctx, -13, -19 - bob, 26, 8, 3, '#e5dfcb', null);
    const flap = Math.sin(t * 9 + seed) * (swing != null ? 0.6 : 0.12);
    ctx.save(); ctx.translate(-2, -22 - bob); ctx.rotate(flap); rrect(ctx, -9, -3, 15, 9, 3, '#e5dfcb'); ctx.restore();
    poly(ctx, [[-13, -27 - bob], [-21, -34 - bob], [-13, -20 - bob]], '#f1ece0');
    const hx = 11 + ph * 4, hy = -33 - bob + ph * 4;
    rrect(ctx, hx - 5, hy - 5, 11, 12, 3, '#fbf8ee'); poly(ctx, [[hx + 6, hy - 1], [hx + 14, hy + 1], [hx + 6, hy + 3]], '#f5a623'); rrect(ctx, hx - 2, hy - 9, 6, 5, 2, '#e0463c', null); rrect(ctx, hx + 1, hy - 3, 2.5, 2.5, 1, OUT, null); rrect(ctx, hx + 5, hy + 3, 3, 4, 1.5, '#e0463c', null);
  } else if (kind === 'cow') {
    const st = Math.sin(t * 3 + seed) * 1;
    for (const lx of [-17, -9, 9, 17]) rrect(ctx, lx - 3, -14, 6.5, 14, 2, lx < 0 ? '#d8d0bd' : '#efe8d6');
    rrect(ctx, -23, -38 - bob, 46, 25, 5, '#f1ecdd'); rrect(ctx, -23, -22 - bob, 46, 9, 4, '#dcd5c0', null);
    rrect(ctx, -14, -36 - bob, 11, 9, 2, '#2c2c34', null); rrect(ctx, 4, -30 - bob, 10, 11, 2, '#2c2c34', null); rrect(ctx, -22, -26 - bob, 6, 7, 2, '#2c2c34', null);
    rrect(ctx, -26, -35 - bob + st, 3, 17, 1.5, '#d8d0bd'); rrect(ctx, -27.5, -19 - bob + st, 6, 4, 2, '#3a2f2a', null);
    const hx = 25 + ph * 6, hy = -34 - bob + ph * 5 + 3;
    rrect(ctx, hx - 6, hy - 9, 17, 17, 4, '#f1ecdd'); rrect(ctx, hx + 4, hy - 1, 9, 8, 3, '#e8a3a0'); rrect(ctx, hx - 1, hy - 6, 3, 3, 1, OUT, null); rrect(ctx, hx + 6, hy + 2, 1.5, 2, 0.7, '#8a4a48', null);
    poly(ctx, [[hx - 5, hy - 9], [hx - 9, hy - 16], [hx - 2, hy - 10]], '#efe3b8'); poly(ctx, [[hx + 3, hy - 9], [hx + 6, hy - 16], [hx + 8, hy - 9]], '#efe3b8'); rrect(ctx, hx - 9, hy - 6, 5, 6, 2, '#2c2c34', null);
  } else if (MONSTER_ART[kind]) {
    MONSTER_ART[kind](ctx, { t, swing, ph, bob, seed, color });
  } else { // unknown kind: a plain blob so new data never crashes the renderer
    ellipse(ctx, 0, -18 - bob, 18, 16, color); circle(ctx, 8, -24 - bob, 2.5, '#fff');
  }
  ctx.restore();
}

// ================= world props =================
const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
/** resource nodes. depleted: dull rock / tree stump. `chip` 0..1 = recent hit shake */
export function drawNode(ctx, kind, x, y, s, depleted, color, t = 0, chip = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (kind === 'pond' || kind === 'stream' || kind === 'deep' || kind === 'cage') {
    const deep = kind === 'deep';
    ellipse(ctx, 0, 3, 50, 14, shade(color, 0.55)); ellipse(ctx, 0, 1, 46, 11.5, shade(color, 0.85), null); ellipse(ctx, 0, 0, 42, 9.5, color, null);
    ellipse(ctx, -8, -2, 28, 4, 'rgba(255,255,255,.14)', null);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { const r = ((t * 0.55 + i * 0.34) % 1); ctx.globalAlpha = (1 - r) * 0.9; ctx.beginPath(); ctx.ellipse(-16 + i * 17, -1 + (i % 2) * 2, 5 + r * 16, 1.6 + r * 4.4, 0, 0, 6.28); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const rx of [-40, 38]) { rrect(ctx, rx, -14, 2.5, 14, 1, '#4f8a3a', null); rrect(ctx, rx + 4, -10, 2.5, 10, 1, '#5fa046', null); }
    const j = Math.sin(t * 3 + x) * 1.6, fx = 16 + Math.sin(t * 0.9 + x) * 6; // fish fin
    poly(ctx, [[fx - 5, -1 + j * 0.3], [fx, -9 + j], [fx + 5, -1 + j * 0.3]], 'rgba(255,255,255,.8)', OUT, 1.2);
    if (deep) for (let i = 0; i < 2; i++) circle(ctx, -20 + i * 30, -3, 2.5, 'rgba(255,255,255,.55)', null);
    if (kind === 'cage') { rrect(ctx, -26, -9, 13, 11, 2.5, '#b9824a'); rrect(ctx, -24, -7, 9, 7, 1, null, '#6a4524', 1.2); }
    ctx.restore(); return;
  }
  ellipse(ctx, 0, 0, 25, 5, 'rgba(0,0,0,.22)', null);
  const shake = chip > 0 ? Math.sin(chip * 40) * 2 * chip : 0;
  ctx.translate(shake, 0);
  if (kind === 'flax') {
    for (let i = 0; i < 5; i++) { const fx = -16 + i * 8, h = depleted ? 6 : 26 + (i % 2) * 6, sw = Math.sin(t * 2 + i) * 1.5; ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, 0); ctx.quadraticCurveTo(fx + sw, -h / 2, fx + sw * 2, -h); ctx.stroke(); if (!depleted) circle(ctx, fx + sw * 2, -h - 2, 3.2, '#8ab0e8', OUT, 1); }
    ctx.restore(); return;
  }
  if (kind === 'tree' || kind === 'oak' || kind === 'willow' || kind === 'maple' || kind === 'yew' || kind === 'magic_tree') {
    const g = color, trunk = { oak: '#6a4524', willow: '#5a6a4a', maple: '#7a4a2a', yew: '#4a3220', magic_tree: '#5a5a7a' }[kind] || '#7a5530';
    if (depleted) {
      rrect(ctx, -10, -13, 20, 13, 3, shade(trunk, 0.9)); ellipse(ctx, 0, -13, 10, 4.5, '#d4b27a'); ellipse(ctx, 0, -13, 6, 2.6, '#b8935c', null); ellipse(ctx, 0, -13, 2.6, 1.2, '#d4b27a', null);
      rrect(ctx, 14, -4, 9, 4, 1.5, trunk, null);
    } else if (kind === 'willow') {
      rrect(ctx, -7, -50, 14, 50, 3, trunk); rrect(ctx, -7, -50, 4, 50, 2, 'rgba(0,0,0,.2)', null);
      poly(ctx, [[-28, -48], [-18, -72], [0, -84], [18, -72], [28, -48], [16, -40], [-16, -40]], g);
      poly(ctx, [[-28, -48], [-18, -72], [-2, -64], [-8, -44]], shade(g, 0.86), null);
      poly(ctx, [[0, -84], [18, -72], [4, -64], [-2, -64], [-18, -72]], shade(g, 1.18), null);
      poly(ctx, [[-28, -48], [-18, -72], [0, -84], [18, -72], [28, -48], [16, -40], [-16, -40]], null, OUT, 1.8);
      ctx.strokeStyle = shade(g, 0.7); ctx.lineWidth = 2;
      for (const dx of [-16, -6, 6, 16]) { ctx.beginPath(); ctx.moveTo(dx, -42); ctx.quadraticCurveTo(dx + 4, -20, dx + 8, -4); ctx.stroke(); }
    } else {
      rrect(ctx, -9, -54, 18, 54, 3, trunk); rrect(ctx, -9, -54, 6, 54, 2, 'rgba(0,0,0,.2)', null); rrect(ctx, 3, -40, 3, 12, 1, shade(trunk, 1.2), null);
      // blocky low-poly canopy: stacked faceted polygons
      poly(ctx, [[-34, -52], [-24, -80], [0, -96], [24, -80], [34, -52], [20, -44], [-20, -44]], g);
      poly(ctx, [[-34, -52], [-24, -80], [-4, -72], [-10, -48]], shade(g, 0.86), null); poly(ctx, [[0, -96], [24, -80], [6, -72], [-4, -72], [-24, -80]], shade(g, 1.18), null); poly(ctx, [[34, -52], [20, -44], [-4, -48], [6, -72], [24, -80]], shade(g, 0.78), null);
      poly(ctx, [[-34, -52], [-24, -80], [0, -96], [24, -80], [34, -52], [20, -44], [-20, -44]], null, OUT, 1.8);
      if (kind === 'magic_tree') for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.6; circle(ctx, Math.cos(a) * 22, -70 + Math.sin(a * 1.3) * 16, 2, '#d8f0ff', null); }
      if (kind === 'yew') { poly(ctx, [[-20, -44], [0, -30], [20, -44]], shade(g, 0.7), OUT, 1.4); }
    }
  } else {
    const dull = depleted, base = dull ? '#6d6d75' : kind === 'coal' ? '#4a4b52' : kind === 'rune_essence' ? '#c8c0a8' : '#8b8b96';
    poly(ctx, [[-31, 0], [-35, -16], [-22, -36], [-4, -43], [16, -38], [30, -22], [35, 0]], base);
    poly(ctx, [[-22, -36], [-4, -43], [-6, -26], [-20, -22]], shade(base, 1.22), null); poly(ctx, [[16, -38], [30, -22], [35, 0], [12, 0], [6, -24]], shade(base, 0.8), null);
    poly(ctx, [[-31, 0], [-35, -16], [-22, -36], [-4, -43], [16, -38], [30, -22], [35, 0]], null, OUT, 1.8);
    if (dull) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(-4, -18); ctx.lineTo(-12, -8); ctx.moveTo(14, -28); ctx.lineTo(10, -14); ctx.stroke(); }
    else for (const [dx, dy] of [[-15, -17], [7, -26], [20, -11], [-3, -8], [-22, -6]]) { poly(ctx, [[dx - 5, dy + 3], [dx - 3, dy - 5], [dx + 4, dy - 4], [dx + 6, dy + 3]], color, OUT, 1.1); circle(ctx, dx - 1.5, dy - 1.5, 1.5, 'rgba(255,255,255,.75)', null); }
  }
  ctx.restore();
}
export function drawStation(ctx, kind, x, y, s, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 0, 34, 6, 'rgba(0,0,0,.2)', null);
  if (kind === 'furnace') {
    poly(ctx, [[-32, 0], [-28, -60], [-14, -70], [14, -70], [28, -60], [32, 0]], '#9b8f86'); poly(ctx, [[-28, -60], [-14, -70], [14, -70], [28, -60], [0, -56]], '#b8aca2', null); rrect(ctx, -22, -86, 16, 22, 3, '#7c726a'); rrect(ctx, -20, -86, 12, 4, 2, '#4a443f', null);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) rrect(ctx, -26 + c * 13 + (r % 2) * 6, -8 - r * 14, 12, 12, 1, 'rgba(0,0,0,.07)', null);
    ctx.beginPath(); ctx.roundRect(-16, -38, 32, 34, [16, 16, 2, 2]); ctx.fillStyle = '#2b2233'; ctx.fill();
    const f = 0.8 + Math.sin(t * 9) * 0.2; circle(ctx, 0, -14, 10 * f, '#ff7a1e', null); circle(ctx, 0, -12, 6 * f, '#ffd34a', null); circle(ctx, 0, -10, 2.6 * f, '#fff3b0', null);
    ctx.globalAlpha = 0.25; ellipse(ctx, 0, -14, 26, 22, '#ff9a2e', null); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.roundRect(-32, 0, 64, 1, 0); ctx.fillStyle = OUT; ctx.fill();
  } else if (kind === 'anvil') {
    rrect(ctx, -18, -14, 36, 14, 3, '#4a3a2a'); rrect(ctx, -9, -26, 18, 14, 2, '#5a626c'); poly(ctx, [[-34, -42], [28, -42], [40, -35], [24, -26], [-24, -26], [-30, -34]], '#8a929c'); rrect(ctx, -30, -42, 44, 5, 2, '#c4ccd4', null); poly(ctx, [[28, -42], [40, -35], [24, -26]], '#6a727c', null);
    rrect(ctx, 12, -52, 5, 10, 1, '#7a5530'); rrect(ctx, 6, -58, 17, 8, 2, '#aab3bf');
  } else if (kind === 'fire') {
    for (const [dx, a] of [[-14, 0.3], [14, -0.3], [0, 0]]) { ctx.save(); ctx.translate(dx, -4); ctx.rotate(a + 1.57); rrect(ctx, -14, -3, 28, 6, 3, '#6a4524'); ctx.restore(); }
    for (let i = 0; i < 5; i++) circle(ctx, -22 + i * 11, 2, 4.5, i % 2 ? '#8b8b96' : '#6d6d75', OUT, 1.2);
    const f = 0.8 + Math.sin(t * 11) * 0.2, f2 = 0.8 + Math.sin(t * 7 + 1) * 0.2;
    poly(ctx, [[-14, -6], [-6, -34 * f], [0, -16], [6, -42 * f2], [14, -6]], '#ff8a1e'); poly(ctx, [[-7, -6], [0, -26 * f2], [8, -6]], '#ffd34a', null);
    for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i * 0.33) % 1; ctx.globalAlpha = 1 - u; circle(ctx, -6 + i * 6 + Math.sin(t * 3 + i) * 3, -40 - u * 26, 1.6, '#ffd34a', null); }
    ctx.globalAlpha = 1;
  } else if (kind === 'range') {
    rrect(ctx, -30, -52, 60, 52, 5, '#6a6f78'); rrect(ctx, -30, -52, 60, 6, 3, '#8a919b', null); rrect(ctx, -23, -42, 46, 22, 3, '#2b2233'); circle(ctx, -9, -31, 5.5 + Math.sin(t * 9) * 0.8, '#ff8a1e', null); circle(ctx, 9, -31, 5.5 + Math.cos(t * 9) * 0.8, '#ffd34a', null);
    rrect(ctx, -23, -17, 46, 5, 2, '#9aa3ad'); rrect(ctx, 20, -66, 8, 16, 2, '#4a4f58'); circle(ctx, 0, -7, 3, '#c9d6e3'); rrect(ctx, -26, -52, 8, 52, 2, 'rgba(255,255,255,.1)', null);
    ctx.globalAlpha = 0.5; for (let i = 0; i < 2; i++) { const u = (t * 0.6 + i * 0.5) % 1; ctx.globalAlpha = 0.5 * (1 - u); circle(ctx, 24 + Math.sin(t * 2 + i) * 3, -70 - u * 24, 4 + u * 4, '#ddd', null); } ctx.globalAlpha = 1;
  } else if (kind === 'bank') {
    rrect(ctx, -32, -36, 64, 36, 4, '#8a5a30'); rrect(ctx, -32, -36, 64, 6, 3, '#a56a38', null); ctx.beginPath(); ctx.roundRect(-32, -52, 64, 22, [16, 16, 0, 0]); ctx.fillStyle = '#a56a38'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
    for (const bx of [-22, 22]) rrect(ctx, bx - 3, -52, 6, 52, 1, '#d6b24a', null); rrect(ctx, -34, -30, 68, 6, 1, '#d6b24a'); rrect(ctx, -7, -35, 14, 16, 3, '#f1d77a'); circle(ctx, 0, -27, 2.2, OUT, null);
  } else if (kind === 'tanner') {
    rrect(ctx, -18, -24, 36, 24, 3, '#8a6a4a'); rrect(ctx, -16, -22, 32, 6, 2, '#6a4a3a', null);
    rrect(ctx, -12, -16, 8, 10, 2, '#c9a46a'); rrect(ctx, 2, -16, 8, 10, 2, '#b9824a');
    rrect(ctx, -4, -8, 8, 6, 1, '#e8d0a0', null);
  } else if (kind === 'store') {
    rrect(ctx, -32, -52, 5, 52, 1, '#6a4524'); rrect(ctx, 27, -52, 5, 52, 1, '#6a4524');
    for (let i = 0; i < 6; i++) { poly(ctx, [[-36 + i * 12, -74], [-24 + i * 12, -74], [-25 + i * 12, -52], [-35 + i * 12, -52]], i % 2 ? '#fff' : '#d8453c'); }
    rrect(ctx, -32, -24, 64, 24, 2, '#a56a38'); rrect(ctx, -32, -24, 64, 4, 1, '#c78a52', null); circle(ctx, -13, -30, 6, '#d8453c'); circle(ctx, 4, -30, 6, '#f7c948'); circle(ctx, 19, -30, 6, '#6fbf4a');
  } else if (kind === 'altar' || kind === 'prayer_altar') {
    const isPrayer = kind === 'prayer_altar';
    const gl = 0.6 + Math.sin(t * 3) * 0.25;
    const col = isPrayer ? '#c9a227' : '#b266ff';
    const col2 = isPrayer ? '#ffe27a' : '#e0b8ff';
    rrect(ctx, -30, -12, 60, 12, 2, '#6f6b7a'); rrect(ctx, -22, -26, 44, 15, 2, '#8a8698'); rrect(ctx, -22, -26, 44, 4, 2, '#aaa6b8', null);
    for (const [px] of [[-18], [18]]) { rrect(ctx, px - 3, -52, 6, 28, 1, '#6f6b7a'); circle(ctx, px, -54, 3.2, `rgba(${isPrayer ? '201,162,39' : '190,120,255'},${gl})`, null); }
    ctx.fillStyle = `rgba(${isPrayer ? '201,162,39' : '190,120,255'},${gl})`; for (const rx of [-12, -4, 4, 12]) rrect(ctx, rx - 1.5, -22, 3, 7, 1, ctx.fillStyle, null);
    const fy = -46 + Math.sin(t * 2) * 3; ctx.save(); ctx.translate(0, fy); ctx.rotate(t * 1.5); poly(ctx, [[0, -9], [6, 0], [0, 9], [-6, 0]], col, OUT, 1.5); poly(ctx, [[0, -9], [6, 0], [0, 0]], col2, null); ctx.restore();
    ctx.globalAlpha = 0.18; ellipse(ctx, 0, -40, 34, 30, col, null); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
export function drawSign(ctx, x, y, s, label, t = 0, left = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -3, -60, 6, 60, 2, '#7a5530'); rrect(ctx, -38, -88 + Math.sin(t * 3) * 1, 76, 30, 5, '#d6b075'); rrect(ctx, -38, -88 + Math.sin(t * 3) * 1, 76, 6, 4, '#e8c98f', null); ctx.fillStyle = OUT; ctx.font = 'bold 13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, 0, -68);
  if (left) poly(ctx, [[-30, -78], [-40, -73], [-30, -68]], '#c0392b', null); else poly(ctx, [[30, -78], [40, -73], [30, -68]], '#c0392b', null);
  ctx.restore();
}

// ================= scenery (world-anchored, behind the entities) =================
export const DECOR = {
  meadow: [['house', 140, 1], ['fence', 340, 480], ['house', 560, 2], ['bush', 640], ['fence', 860, 1000], ['lamp', 395], ['flower', 760], ['flower', 1130], ['bush', 1330], ['tree', 1380], ['flower', 1560], ['tree', 1800], ['bush', 2050], ['flower', 2100], ['fence', 2060, 2160]],
  quarry: [['rubble', 150], ['cart', 330], ['pine', 520], ['rubble', 900], ['pine', 1250], ['cart', 1600], ['rubble', 1900], ['pine', 2100]],
  peaks: [['pine', 200], ['snow', 400], ['pine', 700], ['rubble', 1000], ['pine', 1300], ['snow', 1500], ['pine', 1750]],
};
export function drawDecor(ctx, d, y, t = 0) {
  const [kind, x, a] = d;
  ctx.save(); ctx.translate(x, y);
  if (kind === 'house') {
    const wall = a === 2 ? '#b9a98f' : '#d9c8a0', roof = a === 2 ? '#7a3a2a' : '#a84a32';
    rrect(ctx, -46, -58, 92, 58, 2, wall); for (let r = 0; r < 4; r++) rrect(ctx, -46, -56 + r * 14, 92, 1.5, 1, 'rgba(0,0,0,.1)', null); rrect(ctx, -46, -58, 92, 58, 2, null, OUT, 1.8);
    poly(ctx, [[-56, -56], [0, -98], [56, -56]], roof); for (let i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-50 + i * 10, -58 - i * 7); ctx.lineTo(50 - i * 10, -58 - i * 7); ctx.stroke(); }
    rrect(ctx, -9, -34, 20, 34, 2, '#6a4524'); circle(ctx, 6, -16, 1.8, '#f1d77a', null); rrect(ctx, -38, -42, 20, 18, 2, '#9ad0f0'); rrect(ctx, -38, -34, 20, 2, 0, '#6a4524', null); rrect(ctx, -29, -42, 2, 18, 0, '#6a4524', null); rrect(ctx, 20, -40, 18, 16, 2, '#9ad0f0');
    if (a === 2) { rrect(ctx, 26, -92, 10, 28, 1, '#7c726a'); ctx.globalAlpha = 0.5; for (let i = 0; i < 3; i++) { const u = (t * 0.4 + i * 0.33) % 1; ctx.globalAlpha = 0.5 * (1 - u); circle(ctx, 31 + Math.sin(t + i) * 4, -96 - u * 30, 4 + u * 5, '#ddd', null); } ctx.globalAlpha = 1; }
  } else if (kind === 'fence') {
    const w = a - x;
    ctx.strokeStyle = OUT; for (const ry of [-22, -10]) rrect(ctx, 0, ry, w, 5, 1.5, '#a07a4a', OUT, 1.2);
    for (let px = 0; px <= w; px += 28) { rrect(ctx, px - 3, -32, 7, 32, 1.5, '#8a6a3e', OUT, 1.2); rrect(ctx, px - 3, -32, 7, 4, 1.5, '#b08a56', null); }
  } else if (kind === 'lamp') {
    rrect(ctx, -2, -70, 4, 70, 1, '#4a4f58'); rrect(ctx, -7, -84, 14, 15, 3, '#ffe9a0', OUT, 1.5); ctx.globalAlpha = 0.18 + Math.sin(t * 2) * 0.04; circle(ctx, 0, -76, 24, '#ffe27a', null); ctx.globalAlpha = 1;
  } else if (kind === 'bush') {
    circle(ctx, -11, -9, 12, '#4a8f3a'); circle(ctx, 8, -11, 14, '#5aa044'); circle(ctx, 0, -17, 10, '#6bb352', null); circle(ctx, 6, -13, 2, '#e0463c', null); circle(ctx, -8, -8, 2, '#e0463c', null);
  } else if (kind === 'flower') {
    for (let i = -2; i <= 2; i++) { const c = ['#f7c948', '#e0463c', '#fff', '#9b59d0', '#f7c948'][i + 2]; rrect(ctx, i * 9 - 0.8, -12 - (i & 1) * 3, 1.6, 12 + (i & 1) * 3, 0.5, '#3f7a2e', null); circle(ctx, i * 9, -13 - (i & 1) * 3, 3, c, null); circle(ctx, i * 9, -13 - (i & 1) * 3, 1, '#7a4a12', null); }
  } else if (kind === 'tree') {
    rrect(ctx, -6, -42, 12, 42, 2, '#6f5030'); circle(ctx, 0, -62, 24, '#3f8a33'); circle(ctx, -14, -50, 15, '#367a2c'); circle(ctx, 14, -50, 15, '#367a2c'); circle(ctx, 3, -68, 15, '#52a342', null);
  } else if (kind === 'pine') {
    rrect(ctx, -4, -16, 8, 16, 1, '#5a4028'); for (let i = 0; i < 3; i++) poly(ctx, [[-22 + i * 4, -14 - i * 22], [0, -52 - i * 22], [22 - i * 4, -14 - i * 22]], i % 2 ? '#2f6a3e' : '#2a5e38', OUT, 1.4);
    poly(ctx, [[-8, -62], [0, -96], [8, -62]], '#e8f2f8', null);
  } else if (kind === 'rubble') {
    poly(ctx, [[-22, 0], [-18, -12], [-6, -16], [4, -8], [2, 0]], '#8f8a84', OUT, 1.4); poly(ctx, [[2, 0], [8, -14], [20, -12], [26, 0]], '#a39d96', OUT, 1.4); poly(ctx, [[-6, -16], [4, -8], [-8, -8]], '#c4beb6', null);
  } else if (kind === 'cart') {
    rrect(ctx, -30, -28, 60, 20, 3, '#8a5a30', OUT, 1.5); rrect(ctx, -30, -28, 60, 5, 2, '#a56a38', null); for (const cx of [-16, 16]) { circle(ctx, cx, -6, 9, '#5a4028', OUT, 1.5); circle(ctx, cx, -6, 3, '#c9a46a', null); }
    for (const [dx, c] of [[-14, '#8b8b96'], [0, '#6d6d75'], [12, '#9a9aa4']]) poly(ctx, [[dx - 8, -28], [dx - 5, -38], [dx + 5, -38], [dx + 8, -28]], c, OUT, 1.2);
  } else if (kind === 'snow') {
    poly(ctx, [[-60, 0], [-20, -70], [0, -46], [24, -92], [64, 0]], '#9aa8b8', OUT, 1.6); poly(ctx, [[24, -92], [12, -60], [28, -66], [38, -52], [44, -62]], '#f4f8fc', null); poly(ctx, [[-20, -70], [-30, -48], [-14, -54], [0, -46]], '#f4f8fc', null);
  }
  ctx.restore();
}
/** grass-and-path ground band, pixel-tile style. Draws from the walking line down to `bottom` (world units). */
export function drawGround(ctx, theme, cam, viewW, gy, bottom, t = 0, area = 'meadow') {
  ctx.fillStyle = theme.ground; ctx.fillRect(0, gy - 6, viewW, bottom);
  ctx.fillStyle = shade(theme.ground, 1.18); ctx.fillRect(0, gy - 6, viewW, 6);
  ctx.fillStyle = shade(theme.ground, 0.7); ctx.fillRect(0, gy - 7, viewW, 1.5);
  // dirt path in the towns
  if (area === 'meadow') {
    const x0 = 120 - cam, x1 = 760 - cam; ctx.fillStyle = '#c9a874'; ctx.fillRect(x0, gy + 4, x1 - x0, 20); ctx.fillStyle = '#b8955f'; ctx.fillRect(x0, gy + 18, x1 - x0, 6);
    for (let i = 0; i < 40; i++) { const px = x0 + hash(i * 7) * (x1 - x0), py = gy + 7 + hash(i * 13) * 14; ctx.fillStyle = hash(i) > 0.5 ? '#d8bc8c' : '#a98650'; ctx.fillRect(px, py, 3, 2); }
  }
  // pixel tiles: 12px blocks with hashed shading, fading towards the bottom
  const T = 12, rows = Math.ceil((bottom - 10) / T) + 1, cols = Math.ceil(viewW / T) + 2, c0 = Math.floor(cam / T);
  for (let r = 0; r < Math.min(rows, 40); r++) {
    for (let c = 0; c < cols; c++) {
      const h = hash((c0 + c) * 928371 + r * 4097 + area.length * 17);
      if (h < 0.55) continue;
      ctx.fillStyle = h > 0.85 ? shade(theme.ground, 1.07) : shade(theme.ground, 0.94 - r * 0.008);
      const bx = (c0 + c) * T - cam, by = gy + 2 + r * T;
      ctx.fillRect(bx, by, T - 1, T - 1);
      if (h > 0.93) { ctx.fillStyle = shade(theme.ground, 0.7); ctx.fillRect(bx + 3, by - 3, 2, 5); ctx.fillRect(bx + 7, by - 5, 2, 7); }
    }
  }
}
