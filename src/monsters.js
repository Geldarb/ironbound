// OSRS-inspired monster models (original procedural canvas art). Origin = feet, faces +x, 1 unit = 1px at scale 1.
// Each drawer gets (ctx, a) with a = { t, swing (0..1 attack progress or null), ph (0..1..0 attack pulse), bob, seed, color }.
import { OUT, shade, circle, ellipse, rrect, poly, kf, limb, drawGlyph } from './art.js';

const dk = (c, f = 0.78) => shade(c, f);
const line = (ctx, pts, col, w = 2) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
const eye = (ctx, x, y, c = '#fff', r = 1.8) => { circle(ctx, x, y, r + 0.6, OUT, null); circle(ctx, x + 0.4, y - 0.3, r * 0.55, c, null); };
/** membrane wing (bat / dragon / demon / imp): root at (0,0), spreads up-back; `f` = flap 0..1 */
function wing(ctx, x, y, size, col, f, back = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.rotate(-0.25 - f * 0.55);
  const tip = [-34, -38], s1 = [-44, -8], s2 = [-30, 4];
  poly(ctx, [[0, 0], [-6, -20], tip, [-38, -22], s1, [-36, -6], s2, [-18, 2]], back ? dk(col, 0.82) : col, OUT, 2.4);
  line(ctx, [[0, 0], [-6, -20], tip], dk(col, 0.55), 3); line(ctx, [[-6, -20], s1], dk(col, 0.6), 1.6); line(ctx, [[-6, -20], s2], dk(col, 0.6), 1.6);
  ctx.restore();
}

