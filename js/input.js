// Mouse & touch for the 3D view: generous hitboxes with priorities, hover, pan, pinch/wheel zoom, drag furniture
import { E, rayFrom, groundAt, panScreen, zoomAt, project, THREE } from './three/engine.js';
import { VIEW, setHover, bounce } from './three/view.js';
import { MARKET } from './three/outside3d.js';
import { emit } from './util.js';
import { G, itemAt, wallAt, save, seatInfo } from './state.js';
import { ITEMS, canHoldWall } from './config.js';
import { doorY } from './path.js';
import { layoutChanged } from './sim.js';
import { openSound, openEquip, openCounter, showCustomer, showStaff, toast, updateToolbar, positionToolbar, itemBusy } from './ui.js';
import { sfx, unlockAudio, nextTrack } from './audio.js';

const ptrs = new Map(), wp = new THREE.Vector3();
let gesture = null;

// all hit meshes, best by priority then distance; retries around the finger for forgiving touch
function hitList() {
  const list = [];
  for (const e of VIEW.items.values()) if (e.group.visible) list.push(e.hit);
  for (const C of VIEW.chars.values()) if (C.root.visible && C.hitbox) list.push(C.hitbox);
  if (MARKET && MARKET.hit && !G.visiting && G.mode !== 'edit') list.push(MARKET.hit);   // the street stall
  return list;
}
function pickAt(px, py, filter) {
  const list = hitList(); let best = null;
  const offs = [[0, 0], [0, -14], [14, 0], [-14, 0], [0, 14], [10, -22], [-10, -22]];
  for (const [ox, oy] of offs) {
    const hits = rayFrom(px + ox, py + oy).intersectObjects(list, false);
    for (const h of hits) {
      const u = h.object.userData; if (filter && !filter(u)) continue;
      // same priority: the object whose centre is nearest the finger on screen wins (not the one nearest the camera)
      h.object.getWorldPosition(wp); const [cx, cy] = project(wp.x, wp.y * .8, wp.z);
      const score = u.pri * 1000 - Math.hypot(cx - px, cy - py) - (ox || oy ? 40 : 0);
      if (!best || score > best.score) best = { ...u, score };
    }
    if (best && !(ox || oy)) break;
  }
  return best;
}
function tileUnder(px, py) { const p = groundAt(px, py); return p ? [Math.floor(p.x), Math.floor(p.z)] : [-1, -1]; }
function validSpot(st, x, y, ignoreId, type) {
  if (x < 0 || y < 0 || x >= st.size || y >= st.size) return false;
  const d = type && ITEMS[type];
  if (d && (d.kind === 'window' || d.kind === 'door')) {
    // openings hang on a wall: only the back row and the left column, one per spot
    if (d.kind === 'door' && x !== 0) return false;            // the entrance stays on the left wall
    if (!canHoldWall(st, x, y)) return false;
    const o = wallAt(st, x, y); return !o || o.id === ignoreId;
  }
  if (x === 0 && y === doorY(st)) return false;                 // keep the doorway clear
  const o = itemAt(st, x, y); return !o || o.id === ignoreId;
}

