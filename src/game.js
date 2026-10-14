// Game model: character state + the traversable-area simulation. No DOM here (the UI listens to `game.on`).
import { SKILL_IDS, ITEMS, MONSTERS, NODES, AREAS, RECIPE_BY_ID, STATIONS, SLOT_IDS, BAG_SLOTS, SHOP_BUY, SELL_RATE, STANCE_BY_ID, isStackable, XP_RATE, nodeYields, burnChance, isFood, stanceXp, PRAYERS, PRAYER_BY_ID, BONE_XP, BONES, SLAYER_TASKS, SPELLS, SPELL_BY_ID, ACHIEVEMENTS, styleXp, ARROW_IDS, monsterStyle, PROTECT } from './data.js';
import { levelForXp } from './xp.js';
import { heroCombat, heroHitChance, monsterHitChance, combatLevel } from './combat.js';
import { sumMods, rollEnchant, rollCost, nextPity, enchantCategory, gemFromMod, canCombineGems, combineGems as combineGemData, maxMods, MODS, modText } from './enchant.js';

export const TOOL_NAMES = { pickaxe: 'pickaxe', axe: 'axe', net: 'small fishing net', rod: 'fishing rod', harpoon: 'harpoon', cage: 'lobster pot', hammer: 'hammer' };
/** Craft-tab menus that need no world station (knife/needle/essence work done anywhere) */
export const NO_STATION = new Set(['fletch', 'craft', 'runecraft']);
export const WALK_SPEED = 150;
export const REACH = { monster: 46, node: 40, station: 56, sign: 50 };
const REGEN_EVERY = 2;
export const EAT_DELAY = 1.2; // seconds between bites
export const RETREAT_FRAC = 0.4;

export class Game {
  constructor(data, rng = Math.random) {
    this.data = data;
    this.rng = rng;
    this.listeners = [];
    this.hero = { x: 0, dir: 1, state: 'idle', cd: 0, moving: false, swing: 0, hurt: 0 };
    this.target = null; // entity id
    this.ents = [];
    this.regenT = 0;
    this.eatCd = 0;
    this.prayerDrainT = 0;
    const d = this.data;
    d.equipEnch ||= {}; d.bankGear ||= []; d.visitedAreas ||= { lumby: true }; d.ep ??= 0; d.pity ??= 0;
    d.prayerPoints ??= this.maxPrayer;
    d.activePrayers ||= [];
    d.energy ??= 100; d.special ??= 100; d.achievements ||= {}; d.slayerStreak ??= 0; d.slayerTask ??= null;
    this.data.area = AREAS[this.data.area] ? this.data.area : 'lumby';
    this.enterArea(this.data.area, AREAS[this.data.area].spawn, true);
    this.data.hp = Math.min(this.data.hp || this.maxHp, this.maxHp);
  }
  on(fn) { this.listeners.push(fn); }
  emit(type, p = {}) { for (const fn of this.listeners) fn(type, p); }
  toast(msg) { this.emit('toast', { msg }); }

  // ---- skills
  level(skill) { return levelForXp(this.data.xp[skill] || 0); }
  get levels() { return Object.fromEntries(SKILL_IDS.map((s) => [s, this.level(s)])); }
  get maxHp() { return this.level('hitpoints'); }
  get maxPrayer() { return Math.max(1, this.level('prayer')); }
  get prayerPoints() { return this.data.prayerPoints || 0; }
  get combatLevel() { return combatLevel(this.levels); }
  gain(skill, amount) {
    if (amount <= 0) return;
    amount *= XP_RATE * (1 + this.mods.xp);
    const before = this.level(skill);
    this.data.xp[skill] = Math.min(200000000, (this.data.xp[skill] || 0) + amount);
    this.emit('xp', { skill, amount, x: this.hero.x });
    const after = this.level(skill);
    if (after > before) {
      if (skill === 'hitpoints') this.data.hp = Math.min(this.maxHp, this.data.hp + (after - before));
      if (skill === 'prayer') this.data.prayerPoints = Math.min(this.maxPrayer, (this.data.prayerPoints || 0) + (after - before));
      this.emit('level', { skill, level: after });
      for (let l = before + 1; l <= after; l++) this.addEp(l % 10 === 0 ? 5 : 1, `${skill} ${l}`);
      if (skill === 'magic' || skill === 'ranged') this.checkAchievements();
    }
  }
  /** enchant modifier totals from everything worn (+ the best tool for gathering, see gatherMods) */
  get mods() { return sumMods(Object.values(this.data.equipEnch)); }
  /** levels with active stat prayers applied (RS: prayers boost the level used in the formulas) */
  get boostedLevels() {
    const lv = this.levels, ap = this.data.activePrayers || [];
    if (!ap.length || this.prayerPoints <= 0) return lv;
    const boost = { defence: [['thick_skin', 0.05], ['rock_skin', 0.1], ['steel_skin', 0.15]], strength: [['burst_of_strength', 0.05], ['superhuman_strength', 0.1], ['ultimate_strength', 0.15]], attack: [['clarity_of_thought', 0.05], ['improved_reflexes', 0.1], ['incredible_reflexes', 0.15]], ranged: [['eagle_eye', 0.15]], magic: [['mystic_might', 0.15]] };
    const out = { ...lv };
    for (const [sk, list] of Object.entries(boost)) { const f = Math.max(0, ...list.filter(([id]) => ap.includes(id)).map(([, v]) => v)); if (f) out[sk] = Math.floor(lv[sk] * (1 + f)); }
    return out;
  }
  /** best arrows in the bag for an equipped bow */
  get ammo() { return ARROW_IDS.find((id) => this.count(id) > 0) || null; }
  /** spell a staff casts: the autocast spell if castable, else the best castable spell */
  get activeSpell() {
    const a = this.data.autocast && SPELL_BY_ID[this.data.autocast];
    if (a && this.canCast(a.id)) return a;
    return [...SPELLS].reverse().find((sp) => this.canCast(sp.id)) || null;
  }
  get combat() { return heroCombat(this.boostedLevels, this.data.equip, this.data.stance, this.mods, { ammo: this.ammo, spell: this.activeSpell }); }
  /** the stance actually in force (a weapon may not offer the saved one) */
  get stance() { return this.combat.stance; }
  setStance(id) { if (STANCE_BY_ID[id]) { this.data.stance = id; this.emit('change'); } }
  // ---- enchant points
  get ep() { return this.data.ep; }
  addEp(n, why) { if (n <= 0) return; this.data.ep += n; this.emit('ep', { n, why }); }

