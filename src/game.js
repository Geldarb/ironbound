// Game model: character state + the traversable-area simulation. No DOM here (the UI listens to `game.on`).
import { SKILL_IDS, ITEMS, MONSTERS, NODES, AREAS, RECIPE_BY_ID, STATIONS, SLOT_IDS, BAG_SLOTS, SHOP_BUY, SELL_RATE, STANCE_BY_ID, isStackable, XP_RATE, nodeYields, burnChance, isFood } from './data.js';
import { levelForXp } from './xp.js';
import { heroCombat, heroHitChance, monsterHitChance, combatLevel } from './combat.js';

export const TOOL_NAMES = { pickaxe: 'pickaxe', axe: 'axe', net: 'small fishing net', rod: 'fishing rod', harpoon: 'harpoon', cage: 'lobster pot', hammer: 'hammer' };
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
    this.hero = { x: 0, dir: 1, state: 'idle', cd: 0, moving: false };
    this.target = null; // entity id
    this.ents = [];
    this.regenT = 0;
    this.eatCd = 0;
    this.data.area = AREAS[this.data.area] ? this.data.area : 'meadow';
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
  get combatLevel() { return combatLevel(this.levels); }
  gain(skill, amount) {
    if (amount <= 0) return;
    amount *= XP_RATE;
    const before = this.level(skill);
    this.data.xp[skill] = Math.min(200000000, (this.data.xp[skill] || 0) + amount);
    this.emit('xp', { skill, amount, x: this.hero.x });
    const after = this.level(skill);
    if (after > before) {
      if (skill === 'hitpoints') this.data.hp = Math.min(this.maxHp, this.data.hp + (after - before));
      this.emit('level', { skill, level: after });
    }
  }
  get combat() { return heroCombat(this.levels, this.data.equip, this.data.stance); }
  setStance(id) { if (STANCE_BY_ID[id]) { this.data.stance = id; this.emit('change'); } }

  // ---- inventory
  count(id) { return this.data.bag.reduce((a, s) => a + (s.id === id ? s.n : 0), 0); }
  get slotsUsed() { return this.data.bag.length; }
  canAdd(id) { return id === 'coins' || (isStackable(id) && this.data.bag.some((s) => s.id === id)) || this.slotsUsed < BAG_SLOTS; }
  /** returns how many were added */
  addItem(id, n = 1) {
    if (n <= 0) return 0;
    if (id === 'coins') { this.data.coins += n; return n; }
    if (isStackable(id)) {
      const s = this.data.bag.find((x) => x.id === id);
      if (s) { s.n += n; return n; }
      if (this.slotsUsed >= BAG_SLOTS) return 0;
      this.data.bag.push({ id, n }); return n;
    }
    let added = 0;
    for (let i = 0; i < n && this.slotsUsed < BAG_SLOTS; i++) { this.data.bag.push({ id, n: 1 }); added++; }
    return added;
  }
  removeItem(id, n = 1) {
    if (this.count(id) < n) return false;
    let left = n;
    for (let i = this.data.bag.length - 1; i >= 0 && left > 0; i--) {
      const s = this.data.bag[i];
      if (s.id !== id) continue;
      const t = Math.min(s.n, left); s.n -= t; left -= t;
      if (s.n <= 0) this.data.bag.splice(i, 1);
    }
    return true;
  }
  bestTool(type) {
    let best = null;
    for (const s of this.data.bag) { const it = ITEMS[s.id]; if (it?.tool === type && (!best || it.toolTier > best.toolTier)) best = it; }
    return best;
  }

  // ---- food / eating
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
  equip(id) {
    const c = this.canEquip(id);
    if (!c.ok) { this.toast(c.reason); return false; }
    if (!this.removeItem(id, 1)) return false;
    const slot = ITEMS[id].slot;
    const old = this.data.equip[slot];
    this.data.equip[slot] = id;
    if (old) this.addItem(old, 1);
    this.emit('change');
    return true;
  }
  unequip(slot) {
    const id = this.data.equip[slot];
    if (!id) return false;
    if (this.slotsUsed >= BAG_SLOTS) { this.toast('Bag is full'); return false; }
    this.data.equip[slot] = null; this.addItem(id, 1);
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
  buy(id) {
    if (!SHOP_BUY.includes(id)) return false;
    const price = ITEMS[id].value;
    if (this.data.coins < price) { this.toast('Not enough coins'); return false; }
    if (!this.canAdd(id)) { this.toast('Bag is full'); return false; }
    this.data.coins -= price; this.addItem(id, 1); this.emit('change'); return true;
  }
  deposit(id, n = 1) {
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

  // ---- crafting (furnace / anvil). Stations must have been visited (tapped in the world) once.
  stationVisited(st) { return st === 'cook' ? !!(this.data.visited.fire || this.data.visited.range) : !!this.data.visited[st]; }
  recipeStatus(r) {
    if (!this.stationVisited(r.station)) return { ok: false, reason: r.station === 'cook' ? 'Visit a campfire or range first' : `Visit the ${STATIONS[r.station].name} first` };
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
        if (!this.addItem(r.out, 1)) { res.reason = 'Bag is full'; break; }
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
  areaUnlocked(areaId) { return this.combatLevel >= (AREAS[areaId].req.combat || 0); }
  travel(areaId, x) {
    if (!AREAS[areaId]) return false;
    if (!this.areaUnlocked(areaId)) { this.toast(`${AREAS[areaId].name} needs combat level ${AREAS[areaId].req.combat}`); return false; }
    this.enterArea(areaId, x ?? AREAS[areaId].spawn);
    this.toast(`Arrived: ${AREAS[areaId].name}`);
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
      if (e.dead > 0) {
        e.dead -= dt;
        if (e.dead <= 0) { e.dead = 0; if (e.type === 'monster') e.hp = e.max; }
      }
    }
    if (h.cd > 0) h.cd -= dt;
    if (this.eatCd > 0) this.eatCd -= dt;
    let engaged = false;
    const t = this.targetEnt;
    const moveTo = (x) => {
      const d = x - h.x;
      if (Math.abs(d) < 3) return true;
      h.dir = Math.sign(d); h.x += h.dir * Math.min(Math.abs(d), WALK_SPEED * dt); h.state = 'walk'; return false;
    };
    if (t) {
      const reach = REACH[t.type];
      const stand = t.x - h.dir * 0 ; // hero stands on the side he approaches from
      const side = h.x <= t.x ? -1 : 1;
      const tx = t.x + side * (reach - 6);
      if (t.dead > 0) { h.state = 'idle'; }
      else if (Math.abs(h.x - t.x) > reach && !moveTo(tx)) { /* walking */ }
      else {
        h.dir = h.x <= t.x ? 1 : -1;
        if (t.type === 'monster') engaged = this.fight(t, dt);
        else if (t.type === 'node') this.gather(t, dt);
        else if (t.type === 'station') { this.data.visited[t.kind] = true; this.target = null; h.state = 'idle'; this.emit('station', { kind: t.kind }); this.emit('target'); }
        else if (t.type === 'sign') { this.target = null; h.state = 'idle'; this.travel(t.kind, t.kind === 'meadow' ? AREAS.meadow.width - 220 : AREAS[t.kind].spawn); }
      }
      void stand;
    } else if (h.dest != null) {
      if (moveTo(h.dest)) { h.dest = null; h.state = 'idle'; }
    } else if (h.state === 'walk') h.state = 'idle';
    if (engaged) this.tryAutoEat();
    // regeneration when not in a fight
    if (!engaged && this.data.hp < this.maxHp) {
      this.regenT += dt;
      if (this.regenT >= REGEN_EVERY) { this.regenT = 0; this.data.hp = Math.min(this.maxHp, this.data.hp + 1); this.emit('hp'); }
    } else if (engaged) this.regenT = 0;
  }

  fight(m, dt) {
    const h = this.hero, def = MONSTERS[m.kind], hc = this.combat;
    h.state = 'attack';
    if (h.cd <= 0) {
      h.cd = hc.interval;
      const hit = this.rng() < heroHitChance(hc, def);
      const dmg = hit ? Math.floor(this.rng() * (hc.maxHit + 1)) : 0;
      this.hitMonster(m, dmg);
      if (m.dead > 0) return false;
    }
    m.cd -= dt;
    if (m.cd <= 0 && m.dead <= 0) {
      m.cd = def.interval;
      const hit = this.rng() < monsterHitChance(hc, def);
      const dmg = hit ? Math.floor(this.rng() * (def.maxHit + 1)) : 0;
      this.data.hp = Math.max(0, this.data.hp - dmg);
      this.emit('hit', { who: 'hero', x: h.x, dmg, miss: dmg === 0 });
      if (this.data.hp <= 0) { this.die(); return false; }
      this.tryAutoEat();
      const a = this.data.autoEat;
      if (this.data.hp < this.maxHp * RETREAT_FRAC && !(a.on && this.foodCount > 0)) { this.toast('Low HP - retreating'); this.target = null; h.state = 'idle'; this.emit('target'); return false; }
    }
    return true;
  }
  hitMonster(m, dmg) {
    const def = MONSTERS[m.kind];
    const real = Math.min(dmg, m.hp); // xp is for damage actually dealt (no overkill xp)
    m.hp = Math.max(0, m.hp - dmg);
    this.emit('hit', { who: 'monster', id: m.id, x: m.x, dmg, miss: dmg === 0 });
    if (real > 0) {
      const st = STANCE_BY_ID[this.data.stance];
      for (const s of st.xp) this.gain(s, 4 * real);
      this.gain('hitpoints', 1.33 * real);
    }
    if (m.hp <= 0) {
      m.dead = 6; this.data.stats.kills++;
      this.emit('kill', { id: m.id, kind: m.kind });
      for (const d of def.drops) {
        if (this.rng() >= d.p) continue;
        const n = d.n[0] + Math.floor(this.rng() * (d.n[1] - d.n[0] + 1));
        const got = this.addItem(d.id, n);
        if (got) this.emit('loot', { id: d.id, n: got, x: m.x });
        else this.toast('Bag is full - loot lost');
      }
      this.emit('change');
    }
  }
  die() {
    this.toast('Oh dear, you died! Back to the start.');
    this.emit('die');
    this.data.hp = this.maxHp;
    const a = AREAS[this.data.area];
    this.enterArea(this.data.area, a.spawn);
  }

  gatherChance(n) { return Math.min(0.9, n.chance + 0.012 * (this.level(n.skill) - n.level)); }
  /** yields the hero can currently get from a node */
  availableYields(n) { const lv = this.level(n.skill); return nodeYields(n).filter((y) => y.level <= lv); }
  gather(e, dt) {
    const h = this.hero, n = NODES[e.kind];
    const tool = this.bestTool(n.tool);
    if (!tool) { this.toast(`You need a ${TOOL_NAMES[n.tool] || n.tool}`); this.clearTarget(); return; }
    if (n.bait && !this.count(n.bait)) { this.toast(`Out of ${ITEMS[n.bait].name.toLowerCase()}`); this.clearTarget(); return; }
    h.state = 'gather';
    if (h.cd > 0) return;
    h.cd = n.interval / (1 + 0.2 * tool.toolTier);
    if (this.rng() < this.gatherChance(n)) {
      const ys = this.availableYields(n), y = ys[Math.floor(this.rng() * ys.length)];
      const got = this.addItem(y.item, 1);
      if (!got) { this.toast('Bag is full'); this.clearTarget(); return; }
      if (n.bait) this.removeItem(n.bait, 1);
      this.gain(n.skill, y.xp);
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