/** blocky humanoid (goblins, guards, wizards, giants, skeletons...). spec = colours + gear. */
function humanoid(ctx, a, p) {
  const { t, swing, bob, seed } = a, sc = p.scale || 1;
  ctx.save(); ctx.scale(sc, sc);
  const skin = p.skin, top = p.top || skin, pants = p.pants || dk(top), hunch = p.hunch || 0;
  const walk = Math.sin(t * 3 + seed) * 0.05;
  // legs
  const legH = p.legH || 18;
  for (const [lx, far] of [[-4.5, 1], [4.5, 0]]) limb(ctx, lx, -legH, far ? walk : -walk, () => {
    rrect(ctx, -4.5, 0, 9, legH, 2, far ? dk(p.legC || pants, 0.8) : p.legC || pants);
    if (p.bony) { rrect(ctx, -1.6, 0, 3.2, legH, 1.5, far ? dk(skin) : skin); }
    rrect(ctx, -5, legH - 5, p.feet ? 12 : 11, 5, 2, far ? dk(p.boots || '#4a3420') : p.boots || '#4a3420');
  });
  const sho = -legH - 24 - bob;
  ctx.save(); ctx.translate(hunch, 0); ctx.rotate(hunch * 0.012);
  // far arm
  const armAng = p.armBack ?? (0.15 + Math.sin(t * 2 + seed) * 0.08);
  limb(ctx, -10, sho + 3, armAng, () => { rrect(ctx, -3.5, -2, 7, 21, 2.5, p.bony ? skin : dk(p.sleeve || top)); rrect(ctx, -3.2, 15, 6.4, 6, 2, dk(skin, 0.85)); if (p.shield) { ctx.translate(2, 12); ctx.scale(0.8, 0.8); drawGlyph(ctx, 'shield', p.shield, dk(p.shield, 0.55)); } });
  // tail (imp / demon / rat-men)
  if (p.tail) { line(ctx, [[-9, sho + 22], [-20, sho + 28 + Math.sin(t * 3) * 3], [-26, sho + 16]], p.tail, 3.2); poly(ctx, [[-26, sho + 12], [-30, sho + 18], [-23, sho + 18]], p.tail, OUT, 1.2); }
  if (p.wings) { wing(ctx, -6, sho + 6, p.wings[1], p.wings[0], 0.5 + 0.5 * Math.sin(t * (p.wingRate || 2.5) + seed)); }
  // torso
  if (p.bony) {
    rrect(ctx, -2, sho, 4, 24, 1.5, skin); for (let i = 0; i < 4; i++) rrect(ctx, -9, sho + 3 + i * 4.4, 18, 2.6, 1.3, skin, OUT, 1.4);
    rrect(ctx, -8, sho + 20, 16, 5, 2, skin);
  } else {
    rrect(ctx, -11, sho - 1, 22, 26, 3, top); rrect(ctx, -11, sho + 15, 22, 10, 2, dk(top, 0.86), null); rrect(ctx, -11, sho - 1, 5, 26, 2, 'rgba(0,0,0,.15)', null);
    if (p.robe) { poly(ctx, [[-11, sho + 20], [11, sho + 20], [14, -1], [-14, -1]], top); poly(ctx, [[-2, sho + 20], [2, sho + 20], [3, -1], [-3, -1]], dk(top, 0.8), null); if (p.trim) { rrect(ctx, -14, -5, 28, 4, 1, p.trim, null); rrect(ctx, -2, sho, 4, 20, 1, p.trim, null); } }
    if (p.belt) rrect(ctx, -11, sho + 19, 22, 4, 1, p.belt, null);
    if (p.stripes) for (let i = 0; i < 3; i++) rrect(ctx, -11, sho + 3 + i * 7, 22, 3, 1, p.stripes, null);
    if (p.plate) { poly(ctx, [[-7, sho + 2], [7, sho + 2], [5, sho + 13], [-5, sho + 13]], shade(top, 1.18), null); rrect(ctx, -12, sho - 2, 24, 5, 2, dk(top, 0.7), null); }
    if (p.chain) for (let y = sho + 2; y < sho + 22; y += 3.5) for (let x = -9; x < 10; x += 4) circle(ctx, x + ((y | 0) % 2), y, 1, dk(top, 0.75), null);
    if (p.moss) for (let i = 0; i < 5; i++) ellipse(ctx, -8 + i * 4, sho + 2 + (i % 2) * 8, 4, 3, '#4a7a2a', null);
  }
  // head
  const hy = sho - 1;
  if (p.neck !== false) rrect(ctx, -3, hy - 3, 6, 4, 1, dk(skin, 0.85), null);
  const hw = p.headW || 20, hh = p.headH || 19, hx = -hw / 2 + (p.headX || 0);
  if (p.skull) {
    rrect(ctx, hx, hy - hh, hw, hh - 5, 6, skin); rrect(ctx, hx + 4, hy - 7, hw - 6, 7, 2, skin);
    rrect(ctx, 2, hy - 13, 5, 5, 1.5, '#1a1418', null); rrect(ctx, -5, hy - 13, 5, 5, 1.5, '#1a1418', null); poly(ctx, [[1, hy - 7], [3, hy - 9], [5, hy - 7]], '#1a1418', null);
    for (let i = 0; i < 4; i++) rrect(ctx, hx + 6 + i * 3, hy - 4, 2, 3, 0.5, '#fff', OUT, 0.8);
  } else {
    rrect(ctx, hx, hy - hh, hw, hh, 3, skin); rrect(ctx, hx, hy - hh * 0.38, hw, hh * 0.38, 3, dk(skin, 0.88), null);
    if (p.ears) { poly(ctx, [[hx + 1, hy - hh + 7], [hx - 11, hy - hh + 1], [hx + 1, hy - hh + 13]], dk(skin, 0.9)); poly(ctx, [[hx + hw - 1, hy - hh + 7], [hx + hw + 9, hy - hh + 2], [hx + hw - 1, hy - hh + 12]], skin); }
    eye(ctx, hx + hw - 6, hy - hh + 8, p.eye || '#fff', 1.6);
    if (p.nose) rrect(ctx, hx + hw - 2, hy - hh + 9, 4, 4, 1.5, dk(skin, 0.8), null);
    if (p.teeth) { rrect(ctx, hx + hw - 10, hy - 4, 9, 3, 1, OUT, null); rrect(ctx, hx + hw - 8, hy - 4, 2, 2, 0.5, '#fff', null); rrect(ctx, hx + hw - 4, hy - 4, 2, 2, 0.5, '#fff', null); }
    else if (!p.beard) rrect(ctx, hx + hw - 8, hy - 5, 6, 1.6, 0.8, '#5a2a2a', null);
    if (p.beard) poly(ctx, [[hx + 4, hy - 6], [hx + hw, hy - 6], [hx + hw - 4, hy + 8], [hx + 8, hy + 6]], p.beard);
    if (p.patch) { rrect(ctx, hx + hw - 9, hy - hh + 5, 7, 6, 2, '#111', null); line(ctx, [[hx, hy - hh + 4], [hx + hw, hy - hh + 9]], '#111', 1.2); }
    if (p.horns) { poly(ctx, [[hx + 2, hy - hh + 2], [hx - 4, hy - hh - 12], [hx + 7, hy - hh]], p.horns); poly(ctx, [[hx + hw - 7, hy - hh], [hx + hw + 4, hy - hh - 13], [hx + hw - 1, hy - hh + 2]], p.horns); }
    if (p.hair) rrect(ctx, hx - 1, hy - hh - 2, hw + 2, 7, 3, p.hair);
    if (p.flameHair) for (let i = 0; i < 4; i++) { const fl = Math.sin(t * 9 + i * 2) * 2; poly(ctx, [[hx + i * 5, hy - hh + 1], [hx + 3 + i * 5, hy - hh - 10 - fl], [hx + 6 + i * 5, hy - hh + 1]], i % 2 ? '#ffd34a' : '#ff7a1e', null); }
    if (p.hat === 'wizard') { poly(ctx, [[hx - 5, hy - hh + 3], [hx + hw + 5, hy - hh + 3], [hx + hw / 2 + 4, hy - hh - 24]], p.hatC); rrect(ctx, hx - 6, hy - hh + 1, hw + 12, 4, 2, dk(p.hatC, 0.8)); if (p.stars) { circle(ctx, hx + hw / 2, hy - hh - 6, 1.6, '#ffe27a', null); circle(ctx, hx + hw / 2 + 4, hy - hh - 13, 1.2, '#ffe27a', null); } }
    if (p.hat === 'hood') { poly(ctx, [[hx - 3, hy + 1], [hx - 3, hy - hh - 2], [hx + hw / 2, hy - hh - 8], [hx + hw + 2, hy - hh - 1], [hx + hw + 2, hy - hh + 5], [hx + 4, hy - hh + 3], [hx + 2, hy + 1]], p.hatC); }
    if (p.hat === 'bandana') { rrect(ctx, hx - 1, hy - hh - 2, hw + 2, 7, 3, p.hatC); poly(ctx, [[hx, hy - hh + 2], [hx - 9, hy - hh + 6], [hx - 6, hy - hh - 1]], p.hatC); }
    if (p.hat === 'medhelm') { rrect(ctx, hx - 1.5, hy - hh - 3, hw + 3, 12, 5, p.hatC); rrect(ctx, hx - 1.5, hy - hh - 3, hw + 3, 3, 2, shade(p.hatC, 1.3), null); }
    if (p.hat === 'fullhelm') { rrect(ctx, hx - 1.5, hy - hh - 3, hw + 3, hh + 3, 4, p.hatC); rrect(ctx, hx + hw - 8, hy - hh + 6, 8, 3, 1, '#1a1418', null); rrect(ctx, hx + 2, hy - hh + 5, hw - 4, 1.5, 0.5, dk(p.hatC, 0.7), null); if (p.plume) poly(ctx, [[hx + 6, hy - hh - 3], [hx - 2, hy - hh - 14], [hx + 14, hy - hh - 9]], p.plume); }
    if (p.headwrap) rrect(ctx, hx - 1, hy - hh - 1, hw + 2, 8, 3, p.headwrap);
  }
  // near arm with weapon
  const w = p.weapon;
  let ang;
  if (w === 'bow') ang = swing == null ? 0.25 : kf(swing, [[0, 0.3], [0.2, 1.55], [0.75, 1.55], [1, 0.3]]);
  else if (w === 'staff' || p.cast) ang = swing == null ? 0.35 : kf(swing, [[0, 0.35], [0.35, 2.7], [0.6, 1.5], [1, 0.35]]);
  else if (p.reach) ang = 1.25 + (swing == null ? Math.sin(t * 2 + seed) * 0.08 : kf(swing, [[0, 0], [0.5, 0.25], [1, 0]]));
  else ang = swing == null ? 0.45 + Math.sin(t * 2.4 + seed) * 0.08 : kf(swing, [[0, 0.5], [0.35, 2.6], [0.55, 2.6], [0.72, 0.3], [1, 0.5]]);
  limb(ctx, 10, sho + 3, ang, () => {
    rrect(ctx, -3.5, -2, 7, 21, 2.5, p.bony ? skin : p.sleeve || top); if (!p.bony) rrect(ctx, -3.2, 13, 6.4, 8, 2, skin);
    ctx.translate(0, 19);
    if (!w) return;
    const glyph = { club: 'mace', sword: 'sword', scimitar: 'scimitar', longsword: 'longsword', dagger: 'dagger', spear: 'spear', staff: 'staff', bow: 'bow', hammer: 'warhammer' }[w];
    ctx.rotate(w === 'bow' ? Math.PI / 2 : Math.PI - (swing == null && w !== 'staff' ? 0.9 : 0.15)); ctx.scale(p.wScale || 0.75, p.wScale || 0.75); ctx.translate(0, w === 'staff' ? -6 : -14);
    drawGlyph(ctx, glyph, p.wColor || '#aab3bf', dk(p.wColor || '#aab3bf', 0.55));
    if (w === 'bow' && swing != null && swing < 0.75) line(ctx, [[0, -12], [-10 * Math.min(1, swing * 3), 0], [0, 12]], '#eee', 1);
    if (w === 'staff' && swing != null && swing > 0.25 && swing < 0.75) { ctx.globalAlpha = 0.7; circle(ctx, 0, -26, 9, p.orb || '#9ad0ff', null); ctx.globalAlpha = 1; }
  });
  ctx.restore(); ctx.restore();
}