  // ---- inventory
  count(id) { return this.data.bag.reduce((a, s) => a + (s.id === id ? s.n : 0), 0); }
  get slotsUsed() { return this.data.bag.length; }
  canAdd(id) { return id === 'coins' || (isStackable(id) && this.data.bag.some((s) => s.id === id)) || this.slotsUsed < BAG_SLOTS; }
  /** returns how many were added */
  addItem(id, n = 1, ench = null, gem = null) {
    if (n <= 0) return 0;
    if (id === 'coins') { this.data.coins += n; return n; }
    if (isStackable(id) && !ench && !gem) {
      const s = this.data.bag.find((x) => x.id === id && !x.e && !x.gem);
      if (s) { s.n += n; return n; }
      if (this.slotsUsed >= BAG_SLOTS) return 0;
      this.data.bag.push({ id, n }); return n;
    }
    let added = 0;
    for (let i = 0; i < n && this.slotsUsed < BAG_SLOTS; i++) {
      const slot = { id, n: 1 };
      if (ench) slot.e = ench;
      if (gem) slot.gem = gem;
      this.data.bag.push(slot); added++;
    }
    return added;
  }
  removeItem(id, n = 1) {
    if (this.count(id) < n) return false;
    let left = n;
    for (const pass of [0, 1]) { // plain items first, enchanted copies last
      for (let i = this.data.bag.length - 1; i >= 0 && left > 0; i--) {
        const s = this.data.bag[i];
        if (s.id !== id || (pass === 0) === !!s.e) continue;
        const t = Math.min(s.n, left); s.n -= t; left -= t;
        if (s.n <= 0) this.data.bag.splice(i, 1);
      }
    }
    return true;
  }
  /** the best tool of a type: bag items and the wielded weapon (axes are weapons too). Returns { item, e } or null */
  toolInfo(type) {
    let best = null;
    const consider = (id, e) => { const it = ITEMS[id]; if (it?.tool === type && (!best || it.toolTier > best.item.toolTier || (it.toolTier === best.item.toolTier && e && !best.e))) best = { item: it, e }; };
    for (const s of this.data.bag) consider(s.id, s.e);
    consider(this.data.equip.weapon, this.data.equipEnch.weapon);
    return best;
  }
  bestTool(type) { return this.toolInfo(type)?.item || null; }

  // ---- Slayer
  get slayerTask() { return this.data.slayerTask; }
  requestSlayerTask() {
    if (this.data.slayerTask) { this.toast('You already have a task'); return false; }
    const eligible = SLAYER_TASKS.filter((t) => this.level('slayer') >= t.level);
    if (!eligible.length) { this.toast('No tasks available'); return false; }
    const t = eligible[Math.floor(this.rng() * eligible.length)];
    const amount = t.amount[0] + Math.floor(this.rng() * (t.amount[1] - t.amount[0] + 1));
    this.data.slayerTask = { id: t.id, name: t.name, monsters: t.monsters, left: amount, total: amount, xp: t.xp };
    this.toast(`New task: Kill ${amount} ${t.name}`);
    this.emit('change');
    return true;
  }
  cancelSlayerTask() {
    if (!this.data.slayerTask) return false;
    this.data.slayerTask = null;
    this.data.slayerStreak = 0;
    this.toast('Task cancelled');
    this.emit('change');
    return true;
  }

  // ---- Magic
  canCast(spellId) {
    const sp = SPELL_BY_ID[spellId];
    if (!sp) return false;
    if (this.level('magic') < sp.level) return false;
    for (const [rune, n] of Object.entries(sp.runes)) if (rune !== this.freeRune && this.count(rune) < n) return false;
    return true;
  }
  /** a rune the equipped staff supplies for free (Staff of air -> air runes) */
  get freeRune() { return ITEMS[this.data.equip.weapon]?.infinite || null; }
  spendRunes(sp) { for (const [rune, n] of Object.entries(sp.runes)) if (rune !== this.freeRune) this.removeItem(rune, n); }
  castSpell(spellId, target) {
    const sp = SPELL_BY_ID[spellId];
    if (!sp || !this.canCast(spellId)) { this.toast('Cannot cast'); return false; }
    this.spendRunes(sp);
    this.gain('magic', sp.xp);
    if (target?.type === 'monster') {
      const dmg = Math.floor(this.rng() * (sp.maxHit + 1));
      this.hitMonster(target, dmg, { xp: [['magic', 0.5]] });
    }
    this.toast(`Cast ${sp.name}`);
    this.emit('change');
    return true;
  }

  // ---- Energy & Special
  get energy() { return this.data.energy ?? 100; }
  get special() { return this.data.special ?? 100; }
  useSpecial() {
    if (this.special < 25) { this.toast('Not enough special'); return false; }
    this.data.special = Math.max(0, this.special - 25);
    this.toast('Special attack used (+damage)');
    this.emit('change');
    return true;
  }
  regenEnergy(dt) {
    if (this.data.energy < 100) this.data.energy = Math.min(100, this.data.energy + dt * 1.5);
    if (this.data.special < 100) this.data.special = Math.min(100, this.data.special + dt * 0.5);
  }
  drainEnergy(dt, running) {
    if (running && this.data.energy > 0) this.data.energy = Math.max(0, this.data.energy - dt * 8);
  }

  // ---- Achievements
  checkAchievements() {
    for (const a of ACHIEVEMENTS) {
      if ((this.data.achievements ||= {})[a.id]) continue;
      if (a.check(this)) {
        this.data.achievements[a.id] = true;
        if (a.reward.coins) this.data.coins += a.reward.coins;
        if (a.reward.xp) for (const [sk, n] of Object.entries(a.reward.xp)) this.gain(sk, n);
        this.toast(`Achievement: ${a.name}`);
      }
    }
  }

