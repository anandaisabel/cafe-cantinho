// Boot + main loop
import { THREE, initEngine, resize, fitRoom, zoomAt, render, E, setQuality } from './three/engine.js';
import { loadAssets } from './three/assets.js';
import { syncView } from './three/view.js';
import { pumpThumbs } from './three/thumbs.js';
import { warmUp } from './three/warmup.js';

import { Clock, DAY_HOUR } from './world/clock.js';
import { G, load, save, flush } from './state.js';
import { ITEMS as CFG_ITEMS } from './config.js';
import { buildItem } from './three/models.js';
import { disposeTree, cacheSizes } from './three/kit.js';
import { makeWorld, tick, layoutChanged } from './sim.js';
import * as SIM from './sim.js';
import { initInput } from './input.js';
import * as UI from './ui.js';
import { on, tickClock, setClock, advanceClock, now as nowFn } from './util.js';

const cv = document.getElementById('cv');
const topPad = () => (E.w < 640 ? 112 : 84), botPad = () => (E.w < 640 ? 100 : 104);
addEventListener('resize', () => { resize(); if (G.world) fitRoom(G.world.st.size, topPad(), botPad()); UI.positionToolbar(); });

const bind = (id, fn) => document.getElementById(id).addEventListener('click', fn);
function wire() {
  for (const [id, icon] of [['bShop', 'shop'], ['bEdit', 'brush'], ['bMenu', 'book'], ['bInv', 'box'], ['bStaff', 'team'], ['bNeigh', 'house'], ['bGoals', 'trophy'], ['bSet', 'gear'], ['zIn', 'plus'], ['zOut', 'minus'], ['zFit', 'fit'], ['vBack', 'back'], ['vGift', 'gift']])
    document.getElementById(id).insertAdjacentHTML('afterbegin', `<span class="bi">${UI.ICON[icon]}</span>`);
  document.getElementById('lvlStar').innerHTML = UI.ICON.star;
  document.getElementById('coinIc').innerHTML = UI.ICON.coin;
  document.getElementById('gemIc').innerHTML = UI.ICON.gem;
  document.getElementById('energyIc').innerHTML = UI.ICON.bolt;
  document.getElementById('vTip').insertAdjacentHTML('afterbegin', `<span class="bi">${UI.ICON.coin}</span>`);
  bind('bLvl', UI.openProgress);
  bind('bOpen', UI.toggleOpen);
  bind('bShop', () => UI.openShop());
  bind('popChip', () => UI.toast(`😊 Fama ${(G.S.pop || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · clientes felizes trazem mais clientes!`));
  bind('energyChip', () => UI.toast('⚡ A energia serve cafés e sucos e acelera pratos no fogo'));
  bind('bEdit', () => { G.mode = 'edit'; G.placeFrom = null; G.sel = null; UI.refreshHUD(); UI.updateToolbar(); document.getElementById('editHint').textContent = 'Arraste os móveis para reorganizar'; });
  bind('bDone', () => { if (G.pending) UI.cancelPlace(); G.mode = 'play'; G.sel = null; G.drag = null; layoutChanged(G.world); UI.refreshHUD(); UI.updateToolbar(); });
  bind('bEditShop', () => UI.openShop());
  bind('bMenu', UI.openRecipes);
  bind('bInv', UI.openInventory);
  bind('bStaff', UI.openStaff);
  bind('bNeigh', UI.openNeighbors);
  bind('bGoals', UI.openGoals);
  bind('bSet', UI.openSettings);
  bind('panelClose', UI.closePanel);
  bind('shade', () => { if (performance.now() - (G.panelAt || 0) > 450) UI.closePanel(); });
  bind('zIn', () => { zoomAt(E.w / 2, E.h / 2, 1.2); UI.positionToolbar(); });
  bind('zOut', () => { zoomAt(E.w / 2, E.h / 2, 1 / 1.2); UI.positionToolbar(); });
  bind('zFit', () => { fitRoom(G.world.st.size, topPad(), botPad()); UI.positionToolbar(); });
  bind('vBack', () => { UI.backHome(); fitRoom(G.S.size, topPad(), botPad()); });
  bind('vTip', UI.visitTip);
  bind('vGift', UI.visitGift);
}
// several levels at once become ONE light celebration, shown once things settle
let lvFrom = null, lvTo = 0, lvTimer = 0;
on('levelup', l => { if (lvFrom === null) lvFrom = l - 1; lvTo = Math.max(lvTo, l); clearTimeout(lvTimer); lvTimer = setTimeout(() => { const f = lvFrom, t = lvTo; lvFrom = null; lvTo = 0; UI.levelUp(t, f); }, 600); });