function quadruped(ctx, a, p) {
  const { t, swing, bob, seed, ph } = a;
  ctx.save(); ctx.scale(p.scale || 1, p.scale || 1);
  const L = p.len || 46, H = p.legH || 16, fur = p.fur, fd = dk(fur, 0.75), gait = Math.sin(t * 5 + seed) * 0.12;
  if (p.tail) { ctx.save(); ctx.translate(-L / 2, -H - 14 - bob); ctx.rotate(p.tail.ang + Math.sin(t * 4 + seed) * 0.15); rrect(ctx, -p.tail.len, -3, p.tail.len, p.tail.w || 6, 3, p.tail.c || fd); ctx.restore(); }
  for (const [lx, far] of [[-L / 2 + 6, 1], [L / 2 - 8, 1], [-L / 2 + 11, 0], [L / 2 - 3, 0]]) limb(ctx, lx, -H - 2, (far ? 1 : -1) * gait, () => { rrect(ctx, -3.5, 0, 7, H + 2, 2, far ? fd : fur); if (p.hoof) rrect(ctx, -3.8, H - 3, 7.6, 5, 1.5, p.hoof, null); });
  rrect(ctx, -L / 2, -H - 20 - bob, L, 22, 8, fur); rrect(ctx, -L / 2 + 4, -H - 6 - bob, L - 8, 7, 4, p.belly || dk(fur, 0.88), null); rrect(ctx, -L / 2, -H - 20 - bob, L, 5, 4, shade(fur, 1.15), null);
  if (p.spots) for (const [sx, sy] of p.spots) ellipse(ctx, sx, sy - H - bob, 5, 4, '#2c2c34', null);
  const hx = L / 2 + 4 + ph * 7, hy = -H - 20 - bob + ph * 4;
  p.head(ctx, hx, hy, ph);
  ctx.restore();
}