  // ---- Clue scrolls
  openClue() {
    if (!this.count('clue_scroll')) return false;
    this.removeItem('clue_scroll', 1);
    const roll = this.rng();
    if (roll < 0.05) {
      this.addItem('enchant_gem', 1);
      this.toast('Clue reward: Enchantment gem!');
    } else if (roll < 0.15) {
      const coins = 200 + Math.floor(this.rng() * 400);
      this.data.coins += coins;
      this.toast(`Clue reward: ${coins} coins`);
    } else {
      const coins = 50 + Math.floor(this.rng() * 150);
      this.data.coins += coins;
      this.toast(`Clue reward: ${coins} coins`);
    }
    this.emit('change');
    return true;
  }

  // ---- Fletching (RS-style)
  fletchShafts() {
    if (this.count('logs') < 1) { this.toast('Need logs'); return false; }
    this.removeItem('logs', 1);
    this.gain('fletching', 5);
    this.addItem('arrow_shaft', 15);
    this.toast('Cut 15 arrow shafts');
    this.emit('change');
    return true;
  }
  makeHeadless() {
    const n = Math.min(this.count('arrow_shaft'), this.count('feather'));
    if (n < 1) { this.toast('Need shafts and feathers'); return false; }
    this.removeItem('arrow_shaft', n);
    this.removeItem('feather', n);
    this.gain('fletching', n * 1);
    this.addItem('headless_arrow', n);
    this.toast(`Made ${n} headless arrows`);
    this.emit('change');
    return true;
  }
  tipArrows(tipId, arrowId, xp = 2.5) {
    const n = Math.min(this.count('headless_arrow'), this.count(tipId));
    if (n < 1) { this.toast('Need headless arrows and arrowtips'); return false; }
    this.removeItem('headless_arrow', n);
    this.removeItem(tipId, n);
    this.gain('fletching', n * xp);
    this.addItem(arrowId, n);
    this.toast(`Made ${n} ${ITEMS[arrowId].name}`);
    this.emit('change');
    return true;
  }
  fletchBow(logId, bowId, level, xp) {
    if (this.level('fletching') < level) { this.toast(`Need Fletching ${level}`); return false; }
    if (this.count(logId) < 1) { this.toast('Need logs'); return false; }
    this.removeItem(logId, 1);
    this.gain('fletching', xp);
    this.addItem(bowId, 1);
    this.toast(`Fletched ${ITEMS[bowId].name}`);
    this.emit('change');
    return true;
  }
  fletchStaff() {
    if (this.count('logs') < 1) { this.toast('Need logs'); return false; }
    this.removeItem('logs', 1);
    this.gain('fletching', 12.5);
    this.addItem('staff', 1);
    this.toast('Fletched a staff');
    this.emit('change');
    return true;
  }

  // ---- Tanner
  tanHide(type) {
    if (this.count('cowhide') < 1) { this.toast('Need a cowhide'); return false; }
    const cost = type === 'soft' ? 1 : 3;
    if (this.data.coins < cost) { this.toast('Not enough coins'); return false; }
    this.removeItem('cowhide', 1);
    this.data.coins -= cost;
    this.addItem(type === 'soft' ? 'soft_leather' : 'hard_leather', 1);
    this.toast(`Tanned ${type} leather`);
    this.emit('change');
    return true;
  }

  // ---- Crafting leather armor
  craftLeatherArmor(type) {
    const reqs = {
      leather_body: { soft_leather: 1, level: 1, xp: 25 },
      hardleather_body: { hard_leather: 1, level: 10, xp: 35 },
      studded_body: { hard_leather: 1, steel_studs: 1, level: 20, xp: 40 },
    };
    const r = reqs[type];
    if (!r || this.level('crafting') < r.level) { this.toast('Cannot craft'); return false; }
    for (const [id, n] of Object.entries(r)) if (id !== 'level' && id !== 'xp' && this.count(id) < n) { this.toast('Missing materials'); return false; }
    for (const [id, n] of Object.entries(r)) if (id !== 'level' && id !== 'xp') this.removeItem(id, n);
    this.gain('crafting', r.xp);
    this.addItem(type, 1);
    this.toast(`Crafted ${ITEMS[type].name}`);
    this.emit('change');
    return true;
  }

  // ---- Magic autocast
  setAutocast(spellId) {
    if (spellId && !this.canCast(spellId)) { this.toast('Cannot autocast that'); return false; }
    this.data.autocast = spellId || null;
    this.toast(spellId ? `Autocasting ${SPELL_BY_ID[spellId].name}` : 'Autocast off');
    this.emit('change');
    return true;
  }

  // ---- Runecrafting
  craftRune(runeId) {
    const costs = { air_rune: 1, mind_rune: 1, water_rune: 2, earth_rune: 2, fire_rune: 3, chaos_rune: 5 };
    const xp = { air_rune: 5, mind_rune: 5.5, water_rune: 6, earth_rune: 6.5, fire_rune: 7, chaos_rune: 8.5 };
    const need = costs[runeId];
    if (!need || this.count('rune_essence') < need) { this.toast('Need more rune essence'); return false; }
    this.removeItem('rune_essence', need);
    this.gain('runecrafting', xp[runeId] || 5);
    this.addItem(runeId, 1);
    this.toast(`Crafted ${ITEMS[runeId].name}`);
    this.emit('change');
    return true;
  }

  // ---- Crafting
  craftLeather() {
    if (this.count('wolf_pelt') < 1) { this.toast('Need a wolf pelt'); return false; }
    this.removeItem('wolf_pelt', 1);
    this.gain('crafting', 15);
    this.addItem('soft_leather', 1);
    this.toast('Crafted soft leather');
    this.emit('change');
    return true;
  }
  /** best food in the bag (highest healing) or null */
  bestFood() { let best = null; for (const s of this.data.bag) { const it = ITEMS[s.id]; if (isFood(s.id) && (!best || it.heal > best.heal)) best = it; } return best; }
  get foodCount() { return this.data.bag.reduce((a, s) => a + (isFood(s.id) ? s.n : 0), 0); }
  /** eat one piece of food: heals a fixed amount, then a short delay before the next bite (and a slower next attack in combat) */
  eat(id) {
    const it = ITEMS[id];
    if (!it?.heal || this.count(id) < 1) return false;
    if (this.data.hp >= this.maxHp) { this.toast('Hitpoints already full'); return false; }
    if (this.eatCd > 0) return false;
    this.removeItem(id, 1);
    const n = Math.min(it.heal, this.maxHp - this.data.hp);
    this.data.hp += n; this.eatCd = EAT_DELAY;
    if (this.targetEnt?.type === 'monster') this.hero.cd += 0.6;
    this.emit('heal', { x: this.hero.x, n, id }); this.emit('change');
    return true;
  }
  eatBest() { const f = this.bestFood(); return f ? this.eat(f.id) : false; }

