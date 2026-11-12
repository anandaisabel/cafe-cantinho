// Auto-update: when a newer build is published, save and reload (players never have to know to refresh).
// Only on the hosted site: it compares window.__VER (baked in by build.py) with version.json next to the page.
import { flush } from './state.js';
import { emit } from './util.js';
let busy = false, last = 0;
export async function checkUpdate(force) {
  if (busy || !window.__VER || window.claude || /[?&]offline/.test(location.search)) return;
  if (!force && Date.now() - last < 45000) return;
  last = Date.now(); busy = true;
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const { v } = await r.json();
    if (v && v !== window.__VER) {
      emit('toast', 'Chegou uma versão nova do café! Atualizando…');
      try { await flush(true); } catch (e) { }
      setTimeout(() => { location.replace(location.pathname + '?v=' + v); }, 1400);   // a changed URL skips the cached copy
      return;
    }
  } catch (e) { }
  finally { busy = false; }
}
export function startUpdateWatch() {
  setInterval(checkUpdate, 60000);                                                   // while playing: once a minute
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(true); });   // back to the game
  setTimeout(() => checkUpdate(true), 8000);
}