const M = {};
M.goblin = (ctx, a) => humanoid(ctx, a, { skin: '#6fa83a', top: '#8a5a30', pants: '#6a4a28', ears: true, teeth: true, nose: true, eye: '#ffd34a', weapon: 'club', wColor: '#8a6a4a', scale: 0.88, headW: 22 });
M.goblin_archer = (ctx, a) => humanoid(ctx, a, { skin: '#6fa83a', top: '#4a6a2a', pants: '#5a4a28', ears: true, teeth: true, nose: true, eye: '#ffd34a', weapon: 'bow', wColor: '#8a5a30', scale: 0.88, headW: 22, hat: 'hood', hatC: '#3a5a22' });
M.hill_giant = (ctx, a) => humanoid(ctx, a, { skin: '#d8b48a', top: '#d8b48a', pants: '#7a5a38', belt: '#5a3a1a', nose: true, weapon: 'club', wColor: '#7a5a3a', wScale: 1.15, scale: 1.55, hair: '#5a3a1a', hunch: 3, headW: 22 });
M.moss_giant = (ctx, a) => humanoid(ctx, a, { skin: '#6a9a5a', top: '#6a9a5a', pants: '#4a3a22', belt: '#3a2a12', moss: true, nose: true, weapon: 'club', wColor: '#6a5a4a', wScale: 1.15, scale: 1.65, hair: '#3a6a2a', beard: '#3f6a2a', hunch: 3, headW: 22 });
M.fire_giant = (ctx, a) => humanoid(ctx, a, { skin: '#d8603c', top: '#c84a2c', pants: '#5a2a1a', belt: '#2a1a12', nose: true, weapon: 'sword', wColor: '#3a3a40', wScale: 1.25, scale: 1.75, flameHair: true, beard: '#ff9a2e', eye: '#ffe27a', hunch: 2, headW: 22 });
M.skeleton = (ctx, a) => humanoid(ctx, a, { skin: '#ece4cf', bony: true, skull: true, weapon: 'scimitar', wColor: '#9aa3ad', shield: '#7a7f8a', legC: '#ece4cf', boots: '#d8d0bb', neck: false });
M.zombie = (ctx, a) => humanoid(ctx, a, { skin: '#8fa878', top: '#6a5a4a', pants: '#4a4a5a', sleeve: '#6a5a4a', reach: true, eye: '#e8e070', teeth: true, hunch: 4, headX: 2 });
M.imp = (ctx, a) => humanoid(ctx, a, { skin: '#d8453c', top: '#c8352c', pants: '#a82a22', boots: '#7a1a14', ears: true, horns: '#3a1a14', tail: '#a82a22', wings: ['#8a2a22', 26], wingRate: 9, eye: '#ffe27a', teeth: true, scale: 0.62, cast: true, headW: 22 });
M.wizard = (ctx, a) => humanoid(ctx, a, { skin: '#f0c8a0', top: '#2f4fb8', robe: true, trim: '#d6b24a', beard: '#e8e8e8', hat: 'wizard', hatC: '#2f4fb8', stars: true, weapon: 'staff', wColor: '#3b8eea', orb: '#9ad0ff' });
M.dark_wizard = (ctx, a) => humanoid(ctx, a, { skin: '#d8b090', top: '#2a2030', robe: true, trim: '#8a1a2a', hat: 'hood', hatC: '#1e1626', eye: '#ff4a4a', weapon: 'staff', wColor: '#a02a3a', orb: '#ff6a3a' });
M.al_kharid_warrior = (ctx, a) => humanoid(ctx, a, { skin: '#b8865a', top: '#7a3a8a', pants: '#e8dcc0', belt: '#d6b24a', headwrap: '#e8dcc0', weapon: 'scimitar', wColor: '#c9d6e3' });
M.white_knight = (ctx, a) => humanoid(ctx, a, { skin: '#f0c8a0', top: '#e8ecf0', legC: '#d8dce4', plate: true, boots: '#b8bcc8', sleeve: '#d8dce4', hat: 'fullhelm', hatC: '#e8ecf0', plume: '#3b5fd8', weapon: 'longsword', wColor: '#e8ecf0', shield: '#e8ecf0' });
M.guard = (ctx, a) => humanoid(ctx, a, { skin: '#f0c8a0', top: '#9aa3ad', chain: true, pants: '#5a3a22', belt: '#3a2614', hat: 'medhelm', hatC: '#aab3bf', weapon: 'longsword', wColor: '#aab3bf' });
M.thief = (ctx, a) => humanoid(ctx, a, { skin: '#e0b890', top: '#3a3a3a', pants: '#2a2a2a', hat: 'hood', hatC: '#2a2a2a', weapon: 'dagger', wColor: '#c9d6e3' });
M.pirate = (ctx, a) => humanoid(ctx, a, { skin: '#e0b890', top: '#f0f0f0', stripes: '#c0392b', pants: '#2a3a6a', belt: '#3a2614', hat: 'bandana', hatC: '#c0392b', patch: true, beard: '#3a2614', weapon: 'scimitar', wColor: '#c9d6e3' });
const demon = (col, horn, sc) => (ctx, a) => humanoid(ctx, a, { skin: col, top: col, pants: dk(col, 0.8), boots: dk(col, 0.6), horns: horn, tail: dk(col, 0.85), wings: [dk(col, 0.9), 46], eye: '#ffe27a', teeth: true, scale: sc, hunch: 5, headW: 24, nose: true, legH: 22 });
M.greater_demon = demon('#b8322a', '#e8dcc0', 1.6);
M.black_demon = demon('#2c2830', '#a8a0a0', 1.8);