  // ---- prayer
  /** bury one set of bones for Prayer XP (anywhere) */
  bury(id = 'bones') {
    const b = BONES[id];
    if (!b || this.count(id) < 1) return false;
    this.removeItem(id, 1);
    this.gain('prayer', b.xp);
    this.data.prayerPoints = Math.min(this.maxPrayer, (this.data.prayerPoints || 0) + 1);
    this.toast(`Buried ${b.name} (+${b.xp} Prayer)`);
    this.emit('change');
    return true;
  }
  /** restore prayer points to full at the prayer altar */
  restorePrayer() {
    const max = this.maxPrayer;
    if (this.prayerPoints >= max) { this.toast('Prayer points already full'); return false; }
    this.data.prayerPoints = max;
    this.toast('Prayer points restored');
    this.emit('change');
    return true;
  }
  /** bury at the prayer altar for bonus XP + chance of Enchant Points */
  buryAtAltar(id = 'bones', n = 1) {
    const b = BONES[id];
    if (!b || this.count(id) < n) return false;
    this.removeItem(id, n);
    const xp = b.altarXp * n;
    this.gain('prayer', xp);
    this.data.prayerPoints = Math.min(this.maxPrayer, (this.data.prayerPoints || 0) + n);
    let ep = 0;
    for (let i = 0; i < n; i++) {
      if (b.epFlat) ep += b.epFlat;
      if (this.rng() < b.epChance) ep += 1;
    }
    if (ep > 0) this.addEp(ep, 'prayer altar');
    this.toast(`Offered ${n} ${b.name} (+${xp} Prayer${ep ? `, +${ep} EP` : ''})`);
    this.emit('change');
    return true;
  }
  togglePrayer(id) {
    const p = PRAYER_BY_ID[id];
    if (!p) return false;
    if (this.level('prayer') < p.level) { this.toast(`Need Prayer ${p.level}`); return false; }
    const list = this.data.activePrayers;
    const i = list.indexOf(id);
    if (i >= 0) { list.splice(i, 1); this.toast(`${p.name} deactivated`); }
    else {
      if (this.prayerPoints < 1) { this.toast('No prayer points'); return false; }
      list.push(id);
      this.toast(`${p.name} activated`);
    }
    this.emit('change');
    return true;
  }
  /** total drain rate of currently active prayers (points per second) */
  get prayerDrain() {
    return this.data.activePrayers.reduce((a, id) => a + (PRAYER_BY_ID[id]?.drain || 0), 0);
  }
  setAutoEat(on, pct) { if (on != null) this.data.autoEat.on = !!on; if (pct) this.data.autoEat.pct = pct; this.emit('change'); }
  tryAutoEat() {
    const a = this.data.autoEat;
    if (a.on && this.eatCd <= 0 && this.data.hp <= Math.ceil(this.maxHp * a.pct / 100) && this.data.hp < this.maxHp) return this.eatBest();
    return false;
  }

  // ---- equipment
  canEquip(id) {
    const it = ITEMS[id];
    if (!it?.slot) return { ok: false, reason: 'Not equipable' };
    if (this.level(it.req.skill) < it.req.level) return { ok: false, reason: `Requires ${it.req.skill[0].toUpperCase() + it.req.skill.slice(1)} ${it.req.level}` };
    return { ok: true };
  }
  /** equip an item from the bag (idx = bag slot, default: first copy). Two-handed weapons also take the shield slot. */
  equip(id, idx = -1) {
    const c = this.canEquip(id);
    if (!c.ok) { this.toast(c.reason); return false; }
    if (idx < 0 || this.data.bag[idx]?.id !== id) idx = this.data.bag.findIndex((x) => x.id === id);
    if (idx < 0) return false;
    const it = ITEMS[id], slot = it.slot, d = this.data;
    const out = []; // [id, ench] pairs that have to go back to the bag
    const old = d.equip[slot];
    if (old) out.push([old, d.equipEnch[slot]]);
    if (it.two && d.equip.shield) out.push([d.equip.shield, d.equipEnch.shield]);
    if (slot === 'shield' && d.equip.weapon && ITEMS[d.equip.weapon].two) out.push([d.equip.weapon, d.equipEnch.weapon]);
    if (this.slotsUsed - 1 + out.length > BAG_SLOTS) { this.toast('Not enough bag space'); return false; }
    const [taken] = d.bag.splice(idx, 1);
    if (it.two && d.equip.shield) { d.equip.shield = null; delete d.equipEnch.shield; }
    if (slot === 'shield' && d.equip.weapon && ITEMS[d.equip.weapon].two) { d.equip.weapon = null; delete d.equipEnch.weapon; }
    d.equip[slot] = id; if (taken.e) d.equipEnch[slot] = taken.e; else delete d.equipEnch[slot];
    for (const [oid, oe] of out) this.addItem(oid, 1, oe);
    this.emit('change');
    return true;
  }
  unequip(slot) {
    const id = this.data.equip[slot];
    if (!id) return false;
    if (this.slotsUsed >= BAG_SLOTS) { this.toast('Bag is full'); return false; }
    const e = this.data.equipEnch[slot];
    this.data.equip[slot] = null; delete this.data.equipEnch[slot]; this.addItem(id, 1, e);
    this.emit('change');
    return true;
  }

