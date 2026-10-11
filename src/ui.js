// DOM UI: HUD, target panel, stance row, nav + bottom sheets (gear, skills, bag/bank/shop, craft, map, settings).
import { SKILLS, SKILL_BY_ID, STANCES, SLOTS, ITEMS, NODES, MONSTERS, AREAS, AREA_IDS, RECIPES, STATIONS, SHOP_BUY, BAG_SLOTS, TIERS, XP_RATE, OFFLINE, nodeYields, burnChance, isFood, isStackable } from './data.js';
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
    $('hudFood').onclick = () => { if (!game.eatBest()) this.toast(game.foodCount ? 'Hitpoints already full' : 'No food in your bag'); };
    $('modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') this.closeModal(); });
    game.on((t, p) => this.onEvent(t, p));
  }
  onEvent(t, p) {
    if (t === 'toast') this.toast(p.msg);
    else if (t === 'level') this.toast(`${cap(p.skill)} level ${p.level}!`, true);
    else if (t === 'station') {
      if (p.kind === 'furnace' || p.kind === 'anvil') { this.craftMenu = p.kind; this.open('craft'); }
      else if (p.kind === 'fire' || p.kind === 'range') { this.craftMenu = 'cook'; this.open('craft'); }
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
    this.sheet = id; this.mode = mode; this.closeModal(); $('sheet').hidden = false; $('sheetBody').scrollTop = 0; this.onSheet?.(true); this.renderSheet();
    for (const b of $('nav').children) b.classList.toggle('on', b.dataset.tab === id);
  }
  close() { this.sheet = null; this.mode = {}; $('sheet').hidden = true; this.onSheet?.(false); for (const b of $('nav').children) b.classList.remove('on'); }
  modal(html) { $('modalCard').innerHTML = html; $('modal').hidden = false; return $('modalCard'); }
  /** 'Welcome back' popup for an offline-progress report (see offline.js) */
  showWelcome(rep) {
    const dur = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m` : `${s}s`; };
    const xp = Object.entries(rep.xp).map(([k, v]) => `<div class="ln"><span>${SKILL_BY_ID[k].name}</span><b>+${fmt(v)} xp</b></div>`).join('');
    const lv = rep.levels.map((l) => `<div class="ln" style="color:var(--gold)"><span>${SKILL_BY_ID[l.skill].name} level up</span><b>${l.from} → ${l.to}</b></div>`).join('');
    const items = Object.entries(rep.items).map(([id, n]) => `<span title="${esc(itemName(id))}">${img(id)}x${fmt(n)}</span>`).join('');
    const ate = Object.entries(rep.ate).map(([id, n]) => `${n} ${itemName(id).toLowerCase()}`).join(', ');
    const what = rep.activity.type === 'monster' ? `fighting ${rep.activity.name.toLowerCase()}s (${rep.kills} defeated)` : `${rep.activity.name.toLowerCase()} (${rep.catches} gathered)`;
    const c = this.modal(`<div class="welcome" data-welcome="1"><h3>Welcome back, ${esc(this.g.data.name)}!</h3><div class="note">Away for <b>${dur(rep.away)}</b>${rep.capped ? ` (capped at ${dur(rep.used)})` : ''}. Your hero kept ${what} at ${Math.round(OFFLINE.efficiency * 100)}% pace.${rep.stopped ? ` Stopped early: <b>${esc(rep.stopped)}</b>.` : ''}</div>
      <div class="lines">${lv}${xp}${rep.coins ? `<div class="ln"><span>Coins</span><b>+${fmt(rep.coins)}</b></div>` : ''}${ate ? `<div class="ln"><span>Food eaten</span><b>${esc(ate)}</b></div>` : ''}</div>${items ? `<div class="items">${items}</div>` : ''}${rep.banked ? `<div class="note">${rep.banked} items did not fit in your bag and went to the bank.</div>` : ''}
      <button class="btn gold" id="mX" style="width:100%">Continue</button></div>`);
    c.querySelector('#mX').onclick = () => this.closeModal();
  }
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
    const fc = g.foodCount, chip = $('hudFood'); setText($('hudFoodT'), d.autoEat.on ? `${fc} · ${d.autoEat.pct}%` : String(fc));
    chip.classList.toggle('auto', d.autoEat.on && fc > 0); chip.classList.toggle('empty', fc === 0);
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
      const n = NODES[e.kind], lv = g.level(n.skill), ys = nodeYields(n);
      const yl = ys.map((y) => `<span title="Lv ${y.level}">${img(y.item)} ${esc(itemName(y.item))}${y.level > lv ? ` <b style="color:#ff8a80">Lv${y.level}</b>` : ''}</span>`).join(' ');
      box.innerHTML = `<div class="tp"><div class="nm"><span>${n.name}</span><em>${cap(n.skill)} ${n.level}</em></div>
        <div>${e.dead > 0 ? 'Depleted - respawning...' : n.skill === 'fishing' ? 'Fishing...' : 'Gathering...'} · Success ${Math.round(g.gatherChance(n) * 100)}% · ${Math.round(ys[0].xp * XP_RATE)} xp${n.bait ? ` · bait: ${g.count(n.bait)}` : ''}</div><div class="drops">Yields ${yl}</div></div>`;
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
    else if (it.heal) extra = `Heals ${it.heal} HP · worth ${g.sellValue(id)} coins`;
    else extra = `Worth ${g.sellValue(id)} coins`;
    const c = this.modal(`<h3>${img(id)} ${esc(it.name)}</h3><p class="note">${extra}</p><div class="btns">${it.slot ? '<button class="btn gold" id="mEq" style="flex:1">Equip</button>' : ''}${it.heal ? '<button class="btn gold" id="mEat" style="flex:1">Eat</button>' : ''}<button class="btn" id="mX" style="flex:1">Close</button></div>`);
    c.querySelector('#mX').onclick = () => this.closeModal();
    const eat = c.querySelector('#mEat');
    if (eat) eat.onclick = () => { g.eat(id); this.closeModal(); };
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
      const r = el('div', 'row', `${img(id)}<div class="tx"><b>${esc(itemName(id))}</b><small>${ITEMS[id].value} coins${ITEMS[id].tool ? ` · ${ITEMS[id].tool}` : ''}</small></div><div class="btns"><button class="btn sm gold" data-buy="${id}" ${g.data.coins < ITEMS[id].value ? 'disabled' : ''}>Buy</button>${isStackable(id) ? `<button class="btn sm" data-buy10="${id}" ${g.data.coins < ITEMS[id].value * 10 ? 'disabled' : ''}>x10</button>` : ''}</div>`);
      r.querySelector('[data-buy]').onclick = () => g.buy(id);
      const b10 = r.querySelector('[data-buy10]'); if (b10) b10.onclick = () => { for (let i = 0; i < 10; i++) if (!g.buy(id)) break; };
      b.appendChild(r);
    }
  }
  r_craft(b) {
    const g = this.g, menu = this.craftMenu;
    const MENUS = { furnace: 'Smelting', anvil: 'Smithing', cook: 'Cooking' };
    const seg = el('div', 'seg', Object.entries(MENUS).map(([k, nm]) => `<button data-menu="${k}" class="${k === menu ? 'on' : ''}">${nm}</button>`).join(''));
    seg.querySelectorAll('button').forEach((x) => { x.onclick = () => { this.craftMenu = x.dataset.menu; this.renderSheet(); $('sheetBody').scrollTop = 0; }; });
    b.appendChild(seg);
    const sk = menu === 'cook' ? 'cooking' : 'smithing';
    if (!g.stationVisited(menu)) b.appendChild(el('div', 'warn', menu === 'cook' ? 'Walk up to a campfire or range (tap it) to unlock cooking. Starter Meadow has both.' : `Walk to the ${STATIONS[menu].name} in Starter Meadow (tap it) to unlock this menu.`));
    else b.appendChild(el('p', 'note', (menu === 'cook' ? `${g.data.visited.range ? 'Using a range (fewer burnt)' : 'Using a campfire (find a range to burn less)'}. ` : STATIONS[menu].blurb + ' ') + `${cap(sk)} level ${g.level(sk)}.`));
    for (const r of RECIPES.filter((x) => x.station === menu)) {
      if (r.stop && !g.count(r.inputs && Object.keys(r.inputs)[0]) && g.level('cooking') < r.level - 10) continue; // hide far-off dishes until you hold the raw food or are close
      const st = g.recipeStatus(r), out = ITEMS[r.out];
      const ing = Object.entries(r.inputs).map(([id, n]) => `<span class="${g.count(id) >= n ? 'ok' : 'no'}">${esc(itemName(id))} ${g.count(id)}/${n}</span>`).join(', ');
      const row = el('div', 'row' + (st.ok ? '' : ' off'), `${img(r.out)}<div class="tx"><b>${esc(out.name)} <small>Lv ${r.level}</small></b><small>${ing}</small><small>${Math.round(r.xp * XP_RATE * 10) / 10} xp${r.chance < 1 ? ` · ${Math.round(r.chance * 100)}% success` : ''}${r.stop ? ` · burn ${Math.round(burnChance(r, g.level('cooking'), !!g.data.visited.range) * 100)}% · heals ${out.heal}` : ''}${out.slot ? ' · ' + bonusText(out) : ''}</small>${st.ok ? '' : `<small class="no">${esc(st.reason)}</small>`}</div>
        <div class="btns"><button class="btn sm" data-n="1">x1</button><button class="btn sm" data-n="5">x5</button><button class="btn sm gold" data-n="99">All</button></div>`);
      row.dataset.recipe = r.id;
      row.querySelectorAll('[data-n]').forEach((x) => { x.disabled = !st.ok; x.onclick = () => { const res = g.craft(r.id, Number(x.dataset.n)); this.toast(res.done ? `Made ${res.done} ${out.name}${res.failed ? ` (${res.failed} ${r.burnt ? 'burnt' : 'failed'})` : ''}` : res.failed ? (r.burnt ? 'Oops, burnt it!' : 'The ore was lost...') : res.reason || 'Cannot craft'); }; });
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
    const ae = g.data.autoEat;
    const aer = el('div', 'row', `<div class="tx"><b>Auto-eat</b><small>Eats the best food when HP is at or below the threshold. With food, the hero never retreats.</small><div class="seg" style="margin:6px 0 0">${[['off', 0], ['30%', 30], ['50%', 50], ['70%', 70]].map(([l, v]) => `<button data-ae="${v}" class="${(v === 0 ? !ae.on : ae.on && ae.pct === v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`);
    aer.querySelectorAll('[data-ae]').forEach((x) => { x.onclick = () => { const v = Number(x.dataset.ae); if (v === 0) g.setAutoEat(false); else g.setAutoEat(true, v); this.renderSheet(); }; });
    b.appendChild(aer);
    const fs = el('div', 'row', `<div class="tx"><b>Fullscreen</b></div><button class="btn" id="fsBtn">Toggle</button>`);
    fs.querySelector('#fsBtn').onclick = () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen?.(); else d.requestFullscreen?.().catch(() => {}); };
    b.appendChild(fs);
    b.appendChild(el('div', 'row', `<div class="tx"><b>${esc(g.data.name)}</b><small>Combat ${g.combatLevel} · ${g.data.stats.kills} kills</small></div>`));
    const r = el('div', 'row', `<div class="tx"><b>New character</b><small>Deletes this save and starts over</small></div><button class="btn red" id="rst">Reset</button>`);
    r.querySelector('#rst').onclick = () => {
      const c = this.modal(`<h3>Delete ${esc(g.data.name)}?</h3><p class="note">All progress will be lost.</p><div class="btns"><button class="btn red" id="mY" style="flex:1">Yes, delete</button><button class="btn" id="mX" style="flex:1">Cancel</button></div>`);
      c.querySelector('#mX').onclick = () => this.closeModal(); c.querySelector('#mY').onclick = () => { this.closeModal(); this.onReset(); };
    };
    b.appendChild(r);
    const zr = el('div', 'row', `<div class="tx"><b>Zoom</b><small id="zoomT"></small></div><div class="btns"><button class="btn sm" id="zOut" aria-label="Zoom out">-</button><button class="btn sm" id="zIn" aria-label="Zoom in">+</button></div>`);
    const sc = window.__ib?.scene, upd = () => { zr.querySelector('#zoomT').textContent = `${Math.round(sc.zoom * 100)}% (smaller = see more of the area)`; };
    if (sc) { upd(); zr.querySelector('#zOut').onclick = () => { sc.setZoom(sc.zoom - 0.1); upd(); }; zr.querySelector('#zIn').onclick = () => { sc.setZoom(sc.zoom + 0.1); upd(); }; }
    b.appendChild(zr);
    b.appendChild(el('p', 'note', 'Ironbound demo v0.1 · progress is saved in this browser.'));
  }
}
function bonusText(it) {
  if (!it.bonus) return '';
  const p = [];
  if (it.bonus.atk) p.push(`Atk +${it.bonus.atk}`); if (it.bonus.str) p.push(`Str +${it.bonus.str}`); if (it.bonus.def) p.push(`Def +${it.bonus.def}`);
  return `${p.join(' · ')}${it.interval ? ` · ${it.interval}s` : ''} · ${TIERS[it.tier].name}`;
}
