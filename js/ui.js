// HUD, menus and panels
import { speedUpCost, spiceLevel, DRINK_BONUS, BONUS_TXT, drinkEnergy, ITEMS, RECIPES, recipe, keepFor, SPICES, SPICE_CATS, RARITY, MARKET_EVERY, rollMarket, inShop as inShopCfg, spice, gemsForLevel, isWallItem, canHoldWall, EQUIP, FLOORS, WALLS, EXPANSIONS, ROLES, GOALS, NAMES, GIFT_ITEMS, xpForLevel, staffCap, stoveCap, CATS, MAX_LEVEL } from './config.js';
import { cafeQuality, qualityLabel } from './events.js';
import { G, level, charm, rep, seats, save, flush, addCoins, addGems, addSpice, hasIngredients, spiceCount, addXP, activeGoals, goalProgress, claimable, resetGame, docsOf, migrate, energy, spendEnergy, POP_MAX } from './state.js';
import { cookState, burnLeft, spoiled, freshLeft, discardStock, queueCook, cancelCook, discardFood, collect, serveDirect, syncStaff, randLook, makeWorld, layoutChanged, serves, serveDrink } from './sim.js';
import { esc, fmtTime, pick, uid, today, on, now } from './util.js';
import { thumbItem, thumbFood, thumbChar } from './three/thumbs.js';
import { swatch } from './three/textures.js';
import { fitRoom, project, setQuality, E } from './three/engine.js';
import { burst, bounce, flyTo } from './three/view.js';
import { sfx, sfxOnce, setAmbience, tickAmbience, AUDIO, TRACKS, setVolume, setBell, setTrack, trackOk, hasJukebox } from './audio.js';
export { setAmbience, tickAmbience };
import { doorY } from './path.js';
export { thumbItem, thumbFood, thumbChar };

const $ = id => document.getElementById(id);

// ---------------- SVG icons (illustrated, no emoji) ----------------
// kawaii icon set: soft brown outline, flat pastel fills, rounded joins, a white shine; faces on the friendly ones
export const ICON = {
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.6" fill="#ffc98a" stroke="#8a6248" stroke-width="1.4"/><path d="M13.4 4.8 8 13h3.6l-1.2 6.2L16 11h-3.8z" fill="#fff3c4" stroke="#8a6248" stroke-width="1.3"/><ellipse cx="8.2" cy="7.4" rx="1.6" ry=".9" fill="#fff" opacity=".8" transform="rotate(-30 8.2 7.4)"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12.8" r="9.4" fill="#e9b04a" stroke="#8a6248" stroke-width="1.4"/><circle cx="12" cy="11.6" r="9.4" fill="#ffd56b" stroke="#8a6248" stroke-width="1.4"/><circle cx="12" cy="11.6" r="6.6" fill="#ffe59a" stroke="#e9b04a" stroke-width="1.1"/><circle cx="9.91" cy="11.40" r="0.71" fill="#8a6248"/><circle cx="14.09" cy="11.40" r="0.71" fill="#8a6248"/><path d="M11.05 12.63q0.95 0.85 1.90 0" stroke="#8a6248" stroke-width="1.04"/><ellipse cx="8.58" cy="12.73" rx="1.04" ry="0.66" fill="#f49ba8" opacity=".85"/><ellipse cx="15.42" cy="12.73" rx="1.04" ry="0.66" fill="#f49ba8" opacity=".85"/><ellipse cx="7.6" cy="6.8" rx="1.82" ry="1.04" fill="#fff" opacity=".85" transform="rotate(-30 7.6 6.8)"/></svg>`,
  gem: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 4h11.6l4 5.2L12 21 2.2 9.2z" fill="#9ee0cc" stroke="#8a6248" stroke-width="1.4"/><path d="M6.2 4 2.2 9.2h19.6L17.8 4z" fill="#c9f2e5" stroke="#8a6248" stroke-width="1.4"/><path d="M8.4 9.2 12 4l3.6 5.2" stroke="#8a6248" stroke-width="1.1"/><circle cx="10.35" cy="13.20" r="0.56" fill="#8a6248"/><circle cx="13.65" cy="13.20" r="0.56" fill="#8a6248"/><path d="M11.25 14.17q0.75 0.68 1.50 0" stroke="#8a6248" stroke-width="0.83"/><ellipse cx="9.30" cy="14.25" rx="0.83" ry="0.52" fill="#f49ba8" opacity=".85"/><ellipse cx="14.70" cy="14.25" rx="0.83" ry="0.52" fill="#f49ba8" opacity=".85"/><ellipse cx="7.4" cy="6.4" rx="1.40" ry="0.80" fill="#fff" opacity=".85" transform="rotate(-30 7.4 6.4)"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12.00 3.00 L14.70 8.88 L21.13 9.63 L16.37 14.02 L17.64 20.37 L12.00 17.20 L6.36 20.37 L7.63 14.02 L2.87 9.63 L9.30 8.88Z" fill="#cbb6f2" stroke="#8a6248" stroke-width="1.4" stroke-width="1.6"/><ellipse cx="9" cy="8.4" rx="1.68" ry="0.96" fill="#fff" opacity=".85" transform="rotate(-30 9 8.4)"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5C5.4 16.4 2.6 12.6 3.4 8.9 4.2 5.2 8.8 4.2 12 7.6c3.2-3.4 7.8-2.4 8.6 1.3.8 3.7-2 7.5-8.6 11.6z" fill="#f7a9b4" stroke="#8a6248" stroke-width="1.4"/><circle cx="10.24" cy="11.80" r="0.60" fill="#8a6248"/><circle cx="13.76" cy="11.80" r="0.60" fill="#8a6248"/><path d="M11.20 12.84q0.80 0.72 1.60 0" stroke="#8a6248" stroke-width="0.88"/><ellipse cx="9.12" cy="12.92" rx="0.88" ry="0.56" fill="#f49ba8" opacity=".85"/><ellipse cx="14.88" cy="12.92" rx="0.88" ry="0.56" fill="#f49ba8" opacity=".85"/><ellipse cx="7.4" cy="8.2" rx="1.54" ry="0.88" fill="#fff" opacity=".85" transform="rotate(-30 7.4 8.2)"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21.22 10.79 L21.22 13.21 L18.95 13.87 L18.24 15.59 L19.37 17.67 L17.67 19.37 L15.59 18.24 L13.87 18.95 L13.21 21.22 L10.79 21.22 L10.13 18.95 L8.41 18.24 L6.33 19.37 L4.63 17.67 L5.76 15.59 L5.05 13.87 L2.78 13.21 L2.78 10.79 L5.05 10.13 L5.76 8.41 L4.63 6.33 L6.33 4.63 L8.41 5.76 L10.13 5.05 L10.79 2.78 L13.21 2.78 L13.87 5.05 L15.59 5.76 L17.67 4.63 L19.37 6.33 L18.24 8.41 L18.95 10.13Z" fill="#f6e3c8" stroke="#8a6248" stroke-width="1.4"/><circle cx="12" cy="12" r="3.4" fill="#f7a9b4" stroke="#8a6248" stroke-width="1.4"/></svg>`,
  shop: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10.5" rx="2" fill="#fff4e4" stroke="#8a6248" stroke-width="1.4"/><path d="M3 10.2 4.6 4h14.8L21 10.2z" fill="#f7a9b4" stroke="#8a6248" stroke-width="1.4"/><path d="M8.3 4 7 10.2M12 4v6.2M15.7 4l1.3 6.2" stroke="#fff" stroke-width="1.6"/><path d="M3 10.2c0 1.6 1.5 2.3 3 2.3s3-.7 3-2.3c0 1.6 1.5 2.3 3 2.3s3-.7 3-2.3c0 1.6 1.5 2.3 3 2.3s3-.7 3-2.3" fill="#f7a9b4" stroke="#8a6248" stroke-width="1.4"/><rect x="10" y="15" width="4" height="5.5" rx="1.2" fill="#ffd56b" stroke="#8a6248" stroke-width="1.4"/></svg>`,
  brush: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14.8 3.6l5.6 5.6-7.4 7.4-5.6-5.6z" fill="#cbb6f2" stroke="#8a6248" stroke-width="1.4"/><path d="M7.4 11l5.6 5.6-1.6 1.6c-1.4 1.4-3.6 1.4-5 0l-.6-.6c-1.4-1.4-1.4-3.6 0-5z" fill="#fff4e4" stroke="#8a6248" stroke-width="1.4"/><path d="M5.2 18.6 3 21" stroke="#8a6248" stroke-width="2.2"/><ellipse cx="16.4" cy="6.4" rx="1.40" ry="0.80" fill="#fff" opacity=".85" transform="rotate(-30 16.4 6.4)"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.4C9.6 4.6 6.4 4.2 3.2 5v13.4c3.2-.8 6.4-.4 8.8 1.4 2.4-1.8 5.6-2.2 8.8-1.4V5c-3.2-.8-6.4-.4-8.8 1.4z" fill="#fff4e4" stroke="#8a6248" stroke-width="1.4"/><path d="M12 6.4v13.4" stroke="#8a6248" stroke-width="1.4"/><path d="M6 9.2c1.4-.3 2.8-.2 4 .3M6 12.2c1.4-.3 2.8-.2 4 .3" stroke="#e9c9a6" stroke-width="1.2"/><path d="M16.6 13.6c-1.6-1-2.4-1.9-2.2-2.9.2-.9 1.3-1.1 2.2-.3.9-.8 2-.6 2.2.3.2 1-.6 1.9-2.2 2.9z" fill="#f7a9b4" stroke="#8a6248" stroke-width="1"/></svg>`,
  box: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 8.4 12 4.4l8.4 4v9.2L12 21.6l-8.4-4z" fill="#f4d3a6" stroke="#8a6248" stroke-width="1.4"/><path d="M3.6 8.4 12 12.4l8.4-4M12 12.4v9.2" stroke="#8a6248" stroke-width="1.4"/><path d="M7.8 6.4l8.4 4v3" stroke="#fff4e4" stroke-width="2"/><circle cx="6.88" cy="15.40" r="0.45" fill="#8a6248"/><circle cx="9.52" cy="15.40" r="0.45" fill="#8a6248"/><path d="M7.60 16.18q0.60 0.54 1.20 0" stroke="#8a6248" stroke-width="0.66"/></svg>`,
  team: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.4" cy="9.6" r="4.4" fill="#ffd0b0" stroke="#8a6248" stroke-width="1.4"/><path d="M2.4 20.4c.4-3.4 2.8-5.4 6-5.4s5.6 2 6 5.4z" fill="#a8dcc6" stroke="#8a6248" stroke-width="1.4"/><circle cx="16.4" cy="8.4" r="3.6" fill="#ffe0c4" stroke="#8a6248" stroke-width="1.4"/><path d="M13.6 13.8c.9-.6 1.8-.9 2.8-.9 2.8 0 4.8 1.8 5.2 4.8h-4.4" fill="#b8d9f2" stroke="#8a6248" stroke-width="1.4"/><circle cx="7.19" cy="9.80" r="0.41" fill="#8a6248"/><circle cx="9.61" cy="9.80" r="0.41" fill="#8a6248"/><path d="M7.85 10.52q0.55 0.50 1.10 0" stroke="#8a6248" stroke-width="0.61"/><ellipse cx="6.42" cy="10.57" rx="0.61" ry="0.39" fill="#f49ba8" opacity=".85"/><ellipse cx="10.38" cy="10.57" rx="0.61" ry="0.39" fill="#f49ba8" opacity=".85"/><circle cx="15.41" cy="8.60" r="0.34" fill="#8a6248"/><circle cx="17.39" cy="8.60" r="0.34" fill="#8a6248"/><path d="M15.95 9.19q0.45 0.41 0.90 0" stroke="#8a6248" stroke-width="0.50"/></svg>`,
  house: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 11v8.4c0 .7.6 1.2 1.2 1.2h12.4c.6 0 1.2-.5 1.2-1.2V11" fill="#fff4e4" stroke="#8a6248" stroke-width="1.4"/><path d="M2.6 11.6 12 3.6l9.4 8" fill="#ffc6a2" stroke="#8a6248" stroke-width="1.4"/><rect x="9.8" y="14" width="4.4" height="6.6" rx="1.4" fill="#f7a9b4" stroke="#8a6248" stroke-width="1.4"/><circle cx="17" cy="14.6" r="1.4" fill="#b8d9f2" stroke="#8a6248" stroke-width="1"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v4.6c0 3-2.2 5.2-5 5.2S7 11.6 7 8.6z" fill="#ffd56b" stroke="#8a6248" stroke-width="1.4"/><path d="M7 6H4.4c0 2.8 1.2 4.2 3.2 4.4M17 6h2.6c0 2.8-1.2 4.2-3.2 4.4" stroke="#8a6248" stroke-width="1.4"/><path d="M10.6 13.6h2.8l.6 3.4h-4z" fill="#ffe59a" stroke="#8a6248" stroke-width="1.4"/><rect x="7.6" y="17" width="8.8" height="3.4" rx="1.2" fill="#f7a9b4" stroke="#8a6248" stroke-width="1.4"/><ellipse cx="9.6" cy="6.6" rx="1.40" ry="0.80" fill="#fff" opacity=".85" transform="rotate(-30 9.6 6.6)"/></svg>`,
  rotate: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19.2 12a7.2 7.2 0 1 1-2.1-5.1" stroke="#8a6248" stroke-width="2"/><path d="M17.8 3.4v4.2h-4.2" stroke="#8a6248" stroke-width="2"/></svg>`,
  store: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10.5" rx="2" fill="#fff4e4" stroke="#8a6248" stroke-width="1.4"/><path d="M3 10.2 4.6 4h14.8L21 10.2z" fill="#a8dcc6" stroke="#8a6248" stroke-width="1.4"/><path d="M8.3 4 7 10.2M12 4v6.2M15.7 4l1.3 6.2" stroke="#fff" stroke-width="1.6"/><rect x="7" y="13.4" width="10" height="4.4" rx="1.2" fill="#b8d9f2" stroke="#8a6248" stroke-width="1.4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.6l4.4 4.4L19 7.4" stroke="#6fb896" stroke-width="3"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" stroke="#8a6248" stroke-width="2.6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.4v13.2M5.4 12h13.2" stroke="#8a6248" stroke-width="2.6"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5.4 12h13.2" stroke="#8a6248" stroke-width="2.6"/></svg>`,
  fit: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 9V5.6c0-.6.4-1 1-1H9M15 4.6h3.4c.6 0 1 .4 1 1V9M19.4 15v3.4c0 .6-.4 1-1 1H15M9 19.4H5.6c-.6 0-1-.4-1-1V15" stroke="#8a6248" stroke-width="2.2"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7.6 10.4V8a4.4 4.4 0 0 1 8.8 0v2.4" stroke="#8a6248" stroke-width="1.4" stroke-width="1.8"/><rect x="4.6" y="10.4" width="14.8" height="10.2" rx="2.6" fill="#cbb6f2" stroke="#8a6248" stroke-width="1.4"/><circle cx="10.46" cy="15.20" r="0.52" fill="#8a6248"/><circle cx="13.54" cy="15.20" r="0.52" fill="#8a6248"/><path d="M11.30 16.11q0.70 0.63 1.40 0" stroke="#8a6248" stroke-width="0.77"/><ellipse cx="9.48" cy="16.18" rx="0.77" ry="0.49" fill="#f49ba8" opacity=".85"/><ellipse cx="14.52" cy="16.18" rx="0.77" ry="0.49" fill="#f49ba8" opacity=".85"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12.4" r="8.6" fill="#fff4e4" stroke="#8a6248" stroke-width="1.4"/><circle cx="12" cy="12.4" r="8.6" stroke="#f7a9b4" stroke-width="1" opacity=".0"/><path d="M12 7.6v4.8l3.2 2" stroke="#8a6248" stroke-width="1.8"/><path d="M6.4 3.6 4 5.8M17.6 3.6 20 5.8" stroke="#8a6248" stroke-width="1.8"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10.4" rx="1.8" fill="#f7a9b4" stroke="#8a6248" stroke-width="1.4"/><rect x="3" y="7" width="18" height="4" rx="1.4" fill="#fbc3cb" stroke="#8a6248" stroke-width="1.4"/><path d="M12 7v13.4" stroke="#ffd56b" stroke-width="3"/><path d="M12 7c-1.6-3.4-5.2-3.2-4.2-.4M12 7c1.6-3.4 5.2-3.2 4.2-.4" stroke="#8a6248" stroke-width="1.4"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.4h3.6L12.4 5v14l-4.8-4.4H4c-.6 0-1-.4-1-1v-3.2c0-.6.4-1 1-1z" fill="#ffd56b" stroke="#8a6248" stroke-width="1.4"/><path d="M15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8" stroke="#8a6248" stroke-width="1.8"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 5.4 8 12l6.6 6.6" stroke="#8a6248" stroke-width="2.8"/></svg>`,
};
const ic = (n, cls = 'ic') => `<span class="${cls}">${ICON[n]}</span>`;