  // ---- shop & bank
  sellValue(id) { return Math.max(1, Math.floor((ITEMS[id]?.value || 0) * SELL_RATE)); }
  sell(id, n = 1) {
    if (id === 'coins' || !ITEMS[id]) return 0;
    n = Math.min(n, this.count(id));
    if (n <= 0) return 0;
    this.removeItem(id, n); this.data.coins += n * this.sellValue(id);
    this.emit('change'); return n;
  }
  /** sell the bag slot at index i (use this for gear so enchanted copies are not sold by accident) */
  sellSlot(i, n = 1) {
    const s = this.data.bag[i];
    if (!s || s.id === 'coins') return 0;
    n = Math.min(n, s.n); s.n -= n; this.data.coins += n * this.sellValue(s.id);
    if (s.n <= 0) this.data.bag.splice(i, 1);
    this.emit('change'); return n;
  }
  buy(id) {
    if (!SHOP_BUY.includes(id)) return false;
    const price = ITEMS[id].value;
    if (this.data.coins < price) { this.toast('Not enough coins'); return false; }
    if (!this.canAdd(id)) { this.toast('Bag is full'); return false; }
    this.data.coins -= price; this.addItem(id, 1); this.emit('change'); return true;
  }
  deposit(id, n = 1, idx = -1) {
    if (idx >= 0 && this.data.bag[idx]?.id === id && (this.data.bag[idx].e || this.data.bag[idx].gem)) {
      const [s] = this.data.bag.splice(idx, 1);
      this.data.bankGear.push({ id, e: s.e, gem: s.gem });
      this.emit('change'); return 1;
    }
    n = Math.min(n, this.count(id));
    if (n <= 0) return 0;
    this.removeItem(id, n); this.data.bank[id] = (this.data.bank[id] || 0) + n; this.emit('change'); return n;
  }
  withdraw(id, n = 1) {
    n = Math.min(n, this.data.bank[id] || 0);
    if (n <= 0) return 0;
    const got = this.addItem(id, n);
    if (!got) { this.toast('Bag is full'); return 0; }
    this.data.bank[id] -= got; if (this.data.bank[id] <= 0) delete this.data.bank[id];
    this.emit('change'); return got;
  }
  withdrawGear(i) {
    const g = this.data.bankGear[i];
    if (!g) return false;
    if (!this.addItem(g.id, 1, g.e, g.gem)) { this.toast('Bag is full'); return false; }
    this.data.bankGear.splice(i, 1); this.emit('change'); return true;
  }

  // ---- enchanting. loc = { where: 'bag', idx } | { where: 'equip', slot }
  enchOf(loc) { return loc.where === 'bag' ? this.data.bag[loc.idx]?.e || null : this.data.equipEnch[loc.slot] || null; }
  idOf(loc) { return loc.where === 'bag' ? this.data.bag[loc.idx]?.id : this.data.equip[loc.slot]; }
  setEnch(loc, e) {
    if (loc.where === 'bag') { const s = this.data.bag[loc.idx]; if (e) s.e = e; else delete s.e; }
    else if (e) this.data.equipEnch[loc.slot] = e; else delete this.data.equipEnch[loc.slot];
  }
  /** spend EP and roll. A fresh item gets the result immediately; an enchanted one returns a candidate to keep or discard. */
  rollEnchant(loc, lockIdx = -1) {
    const id = this.idOf(loc), cur = this.enchOf(loc);
    if (!enchantCategory(id)) return { ok: false, reason: 'This cannot be enchanted' };
    const cost = rollCost(id, cur, cur && lockIdx >= 0);
    if (this.data.ep < cost) return { ok: false, reason: `Need ${cost} Enchant Points` };
    this.data.ep -= cost;
    const cand = rollEnchant(id, this.rng, { pity: this.data.pity, prev: cur, lockIdx: cur ? lockIdx : -1 });
    this.data.pity = nextPity(this.data.pity, cand.r);
    if (!cur) { this.setEnch(loc, cand); this.emit('change'); return { ok: true, cost, applied: true, ench: cand }; }
    this.emit('change');
    return { ok: true, cost, applied: false, ench: cand, old: cur };
  }
  /** keep the candidate (keepNew) or the old enchant; either way the item remembers how many rolls were spent on it */
  resolveEnchant(loc, cand, keepNew) {
    const cur = this.enchOf(loc);
    if (keepNew) this.setEnch(loc, cand); else if (cur) cur.rolls = cand.rolls;
    this.emit('change');
  }

  // ---- enchantment gems
  /** extract a selected mod from an enchanted item into a gem. Destroys the source item. */
  extractGem(loc, modIdx) {
    const id = this.idOf(loc), e = this.enchOf(loc);
    if (!e || modIdx < 0 || modIdx >= e.mods.length) return false;
    if (this.slotsUsed >= BAG_SLOTS) { this.toast('Bag is full'); return false; }
    const mod = e.mods[modIdx];
    const gem = gemFromMod(mod, e.r);
    // destroy the source item
    if (loc.where === 'bag') this.data.bag.splice(loc.idx, 1);
    else { this.data.equip[loc.slot] = null; delete this.data.equipEnch[loc.slot]; }
    this.data.bag.push({ id: 'enchant_gem', n: 1, gem });
    this.toast(`Extracted ${modText(mod)} into a gem`);
    this.emit('change');
    return true;
  }
  /** apply a gem to a target item (adds the mod or upgrades a matching one). Consumes the gem. */
  applyGem(gemIdx, targetLoc) {
    const gemSlot = this.data.bag[gemIdx];
    if (!gemSlot || gemSlot.id !== 'enchant_gem' || !gemSlot.gem) return false;
    const targetId = this.idOf(targetLoc);
    if (!enchantCategory(targetId)) { this.toast('That item cannot be enchanted'); return false; }
    const cat = enchantCategory(targetId);
    const gem = gemSlot.gem;
    if (!MODS[gem.k]?.cats.includes(cat) && !(ITEMS[targetId].tool && MODS[gem.k]?.cats.includes('tool'))) {
      this.toast('This gem cannot be applied to that item'); return false;
    }
    let e = this.enchOf(targetLoc);
    if (!e) {
      e = { r: gem.r, mods: [{ k: gem.k, v: gem.v, fam: gem.fam }], rolls: 0 };
      this.setEnch(targetLoc, e);
    } else {
      const existing = e.mods.find((m) => m.k === gem.k && (m.fam || '') === (gem.fam || ''));
      if (existing) {
        existing.v = Math.min(MODS[gem.k].cap || 1000, Math.round(Math.max(existing.v, gem.v) * 1.35 * 10) / 10);
        if (gem.r > e.r) e.r = gem.r;
      } else if (e.mods.length < maxMods(e.r)) {
        e.mods.push({ k: gem.k, v: gem.v, fam: gem.fam });
        if (gem.r > e.r) e.r = gem.r;
      } else {
        this.toast('No room for another modifier'); return false;
      }
    }
    this.data.bag.splice(gemIdx, 1);
    this.toast('Gem applied');
    this.emit('change');
    return true;
  }
  /** combine two identical gems into one upgraded gem. Consumes both. */
  combineGems(idx1, idx2) {
    if (idx1 === idx2) return false;
    const a = this.data.bag[idx1], b = this.data.bag[idx2];
    if (!a || !b || a.id !== 'enchant_gem' || b.id !== 'enchant_gem' || !a.gem || !b.gem) return false;
    if (!canCombineGems(a.gem, b.gem)) { this.toast('Gems must match in effect and rarity'); return false; }
    const upgraded = combineGemData(a.gem, b.gem);
    // remove higher index first
    const hi = Math.max(idx1, idx2), lo = Math.min(idx1, idx2);
    this.data.bag.splice(hi, 1);
    this.data.bag.splice(lo, 1);
    this.data.bag.push({ id: 'enchant_gem', n: 1, gem: upgraded });
    this.toast('Gems combined');
    this.emit('change');
    return true;
  }

