// Co-op UI: small floating button on the scene, room/chat sheet (modal), trade window, chat ticker.
import { ITEMS } from './data.js';
import { iconURL } from './art.js';
import { $, el, esc, fmt } from './dom.js';
import { normalizeCode } from './coop-proto.js';

const img = (id) => `<img alt="" src="${iconURL(id)}">`;
const ERR = { no_room: 'No room with that code', room_full: 'That room is full (4 players)', bad_code: 'Codes are 5 letters/numbers', server_full: 'Server busy - try again', rate_limited: 'Slow down' };

export class CoopUI {
  constructor(coop, ui) {
    this.c = coop; this.ui = ui; this.view = null;
    const stage = $('stage');
    // co-op lives in Settings; the settings button carries a subtle connected ring + unread dot
    this.btn = $('btnMenu'); this.badge = this.btn.querySelector('.coopBadge') || el('span', 'coopBadge'); this.btn.appendChild(this.badge);
    this.ticker = el('div', 'coopTicker'); this.ticker.id = 'coopTicker'; stage.appendChild(this.ticker);
    coop.on((t, p) => {
      if (t === 'chat') { this.renderTicker(); if (this.view === 'room') this.renderChat(); if (this.view !== 'room' && !p.me && !p.sys) this.unread = (this.unread || 0) + 1; this.renderBadge(); }
      else if (t === 'room' || t === 'status') { this.renderBadge(); if (this.view === 'room') this.openRoom(); }
      else if (t === 'error') { if (this.view === 'room') { const n = $('coopErr'); if (n) n.textContent = ERR[p.err] || p.err; } }
      else if (t === 'invite') this.showInvite(p);
      else if (t === 'trade') { if (p.ended) { this.ui.toast(p.ended, !!p.done); if (this.view === 'trade') { this.ui.closeModal(); this.view = null; } } else if (coop.trade?.open) this.openTrade(); else this.ui.toast('Trade request sent - waiting...'); }
    });
    this.renderBadge(); this.renderTicker();
  }
  renderBadge() {
    const c = this.c, n = c.room ? c.members.length : 0;
    this.btn.classList.toggle('on', !!c.room && c.status === 'online'); this.btn.classList.toggle('warn', !!c.room && c.status !== 'online');
    this.badge.hidden = !this.unread; this.btn.title = c.room ? `Settings · co-op room ${c.room.code} (${n} player${n === 1 ? '' : 's'})` : 'Settings';
  }
  renderTicker() {
    const lines = this.c.room ? this.c.chat.filter((m) => Date.now() - m.ts < 12000).slice(-2) : [];
    this.ticker.innerHTML = lines.map((m) => `<div class="${m.sys ? 'sys' : ''}">${m.sys ? '' : `<b>${esc(m.name)}:</b> `}${esc(m.x)}</div>`).join('');
    clearTimeout(this.tT); if (lines.length) this.tT = setTimeout(() => this.renderTicker(), 12500);
  }
  close() { this.view = null; this.ui.closeModal(); }
  /** one-line status for the Settings row */
  summary() { const c = this.c; return c.room ? `Room ${c.room.code} · ${c.members.length} player${c.members.length === 1 ? '' : 's'}${c.status !== 'online' ? ' · reconnecting' : ''}` : 'Play with friends using a room code'; }

  openRoom() {
    const c = this.c; if (c.trade?.open) return this.openTrade(); this.view = 'room'; this.unread = 0; this.renderBadge();
    const status = c.status === 'online' ? '' : c.status === 'connecting' ? '<p class="note">Connecting...</p>' : c.status === 'offline' && c.room ? '<p class="note" style="color:#ffb86b">Connection lost - reconnecting. You keep playing solo meanwhile.</p>' : '';
    if (!c.room) {
      const card = this.ui.modal(`<h3>👥 Co-op</h3><p class="note">Play together: create a room and share the code, or join a friend's room. Saves stay on your device.</p>${status}
        <div class="btns"><button class="btn gold" id="coopCreate" style="flex:1">Create room</button></div>
        <div class="coopJoin"><input id="coopCode" maxlength="5" placeholder="CODE" autocomplete="off" autocapitalize="characters"><button class="btn gold" id="coopJoin">Join</button></div>
        <div id="coopErr" class="note" style="color:#ff8a80;min-height:1em"></div><div class="btns"><button class="btn" id="coopX" style="flex:1">Close</button></div>`);
      card.querySelector('#coopCreate').onclick = () => { c.create(); $('coopErr').textContent = 'Creating...'; };
      const join = () => { const v = normalizeCode($('coopCode').value); if (v.length !== 5) { $('coopErr').textContent = ERR.bad_code; return; } c.join(v); $('coopErr').textContent = 'Joining...'; };
      card.querySelector('#coopJoin').onclick = join; card.querySelector('#coopCode').onkeydown = (e) => { if (e.key === 'Enter') join(); };
      card.querySelector('#coopX').onclick = () => this.close();
      return;
    }
    const me = c.room.id;
    const mem = c.members.map((m) => { const p = c.peers.get(m.id); const where = m.id === me ? 'you' : m.away ? 'reconnecting...' : p ? `lvl ${p.lv} · ${p.a === c.g.data.area ? 'here' : esc(p.a)}` : '';
      return `<div class="coopMem"><span><b>${esc(m.name)}</b> <em>${where}</em></span>${m.id !== me && !m.away ? `<button class="btn" data-trade="${m.id}">Trade</button>` : ''}</div>`; }).join('');
    const card = this.ui.modal(`<h3>👥 Room <span class="coopCode" id="coopRoomCode">${esc(c.room.code)}</span></h3>${status}<p class="note">Share this code. Same-area players fight the same monsters (shared HP, own loot).</p>
      <div class="coopMems">${mem}</div><div class="coopChat" id="coopChat"></div>
      <div class="coopJoin"><input id="coopMsg" maxlength="120" placeholder="Say something" autocomplete="off"><button class="btn gold" id="coopSend">Send</button></div>
      <div class="btns"><button class="btn" id="coopLeave" style="flex:1">Leave room</button><button class="btn" id="coopX" style="flex:1">Close</button></div>`);
    this.renderChat();
    const send = () => { const i = $('coopMsg'); if (c.say(i.value)) i.value = ''; };
    card.querySelector('#coopSend').onclick = send; card.querySelector('#coopMsg').onkeydown = (e) => { if (e.key === 'Enter') send(); };
    card.querySelector('#coopLeave').onclick = () => { c.leave(); this.openRoom(); };
    card.querySelector('#coopX').onclick = () => this.close();
    card.querySelectorAll('[data-trade]').forEach((b) => { b.onclick = () => { if (c.requestTrade(b.dataset.trade)) this.close(); }; });
  }
  renderChat() { const box = $('coopChat'); if (!box) return; box.innerHTML = this.c.chat.slice(-30).map((m) => `<div class="${m.sys ? 'sys' : ''}">${m.sys ? '' : `<b>${esc(m.name)}:</b> `}${esc(m.x)}</div>`).join(''); box.scrollTop = box.scrollHeight; }

