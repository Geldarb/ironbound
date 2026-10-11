// art gallery: draws poses/weapons/monsters onto a canvas inside the page and screenshots it
export default async function art({ page, G, shot }) {
  const draw = async (name, spec) => {
    await G(async (spec) => {
      const A = await import('/src/art.js'); const D = await import('/src/data.js');
      document.querySelectorAll('#gallery').forEach((n) => n.remove());
      const cv = document.createElement('canvas'); cv.id = 'gallery'; cv.width = spec.w * 2; cv.height = spec.h * 2; cv.style.cssText = `position:fixed;left:0;top:0;width:${spec.w}px;height:${spec.h}px;z-index:99999;background:#cfe8f7`;
      document.body.appendChild(cv); const ctx = cv.getContext('2d'); ctx.scale(2, 2);
      ctx.fillStyle = '#7fbf5a'; ctx.fillRect(0, spec.h * 0.72, spec.w, spec.h); 
      let x = 40;
      for (const it of spec.items) {
        if (it.hero) A.drawHero(ctx, x, spec.h * 0.72 + 14, it.s || 1.6, { look: 0, dir: 1, t: 1.3, ...it.hero });
        else if (it.mon) A.drawMonster(ctx, it.mon, x, spec.h * 0.72 + 14, it.s || 1.4, { dir: -1, t: 1.3, color: D.MONSTERS[it.mon].color, swing: it.swing ?? null });
        else if (it.node) A.drawNode(ctx, it.node, x, spec.h * 0.72 + 14, 1.4, !!it.dep, D.NODES[it.node].color, 1.0);
        else if (it.st) A.drawStation(ctx, it.st, x, spec.h * 0.72 + 14, 1.2, 1.0);
        else if (it.glyph) { ctx.save(); ctx.translate(x, spec.h * 0.72 - 30); ctx.scale(1.2, 1.2); const t = D.ITEMS[it.glyph]; A.drawGlyph(ctx, t.art, t.c, t.d); ctx.restore(); }
        x += it.dx || 80;
      }
    }, spec);
    await shot(name, { x: 0, y: 0, width: spec.w, height: spec.h });
  };
  const full = { weapon: 'iron_scimitar', head: 'iron_helm', body: 'iron_body', legs: 'iron_legs', shield: 'iron_shield', boots: 'iron_boots', gloves: 'iron_gloves' };
  const tiers = ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune'];
  await draw('art-tiers', { w: 390, h: 300, items: tiers.map((t) => ({ hero: { equip: { weapon: `${t}_sword`, head: `${t}_helm`, body: `${t}_body`, legs: `${t}_legs`, shield: `${t}_shield`, boots: `${t}_boots`, gloves: `${t}_gloves` }, state: 'idle' }, s: 1.0, dx: 64 })) });
  const ws = ['dagger', 'sword', 'scimitar', 'longsword', 'mace', 'warhammer', 'axe', 'battleaxe', '2h', 'spear', 'halberd'];
  await draw('art-weapons', { w: 390, h: 200, items: ws.map((w) => ({ glyph: `rune_${w}`, dx: 34 })) });
  const atk = (w, type, p, two) => ({ hero: { equip: { ...full, weapon: `iron_${w}`, shield: two ? null : 'iron_shield' }, state: 'attack', swingP: p, atkType: type, two }, s: 1.2, dx: 90 });
  await draw('art-attack-stab', { w: 390, h: 260, items: [0.1, 0.3, 0.5, 0.7].map((p) => atk('dagger', 'stab', p)) });
  await draw('art-attack-slash', { w: 390, h: 260, items: [0.1, 0.3, 0.5, 0.7].map((p) => atk('scimitar', 'slash', p)) });
  await draw('art-attack-crush', { w: 390, h: 260, items: [0.1, 0.4, 0.55, 0.7].map((p) => atk('mace', 'crush', p)) });
  await draw('art-attack-2h', { w: 390, h: 300, items: [0.1, 0.35, 0.55, 0.75].map((p) => atk('2h', 'slash', p, true)) });
  await draw('art-monsters', { w: 390, h: 220, items: ['chicken', 'cow', 'goblin', 'wolf'].map((m) => ({ mon: m, dx: 95 })) });
  await draw('art-monsters2', { w: 390, h: 260, items: [{ mon: 'hill_giant', dx: 150, s: 1 }, { mon: 'alpha_wolf', dx: 150, s: 1 }, { mon: 'goblin', swing: 0.5, dx: 90 }] });
  await draw('art-nodes', { w: 390, h: 200, items: [{ node: 'copper' }, { node: 'copper', dep: 1 }, { node: 'tree' }, { node: 'tree', dep: 1 }, { node: 'pond', dx: 100 }].map((i) => ({ ...i, dx: i.dx || 70 })) });
  await draw('art-stations', { w: 390, h: 200, items: ['furnace', 'anvil', 'fire', 'altar', 'bank'].map((st) => ({ st, dx: 76 })) });
  const gat = (tool, id, p) => ({ hero: { equip: { ...full, weapon: null }, state: 'gather', tool, toolId: id, swingP: p, aim: 70 }, s: 1.2, dx: 90 });
  await draw('art-gather', { w: 390, h: 260, items: [gat('pickaxe', 'iron_pickaxe', 0.45), gat('axe', 'iron_axe', 0.3), gat('rod', 'fishing_rod', 0.5), gat('net', 'small_net', 0.4)] });
  const pose = (name, p) => ({ hero: { equip: full, pose: { name, p, item: 'fish' } }, s: 1.2, dx: 90 });
  await draw('art-poses', { w: 390, h: 260, items: [pose('eat', 0.4), pose('cook', 0.3), pose('smith', 0.55), pose('cheer', 0.3)] });
}