  // ---- crafting (furnace / anvil). Stations must have been visited (tapped in the world) once.
  stationVisited(st) { return st === 'cook' ? !!(this.data.visited.fire || this.data.visited.range) : !!this.data.visited[st]; }
  recipeStatus(r) {
    if (!this.stationVisited(r.station) && !NO_STATION.has(r.station)) return { ok: false, reason: r.station === 'cook' ? 'Visit a campfire or range first' : `Visit the ${STATIONS[r.station]?.name || r.station} first` };
    const sk = r.skill || 'smithing';
    if (this.level(sk) < r.level) return { ok: false, reason: `${sk[0].toUpperCase() + sk.slice(1)} ${r.level}` };
    if (r.station === 'anvil' && !this.count('hammer')) return { ok: false, reason: 'Needs a hammer' };
    for (const [id, n] of Object.entries(r.inputs)) if (this.count(id) < n) return { ok: false, reason: `Need ${ITEMS[id].name} x${n}` };
    return { ok: true };
  }
  craft(recipeId, times = 1) {
    const r = RECIPE_BY_ID[recipeId];
    const res = { done: 0, failed: 0, reason: null };
    if (!r) return res;
    for (let i = 0; i < times; i++) {
      const st = this.recipeStatus(r);
      if (!st.ok) { res.reason = st.reason; break; }
      if (!isStackable(r.out) && this.slotsUsed >= BAG_SLOTS && !Object.keys(r.inputs).some((k) => this.count(k) === r.inputs[k])) { res.reason = 'Bag is full'; break; }
      for (const [id, n] of Object.entries(r.inputs)) this.removeItem(id, n);
      const burn = r.stop ? burnChance(r, this.level(r.skill), !!this.data.visited.range) : 0;
      if (r.stop ? this.rng() >= burn : (r.chance >= 1 || this.rng() < r.chance)) {
        if (!this.addItem(r.out, r.n || 1)) { res.reason = 'Bag is full'; break; }
        this.gain(r.skill || 'smithing', r.xp); res.done++;
        this.emit('craft', { id: r.out });
      } else { res.failed++; if (r.burnt) this.addItem(r.burnt, 1); this.emit('craftfail', { id: r.out }); }
    }
    this.emit('change');
    return res;
  }

  // ---- world
  enterArea(areaId, x, silent = false) {
    const a = AREAS[areaId];
    this.data.area = areaId;
    this.ents = a.entities.map(([type, kind, ex], i) => {
      const e = { id: `${areaId}:${i}`, type, kind, x: ex, dead: 0, cd: 0 };
      if (type === 'monster') { e.hp = MONSTERS[kind].hp; e.max = MONSTERS[kind].hp; }
      return e;
    });
    this.hero.x = x; this.hero.dest = null; this.target = null; this.hero.state = 'idle';
    if (!silent) this.emit('area', { area: areaId });
    this.emit('change');
  }
  areaUnlocked(areaId) { return true; }
  travel(areaId, x) {
    if (!AREAS[areaId]) return false;
    this.enterArea(areaId, x ?? AREAS[areaId].spawn);
    this.toast(`Arrived: ${AREAS[areaId].name}`);
    if (!this.data.visitedAreas[areaId]) { this.data.visitedAreas[areaId] = true; this.addEp(10, `first visit to ${AREAS[areaId].name}`); this.toast('First visit: +10 Enchant Points'); }
    return true;
  }
  ent(id) { return this.ents.find((e) => e.id === id) || null; }
  get targetEnt() { return this.target ? this.ent(this.target) : null; }
  tapGround(x) {
    const w = AREAS[this.data.area].width;
    this.hero.dest = Math.max(30, Math.min(w - 30, x)); this.target = null; this.hero.state = 'walk';
    this.emit('target');
  }
  /** returns false (with a toast) if the target can't be used yet */
  select(id) {
    const e = this.ent(id);
    if (!e) return false;
    if (e.type === 'node') {
      const n = NODES[e.kind];
      if (this.level(n.skill) < n.level) { this.toast(`${n.name} need ${n.skill} level ${n.level}`); return false; }
      if (!this.bestTool(n.tool)) { this.toast(`You need a ${TOOL_NAMES[n.tool] || n.tool}`); return false; }
      if (n.bait && !this.count(n.bait)) { this.toast(`You need ${ITEMS[n.bait].name.toLowerCase()} as bait`); return false; }
    }
    this.target = id; this.hero.dest = null; this.hero.cd = 0.5; e.cd = 1.2;
    this.emit('target');
    return true;
  }
  clearTarget() { this.target = null; this.hero.dest = null; this.hero.state = 'idle'; this.emit('target'); }

