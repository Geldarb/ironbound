// DOM UI: HUD, target panel, stance row, nav + bottom sheets (gear, skills, bag/bank/shop, craft, map, settings).
import { SKILLS, STANCES, SLOTS, ITEMS, NODES, MONSTERS, AREAS, AREA_IDS, RECIPES, STATIONS, SHOP_BUY, BAG_SLOTS, TIERS } from './data.js';
import { levelProgress, xpForLevel } from './xp.js';
import { heroHitChance } from './combat.js';
import { iconURL } from './art.js';
import { $, el, esc, fmt, setText } from './dom.js';

const NAV = [
  { id: 'gear', i: '🛡', t: 'Gear' }, { id: 'skills', i: '📊', t: 'Skills' }, { id: 'bag', i: '🎒', t: 'Bag' },
  { id: 'craft', i: '🔨', t: 'Craft' }, { id: 'map', i: '🗺', t: 'Map' },
];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const img = (id) => `<img alt="" src="${iconURL(id)}">`;
const itemName = (id) => ITEMS[id]?.name || id;

export class UI {
  constructor(game, onReset) {
    this.g = game; this.onReset = onReset; this.sheet = null; this.mode = {}; this.dirty = true; this.acc = 0;
    this.craftMenu = 'furnace';
    this.buildNav(); this.buildStance();
    $('sheetClose').onclick = () => this.close();
    $('btnMenu').onclick = () => this.open('settings');
    $('btnFull').onclick = () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen?.(); else d.requestFullscreen?.().catch(() => {}); };
    $('modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') this.closeModal(); });
    game.on((t, p) => this.onEvent(t, p));
  }
  onEvent(t, p) {
    if (t === 'toast') this.toast(p.msg);
    else if (t === 'level') this.toast(`${cap(p.skill)} level ${p.level}!`, true);
    else if (t === 'station') {
      if (p.kind === 'furnace' || p.kind === 'anvil') { this.craftMenu = p.kind; this.open('craft'); }
      else if (p.kind === 'bank') this.open('bag', { bank: true });
      else if (p.kind === 'store') this.open('bag', { shop: true });
    } else if (t === 'area') this.close();
    if (t === 'change' || t === 'xp' || t === 'hp' || t === 'level' || t === 'target') this.dirty = true;
  }
  toast(msg, lv = false) {
    const d = el('div', 'toast' + (lv ? ' lv' : ''), esc(msg)); const box = $('toasts'); box.appendChild(d);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => d.remove(), 2900);
  }
  buildNav() {
    const nav = $('nav'); nav.innerHTML = '';
    for (const n of NAV) {
      const b = el('button', '', `<span class="i">${n.i}</span>${n.t}`); b.dataset.tab = n.id; b.setAttribute('aria-label', n.t);
      b.onclick = () => (this.sheet === n.id && !this.mode.bank && !this.mode.shop ? this.close() : this.open(n.id));
      nav.appendChild(b);
    }
  }
  buildStance() {
    const row = $('stanceRow'); row.innerHTML = '';
    for (const s of STANCES) {
      const b = el('button', 'st', `${s.name}<small>trains ${cap(s.xp[0])}</small>`); b.dataset.stance = s.id; b.title = s.blurb;
      b.onclick = () => this.g.setStance(s.id); row.appendChild(b);
    }
  }
  open(id, mode = {}) {
    this.sheet = id; this.mode = mode; this.closeModal(); $('sheet').hidden = false; this.onSheet?.(true); this.renderSheet();
    for (const b of $('nav').children) b.classList.toggle('on', b.dataset.tab === id);
  }
  close() { this.sheet = null; this.mode = {}; $('sheet').hidden = true; this.onSheet?.(false); for (const b of $('nav').children) b.classList.remove('on'); }
  modal(html) { $('modalCard').innerHTML = html; $('modal').hidden = false; return $('modalCard'); }
  closeModal() { $('modal').hidden = true; }

  tick(dt) {
    this.acc += dt;
    this.updateHud();
    if (this.acc > 0.25) { this.acc = 0; if (this.dirty) { this.dirty = false; this.updateTarget(); if (this.sheet && $('modal').hidden) this.renderSheet(true); } else if (this.targetLive) this.updateTarget(); }
  }
  updateHud() {
    const g = this.g, d = g.data;
    setText($('hudNameT'), d.name); setText($('hudCb'), `Cmb ${g.combatLevel}`);
    setText($('hudHpT'), `${d.hp}/${g.maxHp}`); const w = `${Math.round((d.hp / g.maxHp) * 100)}%`; if ($('hudHpFill')._w !== w) { $('hudHpFill')._w = w; $('hudHpFill').style.width = w; }
    setText($('hudCoinsT'), fmt(d.coins));
    for (const b of $('stanceRow').children) b.classList.toggle('on', b.dataset.stance === d.stance);
  }
  updateTarget() {
    const g = this.g, e = g.targetEnt, box = $('target');
    this.targetLive = false;
    if (!e || e.type === 'sign' || e.type === 'station') {
      const key = e ? 'x' : 'hint';
      if (box._k !== key) { box._k = key; box.innerHTML = e ? '' : `<div class="tp hint">Tap to walk · tap a monster or node to work it</div>`; }
      return;
    }
    box._k = 'live'; this.targetLive = true;
    if (e.type === 'monster') {
      const m = MONSTERS[e.kind], hc = g.combat;
      const drops = m.drops.map((d) => `<span title="${esc(itemName(d.id))} ${Math.round(d.p * 100)}%">${img(d.id)}</span>`).join('');
      box.innerHTML = `<div class="tp"><div class="nm"><span>${m.name}</span><em>Lv ${m.level}</em></div><div class="bar"><i style="width:${Math.round((e.dead > 0 ? 0 : e.hp / e.max) * 100)}%"></i></div>
        <div>HP ${e.dead > 0 ? 0 : e.hp}/${e.max} · Hit chance ${Math.round(heroHitChance(hc, m) * 100)}% · Max hit ${hc.maxHit}</div><div class="drops">Drops ${drops}</div></div>`;
    } else {
      const n = NODES[e.kind], lv = g.level(n.skill);
      box.innerHTML = `<div class="tp"><div class="nm"><span>${n.name}</span><em>${cap(n.skill)} ${n.level}</em></div>
        <div>${e.dead > 0 ? 'Depleted - respawning...' : 'Gathering...'} · Success ${Math.round(g.gatherChance(n) * 100)}% · ${n.xp} xp</div><div class="drops">Yields ${img(n.item)} ${esc(itemName(n.item))} (you: Lv ${lv})</div></div>`;
    }
  }

  renderSheet(keepScroll = false) {
    const body = $('sheetBody'), top = body.scrollTop, g = this.g;
    const t = { gear: 'Equipment', skills: 'Skills', bag: this.mode.bank ? 'Bank' : this.mode.shop ? 'General store' : 'Bag', craft: 'Crafting', map: 'World map', settings: 'Settings' }[this.sheet];
    $('sheetTitle').textContent = t;
    body.innerHTML = '';
    this['r_' + this.sheet](body);
    if (keepScroll) body.scrollTop = top;
    void g;
  }
  r_gear(b) {
    const g = this.g, hc = g.combat, d = g.data;
    b.appendChild(el('div', 'sum', `<div><b>${hc.bonuses.atk}</b><small>Attack bonus</small></div><div><b>${hc.bonuses.str}</b><small>Strength bonus</small></div><div><b>${hc.bonuses.def}</b><small>Defence bonus</small></div>
      <div><b>${hc.maxHit}</b><small>Max hit</small></div><div><b>${hc.interval}s</b><small>Attack speed</small></div><div><b>${g.combatLevel}</b><small>Combat level</small></div>`));
    for (const s of SLOTS) {
      const id = d.equip[s.id], it = ITEMS[id];
      const r = el('div', 'row' + (id ? '' : ' off'), `${id ? img(id) : '<span class="slotImg"></span>'}<div class="tx"><b>${s.name}: ${id ? esc(it.name) : 'empty'}</b><small>${id ? bonusText(it) : 'Nothing equipped'}</small></div>${id ? '<button class="btn sm">Remove</button>' : ''}`);
      if (id) r.querySelector('button').onclick = () => g.unequip(s.id);
      b.appendChild(r);
    }
    b.appendChild(el('p', 'note', 'Equip gear from your Bag. Smith it at the anvil in Starter Meadow. Higher tiers need more Attack/Defence.'));
  }
  r_skills(b) {
    const g = this.g;
    b.appendChild(el('div', 'row', `<div class="tx"><b>Combat level ${g.combatLevel}</b><small>Attack, Strength, Defence, Hitpoints</small></div>`));
    for (const s of SKILLS) {
      const xp = g.data.xp[s.id], lv = g.level(s.id);
      const r = el('div', 'row', `<div class="tx"><b>${s.name} <span style="float:right;color:var(--gold)">${lv}</span></b><small>${lv >= 99 ? 'Max level' : `${fmt(xp)} xp · ${fmt(xpForLevel(lv + 1) - xp)} to next`}</small><div class="xpbar"><i style="width:${Math.round(levelProgress(xp) * 100)}%;background:${s.color}"></i></div></div>`);
      r.dataset.skill = s.id; b.appendChild(r);
    }
  }
  r_bag(b) {
    const g = this.g, m = this.mode;
    if (m.shop) return this.r_shop(b);
    const grid = (items, onTap) => {
      const gr = el('div', 'grid');
      items.forEach(([id, n]) => { const c = el('button', 'cell', `${img(id)}${n > 1 ? `<b>${fmt(n)}</b>` : ''}`); c.title = itemName(id); c.dataset.item = id; c.onclick = () => onTap(id, n); gr.appendChild(c); });
      return gr;
    };
    const bag = g.data.bag.map((s) => [s.id, s.n]);
    if (m.bank) {
      b.appendChild(el('p', 'note', 'Tap a bag item to deposit it, tap a banked item to withdraw.'));
      b.appendChild(el('div', 'note', `<b>Bag</b> ${bag.length}/${BAG_SLOTS}`));
      b.appendChild(grid(bag, (id, n) => this.itemPrompt(id, n, 'Deposit', (k) => g.deposit(id, k))));
      const bank = Object.entries(g.data.bank);
      b.appendChild(el('div', 'note', `<b>Bank</b> ${bank.length} item types`));
      b.appendChild(bank.length ? grid(bank, (id, n) => this.itemPrompt(id, n, 'Withdraw', (k) => g.withdraw(id, k))) : el('p', 'note', 'Your bank is empty.'));
      return;
    }
    b.appendChild(el('div', 'note', `<b>${bag.length}/${BAG_SLOTS}</b> slots · <b>${fmt(g.data.coins)}</b> coins`));
    const gr = el('div', 'grid');
    for (let i = 0; i < BAG_SLOTS; i++) {
      const s = g.data.bag[i];
      const c = el('button', 'cell' + (s ? '' : ' empty'), s ? `${img(s.id)}${s.n > 1 ? `<b>${fmt(s.n)}</b>` : ''}` : '');
      if (s) { c.dataset.item = s.id; c.title = itemName(s.id); c.onclick = () => this.itemInfo(s.id); }
      gr.appendChild(c);
    }
    b.appendChild(gr);
    b.appendChild(el('p', 'note', 'Tap an item to inspect or equip it. Bank chest and store are in Starter Meadow.'));
  }
  itemInfo(id) {
    const it = ITEMS[id], g = this.g;
    let extra = '';
    if (it.slot) { const c = g.canEquip(id); extra = `${bonusText(it)}<br><span class="${c.ok ? 'ok' : 'no'}">${c.ok ? `Requires ${cap(it.req.skill)} ${it.req.level}` : c.reason}</span>`; }
    else if (it.tool) extra = `Tool: ${it.tool}${it.toolTier ? ` (tier ${it.toolTier + 1}, faster)` : ''}`;
    else extra = `Worth ${g.sellValue(id)} coins`;
    const c = this.modal(`<h3>${img(id)} ${esc(it.name)}</h3><p class="note">${extra}</p><div class="btns">${it.slot ? '<button class="btn gold" id="mEq" style="flex:1">Equip</button>' : ''}<button class="btn" id="mX" style="flex:1">Close</button></div>`);
    c.querySelector('#mX').onclick = () => this.closeModal();
    const eq = c.querySelector('#mEq');
    if (eq) { eq.disabled = !g.canEquip(id).ok; eq.onclick = () => { g.equip(id); this.closeModal(); }; }
  }
  itemPrompt(id, n, verb, fn) {
    const c = this.modal(`<h3>${img(id)} ${esc(itemName(id))} <small>x${n}</small></h3><div class="btns"><button class="btn" data-k="1" style="flex:1">${verb} 1</button>${n > 5 ? `<button class="btn" data-k="5" style="flex:1">${verb} 5</button>` : ''}<button class="btn gold" data-k="${n}" style="flex:1">${verb} all</button></div><div class="btns" style="margin-top:6px"><button class="btn" id="mX" style="flex:1">Cancel</button></div>`);
    c.querySelectorAll('[data-k]').forEach((x) => { x.onclick = () => { fn(Number(x.dataset.k)); this.closeModal(); }; });
    c.querySelector('#mX').onclick = () => this.closeModal();
  }
  r_shop(b) {
    const g = this.g;
    b.appendChild(el('div', 'note', `You have <b>${fmt(g.data.coins)}</b> coins. The store buys items at ${50}% value.`));
    b.appendChild(el('div', 'note', '<b>Sell</b>'));
    const sellable = g.data.bag.filter((s) => s.id !== 'coins');
    if (!sellable.length) b.appendChild(el('p', 'note', 'Nothing to sell.'));
    for (const s of sellable) {
      const r = el('div', 'row', `${img(s.id)}<div class="tx"><b>${esc(itemName(s.id))} ${s.n > 1 ? 'x' + s.n : ''}</b><small>${g.sellValue(s.id)} coins each</small></div><div class="btns"><button class="btn sm" data-k="1">1</button>${s.n > 1 ? `<button class="btn sm gold" data-k="${s.n}">All</button>` : ''}</div>`);
      r.dataset.item = s.id;
      r.querySelectorAll('[data-k]').forEach((x) => { x.onclick = () => g.sell(s.id, Number(x.dataset.k)); });
      b.appendChild(r);
    }
    b.appendChild(el('div', 'note', '<b>Buy</b>'));
    for (const id of SHOP_BUY) {
      const r = el('div', 'row', `${img(id)}<div class="tx"><b>${esc(itemName(id))}</b><small>${ITEMS[id].value} coins</small></div><button class="btn sm gold" data-buy="${id}" ${g.data.coins < ITEMS[id].value ? 'disabled' : ''}>Buy</button>`);
      r.querySelector('button').onclick = () => g.buy(id);
      b.appendChild(r);
    }
  }
  r_craft(b) {
    const g = this.g, menu = this.craftMenu;
    const seg = el('div', 'seg', ['furnace', 'anvil'].map((k) => `<button data-menu="${k}" class="${k === menu ? 'on' : ''}">${STATIONS[k].menu}</button>`).join(''));
    seg.querySelectorAll('button').forEach((x) => { x.onclick = () => { this.craftMenu = x.dataset.menu; this.renderSheet(); }; });
    b.appendChild(seg);
    if (!g.stationVisited(menu)) b.appendChild(el('div', 'warn', `Walk to the ${STATIONS[menu].name} in Starter Meadow (tap it) to unlock this menu.`));
    else b.appendChild(el('p', 'note', STATIONS[menu].blurb + ` Smithing level ${g.level('smithing')}.`));
    for (const r of RECIPES.filter((x) => x.station === menu)) {
      const st = g.recipeStatus(r), out = ITEMS[r.out];
      const ing = Object.entries(r.inputs).map(([id, n]) => `<span class="${g.count(id) >= n ? 'ok' : 'no'}">${esc(itemName(id))} ${g.count(id)}/${n}</span>`).join(', ');
      const row = el('div', 'row' + (st.ok ? '' : ' off'), `${img(r.out)}<div class="tx"><b>${esc(out.name)} <small>Lv ${r.level}</small></b><small>${ing}</small><small>${r.xp} xp${r.chance < 1 ? ` · ${Math.round(r.chance * 100)}% success` : ''}${out.slot ? ' · ' + bonusText(out) : ''}</small>${st.ok ? '' : `<small class="no">${esc(st.reason)}</small>`}</div>
        <div class="btns"><button class="btn sm" data-n="1">x1</button><button class="btn sm" data-n="5">x5</button><button class="btn sm gold" data-n="99">All</button></div>`);
      row.dataset.recipe = r.id;
      row.querySelectorAll('[data-n]').forEach((x) => { x.disabled = !st.ok; x.onclick = () => { const res = g.craft(r.id, Number(x.dataset.n)); this.toast(res.done ? `Made ${res.done} ${out.name}${res.failed ? ` (${res.failed} failed)` : ''}` : res.failed ? 'The ore was lost...' : res.reason || 'Cannot craft'); }; });
      b.appendChild(row);
    }
  }
  r_map(b) {
    const g = this.g;
    for (const id of AREA_IDS) {
      const a = AREAS[id], un = g.areaUnlocked(id), here = g.data.area === id;
      const mons = [...new Set(a.entities.filter((e) => e[0] === 'monster').map((e) => MONSTERS[e[1]].name))].join(', ');
      const nodes = [...new Set(a.entities.filter((e) => e[0] === 'node').map((e) => NODES[e[1]].name))].join(', ');
      const r = el('div', 'row' + (un ? '' : ' off'), `<div class="tx"><b>${a.name} ${here ? '<small>(you are here)</small>' : ''}</b><small>Monsters: ${mons}</small><small>Resources: ${nodes}</small>${un ? '' : `<small class="no">Needs combat level ${a.req.combat}</small>`}</div><button class="btn gold" data-area="${id}" ${!un || here ? 'disabled' : ''}>Travel</button>`);
      r.querySelector('button').onclick = () => { g.travel(id); };
      b.appendChild(r);
    }
    b.appendChild(el('p', 'note', 'You can also walk to the signposts at the edge of each area.'));
  }
  r_settings(b) {
    const g = this.g;
    b.appendChild(el('div', 'row', `<div class="tx"><b>${esc(g.data.name)}</b><small>Combat ${g.combatLevel} · ${g.data.stats.kills} kills</small></div>`));
    const r = el('div', 'row', `<div class="tx"><b>New character</b><small>Deletes this save and starts over</small></div><button class="btn red" id="rst">Reset</button>`);
    r.querySelector('#rst').onclick = () => {
      const c = this.modal(`<h3>Delete ${esc(g.data.name)}?</h3><p class="note">All progress will be lost.</p><div class="btns"><button class="btn red" id="mY" style="flex:1">Yes, delete</button><button class="btn" id="mX" style="flex:1">Cancel</button></div>`);
      c.querySelector('#mX').onclick = () => this.closeModal(); c.querySelector('#mY').onclick = () => { this.closeModal(); this.onReset(); };
    };
    b.appendChild(r);
    b.appendChild(el('p', 'note', 'Ironbound demo v0.1 · progress is saved in this browser.'));
  }
}
function bonusText(it) {
  if (!it.bonus) return '';
  const p = [];
  if (it.bonus.atk) p.push(`Atk +${it.bonus.atk}`); if (it.bonus.str) p.push(`Str +${it.bonus.str}`); if (it.bonus.def) p.push(`Def +${it.bonus.def}`);
  return `${p.join(' · ')}${it.interval ? ` · ${it.interval}s` : ''} · ${TIERS[it.tier].name}`;
}
