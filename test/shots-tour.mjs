// Screenshot tour for the README / release notes (390x844 touch). Run via: node test/shots.mjs tour
export default async function tour({ page, G, tap, touch, shot, warpTo, select, setXp, give, sleep }) {
  const ALL = ['iron_scimitar', 'iron_helm', 'iron_body', 'iron_legs', 'iron_shield', 'iron_boots', 'iron_gloves'];
  await setXp({ attack: 40, strength: 40, defence: 40, hitpoints: 40, mining: 40, smithing: 40, woodcutting: 30, fishing: 20, cooking: 20 });
  await G(() => { window.__ib.game.data.ep = 300; window.__ib.game.data.coins = 250; });
  await give([...ALL.map((i) => [i, 1]), ['rune_2h', 1], ['mithril_mace', 1], ['steel_spear', 1], ['adamant_halberd', 1], ['iron_bar', 12], ['bronze_bar', 6], ['coal', 20], ['iron_ore', 5], ['raw_shrimp', 4]]);
  await G((ALL) => { const g = window.__ib.game; for (const id of ALL) g.equip(id); }, ALL);
  // enchants of every rarity, on worn gear and spare bag items
  await G(() => {
    const g = window.__ib.game, d = g.data;
    d.equipEnch.weapon = { r: 4, rolls: 2, mods: [{ k: 'maxhit', v: 17 }, { k: 'crit', v: 12 }, { k: 'vs', v: 33, fam: 'beast' }] };
    d.equipEnch.head = { r: 1, rolls: 1, mods: [{ k: 'xp', v: 4.5 }] };
    d.equipEnch.body = { r: 3, rolls: 3, mods: [{ k: 'def', v: 12 }, { k: 'regen', v: 20 }] };
    d.equipEnch.shield = { r: 2, rolls: 1, mods: [{ k: 'drop', v: 8 }, { k: 'xp', v: 6 }] };
    d.equipEnch.boots = { r: 5, rolls: 4, mods: [{ k: 'def', v: 24 }, { k: 'drop', v: 22 }, { k: 'regen', v: 36 }] };
    for (const s of d.bag) { if (s.id === 'mithril_mace') s.e = { r: 3, rolls: 2, mods: [{ k: 'burn', v: 18 }, { k: 'speed', v: 9 }, { k: 'lifesteal', v: 8 }] }; if (s.id === 'steel_spear') s.e = { r: 0, rolls: 1, mods: [{ k: 'acc', v: 4 }] }; if (s.id === 'rune_2h') s.e = { r: 5, rolls: 5, mods: [{ k: 'maxhit', v: 36 }, { k: 'speed', v: 18 }, { k: 'crit', v: 30 }] }; }
    g.emit('change');
  });
  await G(() => document.getElementById('toasts').innerHTML = '');
  // 1. scene art: fight at the chickens
  await warpTo('chicken', -120); await select('chicken'); await sleep(2200);
  await shot('scene-fight');
  // 2. gear tab with enchant colours
  await tap('#nav [data-tab="gear"]'); await sleep(300);
  await G(() => { document.getElementById('sheetBody').scrollTop = 120; });
  await shot('gear-enchants');
  await G(() => window.__ib.ui.close());
  // 3. bag with enchanted gear + compare popup
  await tap('#nav [data-tab="bag"]'); await sleep(250); await shot('bag-enchants');
  await tap('.cell[data-item="mithril_mace"]'); await sleep(250); await shot('inspect-compare');
  await tap('#mX'); await G(() => window.__ib.ui.close());
  // 4. enchanting altar (reroll pending: keep new / keep old)
  await warpTo('altar', 70); await sleep(200);
  await G(() => { const g = window.__ib.game; const ui = window.__ib.ui; g.data.visited.altar = true; ui.altar = { loc: { where: 'bag', idx: g.data.bag.findIndex((s) => s.id === 'mithril_mace') }, cand: null, lock: 1 }; ui.open('altar'); });
  await sleep(300); await tap('#rollBtn'); await sleep(400); await shot('altar-reroll');
  await tap('#keepNew'); await sleep(250); await shot('altar');
  await G(() => window.__ib.ui.close());
  // 5. smithing menu: weapon list per tier
  await G(() => { const ui = window.__ib.ui; ui.craftMenu = 'anvil'; ui.smithTier = 1; window.__ib.game.data.visited.anvil = true; ui.open('craft'); });
  await sleep(300); await shot('smithing-weapons');
  await G(() => { document.getElementById('sheetBody').scrollTop = 260; }); await sleep(150); await shot('smithing-weapons2');
  await G(() => { const ui = window.__ib.ui; ui.smithTier = 5; ui.renderSheet(); });
  await sleep(200); await shot('smithing-rune');
  await G(() => window.__ib.ui.close());
  // 6. 2h attack frame (zoomed in for the art)
  await G(() => { const g = window.__ib.game; g.equip('rune_2h'); window.__ib.scene.setZoom(1.1); });
  await warpTo('goblin', -140); await select('goblin'); await sleep(900);
  await G(() => { const h = window.__ib.game.hero; window.__hold = setInterval(() => { h.swing = 0.45 * 0.52; h.swingDur = 0.45; }, 4); });
  await sleep(250); await shot('attack-2h');
  await G(() => { clearInterval(window.__hold); });
  // stance row for a 2h, then a scimitar
  await shot('stance-2h');
  // 7. mining and fishing animations
  await G(() => { const g = window.__ib.game; g.clearTarget(); g.equip('iron_scimitar'); });
  await warpTo('copper', -70); await select('copper'); await sleep(1200);
  await G(() => { const h = window.__ib.game.hero; window.__hold = setInterval(() => { h.swing = 0.45 * 0.55; h.swingDur = 0.45; for (const e of window.__ib.game.ents) if (e.kind === 'copper') e.dead = 0; }, 4); });
  await sleep(120); await G(() => window.__ib.scene.burst(window.__ib.game.ents.find((e) => e.kind === 'copper').x, 296 - 28, 'stone', 8, '#c97a3a')); await sleep(30); await shot('mining');
  await G(() => clearInterval(window.__hold));
  await warpTo('pond', -75); await select('pond'); await sleep(1400);
  await G(() => { const h = window.__ib.game.hero; window.__hold = setInterval(() => { h.swing = 0.45 * 0.5; h.swingDur = 0.45; }, 4); });
  await sleep(100); await G(() => window.__ib.scene.burst(window.__ib.game.ents.find((e) => e.kind === 'pond').x, 296 - 4, 'splash', 10)); await sleep(30); await shot('fishing');
  await G(() => clearInterval(window.__hold));
  await warpTo('tree', -70); await select('tree'); await sleep(1200);
  await G(() => { const h = window.__ib.game.hero; window.__hold = setInterval(() => { h.swing = 0.45 * 0.5; h.swingDur = 0.45; }, 4); });
  await sleep(100); await G(() => window.__ib.scene.burst(window.__ib.game.ents.find((e) => e.kind === 'tree').x, 296 - 40, 'chip', 10)); await sleep(30); await shot('woodcutting');
  await G(() => clearInterval(window.__hold));
  // 8. level-up fireworks + eating
  await G(() => { const g = window.__ib.game; g.clearTarget(); g.data.xp.strength = window.__ib.xpForLevel(41) - 1; g.gain('strength', 5); });
  await sleep(450); await shot('levelup');
  await G(() => { window.__ib.scene.setZoom(0.7); });
  await shot('scene-default');
}
