// Offline progress: a pure(ish) simulation of what the hero was doing while the tab was closed.
// It works from expected values (no DOM, no timers), mutates the given Game, and returns a report for the "Welcome back" popup.
import { MONSTERS, NODES, ITEMS, OFFLINE, SKILL_IDS, styleXp, isFood, ARROW_IDS } from './data.js';
import { heroHitChance, monsterHitChance, expectedDps } from './combat.js';
import { sumMods } from './enchant.js';
import { RETREAT_FRAC } from './game.js';

const RESPAWN_WAIT = 6, REGEN_PER_SEC = 0.5, CHUNK = 300;

export function simulateOffline(game, awaySeconds, opts = {}) {
  const rng = opts.rng || game.rng || Math.random;
  const eff = opts.efficiency ?? OFFLINE.efficiency;
  const cap = (opts.capHours ?? OFFLINE.capHours) * 3600;
  const minAway = opts.minAway ?? OFFLINE.minAway;
  const used = Math.min(awaySeconds, cap);
  const rep = { away: awaySeconds, used, capped: awaySeconds > cap, simulated: false, activity: null, kills: 0, catches: 0, ep: 0, epKills: 0, epLevels: 0, xp: {}, levels: [], items: {}, coins: 0, ate: {}, spent: {}, banked: 0, stopped: null };
  const act = game.data.activity;
  if (!act || awaySeconds < minAway) return rep;
  const kind = act.type === 'monster' ? MONSTERS[act.kind] : NODES[act.kind];
  if (!kind) return rep;
  rep.activity = { type: act.type, kind: act.kind, name: kind.name, area: act.area };

  const d = game.data, xp0 = { ...d.xp }, lv0 = game.levels, ep0 = d.ep;
  const saved = game.listeners; game.listeners = []; // silent: no toasts / floaters while catching up
  const give = (id, n) => {
    if (n <= 0) return;
    rep.items[id] = (rep.items[id] || 0) + n;
    if (id === 'coins') { d.coins += n; rep.coins += n; delete rep.items.coins; return; }
    const got = game.addItem(id, n), rest = n - got;
    if (rest > 0) { d.bank[id] = (d.bank[id] || 0) + rest; rep.banked += rest; } // overflow is auto-banked
  };
  const stochastic = (x) => Math.floor(x) + (rng() < x - Math.floor(x) ? 1 : 0);
  let remaining = used * eff;
  let hp = d.hp;
  try {
    while (remaining > 1 && !rep.stopped) {
      const chunk = Math.min(remaining, CHUNK);
      if (act.type === 'monster') {
        const m = kind, hc = game.combat, maxHp = game.maxHp;
        const dps = expectedDps(hc, m);
        if (dps <= 0) { rep.stopped = 'cannot hurt it'; break; }
        const wait = m.respawn || RESPAWN_WAIT, ttk = m.hp / dps, cycle = ttk + wait;
        const fc = m.fire?.chance || 0, fireAvg = m.fire ? (m.fire.max / 2) * (ITEMS[game.data.equip.shield]?.antifire ? 0.15 : 1) : 0;
        const perHit = (1 - fc) * monsterHitChance(hc, m) * (m.maxHit / 2) + fc * fireAvg; // expected damage per monster attack (incl. dragonfire)
        const loss = Math.max(0, (perHit / m.interval) * ttk - wait * REGEN_PER_SEC * (1 + hc.mods.regen)); // net hp lost per kill
        const floorHp = Math.ceil(maxHp * RETREAT_FRAC);
        const foods = d.autoEat.on ? d.bag.filter((s) => isFood(s.id)).sort((a, b) => ITEMS[b.id].heal - ITEMS[a.id].heal).map((s) => ({ id: s.id, n: s.n, heal: ITEMS[s.id].heal })) : [];
        const foodHeal = foods.reduce((a, f) => a + f.n * f.heal, 0);
        const timeKills = Math.floor(Math.max(chunk, Math.min(remaining, cycle)) / cycle);
        let kills = timeKills;
        if (loss > 0) {
          const budget = Math.max(0, hp - floorHp) + foodHeal;
          const byHp = Math.floor(budget / loss);
          if (byHp < kills) { kills = byHp; rep.stopped = foods.length ? 'out of food' : 'low HP'; }
        }
        // ranged / magic: each attack uses an arrow or one cast's runes, so supplies cap the kills
        const perKill = Math.max(1, Math.ceil(ttk / hc.interval));
        if (hc.type === 'ranged' || hc.type === 'magic') {
          const sp = hc.spell, free = game.freeRune;
          const shots = hc.type === 'ranged' ? ARROW_IDS.reduce((a, id) => a + game.count(id), 0)
            : Math.min(...Object.entries(sp?.runes || { none: 1 }).map(([r, n]) => (r === free ? Infinity : Math.floor(game.count(r) / n))));
          const byAmmo = Math.floor(shots / perKill);
          if (byAmmo < kills) { kills = byAmmo; rep.stopped = hc.type === 'ranged' ? 'out of arrows' : 'out of runes'; }
          if (kills > 0) {
            let need = kills * perKill;
            if (hc.type === 'ranged') for (const id of ARROW_IDS) { const k = Math.min(need, game.count(id)); if (k) { game.removeItem(id, k); need -= k; rep.spent[id] = (rep.spent[id] || 0) + k; } }
            else { for (const [r, n] of Object.entries(sp.runes)) if (r !== free) { game.removeItem(r, n * need); rep.spent[r] = (rep.spent[r] || 0) + n * need; } game.gain('magic', sp.xp * need); }
          }
        }
        if (kills <= 0) break;
        // food: whatever the hp pool above the retreat line could not absorb is eaten (best food first)
        const pool = Math.max(0, hp - floorHp), total = kills * loss;
        if (total <= pool) hp -= total;
        else {
          let healed = 0; const deficit = total - pool;
          while (healed < deficit) {
            const f = foods.find((x) => x.n > 0); if (!f) break;
            f.n--; healed += f.heal; game.removeItem(f.id, 1); rep.ate[f.id] = (rep.ate[f.id] || 0) + 1;
          }
          hp = Math.min(maxHp, floorHp + Math.max(0, healed - deficit));
        }
        // xp for the damage dealt, per stance
        const dmg = kills * m.hp;
        for (const [sk, share] of styleXp(hc.style)) game.gain(sk, 4 * dmg * share);
        game.gain('hitpoints', 1.33 * dmg);
        for (const dr of m.drops) {
          const avg = (dr.n[0] + dr.n[1]) / 2;
          give(dr.id, stochastic(Math.min(1, dr.p * (1 + hc.mods.drop)) * avg * kills));
        }
        d.stats.kills += kills; rep.kills += kills;
        // Enchant Points: the same per-kill sources as online (boss flat EP + per-kill chance). `kills` is already the 50%-pace
        // count, so the chance-based part carries the offline efficiency without being reduced twice.
        const ep = stochastic(kills * ((m.epFlat || 0) + (m.epChance || 0)));
        if (ep > 0) { game.addEp(ep, 'offline'); rep.epKills += ep; }
        remaining -= kills * cycle;
      } else {
        const n = kind, tool = game.bestTool(n.tool);
        if (!tool) { rep.stopped = 'no tool'; break; }
        if (game.level(n.skill) < n.level) { rep.stopped = 'level too low'; break; }
        const info = game.toolInfo(n.tool), p = game.gatherChance(n), step = n.interval / (1 + 0.2 * tool.toolTier) / (1 + sumMods([info.e]).gather);
        const per = (1 / p - 1) * step + Math.max(step, n.respawn);
        let succ = Math.floor(Math.max(chunk, Math.min(remaining, per)) / per);
        if (n.bait) { const have = game.count(n.bait); if (have < succ) { succ = have; rep.stopped = 'out of bait'; } }
        if (succ <= 0) break;
        const ys = game.availableYields(n), counts = new Map();
        for (let i = 0; i < succ; i++) { const y = ys[Math.floor(rng() * ys.length)]; counts.set(y, (counts.get(y) || 0) + 1); }
        for (const [y, c] of counts) { give(y.item, c); game.gain(n.skill, y.xp * c); }
        if (n.bait) game.removeItem(n.bait, succ);
        rep.catches += succ;
        remaining -= succ * per;
      }
    }
  } finally { game.listeners = saved; }
  // hp: if the hero stopped (retreat) he rested for the rest of the time away; otherwise he is wherever the fight left him
  d.hp = Math.max(1, Math.min(game.maxHp, rep.stopped ? game.maxHp : Math.round(hp)));
  for (const s of SKILL_IDS) {
    const g = d.xp[s] - xp0[s];
    if (g > 0) rep.xp[s] = g;
    const l1 = game.level(s);
    if (l1 > lv0[s]) rep.levels.push({ skill: s, from: lv0[s], to: l1 });
  }
  // total EP gained = kill EP above + the level-up rule applied by game.gain (+1 per level, +5 on every 10th)
  rep.ep = d.ep - ep0; rep.epLevels = rep.ep - rep.epKills;
  rep.simulated = rep.kills > 0 || rep.catches > 0;
  return rep;
}
