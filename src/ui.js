// DOM UI: HUD, target panel, stance row, nav + bottom sheets (gear, skills, bag/bank/shop, craft, map, settings).
import { SKILLS, SKILL_BY_ID, STANCES, SLOTS, ITEMS, NODES, MONSTERS, AREAS, AREA_IDS, RECIPES, STATIONS, SHOP_BUY, BAG_SLOTS, TIERS, XP_RATE, WEAPON_KINDS, TIER_BAR, OFFLINE, nodeYields, burnChance, isFood, isStackable } from './data.js';
import { levelProgress, xpForLevel } from './xp.js';
import { RARITIES, rarityOf, modText, rollCost, enchantCategory, isEnchantable, PITY_EPIC } from './enchant.js';
import { heroHitChance, weaponKind } from './combat.js';
import { iconURL, tabIcon } from './art.js';
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
      if (p.kind === 'altar') this.open('altar');
      else if (p.kind === 'furnace' || p.kind === 'anvil') { this.craftMenu = p.kind; this.open('craft'); }
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
      const b = el('button', '', `<img class="ti" alt="" src="${tabIcon(n.id)}">${n.t}`); b.dataset.tab = n.id; b.setAttribute('aria-label', n.t);
      b.onclick = () => (this.sheet === n.id && !this.mode.bank && !this.mode.shop ? this.close() : this.open(n.id));
      nav.appendChild(b);
    }
  }
  /** the stance row follows the wielded weapon: its own style names, damage types and trained skill */
  buildStance() {
    const row = $('stanceRow'); row.innerHTML = '';
    const SH = { attack: 'Atk', strength: 'Str', defence: 'Def' };
    const w = this.g.data.equip.weapon; this.stanceSig = w || '';
    for (const st of weaponKind(this.g.data.equip).styles) {
      const info = STANCES.find((x) => x.id === st.stance);
      const trains = info.xp.length > 1 ? 'All' : SH[info.xp[0]];
      const b = el('button', 'st', `${st.name}<small>${st.type} · ${trains}</small>`); b.dataset.stance = st.stance; b.title = `${st.name} (${st.type}): ${info.blurb}`;
      b.onclick = () => this.g.setStance(st.stance); row.appendChild(b);
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
    if (this.stanceSig !== (d.equip.weapon || '')) this.buildStance();
    for (const b of $('stanceRow').children) b.classList.toggle('on', b.dataset.stance === g.stance);
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
        <div>HP ${e.dead > 0 ? 0 : e.hp}/${e.max} · ${hc.style.name} (${hc.type}) ${Math.round(heroHitChance(hc, m) * 100)}% · max ${hc.maxHit}</div><div style="color:var(--dim)">Defence: stab ${m.defB.stab} · slash ${m.defB.slash} · crush ${m.defB.crush}${m.boss ? ' · <b style="color:#ff9d2e">BOSS</b>' : ''}</div><div class="drops">Drops ${drops}</div></div>`;
    } else {
      const n = NODES[e.kind], lv = g.level(n.skill), ys = nodeYields(n);
      const yl = ys.map((y) => `<span title="Lv ${y.level}">${img(y.item)} ${esc(itemName(y.item))}${y.level > lv ? ` <b style="color:#ff8a80">Lv${y.level}</b>` : ''}</span>`).join(' ');
      box.innerHTML = `<div class="tp"><div class="nm"><span>${n.name}</span><em>${cap(n.skill)} ${n.level}</em></div>
        <div>${e.dead > 0 ? 'Depleted - respawning...' : n.skill === 'fishing' ? 'Fishing...' : 'Gathering...'} · Success ${Math.round(g.gatherChance(n) * 100)}% · ${Math.round(ys[0].xp * XP_RATE)} xp${n.bait ? ` · bait: ${g.count(n.bait)}` : ''}</div><div class="drops">Yields ${yl}</div></div>`;
    }
  }

  renderSheet(keepScroll = false) {
    const body = $('sheetBody'), top = body.scrollTop, g = this.g;
    const t = { gear: 'Equipment', skills: 'Skills', bag: this.mode.bank ? 'Bank' : this.mode.shop ? 'General store' : 'Bag', craft: 'Crafting', map: 'World map', settings: 'Settings', altar: 'Enchanting altar' }[this.sheet];
    $('sheetTitle').textContent = t;
    body.innerHTML = '';
    this['r_' + this.sheet](body);
    if (keepScroll) body.scrollTop = top;
    void g;
  }
  r_gear(b) {
    const g = this.g, hc = g.combat, d = g.data, a = hc.bonuses.a;
    b.appendChild(el('div', 'row', `<div class="tx"><b>✨ ${g.ep} Enchant Points</b><small>Earned from level-ups, new areas, bosses and kills. Spend them at the altar.</small></div><button class="btn gold" id="toAltar">Altar</button>`));
    b.querySelector('#toAltar').onclick = () => this.open('altar');
    b.appendChild(el('div', 'sum', `<div><b>${a.stab}/${a.slash}/${a.crush}</b><small>Stab/Slash/Crush</small></div><div><b>${hc.bonuses.str}</b><small>Strength bonus</small></div><div><b>${hc.bonuses.def}</b><small>Defence bonus</small></div>
      <div><b>${hc.maxHit}</b><small>Max hit</small></div><div><b>${hc.interval}s</b><small>Attack speed</small></div><div><b>${g.combatLevel}</b><small>Combat level</small></div>`));
    b.appendChild(el('div', 'note', `Style: <b>${hc.style.name}</b> (${hc.type}) · ${hc.weapon.name}${hc.two ? ' · two-handed' : ''}${hc.reach ? ` · reach +${hc.reach}` : ''}`));
    for (const s of SLOTS) {
      const id = d.equip[s.id], it = ITEMS[id], e = d.equipEnch[s.id], rc = rarityOf(e);
      const blocked = !id && s.id === 'shield' && d.equip.weapon && ITEMS[d.equip.weapon].two;
      const r = el('div', 'row' + (id ? '' : ' off'), `${id ? img(id) : '<span class="slotImg"></span>'}<div class="tx"><b${rc ? ` style="color:${rc.color}"` : ''}>${s.name}: ${id ? esc(it.name) : 'empty'}</b><small>${id ? statLine(it) : blocked ? 'Two-handed weapon in use' : 'Nothing equipped'}</small>${e ? `<small style="color:${rc.color}">${rc.name}: ${e.mods.map(modText).join(' · ')}</small>` : ''}</div>${id ? '<button class="btn sm">Remove</button>' : ''}`);
      if (rc) r.style.borderColor = rc.color;
      r.dataset.slot = s.id;
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
    const cellHtml = (id, n, e) => `${img(id)}${n > 1 ? `<b>${fmt(n)}</b>` : ''}${e ? `<i class="gem" style="background:${rarityOf(e).color}"></i>` : ''}`;
    const cell = (id, n, e, onTap, idx) => { const c = el('button', 'cell' + (e ? ' ench' : ''), cellHtml(id, n, e)); c.title = itemName(id); c.dataset.item = id; if (idx != null) c.dataset.idx = idx; if (e) c.style.borderColor = rarityOf(e).color; c.onclick = onTap; return c; };
    const bag = g.data.bag;
    if (m.bank) {
      b.appendChild(el('p', 'note', 'Tap a bag item to deposit it, tap a banked item to withdraw.'));
      b.appendChild(el('div', 'note', `<b>Bag</b> ${bag.length}/${BAG_SLOTS}`));
      const gr = el('div', 'grid');
      bag.forEach((s, i) => gr.appendChild(cell(s.id, s.n, s.e, () => (s.e || s.n === 1 ? (g.deposit(s.id, 1, i)) : this.itemPrompt(s.id, s.n, 'Deposit', (k) => g.deposit(s.id, k))), i)));
      b.appendChild(gr);
      const bank = Object.entries(g.data.bank), gear = g.data.bankGear;
      b.appendChild(el('div', 'note', `<b>Bank</b> ${bank.length + gear.length} item types`));
      const bg = el('div', 'grid');
      bank.forEach(([id, n]) => bg.appendChild(cell(id, n, null, () => this.itemPrompt(id, n, 'Withdraw', (k) => g.withdraw(id, k)))));
      gear.forEach((x, i) => bg.appendChild(cell(x.id, 1, x.e, () => g.withdrawGear(i))));
      b.appendChild(bank.length || gear.length ? bg : el('p', 'note', 'Your bank is empty.'));
      return;
    }
    b.appendChild(el('div', 'note', `<b>${bag.length}/${BAG_SLOTS}</b> slots · <b>${fmt(g.data.coins)}</b> coins · <b>✨ ${g.ep}</b> EP`));
    const gr = el('div', 'grid');
    for (let i = 0; i < BAG_SLOTS; i++) {
      const s = bag[i];
      if (!s) { gr.appendChild(el('button', 'cell empty', '')); continue; }
      gr.appendChild(cell(s.id, s.n, s.e, () => this.itemInfo(s.id, i), i));
    }
    b.appendChild(gr);
    b.appendChild(el('p', 'note', 'Tap an item to inspect, compare or equip it. Bank chest, altar and store are in Starter Meadow.'));
  }
  /** item inspect/compare popup (idx = bag slot, so enchanted copies are told apart) */
  itemInfo(id, idx = -1) {
    const it = ITEMS[id], g = this.g;
    if (idx < 0) idx = g.data.bag.findIndex((x) => x.id === id);
    const e = g.data.bag[idx]?.e, rc = rarityOf(e);
    let extra = '';
    if (it.slot) {
      const c = g.canEquip(id), cur = ITEMS[g.data.equip[it.slot]];
      extra = `${statLine(it)}<br>${it.wk ? `<span style="color:var(--dim)">${WEAPON_KINDS[it.wk].blurb} · styles: ${WEAPON_KINDS[it.wk].styles.map((x) => `${x.name} (${x.type})`).join(', ')}</span><br>` : ''}<span class="${c.ok ? 'ok' : 'no'}">${c.ok ? `Requires ${cap(it.req.skill)} ${it.req.level}` : c.reason}</span>`;
      if (cur && cur.id !== id) extra += `<br><span style="color:var(--dim)">vs ${esc(cur.name)}: ${compareText(it, cur)}</span>`;
      else if (!cur) extra += '<br><span style="color:var(--dim)">Slot is empty</span>';
    } else if (it.tool) extra = `Tool: ${it.tool}${it.toolTier ? ` (tier ${it.toolTier + 1}, faster)` : ''}`;
    else if (it.heal) extra = `Heals ${it.heal} HP · worth ${g.sellValue(id)} coins`;
    else extra = `Worth ${g.sellValue(id)} coins`;
    const ench = e ? `<div class="enchBox" style="border-color:${rc.color}"><b style="color:${rc.color}">${rc.name} enchant</b>${e.mods.map((m) => `<div>${modText(m)}</div>`).join('')}</div>` : '';
    const c = this.modal(`<h3${rc ? ` style="color:${rc.color}"` : ''}>${img(id)} ${esc(it.name)}</h3><p class="note">${extra}</p>${ench}<div class="btns">${it.slot ? '<button class="btn gold" id="mEq" style="flex:1">Equip</button>' : ''}${it.heal ? '<button class="btn gold" id="mEat" style="flex:1">Eat</button>' : ''}${isEnchantable(id) ? '<button class="btn" id="mEn" style="flex:1">Enchant</button>' : ''}<button class="btn" id="mX" style="flex:1">Close</button></div>`);
    c.querySelector('#mX').onclick = () => this.closeModal();
    const eat = c.querySelector('#mEat');
    if (eat) eat.onclick = () => { g.eat(id); this.closeModal(); };
    const en = c.querySelector('#mEn');
    if (en) en.onclick = () => { this.altar = { loc: { where: 'bag', idx }, cand: null, lock: -1 }; this.open('altar'); };
    const eq = c.querySelector('#mEq');
    if (eq) { eq.disabled = !g.canEquip(id).ok; eq.onclick = () => { g.equip(id, idx); this.closeModal(); }; }
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
    const sellable = g.data.bag.map((s, i) => [s, i]);
    if (!sellable.length) b.appendChild(el('p', 'note', 'Nothing to sell.'));
    for (const [s, i] of sellable) {
      const rc = rarityOf(s.e);
      const r = el('div', 'row', `${img(s.id)}<div class="tx"><b${rc ? ` style="color:${rc.color}"` : ''}>${esc(itemName(s.id))} ${s.n > 1 ? 'x' + s.n : ''}</b><small>${g.sellValue(s.id)} coins each${rc ? ` · ${rc.name} enchant (lost if sold)` : ''}</small></div><div class="btns"><button class="btn sm" data-k="1">1</button>${s.n > 1 ? `<button class="btn sm gold" data-k="${s.n}">All</button>` : ''}</div>`);
      r.dataset.item = s.id; r.dataset.idx = i; if (rc) r.style.borderColor = rc.color;
      r.querySelectorAll('[data-k]').forEach((x) => { x.onclick = () => g.sellSlot(i, Number(x.dataset.k)); });
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
    if (menu === 'anvil') {
      if (this.smithTier == null) this.smithTier = 0;
      const chips = el('div', 'seg', TIERS.map((t, i) => `<button data-tier="${i}" class="${i === this.smithTier ? 'on' : ''}" style="padding:0 2px;font-size:12px">${t.name}</button>`).join(''));
      chips.querySelectorAll('button').forEach((x) => { x.onclick = () => { this.smithTier = Number(x.dataset.tier); this.renderSheet(); $('sheetBody').scrollTop = 0; }; });
      b.appendChild(chips);
    }
    for (const r of RECIPES.filter((x) => x.station === menu && (menu !== 'anvil' || x.tier === this.smithTier))) {
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
  r_altar(b) {
    const g = this.g, A = (this.altar ||= { loc: null, cand: null, lock: -1 });
    if (A.loc && !isEnchantable(g.idOf(A.loc))) A.loc = null;
    b.appendChild(el('div', 'row', `<div class="tx"><b>✨ ${g.ep} Enchant Points</b><small>Pity ${g.data.pity}/${PITY_EPIC}: a Rare+ is guaranteed at 10 dry rolls, an Epic+ at 20. Rarities: ${RARITIES.map((r) => `<span style="color:${r.color}">${r.name}</span>`).join(', ')}.</small></div>`));
    if (!g.stationVisited('altar') && !A.loc) b.appendChild(el('div', 'warn', 'Tip: the altar itself stands in Starter Meadow, but you can use it from here.'));
    const locKey = (l) => (l.where === 'bag' ? `b${l.idx}` : `e${l.slot}`);
    const items = [];
    for (const s of SLOTS) if (g.data.equip[s.id] && isEnchantable(g.data.equip[s.id])) items.push({ where: 'equip', slot: s.id });
    g.data.bag.forEach((s, i) => { if (isEnchantable(s.id)) items.push({ where: 'bag', idx: i }); });
    if (A.loc) {
      const id = g.idOf(A.loc), it = ITEMS[id], cur = g.enchOf(A.loc), rc = rarityOf(cur);
      const lockCost = cur ? rollCost(id, cur, true) : 0, cost = rollCost(id, cur, false);
      const lockIdx = A.cand ? -1 : A.lock;
      const need = lockIdx >= 0 ? lockCost : cost;
      const panel = el('div', 'enchBox eb', `<div class="nm" style="display:flex;gap:8px;align-items:center">${img(id)}<b${rc ? ` style="color:${rc.color}"` : ''}>${esc(it.name)}</b><small style="margin-left:auto;color:var(--dim)">${enchantCategory(id)}</small></div>
        ${cur ? `<div class="mods">${cur.mods.map((m, i) => `<label class="mod"><input type="radio" name="lock" value="${i}" ${A.lock === i ? 'checked' : ''} ${A.cand ? 'disabled' : ''}> <span style="color:${rc.color}">${modText(m)}</span></label>`).join('')}<label class="mod"><input type="radio" name="lock" value="-1" ${A.lock < 0 ? 'checked' : ''} ${A.cand ? 'disabled' : ''}> <span style="color:var(--dim)">no lock</span></label></div>
        <div class="note">${rc.name} · ${cur.rolls} roll${cur.rolls === 1 ? '' : 's'} so far. Lock one modifier to keep it for +${lockCost - cost} EP.</div>` : '<div class="note">Not enchanted yet. The first roll applies immediately.</div>'}`);
      panel.style.borderColor = rc ? rc.color : 'var(--line)'; panel.dataset.altarItem = id;
      if (A.cand) {
        const cc = RARITIES[A.cand.r];
        const cand = el('div', 'enchBox eb', `<b style="color:${cc.color}">New roll: ${cc.name}</b>${A.cand.mods.map((m) => `<div style="color:${cc.color}">${modText(m)}</div>`).join('')}<div class="btns" style="margin-top:6px"><button class="btn gold" id="keepNew" style="flex:1">Keep new</button><button class="btn" id="keepOld" style="flex:1">Keep old</button></div>`);
        cand.style.borderColor = cc.color; cand.dataset.cand = '1';
        cand.querySelector('#keepNew').onclick = () => { g.resolveEnchant(A.loc, A.cand, true); A.cand = null; A.lock = -1; this.renderSheet(); };
        cand.querySelector('#keepOld').onclick = () => { g.resolveEnchant(A.loc, A.cand, false); A.cand = null; this.renderSheet(); };
        panel.appendChild(cand);
      } else {
        const btn = el('button', 'btn gold', `${cur ? 'Reroll' : 'Roll'} · ${need} ✨`); btn.id = 'rollBtn'; btn.style.cssText = 'width:100%;margin-top:8px'; btn.disabled = g.ep < need;
        btn.onclick = () => {
          const res = g.rollEnchant(A.loc, cur ? A.lock : -1);
          if (!res.ok) { this.toast(res.reason); return; }
          if (res.applied) { this.toast(`${RARITIES[res.ench.r].name} enchant!`, res.ench.r >= 3); A.lock = -1; } else A.cand = res.ench;
          this.renderSheet();
        };
        panel.appendChild(btn);
        panel.querySelectorAll('input[name=lock]').forEach((x) => { x.onchange = () => { A.lock = Number(x.value); this.renderSheet(); }; });
      }
      b.appendChild(panel);
    }
    b.appendChild(el('div', 'note', A.loc ? '<b>Choose another item</b>' : '<b>Choose an item to enchant</b> (weapons, armour and tools)'));
    if (!items.length) b.appendChild(el('p', 'note', 'You have nothing enchantable. Smith some gear first!'));
    for (const l of items) {
      const id = g.idOf(l), e = g.enchOf(l), rc = rarityOf(e), it = ITEMS[id];
      const r = el('div', 'row' + (A.loc && locKey(A.loc) === locKey(l) ? '' : ''), `${img(id)}<div class="tx"><b${rc ? ` style="color:${rc.color}"` : ''}>${esc(it.name)}${l.where === 'equip' ? ' <small>(worn)</small>' : ''}</b><small>${e ? `${rc.name}: ${e.mods.map(modText).join(' · ')}` : `Not enchanted · first roll ${rollCost(id, null)} ✨`}</small></div><button class="btn sm">Select</button>`);
      if (rc) r.style.borderColor = rc.color;
      r.dataset.item = id; r.dataset.loc = locKey(l);
      r.querySelector('button').onclick = () => { if (A.cand) g.resolveEnchant(A.loc, A.cand, false); A.cand = null; A.lock = -1; A.loc = l; this.renderSheet(); $('sheetBody').scrollTop = 0; };
      b.appendChild(r);
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
/** one-line stats for an item */
function statLine(it) {
  if (!it.bonus) return '';
  if (it.wk) { const a = it.bonus.a; return `Stab ${a.stab} · Slash ${a.slash} · Crush ${a.crush} · Str +${it.bonus.str} · ${it.interval}s${it.two ? ' · 2H' : ''}${it.reach ? ` · reach +${it.reach}` : ''}`; }
  if (it.bonus.def) return `Def +${it.bonus.def} · ${TIERS[it.tier].name}`;
  return `${TIERS[it.tier].name}`;
}
/** what changes if `it` replaces `cur` */
function compareText(it, cur) {
  const d = (n) => (n > 0 ? `+${n}` : String(n)), parts = [];
  if (it.wk || cur.wk) {
    for (const t of ['stab', 'slash', 'crush']) { const v = (it.bonus.a?.[t] || 0) - (cur.bonus.a?.[t] || 0); if (v) parts.push(`${t} ${d(v)}`); }
    const sv = (it.bonus.str || 0) - (cur.bonus.str || 0); if (sv) parts.push(`str ${d(sv)}`);
    const iv = Math.round(((it.interval || 0) - (cur.interval || 0)) * 10) / 10; if (iv) parts.push(`${Math.abs(iv)}s ${iv < 0 ? 'faster' : 'slower'}`);
  } else { const v = it.bonus.def - cur.bonus.def; if (v) parts.push(`def ${d(v)}`); }
  return parts.join(' · ') || 'same stats';
}
function bonusText(it) { return statLine(it); }