export function initInput(cv) {
  cv.addEventListener('pointerdown', e => {
    unlockAudio();
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; gesture = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) }; G.drag = null; return; }
    gesture = { type: 'tap', sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, touch: e.pointerType !== 'mouse' };
    if (G.mode === 'edit' && !G.visiting) {
      if (G.pending) { gesture.pend = true; return; }
      const h = pickAt(e.clientX, e.clientY, u => u.pick === 'item');
      if (h) gesture.item = h.id;
    }
  });
  cv.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) {
      // hover feedback (mouse only)
      if (e.pointerType === 'mouse' && G.world) { const h = pickAt(e.clientX, e.clientY, u => G.mode === 'edit' ? u.pick === 'item' : true); setHover(h); cv.style.cursor = h ? 'pointer' : 'grab'; }
      return;
    }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!gesture) return;
    if (gesture.type === 'pinch' && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / gesture.d); gesture.d = d; positionToolbar(); return;
    }
    const moved = Math.hypot(e.clientX - gesture.sx, e.clientY - gesture.sy) > (gesture.touch ? 10 : 6);
    if (gesture.type === 'tap' && moved) {
      if (gesture.pend) gesture.type = 'pdrag';
      else if (gesture.item) {
        const it = G.world.st.items.find(i => i.id === gesture.item), busy = it && itemBusy(it);
        if (busy) { toast(busy); gesture.type = 'pan'; }
        else { gesture.type = 'drag'; G.sel = it.id; G.drag = { id: it.id, x: it.x, y: it.y, valid: true }; updateToolbar(); sfx('click'); }
      } else gesture.type = 'pan';
    }
    if (gesture.type === 'pan') { panScreen(e.clientX - gesture.lx, e.clientY - gesture.ly); positionToolbar(); cv.style.cursor = 'grabbing'; }
    if (gesture.type === 'drag') {
      const [x, y] = tileUnder(e.clientX, e.clientY);
      if (x !== G.drag.x || y !== G.drag.y) { G.drag.x = x; G.drag.y = y; G.drag.valid = validSpot(G.world.st, x, y, G.drag.id, (G.world.st.items.find(i => i.id === G.drag.id) || {}).type); }
    }
    if (gesture.type === 'pdrag') movePending(e.clientX, e.clientY);
    gesture.lx = e.clientX; gesture.ly = e.clientY;
  });
  const end = e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId); cv.style.cursor = '';
    if (!gesture) return;
    if (gesture.type === 'pinch') { if (ptrs.size === 0) gesture = null; return; }
    if (gesture.type === 'drag') {
      const d = G.drag, it = G.world.st.items.find(i => i.id === d.id);
      if (it && d.valid && (it.x !== d.x || it.y !== d.y)) { it.x = d.x; it.y = d.y; save(); sfx('pop'); layoutChanged(G.world); bounce(it.id); }
      else if (!d.valid) toast('Não cabe aí');
      G.drag = null; updateToolbar();
    } else if (gesture.type === 'tap') tap(e.clientX, e.clientY);
    gesture = null;
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => setHover(null));
  // stop the browser's synthetic click after a touch from landing on a panel that just opened
  cv.addEventListener('touchend', e => e.preventDefault(), { passive: false });
  cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12); positionToolbar(); }, { passive: false });
}

function movePending(px, py) {
  const p = G.pending, [x, y] = tileUnder(px, py);
  if (x < 0 || y < 0 || x >= G.S.size || y >= G.S.size) return;
  if (p.item.x !== x || p.item.y !== y) { p.item.x = x; p.item.y = y; p.valid = validSpot(G.S, x, y, null, p.item.type); positionToolbar(); }
}

function tap(px, py) {
  const w = G.world, st = w.st;
  if (G.mode === 'edit' && !G.visiting) {
    if (G.pending) { movePending(px, py); sfx('click'); return; }
    const h = pickAt(px, py, u => u.pick === 'item');
    G.sel = h ? h.id : null; if (h) { sfx('click'); bounce(h.id); }
    updateToolbar(); return;
  }
  const h = pickAt(px, py);
  if (!h) return;
  if (h.pick === 'char') {
    const c = [...w.custs, ...w.staff].find(c => c.id === h.id); if (!c) return;
    sfx('click'); if (c.role === 'cust') showCustomer(c); else if (!G.visiting) showStaff(c.data); return;
  }
  if (G.visiting) return;
  if (h.pick === 'market') { emit('openmarket'); return; }
  const it = st.items.find(i => i.id === h.id); if (!it) return;
  const d = ITEMS[it.type]; bounce(it.id);
  if (d.kind === 'equip') openEquip(it);
  else if (d.kind === 'counter') openCounter(it);
  else if (d.kind === 'chair') { sfx('click'); toast(seatInfo(st, it) ? 'Lugar pronto para clientes' : 'Gire a cadeira para uma mesa no modo decoração'); }
  else if (d.kind === 'table') { sfx('click'); toast('Coloque cadeiras viradas para a mesa'); }
  else if (it.type === 'jukebox') { sfx('click'); const tr = nextTrack(); if (tr) toast(`🎵 Tocando: ${tr.n} · toque de novo para trocar`); }   // a real jukebox: one tap, next song
  else sfx('pop');
}
