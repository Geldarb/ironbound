// Tiny DOM helpers shared by the UI modules.
export function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toFixed(n < 1e5 ? 2 : 1) + 'k';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'm';
  return (n / 1e9).toFixed(2) + 'b';
}
export const fmtStat = (v) => (v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (id) => document.getElementById(id);
export const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export const setText = (node, v) => { v = String(v); if (node._t !== v) { node._t = v; node.textContent = v; } };
