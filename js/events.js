// Quality score and the hooks future events, contests and challenges plug into.
// Nothing here runs on a timer yet: it is the structure the rest of the game already reads from.
import { ITEMS, RECIPES } from './config.js';
import { charm, rep, level, seats } from './state.js';

// 0..1 — how good the café is right now. Decoration, menu variety, satisfaction and service all count.
export function cafeQuality(st) {
  if (!st) return 0;
  const dec = Math.min(1, charm(st) / 30);                                   // decoration and organisation
  const lv = level(st);
  const menu = Math.min(1, RECIPES.filter(R => R.lv <= lv).length / RECIPES.length);   // variety
  const sat = rep(st);                                                        // customer satisfaction
  const equip = st.items.filter(i => ITEMS[i.type].kind === 'equip').length;
  const staff = (st.staff || []).length;
  const service = Math.min(1, (equip * .6 + staff * .8 + seats(st).length * .25) / 8);  // how fast it can serve
  const q = dec * .3 + menu * .2 + sat * .3 + service * .2;
  return Math.max(0, Math.min(1, q));
}
export const qualityLabel = q => q > .8 ? 'Excelente' : q > .62 ? 'Muito bom' : q > .45 ? 'Bom' : q > .28 ? 'Razoável' : 'Começando';

// --- event registry -------------------------------------------------------
// An event is { id, n, d, kind, goal, reward, active(st), progress(st) }.
// kind: 'tema' | 'decor' | 'culinaria' | 'atendimento'. Add entries here to ship one.
export const EVENTS = [];
export const registerEvent = e => { EVENTS.push(e); return e; };
export function activeEvents(st) { return EVENTS.filter(e => !e.active || e.active(st)); }
export function eventProgress(st, e) { return e.progress ? e.progress(st) : 0; }