  update(dt) {
    dt = Math.min(dt, 0.25);
    const h = this.hero;
    for (const e of this.ents) {
      if (e.swing > 0) e.swing -= dt;
      if (e.dead > 0) {
        e.dead -= dt;
        if (e.dead <= 0) { e.dead = 0; if (e.type === 'monster') e.hp = e.max; }
      }
    }
    if (h.cd > 0) h.cd -= dt;
    if (this.eatCd > 0) this.eatCd -= dt;
    if (h.swing > 0) h.swing -= dt;
    if (h.hurt > 0) h.hurt -= dt;
    let engaged = false;
    const t = this.targetEnt;
    const moveTo = (x) => {
      const d = x - h.x;
      if (Math.abs(d) < 3) return true;
      const running = this.data.energy > 5;
      const speed = running ? WALK_SPEED * 1.6 : WALK_SPEED;
      h.dir = Math.sign(d); h.x += h.dir * Math.min(Math.abs(d), speed * dt); h.state = 'walk';
      if (running) this.drainEnergy(dt, true);
      return false;
    };
    if (t) {
      const reach = REACH[t.type] + (t.type === 'monster' ? this.combat.reach : 0);
      const side = h.x <= t.x ? -1 : 1;
      const tx = t.x + side * (reach - 6);
      if (t.dead > 0) { h.state = 'idle'; }
      else if (Math.abs(h.x - t.x) > reach && !moveTo(tx)) { /* walking */ }
      else {
        h.dir = h.x <= t.x ? 1 : -1;
        if (t.type === 'monster') engaged = this.fight(t, dt);
        else if (t.type === 'node') this.gather(t, dt);
        else if (t.type === 'station') { this.data.visited[t.kind] = true; this.target = null; h.state = 'idle'; this.emit('station', { kind: t.kind }); this.emit('target'); }
        else if (t.type === 'sign') { this.target = null; h.state = 'idle'; const back = AREAS[t.kind].entities.find((e) => e[0] === 'sign' && e[1] === this.data.area), from = this.data.area; if (this.travel(t.kind, back ? back[2] + (back[2] < AREAS[t.kind].width / 2 ? 110 : -110) : undefined)) this.hero.dir = back && back[2] > AREAS[t.kind].width / 2 ? -1 : 1; void from; }
      }
    } else if (h.dest != null) {
      if (moveTo(h.dest)) { h.dest = null; h.state = 'idle'; }
    } else if (h.state === 'walk') h.state = 'idle';
    if (engaged) this.tryAutoEat();
    // regeneration when not in a fight
    if (!engaged && this.data.hp < this.maxHp) {
      this.regenT += dt;
      if (this.regenT >= REGEN_EVERY / (1 + this.mods.regen) / (this.data.activePrayers.includes('rapid_heal') && this.prayerPoints > 0 ? 2 : 1)) { this.regenT = 0; this.data.hp = Math.min(this.maxHp, this.data.hp + 1); this.emit('hp'); }
    } else if (engaged) this.regenT = 0;

    // prayer point drain
    if (this.data.activePrayers.length && this.prayerPoints > 0) {
      this.prayerDrainT += dt * this.prayerDrain;
      if (this.prayerDrainT >= 1) {
        const drain = Math.floor(this.prayerDrainT);
        this.prayerDrainT -= drain;
        this.data.prayerPoints = Math.max(0, this.prayerPoints - drain);
        if (this.prayerPoints <= 0) {
          this.data.activePrayers = [];
          this.toast('Prayer points depleted');
        }
        this.emit('change');
      }
    } else this.prayerDrainT = 0;

    this.regenEnergy(dt);
  }