M.wolf = (ctx, a) => quadruped(ctx, a, { fur: '#9098a4', belly: '#c8ccd4', len: 48, tail: { ang: -0.5, len: 22, w: 8 }, head: wolfHead('#9098a4', '#f7c948') });
M.alpha_wolf = (ctx, a) => quadruped(ctx, a, { fur: '#454a56', belly: '#6a7080', len: 56, legH: 20, scale: 1.3, tail: { ang: -0.6, len: 26, w: 9 }, head: wolfHead('#454a56', '#ff4d4d', true) });
function wolfHead(fur, eyeC, scar) {
  return (ctx, hx, hy, ph) => {
    rrect(ctx, hx - 12, hy - 12, 22, 22, 6, fur); poly(ctx, [[hx + 6, hy - 6], [hx + 26, hy + 2 + ph * 3], [hx + 24, hy + 8 + ph * 5], [hx + 6, hy + 8]], shade(fur, 1.08));
    circle(ctx, hx + 25, hy + 2 + ph * 3, 2.6, OUT, null);
    if (ph > 0.3) { poly(ctx, [[hx + 8, hy + 8], [hx + 22, hy + 9 + ph * 5], [hx + 8, hy + 12 + ph * 4]], '#7a1a1a'); for (let i = 0; i < 3; i++) poly(ctx, [[hx + 10 + i * 4, hy + 8], [hx + 12 + i * 4, hy + 11], [hx + 14 + i * 4, hy + 8]], '#fff', OUT, 0.8); }
    poly(ctx, [[hx - 10, hy - 10], [hx - 7, hy - 24], [hx - 1, hy - 11]], dk(fur)); poly(ctx, [[hx - 2, hy - 11], [hx + 3, hy - 24], [hx + 8, hy - 10]], fur);
    rrect(ctx, hx + 2, hy - 5, 6, 4, 1.5, eyeC, null); rrect(ctx, hx + 5, hy - 4.5, 2, 3, 0.7, OUT, null);
    if (scar) line(ctx, [[hx - 2, hy - 10], [hx + 8, hy + 6]], '#9a2a2a', 2);
  };
}
M.giant_rat = (ctx, a) => quadruped(ctx, a, { fur: '#7a6a5a', belly: '#a89880', len: 34, legH: 6, tail: { ang: -0.15, len: 30, w: 3, c: '#e8a3a0' }, head: (ctx, hx, hy, ph) => {
  poly(ctx, [[hx - 8, hy - 6], [hx - 6, hy + 10], [hx + 18 + ph * 2, hy + 6], [hx + 18, hy + 2]], '#7a6a5a'); circle(ctx, hx + 18 + ph * 2, hy + 4, 2.4, '#e8a3a0', OUT, 1);
  circle(ctx, hx - 2, hy - 6, 5.5, '#e8a3a0', OUT, 1.6); eye(ctx, hx + 6, hy, '#f33', 1.4);
  line(ctx, [[hx + 15, hy + 4], [hx + 24, hy + 1]], '#ddd', 0.8); line(ctx, [[hx + 15, hy + 5], [hx + 24, hy + 7]], '#ddd', 0.8);
  if (ph > 0.3) { rrect(ctx, hx + 12, hy + 6, 2, 4, 0.5, '#fff', OUT, 0.8); rrect(ctx, hx + 14.5, hy + 6, 2, 4, 0.5, '#fff', OUT, 0.8); }
} });
M.scorpion = (ctx, a) => {
  const { t, swing, bob, seed } = a, c = '#2a2a30', hi = '#4a4a58';
  for (let i = 0; i < 4; i++) { const k = Math.sin(t * 8 + i + seed) * 1.5; line(ctx, [[-10 + i * 7, -8], [-14 + i * 7, -3 + k], [-16 + i * 7, 0]], c, 2.4); }
  ellipse(ctx, 0, -10 - bob, 18, 8, c); ellipse(ctx, 0, -12 - bob, 12, 4, hi, null);
  // tail arcs over the back; strikes forward on attack
  const st = swing == null ? Math.sin(t * 2 + seed) * 0.1 : kf(swing, [[0, 0], [0.4, -0.3], [0.6, 1.1], [1, 0]]);
  let x = -16, y = -12 - bob, ang = -1.9 + st; const seg = [];
  for (let i = 0; i < 5; i++) { seg.push([x, y]); x += Math.cos(ang) * 8; y += Math.sin(ang) * 8; ang += 0.55 + st * 0.15; }
  for (const [sx, sy] of seg) circle(ctx, sx, sy, 4.6, c); circle(ctx, x, y, 4, '#8a2a2a'); poly(ctx, [[x + 2, y - 2], [x + 10, y + 3], [x + 2, y + 3]], '#d8d8d8', OUT, 1.2);
  // claws
  const cl = swing == null ? 0 : Math.sin(swing * Math.PI) * 6;
  for (const dy of [-3, 3]) { line(ctx, [[14, -10 + dy - bob], [22 + cl, -14 + dy - bob]], c, 3); ellipse(ctx, 27 + cl, -15 + dy - bob, 6, 3.6, hi); poly(ctx, [[30 + cl, -16 + dy - bob], [36 + cl, -19 + dy - bob], [33 + cl, -13 + dy - bob]], c, OUT, 1); }
  eye(ctx, 14, -14 - bob, '#d33', 1.2);
};
M.bat = (ctx, a) => {
  const { t, bob, seed } = a, f = 0.5 + 0.5 * Math.sin(t * 14 + seed), y = -34 - Math.sin(t * 3 + seed) * 4;
  ctx.save(); ctx.translate(0, y);
  wing(ctx, -2, 0, 26, '#3a2a22', f); ctx.save(); ctx.scale(-1, 1); wing(ctx, -2, 0, 26, '#4a382c', f, false); ctx.restore();
  ellipse(ctx, 0, 2, 6, 7, '#3a2a22'); circle(ctx, 2, -6, 5, '#4a382c'); poly(ctx, [[-1, -9], [0, -15], [2, -10]], '#4a382c', OUT, 1); poly(ctx, [[3, -10], [5, -15], [6, -9]], '#4a382c', OUT, 1);
  circle(ctx, 4, -6.5, 1.2, '#ff3a2a', null); rrect(ctx, 4, -3, 1.2, 2.5, 0.4, '#fff', null);
  ctx.restore(); void bob;
};
M.seagull = (ctx, a) => {
  const { t, swing, seed } = a, hop = swing == null ? 0 : Math.sin(swing * Math.PI) * 6;
  line(ctx, [[-2, -10], [-2, 0]], '#e8a33a', 2); line(ctx, [[3, -10], [3, 0]], '#e8a33a', 2);
  ellipse(ctx, 0, -17 - hop, 13, 8, '#f6f6f6'); poly(ctx, [[-11, -19 - hop], [-20, -14 - hop], [-11, -13 - hop]], '#2a2a2a');
  ctx.save(); ctx.translate(-2, -20 - hop); ctx.rotate(Math.sin(t * 3 + seed) * 0.15 - (swing != null ? 0.8 : 0)); ellipse(ctx, -4, 0, 11, 5, '#a8b0b8'); ellipse(ctx, -12, 0, 4, 3, '#2a2a2a', null); ctx.restore();
  circle(ctx, 11, -26 - hop, 6, '#f6f6f6'); poly(ctx, [[16, -27 - hop], [24, -25 - hop], [16, -23 - hop]], '#f0c030', OUT, 1.2); circle(ctx, 18.5, -24.5 - hop, 1, '#d33', null); eye(ctx, 13, -28 - hop, '#fff', 1.1);
};
M.chaos_elemental = (ctx, a) => {
  const { t, swing } = a, k = swing == null ? 0 : Math.sin(swing * Math.PI);
  const cols = ['#d8453c', '#f7c948', '#3fb950', '#3b8eea', '#b266ff'];
  for (let i = 0; i < 14; i++) { const r = 14 + i * 1.8, ang = t * (1.5 + i * 0.2) + i; ctx.globalAlpha = 0.85; ellipse(ctx, Math.cos(ang) * (4 + i * 0.6), -14 - i * 5.5 + Math.sin(ang) * 3, r * (1 + k * 0.15), r * 0.32, cols[i % 5], i % 3 ? null : OUT); }
  ctx.globalAlpha = 1; ellipse(ctx, 0, -62, 11, 13, '#1a1020'); circle(ctx, -4, -64, 2.6, '#ff4a4a', null); circle(ctx, 4, -64, 2.6, '#ff4a4a', null);
  for (const s of [-1, 1]) line(ctx, [[s * 16, -56], [s * (34 + k * 8), -70 + Math.sin(t * 4) * 5]], '#2a1830', 5);
};
/** OSRS-style dragon: quadruped with long neck, horns, bat wings, spiked tail. */
const dragon = (body, belly, wingC, horn, sc) => (ctx, a) => {
  const { t, swing, bob, seed } = a;
  ctx.save(); ctx.scale(sc, sc);
  const breath = swing == null ? 0 : kf(swing, [[0, 0], [0.3, -0.35], [0.6, 0.35], [1, 0]]);
  const fl = 0.5 + 0.5 * Math.sin(t * 2.2 + seed), b = bob * 1.4;
  // tail (spiked, tapering), far legs, far wing
  ctx.save(); ctx.translate(-26, -30 - b); ctx.rotate(0.25 + Math.sin(t * 1.6 + seed) * 0.12);
  poly(ctx, [[0, -8], [-28, -2], [-50, 8], [-58, 10], [-50, 4], [-28, 6], [0, 8]], body); for (let i = 0; i < 4; i++) poly(ctx, [[-8 - i * 11, -6 + i * 2], [-12 - i * 11, -13 + i * 2], [-15 - i * 11, -4 + i * 2]], horn, OUT, 1.2);
  poly(ctx, [[-56, 8], [-66, 2], [-62, 14]], horn, OUT, 1.4); ctx.restore();
  wing(ctx, -10, -50 - b, 48, dk(wingC, 0.8), fl);
  for (const [lx, far] of [[-20, 1], [16, 1]]) { rrect(ctx, lx - 5, -26, 10, 26, 3, far ? dk(body, 0.7) : body); }
  // body
  ellipse(ctx, -4, -34 - b, 30, 17, body); ellipse(ctx, -2, -24 - b, 24, 7, belly, null);
  for (let i = 0; i < 5; i++) poly(ctx, [[-22 + i * 9, -48 - b], [-18 + i * 9, -56 - b], [-14 + i * 9, -48 - b]], horn, OUT, 1.2);
  // near legs with claws
  for (const lx of [-14, 22]) { rrect(ctx, lx - 6, -28, 12, 28, 4, body); rrect(ctx, lx - 7, -4, 15, 5, 2, dk(body, 0.7), null); for (let i = 0; i < 3; i++) poly(ctx, [[lx - 6 + i * 5, 0], [lx - 4 + i * 5, 3], [lx - 2 + i * 5, 0]], '#e8e0d0', OUT, 0.8); }
  // neck: segmented curve up and forward
  const nx = [18, 28, 36, 42], ny = [-40, -54, -66, -76];
  for (let i = 0; i < 4; i++) { const ox = nx[i] + breath * i * 6, oy = ny[i] - b + breath * i * 4; ellipse(ctx, ox, oy, 10 - i, 9 - i * 0.5, body); ellipse(ctx, ox + 3, oy + 3, 6 - i, 4, belly, null); }
  // head
  ctx.save(); ctx.translate(48 + breath * 20, -84 - b + breath * 14); ctx.rotate(breath * 0.6);
  poly(ctx, [[-10, -8], [8, -10], [28, -4], [30, 2], [8, 4], [-8, 6]], body); // upper jaw/skull
  const jaw = swing != null && swing > 0.3 && swing < 0.8 ? 0.45 : 0.05;
  ctx.save(); ctx.translate(-2, 4); ctx.rotate(jaw); poly(ctx, [[-6, 0], [26, -1], [24, 5], [-4, 6]], dk(body, 0.85)); if (jaw > 0.2) for (let i = 0; i < 4; i++) poly(ctx, [[4 + i * 5, -1], [6 + i * 5, -5], [8 + i * 5, -1]], '#fff', OUT, 0.7); ctx.restore();
  poly(ctx, [[-6, -8], [-22, -20], [-3, -11]], horn, OUT, 1.6); poly(ctx, [[2, -9], [-10, -24], [6, -10]], shade(horn, 1.1), OUT, 1.6);
  rrect(ctx, 6, -8, 6, 4, 1.5, '#ffd34a', null); rrect(ctx, 9, -7.5, 2, 3, 0.6, OUT, null);
  circle(ctx, 27, -2, 1.4, OUT, null);
  ctx.restore();
  wing(ctx, -2, -46 - b, 50, wingC, fl, false);
  ctx.restore();
};
M.green_dragon = dragon('#3e8f3a', '#9ccf6a', '#5aa83e', '#e8dcb0', 1);
M.bronze_dragon = dragon('#b87a3e', '#e0b07a', '#c98f50', '#5a3a1a', 1.1);
M.iron_dragon = dragon('#6a6e76', '#a8acb4', '#7a7f88', '#2a2a30', 1.15);
M.steel_dragon = dragon('#9aa8b6', '#d8e0e8', '#aab6c2', '#3a4048', 1.2);