let last = performance.now(), hudT = 0, saveT = 0, fpsT = 0, frames = 0, downgraded = false, ambT = 0;
// The next frame is booked first and each frame is guarded: one bad frame used to stop the loop for good,
// which froze the café until a reload.
let loopErrors = 0;
function loop(t) {
  requestAnimationFrame(loop);
  try { frame(t); }
  catch (e) {
    loopErrors++; window.__lastLoopError = String((e && e.stack) || e);
    if (loopErrors < 5) console.error('frame error (game keeps running):', e);
  }
}
function frame(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t; window.__frames = (window.__frames || 0) + 1;
  // Gameplay time only advances while the game is on screen; closing it freezes every timer.
  tickClock();
  if (G.world) {
    // CAFÉ: its own simulation (paused only in decoration mode)
    tick(G.world, dt, G.mode === 'edit' && !G.visiting);
    syncView(G.world, t, dt);
    pumpThumbs();          // before the main render: draws in a corner that the render then overwrites
    render();
    hudT += dt; if (hudT > .5) { hudT = 0; UI.refreshOrders(); UI.refreshEnergy(); UI.refreshPop(); }
    // room tone follows how busy the café actually is
    ambT += dt;
    if (ambT > .4) { ambT = 0; const n = G.world.custs.filter(c => c.state !== 'leave').length; UI.setAmbience(Math.min(1, n / 5) * (G.S.open === false ? .25 : 1)); }
    UI.tickAmbience(t);
    saveT += dt; if (saveT > 15) { saveT = 0; save(); }
    // lower quality once, only if the device is genuinely slow (not during a menu or a hidden tab)
    if (!document.hidden && !document.getElementById('panel').classList.contains('open')) { frames++; fpsT += dt; }
    if (fpsT > 6) { const fps = frames / fpsT; frames = 0; fpsT = 0; if (fps < 22 && !downgraded && E.quality !== 'low' && !lockedQ()) { downgraded = true; setQuality(E.quality === 'high' ? 'medium' : 'low'); try { localStorage.removeItem('cc_quality'); } catch (e) { } } }
  }
}
const lockedQ = () => { try { return localStorage.getItem('cc_quality_locked'); } catch (e) { return 1; } };
const status = t => { const p = document.querySelector('#loading p'); if (p) p.textContent = t; };

async function boot() {
  wire();
  status('Preparando a cozinha…');
  initEngine(cv);
  status('Arrumando os móveis…');
  await loadAssets();
  status('Aquecendo o forno…');
  await warmUp();
  status('Abrindo o café…');
  const { isNew } = await load();
  if (!G.S.world) G.S.world = { min: 8 * 60, day: 1 };
  Clock.bind(G.S.world); Clock.set(DAY_HOUR);          // fixed, friendly daylight: no day/night cycle
  setClock(G.S.t);                                      // resume every gameplay timer where it stopped
  G.world = makeWorld(G.S, true);
  fitRoom(G.S.size, topPad(), botPad());
  initInput(cv);
  // if the phone drops the 3D context, save and reload instead of freezing
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); status('Recarregando o café…'); document.getElementById('loading').classList.remove('gone'); flush(true); setTimeout(() => location.reload(), 1200); });
  UI.refreshHUD();
  UI.listenSocial();
  requestAnimationFrame(loop);
  setTimeout(() => document.getElementById('loading').classList.add('gone'), 250);
  if (isNew) setTimeout(UI.askName, 700);
  window.__now = () => nowFn(); window.__ITEMS = CFG_ITEMS; window.__RENDER = render; window.__CACHE = cacheSizes; window.__BUILD = buildItem; window.__DISPOSE = disposeTree; window.__SIM = SIM; window.__G = G; window.__E = E; window.__THREE = THREE; window.__UI = UI; window.__Clock = Clock; window.__ff = s => { for (let i = 0; i < s * 30; i++) { advanceClock(1000 / 30); tick(G.world, 1 / 30, false); } };
}
boot().catch(e => { status('Ops, algo deu errado ao abrir: ' + (e && e.message || e)); console.error(e); });