  showInvite(p) {
    this.view = 'invite';
    const card = this.ui.modal(`<h3>🤝 Trade request</h3><p class="note"><b>${esc(p.name)}</b> wants to trade with you.</p><div class="btns"><button class="btn gold" id="invYes" style="flex:1">Trade</button><button class="btn" id="invNo" style="flex:1">Decline</button></div>`);
    card.querySelector('#invYes').onclick = () => { this.c.answerInvite(p.tid, true); };
    card.querySelector('#invNo').onclick = () => { this.c.answerInvite(p.tid, false); this.close(); };
  }

  openTrade() {
    const c = this.c, t = c.trade, g = c.g; if (!t) return; this.view = 'trade';
    const cell = (o, i, mine) => `<button class="cell${o.e || o.gem ? ' ench' : ''}" ${mine ? `data-un="${i}"` : ''} title="${esc(ITEMS[o.id]?.name || o.id)}">${img(o.id)}${o.n > 1 ? `<i>${fmt(o.n)}</i>` : ''}</button>`;
    const side = (o, mine) => `<div class="tgrid">${o.items.map((x, i) => cell(x, i, mine)).join('') || '<span class="note">Nothing</span>'}</div><div class="tcoin">🪙 ${fmt(o.coins)}</div>`;
    const offered = new Map(t.mine.items.map((o) => [o.id + JSON.stringify(o.e || null), o.n]));
    const bag = g.data.bag.map((s, i) => { const k = s.id + JSON.stringify(s.e || null); const left = s.n - Math.min(s.n, offered.get(k) || 0); return left > 0 && !s.gem ? `<button class="cell" data-off="${i}" title="${esc(ITEMS[s.id]?.name || s.id)}">${img(s.id)}${s.n > 1 ? `<i>${fmt(s.n)}</i>` : ''}</button>` : ''; }).join('');
    const st = t.myReady && t.theirReady ? 'Completing...' : t.myReady ? 'Waiting for the other player...' : t.theirReady ? '<b style="color:#9dff8a">Other player accepted</b>' : 'Tap your items to offer them';
    const card = this.ui.modal(`<h3>🤝 Trade with ${esc(c.memberName(t.peer))}</h3><div class="trade"><div class="tside${t.myReady ? ' ok' : ''}"><h4>You offer</h4>${side(t.mine, true)}</div><div class="tside${t.theirReady ? ' ok' : ''}"><h4>They offer</h4>${side(t.theirs, false)}</div></div>
      <p class="note" id="tradeStatus">${st}</p><div class="tbag">${bag || '<span class="note">Bag is empty</span>'}</div>
      <div class="coopJoin"><input id="tradeCoins" type="number" min="0" max="${g.data.coins}" placeholder="Coins (you have ${fmt(g.data.coins)})" value="${t.mine.coins || ''}"><button class="btn" id="tradeSetCoins">Set coins</button></div>
      <div class="btns"><button class="btn gold" id="tradeAccept" style="flex:1" ${t.myReady ? 'disabled' : ''}>${t.myReady ? 'Accepted' : 'Accept'}</button><button class="btn" id="tradeCancel" style="flex:1">Cancel</button></div>`);
    card.querySelectorAll('[data-off]').forEach((b) => { b.onclick = () => c.offerSlot(+b.dataset.off); });
    card.querySelectorAll('[data-un]').forEach((b) => { b.onclick = () => c.unoffer(+b.dataset.un); });
    card.querySelector('#tradeSetCoins').onclick = () => c.offerCoins($('tradeCoins').value);
    card.querySelector('#tradeAccept').onclick = () => { const r = c.accept(); if (!r.ok && r.err) this.ui.toast(r.err); };
    card.querySelector('#tradeCancel').onclick = () => c.cancelTrade();
  }
}
