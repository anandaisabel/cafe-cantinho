// Small shared helpers
// GAME CLOCK — all gameplay timers (cooking, spoiling, patience) read this.
// It only advances while the game is actually running on screen, so closing the tab or the app
// freezes everything exactly where it was; there is no offline simulation.
let gameMs = 0, lastReal = Date.now();
export const now = () => gameMs;                 // game time in ms, persisted with the save
export const wall = () => Date.now();            // real-world time, for save stamps only
export function tickClock() {
  const t = Date.now(); let d = t - lastReal; lastReal = t;
  if (!(d > 0)) d = 0;
  if (d > 1000) d = 1000;                        // a long stall must not fast-forward the café
  if (typeof document !== 'undefined' && document.hidden) d = 0;   // game not on screen: everything waits
  gameMs += d;
  return gameMs;
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { lastReal = Date.now(); });
export function advanceClock(ms) { gameMs += Math.max(0, ms); }   // debug/testing hook only
export function setClock(ms) { gameMs = Number.isFinite(ms) && ms > 0 ? ms : 0; lastReal = Date.now(); }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function parse(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}
// amt in -1..1 : negative darkens, positive lightens
export function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  let [r, g, b] = parse(hex);
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `rgb(${r},${g},${b})`;
}
export function alpha(hex, a) { const [r, g, b] = parse(hex); return `rgba(${r},${g},${b},${a})`; }

export function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return s + 's';
  if (s < 3600) { const m = Math.floor(s / 60), r = s % 60; return m + 'min' + (r && m < 5 ? ' ' + r + 's' : ''); }
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h + 'h' + (m ? ' ' + m + 'min' : '');
}

// tiny event bus so modules stay decoupled
const handlers = {};
export const on = (n, f) => (handlers[n] = handlers[n] || []).push(f);
export const emit = (n, d) => (handlers[n] || []).forEach(f => f(d));