export const MONSTER_ART = M;
/** approximate on-screen height (for HP bars, splats, tap targets) */
// Camelot / Ardougne
M.paladin = (ctx, a) => humanoid(ctx, a, { skin: '#f0c8a0', top: '#e8ecf0', legC: '#d8dce4', plate: true, boots: '#b8bcc8', sleeve: '#d8dce4', trim: '#d6b24a', hat: 'fullhelm', hatC: '#f0f0f4', plume: '#d6b24a', weapon: 'longsword', wColor: '#f3e7b0', shield: '#f0d878' });
M.knight_of_ardougne = (ctx, a) => humanoid(ctx, a, { skin: '#f0c8a0', top: '#aab3bf', legC: '#9aa3ad', plate: true, boots: '#7a828c', sleeve: '#9aa3ad', hat: 'medhelm', hatC: '#aab3bf', weapon: 'longsword', wColor: '#c9d6e3', shield: '#3b5fd8' });
M.hero = (ctx, a) => humanoid(ctx, a, { skin: '#e8b890', top: '#8a1a2a', chain: true, pants: '#3a2a22', belt: '#d6b24a', hair: '#3a2a1a', beard: '#3a2a1a', weapon: 'longsword', wColor: '#e8ecf0', shield: '#8a1a2a' });
const unicornHead = (ctx, x, y, ph) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35 + ph * 0.5);
  rrect(ctx, -8, -14, 12, 20, 5, '#f4f4fa'); rrect(ctx, -2, -12, 20, 11, 5, '#f4f4fa'); rrect(ctx, 13, -9, 6, 7, 3, '#e8d8e8', null);
  poly(ctx, [[4, -14], [10, -34], [9, -13]], '#f3d77a', OUT, 1.2); for (let i = 0; i < 3; i++) rrect(ctx, 4.5 + i * 1.2, -18 - i * 5, 4, 1.2, 0.5, '#c9a43a', null);
  rrect(ctx, -11, -14, 6, 22, 3, '#d8c8f0', null); circle(ctx, 6, -8, 1.8, '#2a2030', null); poly(ctx, [[-4, -16], [-1, -22], [1, -15]], '#f4f4fa', OUT, 1);
  ctx.restore();
};
M.unicorn = (ctx, a) => quadruped(ctx, a, { fur: '#f4f4fa', belly: '#e4e4ee', len: 50, legH: 20, hoof: '#c9a43a', tail: { ang: -0.6, len: 22, w: 7, c: '#d8c8f0' }, head: unicornHead });
export const MON_HEIGHT = { paladin: 78, knight_of_ardougne: 74, hero: 72, unicorn: 70, goblin: 62, goblin_archer: 62, hill_giant: 112, moss_giant: 118, fire_giant: 126, skeleton: 70, zombie: 66, imp: 48, wizard: 82, dark_wizard: 78, al_kharid_warrior: 70, white_knight: 76, guard: 72, thief: 70, pirate: 70, greater_demon: 118, black_demon: 132, wolf: 54, alpha_wolf: 76, giant_rat: 34, scorpion: 48, bat: 60, seagull: 40, chaos_elemental: 100, green_dragon: 112, bronze_dragon: 122, iron_dragon: 128, steel_dragon: 134, chicken: 46, cow: 52 };