function thumbSwatch(floor, wall, size = 64) { return swatch(floor, wall, size); }

// ---------------- toast & HUD ----------------
let tt;
export function toast(msg) { const e = $('toast'); e.textContent = msg; e.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('show'), 2400); }

export function refreshHUD() {
  const S = G.S; if (!S) return;
  const vis = G.visiting, st = vis ? G.world.st : S;
  const l = level(S), lo = xpForLevel(l), hi = xpForLevel(l + 1);
  $('lvlNum').textContent = l;
  $('xpFill').style.width = Math.max(4, Math.round((S.xp - lo) / (hi - lo) * 100)) + '%';
  $('xpTxt').textContent = `${S.xp - lo}/${hi - lo}`;
  $('coinTxt').textContent = S.coins.toLocaleString('pt-BR');
  $('gemTxt').textContent = (S.gems || 0).toLocaleString('pt-BR');
  refreshEnergy();
  refreshPop();
  $('cafeTitle').textContent = st.name;
  const cl = claimable(S); $('goalBadge').textContent = cl; $('goalBadge').style.display = cl ? 'flex' : 'none';
  $('invBadge').textContent = G.gifts.length; $('invBadge').style.display = G.gifts.length ? 'flex' : 'none';
  document.body.classList.toggle('editing', G.mode === 'edit');
  document.body.classList.toggle('visiting', !!vis);
  $('visitWho').textContent = vis ? `Café de ${vis.who}` : '';
  refreshOpen();
}
on('hud', refreshHUD);
on('toast', toast);
on('sound', sfx);
on('sound1', n => sfxOnce(n));
on('openmarket', () => { sfx('click'); openMarket(); });
on('autocook', n => { const who = (G.S.avatar && G.S.avatar.name) || 'Chef'; toast(`A cozinha estava parada: ${who} começou ${n.toLowerCase()} sozinho`); refreshHUD(); });
on('servedrink', id => {
  const c = G.world && G.world.custs.find(x => x.id === id); if (!c || G.visiting) return;
  const r = serveDrink(G.world, c);
  if (r === 'ok') { const R = recipe(c.drink), b = DRINK_BONUS[R.id] || 'coins'; toast(`${R.n} servido · ${BONUS_TXT[b]}`); refreshHUD(); return; }
  sfx('bad');
  if (r === 'energy') { toast(`⚡ Sem energia · volta em ${energy().next}s`); bumpEnergy(); return; }
  toast(r === 'nomachine' ? 'Compre a máquina dessa bebida na loja' : r === 'coins' ? 'Moedinhas insuficientes' : r === 'ingredient' ? 'Falta o ingrediente especial' : 'Não dá para servir agora');
});
// popularity meter: a face that cheers up as the café gets famous, plus the number (0–105)
const POP_FACES = {
  sad:  '<path d="M8.5 16.5c1.8-2 5.2-2 7 0" stroke="#7a4a12" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  meh:  '<path d="M8.5 15.5h7" stroke="#7a4a12" stroke-width="1.8" stroke-linecap="round"/>',
  ok:   '<path d="M8 14.2c1.8 2.4 6.2 2.4 8 0" stroke="#7a4a12" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  star: '<path d="M7.5 13.5c1.6 4 7.4 4 9 0z" fill="#7a4a12"/><path d="M9 15.6c1.6 1.4 4.4 1.4 6 0" stroke="#e8445c" stroke-width="1.4" fill="none"/>',
};
let lastPop = null;
export function refreshPop() {
  if (!$('popTxt') || !G.S) return;
  const p = G.S.pop || 0, tier = p < 10 ? 'sad' : p < 35 ? 'meh' : p < 70 ? 'ok' : 'star';
  if (lastPop === p) return;
  const up = lastPop !== null && p > lastPop, down = lastPop !== null && p < lastPop; lastPop = p;
  $('popTxt').textContent = p.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  $('popFace').innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${tier === 'sad' ? '#ffd26a' : '#ffd95e'}" stroke="#c08a5e" stroke-width="1.6"/><circle cx="9" cy="10" r="1.3" fill="#7a4a12"/><circle cx="15" cy="10" r="1.3" fill="#7a4a12"/>${tier !== 'sad' ? '<circle cx="6.8" cy="13.6" r="1.6" fill="#f49ba8" opacity=".8"/><circle cx="17.2" cy="13.6" r="1.6" fill="#f49ba8" opacity=".8"/>' : ''}${POP_FACES[tier]}</svg>`;
  const el = $('popChip'); el.classList.toggle('max', p >= POP_MAX);
  if (up || down) { el.classList.remove('up', 'down'); void el.offsetWidth; el.classList.add(up ? 'up' : 'down'); }
}
export const energyNow = () => energy(G.S);
export function refreshEnergy() {
  if (!$('energyTxt') || !G.S) return;
  const e = energy(G.S), txt = `${e.v}/${e.max}`;
  if ($('energyTxt').textContent !== txt) { $('energyTxt').textContent = txt; $('energyFill').style.width = Math.round(e.v / e.max * 100) + '%'; }
  $('energyChip').title = 'Energia: serve cafés e sucos e acelera pratos no fogo';
  // a small countdown under the chip while it refills
  const sub = $('energySub'); if (sub) { const t = e.next ? `+1 em ${Math.floor(e.next / 60)}:${String(e.next % 60).padStart(2, '0')}` : ''; if (sub.textContent !== t) { sub.textContent = t; sub.style.display = t ? '' : 'none'; } }
}
function bumpEnergy() { const el = $('energyChip'); if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
on('drinkfail', r => toast(r === 'nomachine' ? 'Compre a máquina dessa bebida na loja' : r === 'coins' ? 'Moedinhas insuficientes' : r === 'ingredient' ? 'Falta o ingrediente especial' : 'Não dá para servir agora'));

// pending orders strip
export function refreshOrders() {
  const w = G.world, el = $('orders'); if (!w) return;
  const counts = {};
  for (const c of w.custs) if (c.state === 'wait' && c.order) counts[c.order] = (counts[c.order] || 0) + 1;
  const keys = Object.keys(counts), sig = keys.map(k => k + counts[k]).join();
  if (el.dataset.sig === sig) return; el.dataset.sig = sig;
  el.innerHTML = keys.length ? '<div class="olabel">Pedidos</div>' : '';
  for (const k of keys) { const d = document.createElement('div'); d.className = 'ord'; d.appendChild(thumbFood(k, 34)); d.insertAdjacentHTML('beforeend', `<b>${counts[k]}</b>`); d.title = recipe(k).n; el.appendChild(d); }
}

// ---------------- panel system ----------------
export function openPanel(title, iconName, build, opts = {}) {
  const p = $('panel'), body = $('panelBody');
  $('panelTitle').innerHTML = (iconName ? ic(iconName, 'ptic') : '') + `<span>${esc(title)}</span>`;
  body.innerHTML = ''; p.className = 'panel open' + (opts.small ? ' small' : '');
  $('shade').classList.add('open'); G.panelAt = performance.now();
  build(body);
  sfx('click');
}
export function closePanel() { $('panel').className = 'panel'; $('shade').classList.remove('open'); }
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
function tabs(body, list, active, onPick) {
  const t = h('div', 'tabs'); list.forEach(([k, n]) => { const b = h('button', k === active ? 'on' : '', n); b.onclick = () => onPick(k); t.appendChild(b); }); body.appendChild(t); return t;
}
function card(thumb, name, desc, cta, opts = {}) {
  const c = h('div', 'card' + (opts.locked ? ' locked' : '') + (opts.active ? ' active' : ''));
  const th = h('div', 'thumb'); if (thumb) th.appendChild(thumb); c.appendChild(th);
  c.appendChild(h('div', 'cname', esc(name)));
  if (desc) c.appendChild(h('div', 'cdesc', desc));
  if (cta) { const b = h('button', 'cbtn' + (opts.btnCls ? ' ' + opts.btnCls : ''), cta); if (opts.disabled) b.disabled = true; b.onclick = e => { e.stopPropagation(); opts.onClick && opts.onClick(); }; c.appendChild(b); }
  return c;
}
function thumbSpice(id, size) {
  const c = document.createElement('canvas'); c.width = c.height = 128; c.style.width = c.style.height = size + 'px'; c.className = 'th3d';
  const x = c.getContext('2d');
  const SP = {
    cacau: ['#6b4023', '#3d2314', '#a9713f'], canela: ['#b06a33', '#6e3c18', '#dba06a'],
    flordesal: ['#e8eef2', '#8aa0b0', '#ffffff'], cardamomo: ['#8cae6a', '#4f6b3a', '#c3dba6'],
    mel: ['#e0a13a', '#9a6a18', '#f7d98a'], baunilha: ['#6b4a24', '#3d2a12', '#c9a978'],
    pistache: ['#9bc46a', '#5c8038', '#cfe3a8'], acafrao: ['#e2643a', '#9e3a18', '#f6a07a'],
    trufa: ['#3f3a39', '#1f1c1b', '#6f6765'],
  };
  const sp = SP[id] || ['#d9c4ae', '#8a5a3e', '#f2e6d6'];
  const gr = x.createRadialGradient(64, 46, 6, 64, 70, 70); gr.addColorStop(0, sp[2]); gr.addColorStop(1, sp[0]); x.fillStyle = gr;
  x.beginPath(); x.moveTo(38, 44); x.lineTo(90, 44); x.lineTo(84, 110); x.lineTo(44, 110); x.closePath(); x.fill();
  x.strokeStyle = sp[1]; x.lineWidth = 5; x.stroke();
  x.fillStyle = sp[1]; x.beginPath(); x.roundRect(34, 28, 60, 18, 7); x.fill();
  x.fillStyle = sp[2]; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(44 + i * 10, 100 + (i % 2) * 7, 5, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.roundRect(46, 62, 36, 26, 6); x.fill();
  x.fillStyle = sp[1]; x.font = 'bold 17px sans-serif'; x.textAlign = 'center';
  x.fillText(id.slice(0, 2).toUpperCase(), 64, 82);
  return c;
}
const price = n => `${ic('coin', 'mi')}${n.toLocaleString('pt-BR')}`;
const gprice = n => `${ic('gem', 'mi')}${n.toLocaleString('pt-BR')}`;

// ---------------- shop ----------------
export function openShop(tab = 'mobilia') {
  const S = G.S, l = level(S);
  openPanel('Loja', 'shop', body => {
    tabs(body, [['mobilia', 'Mobília'], ['cozinha', 'Cozinha'], ['decor', 'Decoração'], ['aberturas', 'Janelas, portas e luzes'], ['especiais', 'Especiais'], ['feira', 'Feira'], ['estilo', 'Pisos e paredes'], ['expandir', 'Ampliar']], tab, k => openShop(k));
    const grid = h('div', 'grid'); body.appendChild(grid);
    if (['mobilia', 'cozinha', 'decor', 'aberturas'].includes(tab)) {
      const nEq = S.items.filter(i => ITEMS[i.type].kind === 'equip').length + Object.entries(S.inv).filter(([k]) => ITEMS[k] && ITEMS[k].kind === 'equip').reduce((a, [, v]) => a + v, 0);
      for (const [k, d] of Object.entries(ITEMS).filter(([, d]) => d.cat === tab)) {
        const locked = d.lv > l, capped = d.kind === 'equip' && nEq >= stoveCap(l);
        let desc = locked ? `${ic('lock', 'mi')} Nível ${d.lv}` : capped ? 'Limite de equipamentos no seu nível' : (d.charm ? `+${d.charm} de charme` : d.kind === 'equip' ? 'Prepara: ' + RECIPES.filter(r => r.eq === d.eq).slice(0, 3).map(r => r.n).join(', ') : d.kind === 'chair' ? 'Vire para uma mesa' : d.kind === 'counter' ? 'Guarda os pratos prontos' : 'Lugar para os clientes');
        const gemOnly = !!d.gprice, short = gemOnly ? (S.gems || 0) < d.gprice : S.coins < d.price;
        if (gemOnly) desc = (locked ? `${ic('lock', 'mi')} Nível ${d.lv}` : `<span class="rtag gemonly">Só diamantes</span>`) + (d.charm ? `<br>+${d.charm} de charme` : '');
        const c = card(thumbItem(k, 76), d.n, desc, locked ? `Nível ${d.lv}` : gemOnly ? gprice(d.gprice) : price(d.price), {
          locked, disabled: locked || capped || short, btnCls: short && !locked ? 'short' : '',
          onClick: () => { closePanel(); beginPlace(k, 'shop', d.price || 0, d.gprice || 0); },
        });
        c.classList.add('tappable'); c.onclick = () => openItem(k, tab); grid.appendChild(c);
      }
    } else if (tab === 'especiais') {
      body.insertBefore(h('p', 'sub', 'Temperos e ingredientes. Os comuns saem por moedinhas; os raros só por diamantes. O resto aparece na feira lá fora.'), grid);
      const inShop = SPICES.filter(sp => inShopCfg(sp) && spiceLevel(sp.id) !== null).sort((a, b) => spiceLevel(a.id) - spiceLevel(b.id) || RARITY[a.r].o - RARITY[b.r].o);
      const lvNow = level(S);
      for (const sp of inShop) {
        const have = spiceCount(sp.id, S), usesGem = !!sp.gprice, R = RARITY[sp.r], need = spiceLevel(sp.id);
        if (need > lvNow) {   // shown so the player knows what is coming, but not buyable before its recipe
          grid.appendChild(card(thumbSpice(sp.id, 70), sp.n, `${ic('lock', 'mi')} Nível ${need}<br><small>Para: ${RECIPES.filter(r => r.need && r.need.id === sp.id).map(r => r.n).join(', ')}</small>`, `Nível ${need}`, { locked: true, disabled: true }));
          continue;
        }
        const cost = usesGem ? sp.gprice : sp.price, got = usesGem ? (S.gems || 0) : S.coins;
        const uses = RECIPES.filter(r => r.need && r.need.id === sp.id).map(r => r.n).join(', ');
        grid.appendChild(card(thumbSpice(sp.id, 70), sp.n,
          `<span class="rtag" style="--rc:${R.c}">${R.n}</span>${usesGem ? '<span class="rtag gemonly">Só diamantes</span>' : ''}<br>${sp.d}<br>Em estoque: <b>${have}</b>${uses ? `<br><small>Usado em: ${uses}</small>` : ''}`,
          usesGem ? gprice(cost) : price(cost), {
            disabled: got < cost,
            onClick: () => {
              if (usesGem) { if ((S.gems || 0) < cost) return; addGems(-cost); } else { if (S.coins < cost) return; addCoins(-cost); }
              addSpice(sp.id, 1); save(); sfx('coin'); toast(`${sp.n} na despensa`); openShop('especiais');
            },
          }));
      }
    } else if (tab === 'feira') {
      marketInto(body, grid, () => openShop('feira'));
    } else if (tab === 'estilo') {
      grid.appendChild(h('div', 'gtitle', 'Pisos'));
      for (const [k, d] of Object.entries(FLOORS)) grid.appendChild(styleCard('floor', k, d, l));
      grid.appendChild(h('div', 'gtitle', 'Papéis de parede'));
      for (const [k, d] of Object.entries(WALLS)) grid.appendChild(styleCard('wall', k, d, l));
    } else {
      const next = EXPANSIONS.find(e => e.size > S.size);
      const box = h('div', 'expand');
      box.innerHTML = `<p>Seu café tem <b>${S.size} × ${S.size}</b> quadrados.</p>` + (next ? `<p>Próxima ampliação: <b>${next.size} × ${next.size}</b></p>` : '<p>Seu café está no tamanho máximo.</p>');
      if (next) {
        const b = h('button', 'btn big', next.lv > l ? `${ic('lock', 'mi')} Nível ${next.lv}` : `Ampliar por ${price(next.cost)}`);
        b.disabled = next.lv > l || S.coins < next.cost;
        b.onclick = () => { addCoins(-next.cost); S.size = next.size; S.stats.expanded++; save(); fitRoom(S.size); G.world && layoutChanged(G.world); sfx('level'); toast('Café ampliado!'); openShop('expandir'); };
        box.appendChild(b);
      }
      grid.appendChild(box);
    }
  });
}
function styleCard(kind, k, d, l) {
  const S = G.S, owned = S.owned[kind].includes(k), cur = S[kind] === k, locked = d.lv > l;
  return card(thumbSwatch(kind === 'floor' ? k : 'none', kind === 'wall' ? k : S.wall, 70), d.n, locked ? `${ic('lock', 'mi')} Nível ${d.lv}` : cur ? 'Em uso' : owned ? 'Comprado' : '',
    cur ? 'Em uso' : owned ? 'Usar' : locked ? 'Bloqueado' : price(d.price), {
      locked, active: cur, disabled: cur || locked || (!owned && S.coins < d.price),
      onClick: () => { if (!owned) { addCoins(-d.price); S.owned[kind].push(k); S.stats.bought++; } S[kind] = k; save(); sfx('pop'); openShop('estilo'); },
    });
}

// ---------------- placement (shop / inventory) ----------------
export function beginPlace(type, source, cost = 0, gems = 0) {
  const S = G.S, d = ITEMS[type];
  // find free tile near view centre
  const free = [];
  const opening = d.kind === 'window' || d.kind === 'door';
  if (opening) {
    for (let y = 0; y < S.size; y++) for (let x = 0; x < S.size; x++) {
      if (!canHoldWall(S, x, y)) continue;
      if (d.kind === 'door' && x !== 0) continue;
      if (S.items.some(i => i.x === x && i.y === y && isWallItem(i))) continue;
      free.push([x, y]);
    }
    if (!free.length) { toast('Não há parede livre. Guarde uma janela antes.'); return; }
  } else {
    for (let y = 0; y < S.size; y++) for (let x = 0; x < S.size; x++) if (!S.items.some(i => i.x === x && i.y === y && !isWallItem(i)) && !(x === 0 && y === doorY(S))) free.push([x, y]);
    if (!free.length) { toast('Não há espaço livre. Amplie o café ou guarde algo.'); return; }
  }
  const c = S.size / 2; free.sort((a, b) => Math.hypot(a[0] - c, a[1] - c) - Math.hypot(b[0] - c, b[1] - c));
  const [x, y] = free[0];
  // placing from the shop or inventory borrows build mode; remember to hand the café back afterwards
  G.placeFrom = G.pending ? G.placeFrom : G.mode;
  G.mode = 'edit'; G.sel = null;
  G.pending = { item: { id: uid(), type, x, y, rot: d.kind === 'chair' ? 1 : 0 }, source, cost, gems, valid: true };
  refreshHUD(); updateToolbar();
  $('editHint').textContent = 'Toque ou arraste até o lugar desejado e confirme';
}
export function confirmPlace() {
  const S = G.S, p = G.pending; if (!p || !p.valid) { toast('Esse lugar está ocupado'); return; }
  if (p.source === 'shop') {
    if (p.gems) { if ((S.gems || 0) < p.gems) { toast('Diamantes insuficientes'); return; } addGems(-p.gems); }
    else { if (S.coins < p.cost) { toast('Moedinhas insuficientes'); return; } addCoins(-p.cost); }
    S.stats.bought++;
  }
  else { S.inv[p.item.type]--; if (S.inv[p.item.type] <= 0) delete S.inv[p.item.type]; }
  S.items.push(p.item); G.pending = null; save(); sfx(p.source === 'shop' ? 'coin' : 'pop'); layoutChanged(G.world);
  setTimeout(() => { burst(p.item.x + .5, p.item.y + .5); bounce(p.item.id); }, 30);
  refreshHUD(); updateToolbar(); $('editHint').textContent = 'Arraste os móveis para reorganizar';
  backToPlay();
}
export function cancelPlace() { G.pending = null; updateToolbar(); $('editHint').textContent = 'Arraste os móveis para reorganizar'; backToPlay(); }
// a purchase started while playing returns straight to play once the item is placed (or cancelled):
// otherwise the café stayed paused in build mode and looked frozen
function backToPlay() {
  if (G.placeFrom !== 'play') return;
  G.placeFrom = null; G.mode = 'play'; G.sel = null; G.drag = null; layoutChanged(G.world); refreshHUD(); updateToolbar();
}

export function itemBusy(it) {
  const w = G.world;
  if (w.custs.some(c => c.seat === it.id && c.sitting)) return 'Tem um cliente sentado aqui';
  if (ITEMS[it.type].kind === 'table' && (w.tableFood[it.id] || []).length) return 'Tem gente comendo nessa mesa';
  if (ITEMS[it.type].kind === 'chair' && w.custs.some(c => c.seat === it.id)) return 'Um cliente está indo sentar aqui';
  return null;
}
export function rotateSel() {
  const p = G.pending, it = p ? p.item : G.S.items.find(i => i.id === G.sel); if (!it) return;
  if (!ITEMS[it.type].rot) { toast('Este item não gira'); return; }
  if (ITEMS[it.type].kind === 'window' || ITEMS[it.type].kind === 'door') { toast('Janelas e portas acompanham a parede'); return; }
  if (!p) { const b = itemBusy(it); if (b) { toast(b); return; } }
  it.rot = ((it.rot || 0) + 1) % 4; sfx('click'); if (!p) { save(); layoutChanged(G.world); }
}
export function storeSel() {
  const S = G.S, it = S.items.find(i => i.id === G.sel); if (!it) return;
  const b = itemBusy(it); if (b) { toast(b); return; }
  if (it.cook) { toast('Espere o preparo terminar antes de guardar'); return; }
  if (it.stock && it.stock.left > 0) { toast('O balcão ainda tem comida'); return; }
  if (ITEMS[it.type].kind === 'door' && S.items.filter(i => ITEMS[i.type].kind === 'door').length <= 1) { toast('O café precisa de uma porta. Compre outra antes de guardar esta.'); return; }
  S.items = S.items.filter(i => i !== it); S.inv[it.type] = (S.inv[it.type] || 0) + 1;
  G.sel = null; save(); sfx('pop'); layoutChanged(G.world); updateToolbar(); toast(`${ITEMS[it.type].n} foi para o inventário`);
}
export function updateToolbar() {
  const tb = $('toolbar');
  const p = G.pending, it = p ? p.item : (G.mode === 'edit' && G.sel ? G.S.items.find(i => i.id === G.sel) : null);
  if (!it || G.drag) { tb.classList.remove('on'); return; }
  const d = ITEMS[it.type];
  tb.innerHTML = '';
  const add = (cls, icon, label, fn) => { const b = h('button', cls, ic(icon, 'tic') + `<span>${label}</span>`); b.onpointerdown = e => e.stopPropagation(); b.onclick = e => { e.stopPropagation(); fn(); }; tb.appendChild(b); };
  if (d.rot) add('', 'rotate', 'Girar', rotateSel);
  if (p) { add('ok', 'check', 'Confirmar', confirmPlace); add('', 'close', 'Cancelar', cancelPlace); }
  else add('', 'store', 'Guardar', storeSel);
  tb.classList.add('on'); positionToolbar();
}
export function positionToolbar() {
  const tb = $('toolbar'); if (!tb.classList.contains('on')) return;
  const p = G.pending, it = p ? p.item : G.S.items.find(i => i.id === G.sel); if (!it) return;
  const [sx, sy] = project(it.x + .5, 0, it.y + 1.1);
  tb.style.left = Math.max(90, Math.min(E.w - 90, sx)) + 'px'; tb.style.top = Math.min(E.h - 170, sy + 6) + 'px';
}

// ---------------- equipment / recipes ----------------
export function openEquip(it) {
  const w = G.world, S = G.S, d = ITEMS[it.type], state = cookState(it), chefName = (S.avatar && S.avatar.name) || 'Chef';
  if (state === 'burnt') {
    const R = recipe(it.cook.r);
    openPanel(d.n, 'clock', body => {
      body.appendChild(h('p', 'sub', `O ${R.n.toLowerCase()} ficou tempo demais no fogo e queimou. Descarte para liberar o equipamento.`));
      const acts = h('div', 'acts');
      const b = h('button', 'btn', 'Descartar'); b.onclick = () => { discardFood(w, it); closePanel(); };
      acts.appendChild(b); body.appendChild(acts);
    }, { small: true });
    return;
  }
  if (state === 'ready') {
    const r = collect(w, it);
    if (r === 'nocounter') toast('Precisa de um balcão livre (ou com o mesmo prato)');
    return;
  }
  if (it.pending && !it.cook) {
    const R = recipe(it.pending.r);
    openPanel(d.n, 'clock', body => {
      const row = h('div', 'cookrow'); row.appendChild(thumbFood(R.id, 64));
      row.appendChild(h('div', '', `<div class="cname">${R.n}</div><div class="cdesc">${esc(chefName)} está a caminho para começar o preparo.</div>`));
      body.appendChild(row);
      const acts = h('div', 'acts');
      const b = h('button', 'btn ghost', 'Cancelar'); b.onclick = () => { cancelCook(w, it); closePanel(); };
      const ok = h('button', 'btn', 'Ok'); ok.onclick = closePanel; acts.append(b, ok); body.appendChild(acts);
    }, { small: true });
    return;
  }
  if (state === 'cooking') {
    const R = recipe(it.cook.r), left = R.t - (now() - it.cook.s) / 1000;
    openPanel(d.n, 'clock', body => {
      const row = h('div', 'cookrow'); row.appendChild(thumbFood(R.id, 64));
      row.appendChild(h('div', '', `<div class="cname">${R.n}</div><div class="cdesc">Fica pronto em <b id="cdLeft">${fmtTime(left)}</b><br>Rende ${R.por} porções · retire antes que queime</div>`));
      body.appendChild(row);
      const bar = h('div', 'pbar', '<i></i>'); body.appendChild(bar);
      const upd = () => { const l2 = R.t - (now() - it.cook.s) / 1000; if (!$('cdLeft')) return; $('cdLeft').textContent = fmtTime(l2); bar.firstChild.style.width = Math.min(100, (1 - l2 / R.t) * 100) + '%'; if (l2 > 0) requestAnimationFrame(upd); else closePanel(); };
      upd();
      const acts = h('div', 'acts');
      const b = h('button', 'btn ghost', 'Descartar'); b.onclick = () => { it.cook = null; it.last = null; save(); closePanel(); };
      // spend energy to finish now (1 per minute left)
      const cost = speedUpCost(left), fast = h('button', 'btn rose', `Acelerar ⚡${cost}`);
      fast.onclick = () => {
        const l2 = R.t - (now() - it.cook.s) / 1000, c2 = speedUpCost(l2);
        if (!spendEnergy(c2)) { toast(`⚡ Sem energia · volta em ${energy().next}s`); bumpEnergy(); return; }
        it.cook.s = now() - R.t * 1000; save(); sfx('ding'); closePanel(); toast(`${R.n} ficou pronto na hora!`); refreshHUD();
      };
      const ok = h('button', 'btn', 'Ok'); ok.onclick = closePanel; acts.append(b, fast, ok); body.appendChild(acts);
    }, { small: true });
    return;
  }
  const l = level(S);
  // a station can cook dishes, serve drinks, or both (gelato: gelato + affogato; chocolate fountain: fondue + hot chocolate)
  const foods = RECIPES.filter(r => r.eq === d.eq && !r.drink), drinks = RECIPES.filter(r => r.eq === d.eq && r.drink);
  const reopen = () => openEquip(it);
  const drinkCards = (body) => {
    const grid = h('div', 'grid'); body.appendChild(grid);
    for (const R of drinks) {
      const locked = R.lv > l, need = R.need && spice(R.need.id), ok = hasIngredients(R, S), on = !locked && serves(it, R.id);
      grid.appendChild(card(thumbFood(R.id, 60), R.n,
        locked ? `${ic('lock', 'mi')} Nível ${R.lv}` : `${BONUS_TXT[DRINK_BONUS[R.id] || 'coins']}<br>${ic('coin', 'mi')}${R.price} por copo · +${R.xp} xp` + (need ? `<br><span class="${ok ? 'okneed' : 'noneed'}">Precisa de ${R.need.n || 1}× ${need.n} · tem ${spiceCount(R.need.id, S)}</span>` : ''),
        locked ? 'Bloqueado' : on ? (ok ? 'Servindo ✓' : 'Servindo · falta ingrediente') : 'Pausada · tocar para servir', {
          locked, active: on, disabled: locked, btnCls: on ? '' : 'ghost',
          onClick: () => {
            const off = Array.isArray(it.off) ? it.off : [];
            it.off = on ? [...off, R.id] : off.filter(id => id !== R.id);
            save(); sfx('click'); toast(on ? `${R.n} saiu do cardápio desta máquina` : `${R.n} está sendo servido`); reopen();
          },
        }));
    }
  };
  if (!foods.length) {        // pure drink machine: served from directly, nothing to queue
    openPanel(`${d.n} · o que servir?`, 'book', body => {
      body.appendChild(h('p', 'sub', 'Escolha as bebidas desta máquina. Os clientes só pedem o que estiver <b>servindo</b>. Quando aparecer o balão com um copo sobre o cliente, <b>toque nele</b> para servir na hora.'));
      drinkCards(body);
    });
    return;
  }
  if (S.open === false && !G.visiting) { toast('O café está fechado. Abra para preparar receitas.'); return; }
  openPanel(`${d.n} · o que preparar?`, 'book', body => {
    body.appendChild(h('p', 'sub', `${esc(chefName)} vai até o equipamento, começa a receita e fica livre de novo. O preparo continua sozinho, mesmo com o jogo fechado.`));
    const grid = h('div', 'grid'); body.appendChild(grid);
    for (const R of foods) {
      const locked = R.lv > l, need = R.need && spice(R.need.id), ok = hasIngredients(R, S);
      const needTxt = need ? `<br><span class="${ok ? 'okneed' : 'noneed'}">Precisa de ${R.need.n || 1}× ${need.n} · tem ${spiceCount(R.need.id, S)}</span>` : '';
      grid.appendChild(card(thumbFood(R.id, 60), R.n,
        locked ? `${ic('lock', 'mi')} Nível ${R.lv}` : `${ic('clock', 'mi')}${fmtTime(R.t)} · ${R.por} porções<br>${ic('coin', 'mi')}${R.price} cada · +${R.xp} xp` + needTxt,
        locked ? 'Bloqueado' : !ok ? 'Falta ingrediente' : `Preparar ${price(R.cost)}`, {
          locked, disabled: locked || !ok || S.coins < R.cost,
          onClick: () => { const r = queueCook(w, it, R.id); if (r === 'ok') { closePanel(); toast(`${chefName} vai preparar ${R.n.toLowerCase()}`); } else if (r === 'ingredient') toast('Falta o ingrediente especial. Compre na loja, aba Especiais.'); },
        }));
    }
    if (drinks.length) {
      body.appendChild(h('div', 'gtitle', 'Bebidas desta máquina'));
      body.appendChild(h('p', 'sub', 'Servidas na hora: toque no balão com copo sobre o cliente.'));
      drinkCards(body);
    }
  });
}
// counter: shows what is on it and how fresh, and lets the player throw spoiled food away
export function openCounter(it) {
  const w = G.world;
  if (!it.stock || it.stock.left <= 0) { sfx('click'); toast('Balcão vazio: os pratos prontos vêm para cá'); return; }
  const R = recipe(it.stock.r), bad = spoiled(it), fl = freshLeft(it), left = Math.max(0, keepFor(R, G.S) * fl);
  openPanel('Balcão', bad ? 'clock' : 'book', body => {
    const row = h('div', 'cookrow'); row.appendChild(thumbFood(R.id, 64));
    row.appendChild(h('div', '', `<div class="cname">${R.n}</div><div class="cdesc">${it.stock.left} porções<br>${bad ? 'Estragou e não pode ser servido.' : `Bom por mais <b>${fmtTime(left)}</b>`}</div>`));
    body.appendChild(row);
    if (!bad) { const bar = h('div', 'pbar' + (fl < .3 ? ' pat' : ''), '<i></i>'); bar.firstChild.style.width = (fl * 100).toFixed(0) + '%'; body.appendChild(bar); }
    const acts = h('div', 'acts');
    const b = h('button', 'btn' + (bad ? '' : ' ghost'), 'Descartar'); b.onclick = () => { discardStock(w, it); closePanel(); };
    acts.appendChild(b);
    if (!bad) { const ok = h('button', 'btn', 'Ok'); ok.onclick = closePanel; acts.appendChild(ok); }
    body.appendChild(acts);
  }, { small: true });
}
export function openRecipes() {
  const l = level(G.S);
  openPanel('Cardápio', 'book', body => {
    body.appendChild(h('p', 'sub', 'Todas as receitas do café. Novas receitas são liberadas conforme você sobe de nível.'));
    const grid = h('div', 'grid'); body.appendChild(grid);
    for (const R of RECIPES) {
      const locked = R.lv > l;
      grid.appendChild(card(thumbFood(R.id, 60), R.n, `${EQUIP[R.eq]}${R.drink ? ' · servida na hora' : ''}<br>${ic('clock', 'mi')}${fmtTime(R.t)} · ${ic('coin', 'mi')}${R.price}/porção` + (locked ? `<br>${ic('lock', 'mi')} Nível ${R.lv}` : ''), null, { locked }));
    }
  });
}

// ---------------- inventory ----------------
export function openInventory(tab = 'ingr') {
  const S = G.S;
  openPanel('Inventário', 'box', body => {
    tabs(body, [['ingr', 'Ingredientes'], ['moveis', 'Móveis guardados']], tab, k => openInventory(k));
    if (tab === 'ingr') { invIngredients(body, S); return; }
    if (G.gifts.length) {
      body.appendChild(h('div', 'gtitle', 'Presentes recebidos'));
      const gg = h('div', 'grid'); body.appendChild(gg);
      for (const g of G.gifts) {
        const d = g.data, isTip = d.kind === 'tip';
        gg.appendChild(card(isTip ? null : thumbItem(d.item, 64), isTip ? 'Gorjeta de vizinho' : (ITEMS[d.item]?.n || 'Presente'), isTip ? `+${d.coins} moedas` : 'Presente de um vizinho', 'Receber', {
          onClick: async () => {
            if (isTip) addCoins(d.coins || 0); else S.inv[d.item] = (S.inv[d.item] || 0) + 1;
            G.gifts = G.gifts.filter(x => x.id !== g.id); save(); sfx('coin'); refreshHUD();
            try { await G.db.collection('gifts').doc(g.id).delete(); } catch (e) { }
            openInventory();
          },
        }));
        if (isTip) gg.lastChild.querySelector('.thumb').innerHTML = `<span class="bigic">${ICON.gift}</span>`;
      }
    }
    body.appendChild(h('div', 'gtitle', 'Itens guardados'));
    const grid = h('div', 'grid'); body.appendChild(grid);
    const keys = Object.keys(S.inv).filter(k => S.inv[k] > 0 && ITEMS[k]);
    if (!keys.length) grid.appendChild(h('p', 'empty', 'Nada guardado. No modo decoração, use “Guardar” para tirar um móvel do salão sem vendê-lo.'));
    for (const k of keys) {
      const d = ITEMS[k], c = card(thumbItem(k, 64), `${d.n} × ${S.inv[k]}`, '', 'Colocar', { onClick: () => { closePanel(); beginPlace(k, 'inv'); } });
      const sell = h('button', 'cbtn ghost', `Vender ${price(Math.floor(d.price / 2))}`);
      sell.onclick = () => { S.inv[k]--; if (!S.inv[k]) delete S.inv[k]; addCoins(Math.floor(d.price / 2)); save(); sfx('coin'); openInventory(); };
      c.appendChild(sell); grid.appendChild(c);
    }
  });
}

// --- street market -------------------------------------------------------
// The stall outside restocks on its own; the player browses and buys straight from the vendor.
export function marketStock(S) {
  const m = S.market || (S.market = { at: -1e9, seed: 1, items: [] });
  const every = MARKET_EVERY * 60000;
  if (now() - m.at >= every) { m.at = now(); m.seed = (m.seed * 7919 + Math.floor(now() / every) + 17) & 0x7fffffff; m.items = rollMarket(m.seed, level(S)); save(); }
  return m;
}
export const marketLeft = S => Math.max(0, MARKET_EVERY * 60000 - (now() - (S.market ? S.market.at : 0))) / 1000;
export function openMarket() {
  openPanel('Feira do bairro', 'shop', body => {
    const grid = h('div', 'grid');
    marketInto(body, grid, openMarket);
  });
}
export function marketInto(body, grid, reopen) {
  const S = G.S, m = marketStock(S);
  {
    if (!grid.parentNode) body.appendChild(grid);
    body.insertBefore(h('p', 'sub', `A banca do seu Jorge troca de estoque sozinha. Carregamento novo em <b>${fmtTime(marketLeft(S))}</b>. Alguns itens só aparecem aqui.`), grid);
    // stock rolled before a level-up, or by an older version, may hold things the player cannot use yet
    const lvNow = level(S), live = m.items.filter(e => e.qty > 0 && spiceLevel(e.id) !== null && spiceLevel(e.id) <= lvNow);
    if (!live.length) grid.appendChild(h('p', 'empty', lvNow < 4 ? 'A feira vende ingredientes especiais para receitas que você libera a partir do nível 4. Volte quando subir de nível!' : 'A banca está vazia por enquanto. Volte depois do próximo carregamento.'));
    for (const e of live) {
      const sp = spice(e.id); if (!sp) continue;
      const R = RARITY[sp.r], usesGem = !!e.gems, cost = usesGem ? e.gems : e.coins;
      const got = usesGem ? (S.gems || 0) : S.coins;
      const uses = RECIPES.filter(r => r.need && r.need.id === sp.id).map(r => r.n).join(', ');
      grid.appendChild(card(thumbSpice(sp.id, 70), sp.n,
        `<span class="rtag" style="--rc:${R.c}">${R.n}</span>${usesGem ? '<span class="rtag gemonly">Só diamantes</span>' : ''}` +
        `<br>${sp.d}` +
        `<br>Restam <b>${e.qty}</b> na banca · você tem ${spiceCount(sp.id, S)}` + (uses ? `<br><small>Usado em: ${uses}</small>` : ''),
        usesGem ? gprice(cost) : price(cost), {
          disabled: got < cost,
          onClick: () => {
            if (usesGem) { if ((S.gems || 0) < cost) return; addGems(-cost); } else { if (S.coins < cost) return; addCoins(-cost); }
            addSpice(sp.id, 1); e.qty--; save(); sfx('coin'); toast(`${sp.n} comprado na feira`); reopen();
          },
        }));
    }
  }
}

// Everything the player owns in the pantry, by category, with rarity, use and where it comes from.
function invIngredients(body, S) {
  const l = level(S);
  body.appendChild(h('p', 'sub', 'Tudo o que você tem guardado na despensa. Receitas que pedem um ingrediente só liberam quando houver estoque.'));
  const byCat = {};
  for (const sp of SPICES) (byCat[sp.cat] = byCat[sp.cat] || []).push(sp);
  for (const [cat, list] of Object.entries(byCat)) {
    body.appendChild(h('div', 'gtitle', SPICE_CATS[cat] || cat));
    const grid = h('div', 'grid'); body.appendChild(grid);
    list.sort((a, b) => RARITY[a.r].o - RARITY[b.r].o);
    for (const sp of list) {
      const have = spiceCount(sp.id, S), R = RARITY[sp.r];
      const uses = RECIPES.filter(r => r.need && r.need.id === sp.id);
      const usesTxt = uses.length ? uses.map(r => r.n + (r.lv > l ? ' (nível ' + r.lv + ')' : '')).join(', ') : 'Ainda sem receita';
      const from = sp.gprice ? `Loja por ${gprice(sp.gprice)}` : sp.price ? `Loja por ${price(sp.price)}` : 'Só na feira';
      const c = card(thumbSpice(sp.id, 64), sp.n,
        `<span class="rtag" style="--rc:${R.c}">${R.n}</span> ${have ? `<b>${have} em estoque</b>` : '<span class="noneed">Em falta</span>'}` +
        `<br><small>Usa em: ${usesTxt}</small><br><small>Onde achar: ${from}, feira e recompensas VIP</small>`, null, {});
      c.classList.add('invcard'); if (!have) c.classList.add('out');
      grid.appendChild(c);
    }
  }
  const missing = SPICES.filter(sp => !spiceCount(sp.id, S) && RECIPES.some(r => r.need && r.need.id === sp.id && r.lv <= l));
  if (missing.length) body.appendChild(h('p', 'sub', `Faltando para receitas que você já pode preparar: ${missing.map(m => m.n).join(', ')}.`));
}

// ---------------- staff ----------------
let candidates = null;
function newCandidate(role) { role = role || 'waiter'; return { name: pick(NAMES.filter(n => !G.S.staff.some(s => s.name === n))), role, look: randLook('adult', role) }; }
// keep at least one chef and one waiter on offer, so hiring a chef never "disappears"
function balanceCandidates() { candidates = candidates.map(c => (c.role === 'waiter' ? c : newCandidate('waiter'))); }
export function openStaff() {
  const S = G.S, l = level(S), cap = staffCap(l);
  if (!candidates) candidates = [newCandidate('waiter'), newCandidate('waiter'), newCandidate('waiter')];
  balanceCandidates();
  openPanel('Equipe', 'team', body => {
    body.appendChild(h('p', 'sub', `Só você começa as receitas. Os garçons cuidam do salão sozinhos enquanto o café estiver aberto.`));
    const me = h('div', 'grid'); body.appendChild(me);
    if (S.avatar) me.appendChild(card(thumbChar(S.avatar.look, 'owner', 62), S.avatar.name, ROLES.owner.n, 'Personalizar', { onClick: () => openAvatar() }));
    body.appendChild(h('div', 'gtitle', `Equipe · ${S.staff.length} de ${cap} vagas`));
    const grid = h('div', 'grid'); body.appendChild(grid);
    for (const s of S.staff) grid.appendChild(card(thumbChar(s.look, s.role, 62), s.name, ROLES[s.role].n, 'Ver', { onClick: () => showStaff(s) }));
    if (!S.staff.length) grid.appendChild(h('p', 'sub', 'Nenhum garçom ainda.'));
    body.appendChild(h('div', 'gtitle', 'Candidatos'));
    const cg = h('div', 'grid'); body.appendChild(cg);
    candidates.forEach((c, i) => {
      const R = ROLES[c.role], locked = R.lv > l, full = S.staff.length >= cap;
      cg.appendChild(card(thumbChar(c.look, c.role, 62), c.name, `${R.n}<br><small>${R.d}</small>` + (locked ? `<br>${ic('lock', 'mi')} Nível ${R.lv}` : full ? '<br>Sem vagas' : ''),
        locked ? 'Bloqueado' : `Contratar ${price(R.price)}`, {
          locked, disabled: locked || full || S.coins < R.price,
          onClick: () => {
            addCoins(-R.price); S.staff.push({ id: uid(), name: c.name, role: c.role, look: c.look }); S.stats.hired++;
            candidates[i] = newCandidate(); syncStaff(G.world); save(); sfx('level'); toast(`${c.name} entrou para a equipe!`); openStaff();
          },
        }));
    });
    const acts = h('div', 'acts'); const rr = h('button', 'btn ghost', 'Ver outros candidatos'); rr.onclick = () => { candidates = null; openStaff(); }; acts.appendChild(rr); body.appendChild(acts);
  });
}
export function openAvatar() {
  const S = G.S, A = S.avatar;
  openPanel('Seu chef', 'team', body => {
    body.appendChild(h('p', 'sub', 'Você é o chef principal do café. Escolha o visual e o nome.'));
    const row = h('div', 'cookrow'); const big = h('div', ''); big.appendChild(thumbChar(A.look, 'owner', 84));
    row.append(big, h('div', '', `<div class="cname">${esc(A.name)}</div><div class="cdesc">${ROLES.owner.d}</div>`));
    body.appendChild(row);
    const inp = h('input', 'txt'); inp.value = A.name; inp.maxLength = 14; body.appendChild(inp);
    body.appendChild(h('div', 'gtitle', 'Aparência'));
    const grid = h('div', 'picks'); body.appendChild(grid);
    for (let m = 0; m < 12; m++) {
      const b = h('button', 'pick' + (A.look.model === m ? ' on' : ''));
      b.appendChild(thumbChar({ ...A.look, model: m }, 'owner', 54));
      b.onclick = () => { A.look.model = m; save(); syncStaff(G.world); sfx('click'); openAvatar(); };
      grid.appendChild(b);
    }
    const acts = h('div', 'acts');
    const ok = h('button', 'btn', 'Salvar'); ok.onclick = () => { const v = inp.value.trim(); if (v) { A.name = v; save(); } closePanel(); };
    acts.appendChild(ok); body.appendChild(acts);
  });
}
export function showStaff(s) {
  openPanel(s.name, 'team', body => {
    const row = h('div', 'cookrow'); row.appendChild(thumbChar(s.look, s.role, 84));
    row.appendChild(h('div', '', `<div class="cname">${esc(s.name)}</div><div class="cdesc">${ROLES[s.role].n}<br>${ROLES[s.role].d}</div>`));
    body.appendChild(row);
    const inp = h('input', 'txt'); inp.value = s.name; inp.maxLength = 14; body.appendChild(inp);
    const acts = h('div', 'acts');
    const fire = h('button', 'btn ghost', 'Dispensar');
    fire.onclick = () => { if (fire.dataset.c) { G.S.staff = G.S.staff.filter(x => x.id !== s.id); const rt = G.world.staff.find(x => x.id === s.id); if (rt && rt.job) { rt.job = null; } syncStaff(G.world); save(); closePanel(); } else { fire.dataset.c = 1; fire.textContent = 'Toque de novo para confirmar'; } };
    const ok = h('button', 'btn', 'Salvar'); ok.onclick = () => { const v = inp.value.trim(); if (v) { s.name = v; save(); } closePanel(); };
    acts.append(fire, ok); body.appendChild(acts);
  }, { small: true });
}

// ---------------- customer info ----------------
const STATE_TXT = { enter: 'Chegando', waitSeat: 'Procurando lugar', toSeat: 'Indo para a mesa', menu: 'Lendo o cardápio', wait: 'Esperando o pedido', eat: 'Comendo', leave: 'Indo embora' };
const MOOD_TXT = { happy: 'Feliz', ok: 'Ficando impaciente', sad: 'Impaciente', angry: 'Irritado', eating: 'Saboreando' };
export function showCustomer(c) {
  const w = G.world;
  openPanel(c.name || 'Cliente', 'heart', body => {
    const row = h('div', 'cookrow'); row.appendChild(thumbChar(c.look, 'cust', 76));
    const type = c.look.body === 'kid' ? 'Criança' : c.look.body === 'elder' ? 'Cliente da melhor idade' : 'Cliente';
    row.appendChild(h('div', '', `<div class="cname">${esc(c.name || 'Cliente')}</div><div class="cdesc">${type}<br>${STATE_TXT[c.state] || ''} · ${MOOD_TXT[c.mood] || 'Feliz'}</div>`));
    body.appendChild(row);
    if (c.order) {
      const o = h('div', 'cookrow'); o.appendChild(thumbFood(c.order, 52));
      o.appendChild(h('div', '', `<div class="cname">Pedido: ${recipe(c.order).n}</div><div class="cdesc">${c.state === 'wait' ? 'Paciência' : ''}</div>`));
      body.appendChild(o);
      if (c.state === 'wait') { const bar = h('div', 'pbar pat', `<i style="width:${Math.max(0, c.patience) * 100}%"></i>`); body.appendChild(bar); }
    }
    const acts = h('div', 'acts');
    if (c.state === 'wait' && !c.waiter && !G.visiting) {
      const b = h('button', 'btn', 'Servir agora');
      b.onclick = () => { const r = serveDirect(w, c); if (r === 'ok') { sfx('pop'); closePanel(); } else toast('Esse prato não está no balcão. Prepare mais!'); };
      acts.appendChild(b);
    }
    const ok = h('button', 'btn ghost', 'Fechar'); ok.onclick = closePanel; acts.appendChild(ok); body.appendChild(acts);
  }, { small: true });
}

// ---------------- goals ----------------
export function openGoals() {
  const S = G.S;
  openPanel('Metas', 'trophy', body => {
    body.appendChild(h('p', 'sub', `Complete metas para ganhar recompensas. ${S.goals.length} de ${GOALS.length} concluídas.`));
    const list = h('div', 'goals'); body.appendChild(list);
    for (const g of activeGoals(S)) {
      const p = Math.min(g.goal, goalProgress(S, g)), done = p >= g.goal;
      const row = h('div', 'goal' + (done ? ' done' : ''));
      row.innerHTML = `<div class="gtxt"><b>${esc(g.n)}</b><div class="pbar"><i style="width:${p / g.goal * 100}%"></i></div><small>${p} / ${g.goal}</small></div>
        <div class="grew">${ic('coin', 'mi')}${g.coins}${g.xp ? ` ${ic('star', 'mi')}${g.xp}` : ''}</div>`;
      const b = h('button', 'cbtn', done ? 'Resgatar' : 'Em andamento'); b.disabled = !done;
      b.onclick = () => { S.goals.push(g.id); addCoins(g.coins); if (g.xp) addXP(g.xp); save(); sfx('level'); toast('Recompensa resgatada!'); refreshHUD(); openGoals(); };
      row.appendChild(b); list.appendChild(row);
    }
    if (!activeGoals(S).length) list.appendChild(h('p', 'empty', 'Você completou todas as metas desta versão!'));
    // stats
    const st = h('div', 'stats');
    st.innerHTML = `<div><b>${S.stats.served}</b><small>clientes atendidos</small></div><div><b>${S.stats.cooked}</b><small>pratos preparados</small></div><div><b>${charm(S)}</b><small>charme</small></div><div><b>${seats(S).length}</b><small>lugares</small></div>`;
    body.appendChild(st);
  });
}

// ---------------- settings ----------------
export function openSettings() {
  const S = G.S;
  openPanel('Configurações', 'gear', body => {
    body.appendChild(h('div', 'gtitle', 'Nome do café'));
    const inp = h('input', 'txt'); inp.value = S.name; inp.maxLength = 24; body.appendChild(inp);
    inp.onchange = () => { const v = inp.value.trim(); if (v) { S.name = v; save(); refreshHUD(); } };
    const row = h('div', 'setrow', `${ic('sound', 'mi')} Som e música`);
    const sb = h('button', 'btn ghost small', 'Ajustar'); sb.onclick = () => { inp.onchange(); openSound(); };
    row.appendChild(sb); body.appendChild(row);
    if (G.net === 'firebase' && G.user) {
      // the café belongs to the account: the same one opens on any device after signing in
      const ar = h('div', 'setrow', `${ic('house', 'mi')} <span class="acct">${esc(G.user.email() || 'Conta Google')}</span>`);
      const ob = h('button', 'btn ghost small', 'Sair');
      ob.onclick = async () => { await flush(true); try { await G.user.signOut(); } catch (e) { } location.reload(); };
      ar.appendChild(ob); body.appendChild(ar);
    }
    const xr = h('div', 'setrow', `${ic('box', 'mi')} Levar meu café`);
    const xb = h('div', 'seg');
    const ex = h('button', '', 'Exportar'); ex.onclick = async () => { await flush(true); toast(await copyText(exportCafe()) ? 'Código do café copiado. Cole em "Importar" no outro lugar' : 'Não deu para copiar'); };
    const im = h('button', '', 'Importar'); im.onclick = () => openImport();
    xb.append(ex, im); xr.appendChild(xb); body.appendChild(xr);
    const qr = h('div', 'setrow', `${ic('star', 'mi')} Qualidade gráfica`); const qs = h('div', 'seg');
    [['low', 'Leve'], ['medium', 'Média'], ['high', 'Alta']].forEach(([k, n]) => { const b = h('button', E.quality === k ? 'on' : '', n); b.onclick = () => { setQuality(k); try { localStorage.setItem('cc_quality_locked', '1'); } catch (e) { } qs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; qs.appendChild(b); });
    qr.appendChild(qs); body.appendChild(qr);
    body.appendChild(h('p', 'sub', G.docRef ? 'Seu progresso é salvo automaticamente na sua conta e neste aparelho.' : 'Seu progresso é salvo automaticamente neste aparelho.'));
    body.appendChild(h('div', 'gtitle', 'Como jogar'));
    body.appendChild(h('div', 'help', `<p>Toque no <b>fogão</b> para preparar um prato. Quando ficar pronto, o chef leva ao <b>balcão</b>.</p><p>Bebidas: compre uma <b>máquina de café</b> ou de <b>suco</b> na loja. Quando aparecer um <b>balão com copo</b> sobre o cliente, toque nele para servir.</p>
      <p>Clientes entram, sentam em <b>cadeiras viradas para uma mesa</b>, pedem um prato do balcão e esperam. O <b>garçom</b> leva o pedido; quanto mais rápido, maior a gorjeta.</p>
      <p>No <b>modo decoração</b>, arraste móveis para mudar de lugar, gire cadeiras e guarde itens no inventário.</p>`));
    const acts = h('div', 'acts');
    const rs = h('button', 'btn ghost', 'Recomeçar do zero');
    rs.onclick = () => { if (rs.dataset.c) { resetGame(); G.world = makeWorld(G.S, true); fitRoom(G.S.size); closePanel(); refreshHUD(); toast('Novo café criado'); } else { rs.dataset.c = 1; rs.textContent = 'Tem certeza? Toque de novo'; } };
    const ok = h('button', 'btn', 'Pronto'); ok.onclick = () => { inp.onchange(); closePanel(); };
    acts.append(rs, ok); body.appendChild(acts);
  }, { small: true });
}
// ---------------- sound & music (also what the jukebox opens) ----------------
export function openSound(fromJukebox) {
  openPanel(fromJukebox ? 'Jukebox' : 'Som e música', 'sound', body => {
    body.appendChild(h('div', 'gtitle', 'Rádio lo-fi'));
    const list = h('div', 'songs');
    TRACKS.forEach((tr, i) => {
      const ok = trackOk(i), b = h('button', 'song' + (AUDIO.track === i ? ' on' : '') + (ok ? '' : ' locked'),
        `<b>${AUDIO.track === i ? '♪ ' : ''}${tr.n}</b><small>${ok ? tr.d : 'Precisa de uma jukebox no café'}</small>`);
      b.onclick = () => {
        if (!setTrack(i)) { toast('Compre uma jukebox na Loja › Decoração para liberar'); return; }
        if (AUDIO.music <= 0) { setVolume('music', .45); const r = body.querySelector('input[data-k=music]'); if (r) r.value = 45; }
        toast(`Tocando: ${tr.n}`); openSound(fromJukebox);
      };
      list.appendChild(b);
    });
    body.appendChild(list);
    body.appendChild(h('div', 'gtitle', 'Volume'));
    for (const [k, n] of [['music', 'Música'], ['sfx', 'Efeitos'], ['amb', 'Salão (talheres e conversa)']]) {
      const r = h('label', 'volrow', `<span>${n}</span>`), inp = document.createElement('input');
      inp.type = 'range'; inp.min = 0; inp.max = 100; inp.value = Math.round(AUDIO[k] * 100); inp.dataset.k = k;
      inp.oninput = () => setVolume(k, inp.value / 100);
      inp.onchange = () => { if (k === 'sfx') sfx('coin'); };
      r.appendChild(inp); body.appendChild(r);
    }
    const br = h('div', 'setrow', 'Sininho da porta');
    const tg = h('button', 'toggle' + (AUDIO.bell ? ' on' : ''), '<i></i>');
    tg.onclick = () => { setBell(!AUDIO.bell); tg.classList.toggle('on', AUDIO.bell); if (AUDIO.bell) sfx('bell'); };
    br.appendChild(tg); body.appendChild(br);
    if (!hasJukebox()) body.appendChild(h('p', 'sub', 'Com uma jukebox no salão você libera mais duas músicas.'));
    const acts = h('div', 'acts'), ok = h('button', 'btn', 'Pronto'); ok.onclick = closePanel; acts.appendChild(ok); body.appendChild(acts);
  }, { small: true });
}
// ---- move a café between places (claude.ai ⇄ GitHub Pages ⇄ another device) ----
export function exportCafe() { return 'CAFE1:' + btoa(unescape(encodeURIComponent(JSON.stringify(G.S)))); }
function openImport() {
  openPanel('Importar café', 'box', body => {
    body.appendChild(h('p', 'sub', 'Cole o código copiado em "Exportar" no outro lugar. <b>O café atual deste lugar será substituído.</b>'));
    const ta = h('textarea', 'txt'); ta.rows = 5; ta.placeholder = 'CAFE1:…'; body.appendChild(ta);
    const acts = h('div', 'acts'), ok = h('button', 'btn', 'Importar este café');
    ok.onclick = async () => {
      try {
        const raw = ta.value.trim().replace(/^CAFE1:/, ''), st = JSON.parse(decodeURIComponent(escape(atob(raw))));
        if (!st || st.v !== 4 || !Array.isArray(st.items)) throw 0;
        if (!ok.dataset.c) { ok.dataset.c = 1; ok.textContent = `Substituir pelo café "${st.name || 'sem nome'}"? Toque de novo`; return; }
        delete st.owner; G.S = migrate(st); await flush(true); toast('Café importado! Abrindo…'); setTimeout(() => location.reload(), 800);
      } catch (e) { toast('Código inválido. Copie de novo em "Exportar"'); }
    };
    const cancel = h('button', 'btn ghost', 'Cancelar'); cancel.onclick = openSettings;
    acts.append(cancel, ok); body.appendChild(acts);
  }, { small: true });
}
export function askName() {
  openPanel('Bem-vinda ao seu café!', 'house', body => {
    body.appendChild(h('p', 'sub', 'Como vai se chamar a sua cafeteria? A Bia já está pronta para atender.'));
    const inp = h('input', 'txt'); inp.value = G.S.name; inp.maxLength = 24; body.appendChild(inp);
    const acts = h('div', 'acts'); const ok = h('button', 'btn', 'Abrir as portas');
    ok.onclick = () => { const v = inp.value.trim(); if (v) G.S.name = v; save(); refreshHUD(); closePanel(); toast('Toque no fogão para preparar o primeiro prato. A máquina de café fica na Loja › Cozinha'); };
    acts.appendChild(ok); body.appendChild(acts); setTimeout(() => inp.select(), 50);
  }, { small: true });
}
export function levelUp(l, from = l - 1) {
  sfx('level');
  let rewards = 0, gems = 0;
  for (let k = from + 1; k <= l; k++) { rewards += k * 40; gems += gemsForLevel(k); }
  G.S.coins += rewards; save();
  celebrate(`Nível ${l}!`);
  const un = []; for (let k = from + 1; k <= l; k++) un.push(...unlocksAt(k));
  openPanel(l - from > 1 ? `Níveis ${from + 1} a ${l}!` : `Nível ${l}!`, 'star', body => {
    const hero = h('div', 'lvhero', `<div class="lvbig"><span>${ICON.star}</span><b>${l}</b></div><p>Você ganhou <b>${ic('coin', 'mi')}${rewards}</b> moedinhas${gems ? ` e <b>${ic('gem', 'mi')}${gems}</b> de Diamantes` : ''}</p>`); body.appendChild(hero);
    if (un.length) {
      body.appendChild(h('div', 'gtitle', 'Liberado agora'));
      const g = h('div', 'grid'); body.appendChild(g);
      // revealed one after another (CSS delay); thumbnails fill in over the next frames
      un.forEach((x, i) => { const c = card(x.thumb(56), x.n, x.tag); c.classList.add('glow', 'reveal'); c.style.animationDelay = (i * .12) + 's'; g.appendChild(c); });
    }
    const acts = h('div', 'acts'); const pv = h('button', 'btn ghost', 'Ver próximos níveis'); pv.onclick = openProgress; const ok = h('button', 'btn', 'Oba!'); ok.onclick = closePanel; acts.append(pv, ok); body.appendChild(acts);
  });
  refreshHUD();
}
function celebrate(text) {
  const d = document.createElement('div'); d.className = 'celebrate'; d.innerHTML = `<b>${text}</b>`; document.body.appendChild(d);
  for (let i = 0; i < 22; i++) { const c = document.createElement('i'); c.style.left = (Math.random() * 100) + '%'; c.style.background = ['#f7d58b', '#f2a7a0', '#a8c3a0', '#9cc1e0', '#c7b2e6'][i % 5]; c.style.animationDelay = (Math.random() * .4) + 's'; c.style.setProperty('--x', (Math.random() * 120 - 60) + 'px'); d.appendChild(c); }
  setTimeout(() => d.remove(), 2400);
}

// ---------------- progression ----------------
export function unlocksAt(l) {
  const out = [];
  RECIPES.filter(r => r.lv === l).forEach(r => out.push({ n: r.n, tag: 'Receita · ' + EQUIP[r.eq], thumb: s => thumbFood(r.id, s), kind: 'recipe' }));
  Object.entries(ITEMS).filter(([, d]) => d.lv === l && d.cat !== 'gift').forEach(([k, d]) => out.push({ n: d.n, tag: d.kind === 'equip' ? 'Equipamento' : CATS[d.cat], thumb: s => thumbItem(k, s), kind: 'item', key: k }));
  Object.entries(FLOORS).filter(([, d]) => d.lv === l && d.price > 0).forEach(([k, d]) => out.push({ n: d.n, tag: 'Piso', thumb: s => thumbSwatch(k, G.S.wall, s), kind: 'style' }));
  Object.entries(WALLS).filter(([, d]) => d.lv === l && d.price > 0).forEach(([k, d]) => out.push({ n: d.n, tag: 'Papel de parede', thumb: s => thumbSwatch(G.S.floor, k, s), kind: 'style' }));
  EXPANSIONS.filter(e => e.lv === l).forEach(e => out.push({ n: `Ampliação ${e.size}×${e.size}`, tag: 'Café maior', thumb: () => { const x = h('span', 'bigic', ICON.house); return x; }, kind: 'other' }));
  if (l > 1 && staffCap(l) > staffCap(l - 1)) out.push({ n: 'Nova vaga na equipe', tag: 'Equipe', thumb: () => h('span', 'bigic', ICON.team), kind: 'other' });
  if (l > 1 && stoveCap(l) > stoveCap(l - 1)) out.push({ n: '+1 equipamento de cozinha', tag: 'Cozinha', thumb: () => h('span', 'bigic', ICON.book), kind: 'other' });
  return out;
}
export function openProgress() {
  const S = G.S, l = level(S), lo = xpForLevel(l), hi = xpForLevel(l + 1);
  openPanel('Sua progressão', 'star', body => {
    const top = h('div', 'progtop');
    top.innerHTML = `<div class="lvbig"><span>${ICON.star}</span><b>${l}</b></div>
      <div class="progtxt"><b>Nível ${l}</b><div class="pbar xp"><i style="width:${Math.max(3, (S.xp - lo) / (hi - lo) * 100)}%"></i></div>
      <small>${S.xp - lo} de ${hi - lo} XP · faltam <b>${hi - S.xp} XP</b> para o nível ${l + 1}</small>
      <small class="hint">Ganhe XP preparando receitas e atendendo clientes.</small></div>`;
    body.appendChild(top);
    // café quality: what decides VIP visits today and event results later on
    const q = cafeQuality(S), sat = Math.round(rep(S) * 100);
    const qb = h('div', 'qual');
    qb.innerHTML = `<div class="qrow"><b>Qualidade do café</b><span class="qtag">${qualityLabel(q)}</span></div>
      <div class="pbar"><i style="width:${Math.max(4, q * 100).toFixed(0)}%"></i></div>
      <small class="hint">Decoração, variedade do cardápio, satisfação (${sat}%) e rapidez do atendimento. Quanto maior, mais clientes VIP aparecem.</small>`;
    body.appendChild(qb);
    const track = h('div', 'track'); body.appendChild(track);
    for (let n = 1; n <= MAX_LEVEL; n++) {
      const st = n < l ? 'done' : n === l ? 'now' : n === l + 1 ? 'next' : 'future';
      const row = h('div', 'lvrow ' + st);
      row.appendChild(h('div', 'lvnode', `<b>${n}</b>`));
      const right = h('div', 'lvbody');
      right.appendChild(h('div', 'lvtitle', n === l ? 'Nível atual' : n === l + 1 ? `Próximo nível · ${xpForLevel(n) - S.xp} XP` : n < l ? 'Concluído' : `${xpForLevel(n)} XP no total`));
      const items = h('div', 'lvitems');
      const un = unlocksAt(n);
      if (n === 1) items.appendChild(h('small', 'muted', 'Começo: café, pão de queijo, bolo, móveis básicos'));
      un.forEach(u => {
        const avail = n <= l, owned = u.kind === 'item' && (S.items.some(i => i.type === u.key) || S.inv[u.key]);
        const chip = h('div', 'chip ' + (owned ? 'owned' : avail ? 'avail' : 'locked'));
        const th = u.thumb(46); chip.appendChild(th);
        chip.appendChild(h('span', '', `${esc(u.n)}<small>${owned ? 'Você tem' : avail ? (u.kind === 'recipe' ? 'Liberada' : 'Disponível na loja') : 'Nível ' + n}</small>`));
        if (u.kind === 'item') { chip.classList.add('tappable'); chip.onclick = () => openItem(u.key, null, true); }
        items.appendChild(chip);
      });
      right.appendChild(items); row.appendChild(right); track.appendChild(row);
    }
    setTimeout(() => { const cur = track.querySelector('.lvrow.now'); if (cur) cur.scrollIntoView({ block: 'center' }); }, 60);
  });
}

// ---------------- item detail ----------------
export function openItem(k, backTab, fromProgress) {
  const S = G.S, d = ITEMS[k], l = level(S), locked = (d.lv || 1) > l, missing = d.price - S.coins;
  const nEq = S.items.filter(i => ITEMS[i.type].kind === 'equip').length + Object.entries(S.inv).filter(([x]) => ITEMS[x] && ITEMS[x].kind === 'equip').reduce((a, [, v]) => a + v, 0);
  const capped = d.kind === 'equip' && nEq >= stoveCap(l);
  const owned = S.items.filter(i => i.type === k).length + (S.inv[k] || 0);
  openPanel(d.n, 'shop', body => {
    const wrap = h('div', 'itemdetail' + (locked ? ' locked' : ''));
    const pic = h('div', 'bigthumb'); pic.appendChild(thumbItem(k, 150, d.rot ? 0 : 0)); if (locked) pic.appendChild(h('span', 'lockbadge', ICON.lock)); wrap.appendChild(pic);
    const info = h('div', 'info');
    info.innerHTML = `<div class="tags"><span class="tag">${CATS[d.cat] || ''}</span>${d.charm ? `<span class="tag pink">+${d.charm} charme</span>` : ''}${d.kind === 'equip' ? '<span class="tag blue">Equipamento</span>' : ''}${owned ? `<span class="tag green">Você tem ${owned}</span>` : ''}</div>
      <p>${esc(d.d || '')}</p>
      ${d.kind === 'equip' ? `<div class="mini">${RECIPES.filter(r => r.eq === d.eq).map(r => `<span class="${r.lv > l ? 'lk' : ''}" title="${r.n}"></span>`).join('')}</div>` : ''}
      <div class="kv"><span>Preço</span><b>${price(d.price)}</b></div><div class="kv"><span>Nível necessário</span><b>${d.lv || 1}</b></div>`;
    if (d.kind === 'equip') { const mini = info.querySelector('.mini'); RECIPES.filter(r => r.eq === d.eq).forEach((r, i) => { const sp = mini.children[i]; sp.appendChild(thumbFood(r.id, 36)); sp.insertAdjacentHTML('beforeend', `<small>${r.lv > l ? 'Nv ' + r.lv : r.n}</small>`); }); }
    wrap.appendChild(info); body.appendChild(wrap);
    const status = h('div', 'status ' + (locked ? 'lock' : capped ? 'lock' : missing > 0 ? 'short' : 'ok'));
    status.innerHTML = locked ? `${ic('lock', 'mi')} Desbloqueado no nível ${d.lv}. Faltam ${xpForLevel(d.lv) - S.xp} XP.` : capped ? 'Você atingiu o limite de equipamentos do seu nível.' : missing > 0 ? `${ic('coin', 'mi')} Faltam ${missing} moedas.` : 'Disponível para compra!';
    body.appendChild(status);
    const acts = h('div', 'acts');
    const back = h('button', 'btn ghost', 'Voltar'); back.onclick = () => fromProgress ? openProgress() : openShop(backTab || d.cat); acts.appendChild(back);
    const gemOnly = !!d.gprice;
    const buy = h('button', 'btn', locked ? `${ic('lock', 'mi')} Nível ${d.lv}` : `Comprar ${gemOnly ? gprice(d.gprice) : price(d.price)}`);
    buy.disabled = locked || capped || missing > 0 || (gemOnly ? (G.S.gems || 0) < d.gprice : G.S.coins < d.price);
    buy.onclick = () => { closePanel(); beginPlace(k, 'shop', d.price || 0, d.gprice || 0); };
    acts.appendChild(buy); body.appendChild(acts);
  }, { small: true });
}

// ---------------- neighbours ----------------
// ---- neighbour codes (Firebase builds): you only see the cafés you added, never strangers' ----
export const inviteLink = () => location.origin + location.pathname + '?vizinho=' + encodeURIComponent(G.me);
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { } a.remove(); return ok; } }
export async function addFriend(code) {
  code = (code || '').trim().replace(/^.*vizinho=/, '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!code || !G.db || !G.me) return 'invalid';
  if (code === G.me) return 'self';
  if (G.S.friends.includes(code)) return 'already';
  try { const d = await G.db.doc('cafes/' + code).get(); if (!(d && d.data && d.data())) return 'missing'; } catch (e) { return 'missing'; }
  G.S.friends.push(code); save(); watchFriend(code); return 'ok';
}
const watching = new Set();
function watchFriend(id) {
  if (watching.has(id) || !G.db) return; watching.add(id);
  try { G.db.doc('cafes/' + id).onSnapshot(d => { const data = d && d.data && d.data(); if (data && data.items) { try { G.cafes[id] = migrate(JSON.parse(JSON.stringify(data))); } catch (e) { } } }, () => { }); } catch (e) { }
}
export async function openNeighbors() {
  if (!G.db || !G.me) { openPanel('Vizinhos', 'house', b => b.appendChild(h('p', 'empty', 'Os vizinhos precisam de internet e de uma conta (claude.ai ou o jogo publicado com Firebase).')), { small: true }); return; }
  const ids = Object.keys(G.cafes).filter(id => id !== G.me && (G.net !== 'firebase' || G.S.friends.includes(id)));
  let names = {}; try { if (G.user && ids.length) names = await G.user.profiles(ids); } catch (e) { }
  openPanel('Vizinhos', 'house', body => {
    body.appendChild(h('p', 'sub', 'Visite o café dos seus amigos, deixe uma gorjeta ou mande um presente (um de cada por dia).'));
    if (G.net === 'firebase') {
      // invite: share your code or link; add a friend by pasting theirs
      const box = h('div', 'invite');
      box.innerHTML = `<div class="gtitle">Seu código de vizinho</div><code class="mycode">${esc(G.me)}</code>`;
      const row = h('div', 'acts');
      const cp = h('button', 'btn ghost', 'Copiar convite'); cp.onclick = async () => { toast(await copyText(inviteLink()) ? 'Link de convite copiado! Mande para sua amiga' : 'Não deu para copiar'); };
      row.appendChild(cp);
      if (navigator.share) { const sh = h('button', 'btn', 'Compartilhar'); sh.onclick = () => navigator.share({ title: 'Café Cantinho', text: 'Vem ser minha vizinha no Café Cantinho!', url: inviteLink() }).catch(() => { }); row.appendChild(sh); }
      box.appendChild(row);
      box.appendChild(h('div', 'gtitle', 'Adicionar vizinho'));
      const inp = h('input', 'txt'); inp.placeholder = 'Cole o código ou o link da sua amiga';
      const add = h('button', 'btn', 'Adicionar');
      add.onclick = async () => { const r = await addFriend(inp.value); toast({ ok: 'Vizinho adicionado!', self: 'Esse é o seu próprio código', already: 'Vocês já são vizinhos', missing: 'Não achei esse café. Confira o código', invalid: 'Cole um código válido' }[r]); if (r === 'ok') setTimeout(openNeighbors, 600); };
      box.appendChild(inp); const r2 = h('div', 'acts'); r2.appendChild(add); box.appendChild(r2);
      body.appendChild(box);
    }
    const grid = h('div', 'grid'); body.appendChild(grid);
    if (!ids.length) grid.appendChild(h('p', 'empty', G.net === 'firebase' ? 'Ainda nenhum vizinho. Mande seu convite: quando sua amiga abrir o link, vocês viram vizinhas.' : 'Ainda nenhum vizinho. Compartilhe o link do jogo: quando seu amigo abrir, o café dele aparece aqui.'));
    for (const id of ids) {
      const c = G.cafes[id], who = (names[id] && names[id].name) || (c.avatar && c.avatar.name && c.avatar.name !== 'Chef' ? c.avatar.name : 'Vizinha');
      grid.appendChild(card(thumbSwatch(c.floor || 'wood', c.wall || 'peach', 64), c.name || 'Café', `de ${esc(who)}<br>Nível ${level(c)}`, 'Visitar', {
        onClick: () => { closePanel(); G.visiting = { id, who }; G.mode = 'play'; G.sel = null; G.world = makeWorld(JSON.parse(JSON.stringify(c)), false); fitRoom(c.size); refreshHUD(); updateToolbar(); },
      }));
    }
  });
}
export function backHome() { G.visiting = null; G.world = makeWorld(G.S, true); fitRoom(G.S.size); refreshHUD(); }
function dailyOk(kind) { const S = G.S; if (S.daily.d !== today()) S.daily = { d: today(), sent: [] }; return !S.daily.sent.includes(kind + ':' + G.visiting.id); }
async function sendGift(p) { try { await G.db.collection('gifts').doc(uid() + uid()).set({ to: G.visiting.id, from: G.me, at: now(), ...p }); return true; } catch (e) { toast('Não foi possível enviar agora'); return false; } }
export async function visitTip() {
  if (!dailyOk('tip')) return toast('Você já deixou gorjeta hoje');
  if (G.S.coins < 10) return toast('Você precisa de 10 moedas');
  if (await sendGift({ kind: 'tip', coins: 25 })) { addCoins(-10); addXP(3); G.S.daily.sent.push('tip:' + G.visiting.id); save(); sfx('coin'); toast('Gorjeta enviada! Seu amigo recebe 25 moedas'); }
}
export function visitGift() {
  if (!dailyOk('gift')) return toast('Você já mandou presente hoje');
  openPanel('Mandar um presente', 'gift', body => {
    body.appendChild(h('p', 'sub', 'Grátis, uma vez por dia. O item vai para o inventário do seu amigo.'));
    const grid = h('div', 'grid'); body.appendChild(grid);
    for (const k of GIFT_ITEMS) grid.appendChild(card(thumbItem(k, 64), ITEMS[k].n, `+${ITEMS[k].charm} de charme`, 'Enviar', {
      onClick: async () => { if (await sendGift({ kind: 'item', item: k })) { G.S.daily.sent.push('gift:' + G.visiting.id); addXP(3); save(); sfx('pop'); closePanel(); toast('Presente enviado!'); } },
    }));
  });
}
export function listenSocial() {
  if (!G.db || !G.me) return;
  try { G.db.collection('gifts').where('to', '==', G.me).onSnapshot(s => { G.gifts = docsOf(s).filter(g => g.data); refreshHUD(); }, () => { }); } catch (e) { }
  if (G.net === 'firebase') {
    // only the cafés you added; an invite link (?vizinho=ID) adds that friend on arrival
    for (const id of G.S.friends) watchFriend(id);
    const inv = new URLSearchParams(location.search).get('vizinho');
    if (inv) { addFriend(inv).then(r => { if (r === 'ok') toast('Agora vocês são vizinhas! Veja em Vizinhos'); }); history.replaceState(null, '', location.pathname); }
    return;
  }
  try { G.db.collection('cafes').onSnapshot(s => { const m = {}; docsOf(s).forEach(d => { if (d.data && d.data.items && d.id) { try { m[d.id] = migrate(JSON.parse(JSON.stringify(d.data))); } catch (e) { } } }); G.cafes = m; }, () => { }); } catch (e) { }
}

// ---------------- café open / closed (café only; the world keeps running) ----------------
export function toggleOpen() {
  const S = G.S; S.open = S.open === false; save(); sfx(S.open ? 'level' : 'pop');
  const b = $('bOpen'); b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip');
  toast(S.open ? 'Café aberto! Os clientes já podem entrar.' : 'Café fechado. Quem já pediu termina a refeição; o mundo continua lá fora.');
  refreshOpen();
}
export function refreshOpen() {
  const open = G.S && G.S.open !== false, b = $('bOpen'); if (!b) return;
  b.classList.toggle('closed', !open);
  b.innerHTML = `<i></i><span>${open ? 'Aberto' : 'Fechado'}</span><small>${open ? 'fechar' : 'abrir'}</small>`;
}
let clockKey = '';