  fight(m, dt) {
    const h = this.hero, def = MONSTERS[m.kind], hc = this.combat;
    h.state = 'attack';
    if (h.cd <= 0) {
      const wep = ITEMS[this.data.equip.weapon];
      // Ranged uses arrows from the bag; magic spends the spell's runes (staff 'Bash' style is melee and needs neither)
      if (hc.type === 'ranged') {
        if (!hc.ammo) { this.toast('Out of arrows'); this.clearTarget(); return false; }
        this.removeItem(hc.ammo, 1);
      } else if (hc.type === 'magic') {
        if (!hc.spell) { this.toast(this.data.autocast ? 'Out of runes for that spell' : 'No spell you can cast (need runes)'); this.clearTarget(); return false; }
        this.spendRunes(hc.spell); this.gain('magic', hc.spell.xp);
      }
      h.cd = hc.interval; h.swing = h.swingDur = Math.min(0.45, hc.interval * 0.6);
      this.emit('swing', { kind: wep?.wk || 'unarmed', type: hc.type, two: hc.two });
      const hit = this.rng() < heroHitChance(hc, def);
      let dmg = hit ? Math.floor(this.rng() * (hc.maxHit + 1)) : 0;
      const mods = hc.mods;
      if (dmg > 0 && mods.vs[def.family]) dmg = Math.round(dmg * (1 + mods.vs[def.family]));
      let crit = false;
      if (dmg > 0 && mods.crit && this.rng() < mods.crit) { dmg = Math.ceil(dmg * 1.5); crit = true; }
      this.hitMonster(m, dmg, { crit });
      if (dmg > 0 && mods.lifesteal && this.data.hp < this.maxHp) { const n = Math.min(this.maxHp - this.data.hp, Math.max(1, Math.round(dmg * mods.lifesteal))); this.data.hp += n; this.emit('heal', { x: h.x, n, id: 'lifesteal' }); }
      if (hit && m.hp > 0 && mods.burn && this.rng() < mods.burn) this.hitMonster(m, Math.ceil(hc.maxHit / 3), { burn: true });
      if (m.dead > 0) return false;
    }
    m.cd -= dt;
    if (m.cd <= 0 && m.dead <= 0) {
      m.cd = def.interval; m.swing = 0.3;
      const r = this.monsterAttack(def);
      let dmg = r.dmg;
      this.emit('mattack', { id: m.id, x: m.x, style: r.style, proj: r.proj, blocked: r.blocked });
      this.data.hp = Math.max(0, this.data.hp - dmg);
      if (dmg > 0) h.hurt = 0.3;
      this.emit('hit', { who: 'hero', x: h.x, dmg, miss: dmg === 0 });
      if (this.data.hp <= 0) { this.die(); return false; }
      this.tryAutoEat();
      const a = this.data.autoEat;
      if (this.data.hp < this.maxHp * RETREAT_FRAC && !(a.on && this.foodCount > 0)) { this.toast('Low HP - retreating'); this.target = null; h.state = 'idle'; this.emit('target'); return false; }
    }
    return true;
  }
  /** one monster attack roll: OSRS-like styles. Dragonfire ignores accuracy; anti-dragon shield and Protect from Magic cut it.
   *  Protect from Melee/Missiles/Magic fully block the matching normal attack. */
  monsterAttack(def) {
    const hc = this.combat, pray = (id) => this.prayerPoints > 0 && this.data.activePrayers.includes(id);
    if (def.fire && this.rng() < def.fire.chance) {
      let dmg = Math.floor(this.rng() * (def.fire.max + 1));
      if (ITEMS[this.data.equip.shield]?.antifire) dmg = Math.floor(dmg * 0.15);
      if (pray('protect_from_magic')) dmg = Math.floor(dmg * 0.6);
      return { dmg, style: 'dragonfire', proj: 'dragonfire', blocked: false };
    }
    const style = monsterStyle(def), proj = def.proj || (style === 'ranged' ? 'arrow' : style === 'magic' ? 'orb' : null);
    if (pray(PROTECT[style])) return { dmg: 0, style, proj, blocked: true };
    const hit = this.rng() < monsterHitChance(hc, def);
    return { dmg: hit ? Math.floor(this.rng() * (def.maxHit + 1)) : 0, style, proj, blocked: false };
  }
  hitMonster(m, dmg, o = {}) {
    const def = MONSTERS[m.kind];
    const real = Math.min(dmg, m.hp); // xp is for damage actually dealt (no overkill xp)
    m.hp = Math.max(0, m.hp - dmg);
    this.emit('hit', { who: 'monster', id: m.id, x: m.x, dmg, miss: dmg === 0, crit: !!o.crit, burn: !!o.burn });
    if (real > 0) {
      for (const [s, share] of o.xp || styleXp(this.combat.style)) this.gain(s, 4 * real * share);
      this.gain('hitpoints', 1.33 * real);
    }
    if (m.hp <= 0) {
      m.dead = def.respawn || 6; this.data.stats.kills++;
      this.checkAchievements();
      // Slayer task progress
      const task = this.data.slayerTask;
      if (task && task.monsters.includes(m.kind) && task.left > 0) {
        task.left--;
        this.gain('slayer', task.xp);
        if (task.left <= 0) {
          const coins = 50 + this.level('slayer') * 10;
          this.data.coins += coins;
          this.data.slayerStreak = (this.data.slayerStreak || 0) + 1;
          this.toast(`Slayer task complete! +${coins} coins`);
          this.data.slayerTask = null;
        }
        this.emit('change');
      }
      this.emit('kill', { id: m.id, kind: m.kind, x: m.x });
      const dropMod = 1 + this.mods.drop;
      for (const d of def.drops) {
        if (this.rng() >= Math.min(1, d.p * dropMod)) continue;
        const n = d.n[0] + Math.floor(this.rng() * (d.n[1] - d.n[0] + 1));
        const got = this.addItem(d.id, n);
        if (got) this.emit('loot', { id: d.id, n: got, x: m.x });
        else this.toast('Bag is full - loot lost');
      }
      if (def.epFlat) { this.addEp(def.epFlat, def.name); this.toast(`${def.name} defeated: +${def.epFlat} Enchant Points`); }
      else if (def.epChance && this.rng() < def.epChance) { this.addEp(1, 'kill'); this.emit('floatep', { x: m.x }); }
      this.emit('change');
    }
  }
  die() {
    this.toast('Oh dear, you died! Back to the start.');
    this.emit('die', { x: this.hero.x });
    this.data.hp = this.maxHp;
    const a = AREAS[this.data.area];
    this.enterArea(this.data.area, a.spawn);
  }

  gatherChance(n) { return Math.min(0.9, n.chance + 0.012 * (this.level(n.skill) - n.level)); }
  /** yields the hero can currently get from a node */
  availableYields(n) { const lv = this.level(n.skill); return nodeYields(n).filter((y) => y.level <= lv); }
  gather(e, dt) {
    const h = this.hero, n = NODES[e.kind];
    const info = this.toolInfo(n.tool), tool = info?.item;
    if (!tool) { this.toast(`You need a ${TOOL_NAMES[n.tool] || n.tool}`); this.clearTarget(); return; }
    if (n.bait && !this.count(n.bait)) { this.toast(`Out of ${ITEMS[n.bait].name.toLowerCase()}`); this.clearTarget(); return; }
    h.state = 'gather';
    if (h.cd > 0) return;
    h.cd = n.interval / (1 + 0.2 * tool.toolTier) / (1 + sumMods([info.e]).gather); h.swing = h.swingDur = 0.45;
    this.emit('swing', { kind: n.tool, gather: true, x: e.x, node: e.kind });
    if (this.rng() < this.gatherChance(n)) {
      const ys = this.availableYields(n), y = ys[Math.floor(this.rng() * ys.length)];
      const got = this.addItem(y.item, 1);
      if (!got) { this.toast('Bag is full'); this.clearTarget(); return; }
      if (n.bait) this.removeItem(n.bait, 1);
      this.gain(n.skill, y.xp);
      if (n.skill === 'mining') { this.data.stats.mined = (this.data.stats.mined || 0) + 1; this.checkAchievements(); }
      e.dead = n.respawn; e.cd = 0;
      this.emit('loot', { id: y.item, n: 1, x: e.x, node: true });
      this.emit('change');
    } else this.emit('gatherfail', { x: e.x });
  }

  // ---- activity persistence (used for offline progress)
  snapshot(now = Date.now()) {
    const t = this.targetEnt;
    this.data.lastSeen = now;
    this.data.activity = t && (t.type === 'monster' || t.type === 'node') ? { area: this.data.area, target: t.id, kind: t.kind, type: t.type } : null;
  }
  /** re-select the saved target after a load (never fails loudly) */
  resumeActivity() {
    const a = this.data.activity;
    if (!a || a.area !== this.data.area) return false;
    const e = this.ent(a.target);
    if (!e || e.kind !== a.kind) return false;
    const toasts = this.listeners; this.listeners = [];
    const ok = this.select(e.id);
    this.listeners = toasts;
    if (ok) this.emit('target');
    return ok;
  }
}
