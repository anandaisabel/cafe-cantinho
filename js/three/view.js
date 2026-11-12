// Keeps the 3D scene in sync with the simulation; DOM overlays for status, bubbles and floating rewards
import { THREE, E, project, setBuildMode } from './engine.js';
import { buildItem, updateItem, updateTableFood, rotYaw } from './models.js';
import { buildRoom, tickRoom } from './room3d.js';
import { buildOutside, tickPedestrians, clearPedestrians, setupCars, tickCars, tickWind, tickNightLights, tickVendor, MARKET } from './outside3d.js';
import { applyDayNight, NIGHT, clearWorldRegistries } from './daynight.js';
import { Clock } from '../world/clock.js';
import { buildChar, animateChar } from './chars3d.js';
import { mat, cachedGeo, disposeTree } from './kit.js';
import { ITEMS, RECIPES, recipe, drinkEnergy } from '../config.js';
import { burnLeft, spoiled, freshLeft, isDirty, doorInUse, waitBudget, serves } from '../sim.js';
import { G, seatInfo, level } from '../state.js';
import { doorY } from '../path.js';
import { thumbFood } from './thumbs.js';
import { now, fmtTime, emit } from '../util.js';

export const CHAIR_PULL = .42;
// KayKit VIPs' sit clip puts the hips .21 behind the root (Kenney people: about level with it), so they are pulled
// further toward the table; otherwise their hips end up in the chair's backrest (measured in the browser).
const HERO_SIT_FWD = .17;
const V = { items: new Map(), chars: new Map(), room: null, roomKey: '', worldRef: null, hover: null, grid: null, ghost: null, ghostKey: '', tile: null, fx: [] };
export const VIEW = V;
const layer = () => document.getElementById('overlay');

function clearAll() {
  for (const e of V.items.values()) { disposeTree(e.group); e.dom && e.dom.remove(); }
  for (const c of V.chars.values()) { disposeTree(c.root); c.dom && c.dom.remove(); c.dom2 && c.dom2.remove(); c.dom3 && c.dom3.remove(); c.face && c.face.remove(); }
  V.items.clear(); V.chars.clear();
}
export function entryFor(id) { return V.items.get(id); }
export function charView(id) { return V.chars.get(id); }

function editGrid(n) {
  const pts = [];
  for (let i = 0; i <= n; i++) { pts.push(i, .015, 0, i, .015, n, 0, .015, i, n, .015, i); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x8a5a3e, transparent: true, opacity: .35 }));
}
function tilePlane() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.96, .96), new THREE.MeshBasicMaterial({ color: 0x7fbe74, transparent: true, opacity: .45, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .02; m.renderOrder = 2; return m;
}
// An opening belongs to a wall, not to a floor tile: the body slides to the wall plane of the cell
// it sits in (left column or back row) and turns to face into the room.
export function placeOnWall(e, it) {
  const onLeft = it.x === 0 && it.y !== 0 ? true : it.y === 0 ? false : it.x === 0;
  e.group.rotation.y = onLeft ? Math.PI / 2 : 0;
  e.body.position.set(0, 0, -.5);
  if (e.hit) e.hit.position.z = -.3;
}
function ghostify(entry) {
  entry.group.traverse(o => { if (o.isMesh && o.material && !o.userData.pick) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = Math.min(o.material.opacity ?? 1, .72); o.material.depthWrite = true; o.castShadow = false; } });
}

export function syncView(w, t, dt) {
  const st = w.st;
  if (V.worldRef !== w) { clearAll(); V.worldRef = w; V.roomKey = ''; }
  // room
  const dIt = st.items.find(i => ITEMS[i.type] && ITEMS[i.type].kind === 'door');
  const rk = [st.size, st.floor, st.wall, dIt ? dIt.type + dIt.y : 'nodoor'].join('|');
  if (rk !== V.roomKey) {
    // rebuild only the shell; furniture and characters are untouched
    if (V.room) disposeTree(V.room); clearWorldRegistries();
    V.room = buildRoom(st); V.room.add(buildOutside(st)); E.scene.add(V.room); clearPedestrians();   // no cars any more: the street is a quiet promenade
    V.roomKey = rk; if (V.grid) disposeTree(V.grid); V.grid = editGrid(st.size); E.scene.add(V.grid);
  }
  // ---- the world: always running, whatever the café is doing ----
  applyDayNight(Clock.hours, { x: st.size / 2, z: st.size / 2 }, st.size);
  // decoration mode is a build mode: the whole world holds still (people, vendor, wind), Sims-style
  const editing = G.mode === 'edit' && !G.visiting;
  if (editing && V.frozenT == null) V.frozenT = t; else if (!editing) V.frozenT = null;
  const at = editing ? V.frozenT : t, adt = editing ? 0 : dt;
  setBuildMode(editing, dt);
  tickRoom(t, st, doorInUse(w)); tickVendor(at, adt); if (!editing) { tickPedestrians(E.scene, st, t, dt); tickWind(t); } tickNightLights();
  V.grid.visible = editing;
  // items
  const seen = new Set(), drag = G.drag;
  for (const it of st.items) {
    seen.add(it.id);
    let e = V.items.get(it.id);
    if (!e || e.type !== it.type) { if (e) disposeTree(e.group); e = buildItem(it); e.id = it.id; V.items.set(it.id, e); E.scene.add(e.group); e.group.userData.itemId = it.id; e.hit.userData.id = it.id; }
    e.group.position.set(it.x + .5, 0, it.y + .5);
    e.group.rotation.y = rotYaw(it.rot); e.rot = it.rot;
    e.group.visible = !(drag && drag.id === it.id);
    updateItem(e, it, t, { hover: V.hover && V.hover.id === it.id, selected: editing && G.sel === it.id });
    if (ITEMS[it.type].kind === 'table') updateTableFood(e, w.tableFood[it.id], !!it.dirty);
    // a chair occupies its whole grid cell, but sits snug against the table it faces (local +z = facing)
    if (ITEMS[it.type].kind === 'chair') e.body.position.z = seatInfo(st, it) ? CHAIR_PULL : 0;
    if (e.opening) placeOnWall(e, it);
  }
  for (const [id, e] of V.items) if (!seen.has(id)) { disposeTree(e.group); e.dom && e.dom.remove(); V.items.delete(id); }
  // ghost (dragging or placing)
  const gsrc = drag ? { ...st.items.find(i => i.id === drag.id), x: drag.x, y: drag.y } : G.pending ? G.pending.item : null;
  const valid = drag ? drag.valid : G.pending ? G.pending.valid : true;
  const gk = gsrc ? gsrc.type + gsrc.id : '';
  if (gk !== V.ghostKey) { if (V.ghost) disposeTree(V.ghost.group); V.ghost = null; V.ghostKey = gk; if (gsrc) { V.ghost = buildItem(gsrc); ghostify(V.ghost); E.scene.add(V.ghost.group); } }
  if (!V.tile) { V.tile = tilePlane(); E.scene.add(V.tile); }
  V.tile.visible = !!gsrc;
  if (gsrc && V.ghost) {
    V.ghost.group.position.set(gsrc.x + .5, .04 + Math.sin(t / 200) * .02, gsrc.y + .5); V.ghost.group.rotation.y = rotYaw(gsrc.rot);
    if (V.ghost.opening) { V.ghost.group.position.y = 0; placeOnWall(V.ghost, gsrc); }
    updateItem(V.ghost, gsrc, t, {});
    V.tile.position.set(gsrc.x + .5, .02, gsrc.y + .5); V.tile.material.color.set(valid ? 0x7fbe74 : 0xe8706a);
  }
  // characters
  const live = new Set(), seats = {};
  for (const c of [...w.custs, ...w.staff]) {
    live.add(c.id);
    let C = V.chars.get(c.id);
    // appearance changed (the player restyled the avatar): drop the old body and build the new one
    if (C && (C.look.model !== c.look.model || C.look.hero !== c.look.hero || C.role !== c.role)) { if (C.dom) C.dom.remove(); if (C.dom2) C.dom2.remove(); if (C.dom3) C.dom3.remove(); if (C.face) C.face.remove(); E.scene.remove(C.root); disposeTree(C.root); if (C.hitbox) { E.scene.remove(C.hitbox); disposeTree(C.hitbox); } V.chars.delete(c.id); C = null; }
    if (!C) { C = buildChar(c.look, c.role); C.role = c.role; V.chars.set(c.id, C); E.scene.add(C.root); C.root.traverse(o => o.isMesh && (o.userData.charId = c.id)); C.hitbox = makeCharHit(C, c); }
    let o = {};
    let pull = null;
    if (c.sitting && c.seat) { const ch = st.items.find(i => i.id === c.seat); if (ch) { o.seatYaw = rotYaw(ch.rot); o.seatY = .29; if (seatInfo(st, ch)) pull = [[0, 1], [1, 0], [0, -1], [-1, 0]][ch.rot || 0]; } }
    if (c._celebrate) { const p = (t - c._celebrate) / 900; if (p < 1) o.celebrate = p; else c._celebrate = 0; }
    animateChar(C, c, at, adt, o);
    if (pull) { const d = CHAIR_PULL + (C.hero ? HERO_SIT_FWD : 0); C.root.position.x += pull[0] * d; C.root.position.z += pull[1] * d; }
  }
  for (const [id, C] of V.chars) if (!live.has(id)) { disposeTree(C.root); C.dom && C.dom.remove(); C.dom2 && C.dom2.remove(); C.dom3 && C.dom3.remove(); V.chars.delete(id); }
  assignLights(st);
  updateOverlays(w, t);
  updateFx(w, t, dt);
}
// lend the fixed pool of point lights to sconces and lamps (warmer and stronger at night)
const tmpV = new THREE.Vector3();
function assignLights(st) {
  const night = NIGHT.k, srcs = [];
  for (const p of (V.room && V.room.userData.lightAnchors) || []) srcs.push([p, .6 + 2.2 * night]);
  for (const e of V.items.values()) if (e.parts.lightAnchor && e.group.visible) { tmpV.copy(e.parts.lightAnchor).applyMatrix4(e.group.matrixWorld); srcs.push([tmpV.clone(), (1.0 + 2.4 * night) * e.parts.lightPower]); }
  E.pool.forEach((L, i) => { const s = srcs[i]; if (s) { L.position.copy(s[0]); L.intensity = s[1]; } else L.intensity = 0; });
}
function makeCharHit(C, c) {
  const h = new THREE.Mesh(cachedGeo('charhit', () => new THREE.BoxGeometry(.55, 1.2, .55)), new THREE.MeshBasicMaterial()); h.position.y = .6; h.visible = false;
  h.userData = { pick: 'char', id: c.id, pri: c.role === 'cust' ? 5 : 2 }; C.root.add(h); return h;
}

// ---------------- DOM overlays ----------------
function el(cls, html) { const d = document.createElement('div'); d.className = cls; if (html != null) d.innerHTML = html; layer().appendChild(d); return d; }
const FACE = {
  love:      '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#ffd95e" stroke="#d99a1e" stroke-width="2.4"/><path d="M9 15.5c0-2.6 3.4-3.6 4.6-1.3 1.2-2.3 4.6-1.3 4.6 1.3 0 2.4-4.6 5.2-4.6 5.2S9 17.9 9 15.5z" fill="#e8445c"/><path d="M21.8 15.5c0-2.6 3.4-3.6 4.6-1.3 1.2-2.3 4.6-1.3 4.6 1.3 0 2.4-4.6 5.2-4.6 5.2s-4.6-2.8-4.6-5.2z" fill="#e8445c"/><path d="M12 25c2.6 3.8 13.4 3.8 16 0" stroke="#8a5a1e" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>',
  happy:     '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#ffd95e" stroke="#d99a1e" stroke-width="2.4"/><path d="M11 16c1.4-2.2 4.2-2.2 5.6 0" stroke="#5a3a12" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M23.4 16c1.4-2.2 4.2-2.2 5.6 0" stroke="#5a3a12" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M12.5 24c2.4 3.4 12.6 3.4 15 0" stroke="#8a5a1e" stroke-width="2.8" fill="none" stroke-linecap="round"/><circle cx="10" cy="24" r="3" fill="#f49ba8" opacity=".75"/><circle cx="30" cy="24" r="3" fill="#f49ba8" opacity=".75"/></svg>',
  neutral:   '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#ffe08a" stroke="#d9a84e" stroke-width="2.4"/><circle cx="14" cy="17" r="2.6" fill="#5a3a12"/><circle cx="26" cy="17" r="2.6" fill="#5a3a12"/><path d="M14 26h12" stroke="#8a5a1e" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>',
  impatient: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#ffc96a" stroke="#d98e2e" stroke-width="2.4"/><path d="M10 13l6 3M30 13l-6 3" stroke="#5a3a12" stroke-width="2.6" stroke-linecap="round"/><circle cx="14.5" cy="19" r="2.4" fill="#5a3a12"/><circle cx="25.5" cy="19" r="2.4" fill="#5a3a12"/><path d="M14 27c2-1.6 10-1.6 12 0" stroke="#8a5a1e" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M31 9c2.2 2.4 2.2 4.6 0 7" stroke="#8ab6e8" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
  angry:     '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f7936b" stroke="#c75a35" stroke-width="2.4"/><path d="M9.5 12.5l7 4M30.5 12.5l-7 4" stroke="#6b2f16" stroke-width="3" stroke-linecap="round"/><circle cx="14.5" cy="20" r="2.5" fill="#6b2f16"/><circle cx="25.5" cy="20" r="2.5" fill="#6b2f16"/><path d="M13.5 28c2.6-3 10.4-3 13 0" stroke="#6b2f16" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  sad:       '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#bcd3e8" stroke="#6f93b5" stroke-width="2.4"/><path d="M10 14.5c1.6 1.4 4.4 1.4 6 0" stroke="#3c5366" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M24 14.5c1.6 1.4 4.4 1.4 6 0" stroke="#3c5366" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="14.5" cy="20" r="2.4" fill="#3c5366"/><circle cx="25.5" cy="20" r="2.4" fill="#3c5366"/><path d="M14 29c2.2-3.2 9.8-3.2 12 0" stroke="#3c5366" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M28.5 21.5c1.6 2.6 1.6 4.4 0 5.2-1.3.7-2.4-.4-2.2-1.8.2-1.2 1.3-2.4 2.2-3.4z" fill="#79b4e0"/></svg>',
};
const img = id => `<i class="fslot" data-f="${id}"></i>`;
function fillSlots(el) { el.querySelectorAll('.fslot').forEach(s => { const c = thumbFood(s.dataset.f, 64); c.classList.add('fimg'); s.replaceWith(c); }); }
function place(d, x, y, z) {
  const [sx, sy] = project(x, y, z);
  d.style.transform = `translate(${sx | 0}px,${sy | 0}px)`;
}
// queue an overlay; positions are resolved together so badges never sit on top of each other
function queue(d, x, y, z, kind) { const [sx, sy] = project(x, y, z); const [w, h, pri] = SIZE[kind] || [40, 40, 0]; placed.push({ d, sx, sy, w, h, pri }); }
function resolve(k) {
  const M = 6; placed.sort((a, b) => b.pri - a.pri);
  const done = [];
  for (const p of placed) {
    const w = p.w * k, h = p.h * k; let y = p.sy;
    for (let pass = 0; pass < 6; pass++) {
      let moved = false;
      for (const q of done) {
        if (Math.abs(p.sx - q.sx) < (w + q.w) / 2 + M && y > q.y - q.h - M && y - h < q.y + M) { y = q.y - q.h - M; moved = true; }
      }
      if (!moved) break;
    }
    done.push({ sx: p.sx, y, w, h });
    p.d.style.transform = `translate(${p.sx | 0}px,${y | 0}px)`;
  }
}
const SIZE = { 'st drinkready': [84, 30, 3], 'st drinkready ask': [84, 30, 4], drinkb: [58, 62, 6], nametag: [64, 18, 0], mkt: [58, 30, 8], bub: [60, 74, 5], 'st dirty': [62, 26, 2], 'st idle': [30, 30, 1], 'st cook': [56, 72, 3], 'st ready': [84, 32, 4], 'st stock': [34, 26, 2] };
let placed = [];
function updateOverlays(w, t) {
  placed = [];
  const st = w.st, k = Math.min(1.25, Math.max(.7, 9 / E.view));
  layer().style.setProperty('--k', k.toFixed(2));
  for (const it of st.items) {
    const e = V.items.get(it.id); if (!e) continue;
    const kind = ITEMS[it.type].kind;
    let html = '', cls = '';
    if (kind === 'equip' && !(G.drag && G.drag.id === it.id)) {
      if (it.cook) {
        const R = recipe(it.cook.r), left = R.t - (now() - it.cook.s) / 1000, p = Math.min(1, 1 - left / R.t), bl = burnLeft(it);
        if (left > 0) { cls = 'st cook'; html = `<div class="ring" style="--p:${(p * 100).toFixed(1)}%">${img(R.id)}</div><small>${fmtTime(left)}</small>`; }
        else if (bl <= 0) { cls = 'st ready burnt'; html = `<b>Queimou</b>`; }
        else { cls = 'st ready' + (bl < .45 ? ' warn' : ''); html = `<b>${bl < .45 ? 'Retire!' : 'Pronto!'}</b>`; }
      } else if (it.pending) { cls = 'st cook wait'; html = `<div class="ring" style="--p:0%">${img(it.pending.r)}</div><small>a caminho</small>`; }
      else if (!G.visiting) {
        const eq = ITEMS[it.type].eq, cooks = RECIPES.some(r => r.eq === eq && !r.drink);
        if (cooks) { cls = 'st idle'; html = '<i>Cozinhar</i>'; }
        else {
          // a drink machine is always ready: say so, and call out when a seated guest is waiting on it
          const menu = RECIPES.filter(r => r.eq === eq && r.drink && r.lv <= level() && serves(it, r.id));
          const asks = w.custs.filter(c => c.drink && !c.drinkDone && c.sitting && recipe(c.drink).eq === eq).length;
          if (menu.length) { cls = 'st drinkready' + (asks ? ' ask' : ''); html = `<b>${img(asks ? w.custs.find(c => c.drink && !c.drinkDone && c.sitting && recipe(c.drink).eq === eq).drink : menu[0].id)}<span>${asks ? 'Pedido!' : 'Pronta'}</span></b>`; }
        }
      }
    }
    if (kind === 'table' && isDirty(it) && !G.visiting) { cls = 'st dirty'; html = `<b>Limpar</b>`; }
    if (kind === 'counter' && it.stock && it.stock.left > 0) {
      if (spoiled(it)) { cls = 'st stock bad'; html = `<b>Estragou</b>`; }
      else { const fl = freshLeft(it); cls = 'st stock' + (fl < .3 ? ' warn' : ''); html = `<b>${it.stock.left}</b>`; }
    }
    const key = cls + html.replace(/--p:[\d.]+%/, '').replace(/<small>.*<\/small>/, '');
    if (!html) { if (e.dom) { e.dom.remove(); e.dom = null; } continue; }
    if (!e.dom) e.dom = el('ov');
    if (e.domKey !== key) { e.dom.className = 'ov ' + cls; e.dom.innerHTML = html; fillSlots(e.dom); e.domKey = key; }
    else if (cls === 'st cook') { const r = e.dom.querySelector('.ring'), s = e.dom.querySelector('small'); const R = recipe(it.cook.r), left = R.t - (now() - it.cook.s) / 1000; r.style.setProperty('--p', ((1 - left / R.t) * 100).toFixed(1) + '%'); s.textContent = fmtTime(left); }
    const yy = cls === 'st ready' ? 1.55 : cls === 'st dirty' ? .95 : cls.startsWith('st drinkready') ? .95 : kind === 'counter' ? .75 : 1.3;
    queue(e.dom, it.x + .5, yy, it.y + .5, cls);
  }
  for (const c of w.custs) {
    const C = V.chars.get(c.id); if (!C) continue;
    let html = '', cls = 'bub';
    if (c.state === 'menu') html = '<span class="menuic"></span>';
    else if (c.state === 'waitSeat') html = '<span class="dots">•••</span>';
    else if (c.state === 'wait' && c.order) {
      const p = Math.max(0, c.patience);
      cls += p > .6 ? ' good' : p > .3 ? ' mid' : ' bad';
      const drink = '';   // drinks have their own tappable bubble (below)
      html = `<div class="ring" style="--p:${(p * 100).toFixed(1)}%">${img(c.order)}${drink}</div><small class="secs">${Math.ceil(p * waitBudget(st))}s</small>`;
    }
    if (!html) { if (C.dom) { C.dom.remove(); C.dom = null; } continue; }
    if (!C.dom) C.dom = el('ov');
    const key = cls + (c.order || '') + c.state;
    if (C.domKey !== key) { C.dom.className = 'ov ' + cls; C.dom.innerHTML = html; fillSlots(C.dom); C.domKey = key; }
    else if (c.state === 'wait') {
      const p = Math.max(0, c.patience);
      C.dom.querySelector('.ring').style.setProperty('--p', (p * 100).toFixed(1) + '%');
      const sc = C.dom.querySelector('.secs'); if (sc) sc.textContent = Math.ceil(p * waitBudget(st)) + 's';
    }
    queue(C.dom, c.gx, (c.sitting ? .3 : 0) + 1.35, c.gy, 'bub');
  }
  // drink orders: a thought bubble with a glass, served by tapping it (Café Mania style)
  for (const c of w.custs) {
    const C = V.chars.get(c.id); if (!C) continue;
    const want = c.drink && !c.drinkDone && (c.state === 'wait' || c.state === 'eat') && c.sitting && !G.visiting && G.mode !== 'edit';   // hidden while paused in decoration mode
    if (!want) { if (C.dom3) { C.dom3.remove(); C.dom3 = null; } continue; }
    if (!C.dom3) {
      C.dom3 = el('ov drinkb', `<div class="dbub"><div class="dglass">${img(c.drink)}</div><b class="dcost">⚡${drinkEnergy(recipe(c.drink))}</b></div>`); fillSlots(C.dom3);
      // serve on touch-down: a click needs press and release on the same spot, which a moving bubble can miss
      const id = c.id; C.dom3.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); emit('servedrink', id); });
    }
    queue(C.dom3, c.gx + .12, 1.7, c.gy - .12, 'drinkb');
  }
  // name tags over the team, like a staff badge: who is who at a glance
  for (const c of w.staff) {
    const C = V.chars.get(c.id); if (!C) continue;
    const name = c.data && c.data.name;
    if (!name || c.alpha < .5) { if (C.dom2) { C.dom2.remove(); C.dom2 = null; } continue; }
    if (!C.dom2) C.dom2 = el('ov nametag');
    const key = c.role + name;
    if (C.dom2Key !== key) { C.dom2.className = 'ov nametag ' + c.role; C.dom2.innerHTML = `<span>${name.replace(/[<>&]/g, '')}</span>`; C.dom2Key = key; }
    queue(C.dom2, c.gx, 1.18, c.gy, 'nametag');
  }
  // the market stall is tapped directly in 3D (see input.js); no floating label
  resolve(k);
}

// ---------------- floating rewards & effects ----------------
const seenFloat = new WeakSet(), seenPop = new WeakSet();
let activeFloats = [];
function updateFx(w, t, dt) {
  for (const f of w.floats) if (!seenFloat.has(f)) {
    seenFloat.add(f);
    const d = el('float ' + (f.kind === 'xp' ? 'xp' : f.text[0] === '-' ? 'neg' : 'coin'), `<span class="fic"></span>${f.text}`);
    const [sx, sy] = project(f.gx, 1.1, f.gy), tnow = performance.now();
    activeFloats = activeFloats.filter(a => tnow - a.t < 900);
    const near = activeFloats.filter(a => Math.abs(a.sx - sx) < 70 && Math.abs(a.sy - sy) < 60).length;
    const fx = sx + (f.kind === 'xp' ? 30 : -6), fy = sy - near * 24;
    activeFloats.push({ sx, sy, t: tnow });
    d.style.transform = `translate(${fx | 0}px,${fy | 0}px)`; setTimeout(() => d.remove(), 1300);
    if (w.own && f.text[0] === '+') flyTo(f.gx, f.gy, f.kind === 'xp' ? 'xp' : 'coin', f.kind === 'xp' ? 3 : Math.min(6, 2 + (parseInt(f.text.slice(1)) / 6) | 0));
  }
  for (const p of w.pops) if (!seenPop.has(p)) {
    seenPop.add(p);
    const d = p.face ? el('pop face m-' + p.mood, `<div class="fwrap">${FACE[p.mood] || FACE.neutral}</div>`) : el('pop ' + p.mood);
    { const [sx, sy] = project(p.gx, 1.45, p.gy); d.style.transform = `translate(${(sx - (p.face ? 0 : 34)) | 0}px,${sy | 0}px)`; }
    setTimeout(() => d.remove(), p.face ? 1700 : 1200);
    if (p.mood === 'happy') { const c = w.custs.find(c => Math.abs(c.gx - p.gx) < .05 && Math.abs(c.gy - p.gy) < .05 && c.state === 'leave'); if (c) c._celebrate = t; }
  }
}
// small icons that fly from the world to the HUD counter
export function flyTo(gx, gy, kind, n = 4) {
  const target = document.getElementById(kind === 'xp' ? 'xpFill' : 'coinIc'); if (!target) return;
  const r = target.getBoundingClientRect(), [sx, sy] = project(gx, 1, gy);
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'flyer ' + kind; document.body.appendChild(d);
    const ox = (Math.random() - .5) * 50, oy = (Math.random() - .5) * 30, tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    d.style.left = sx + 'px'; d.style.top = sy + 'px';
    d.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: `translate(calc(-50% + ${ox}px),calc(-50% + ${oy}px)) scale(1)`, opacity: 1, offset: .25 },
      { transform: `translate(calc(-50% + ${tx - sx}px),calc(-50% + ${ty - sy}px)) scale(.6)`, opacity: .9 }], { duration: 750 + i * 70, easing: 'cubic-bezier(.5,0,.6,1)', delay: i * 40 }).onfinish = () => {
      d.remove(); const pill = target.closest('.res, .lvl'); if (pill) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
    };
  }
}
// sparkle burst at a tile (purchases, placing)
export function burst(gx, gy, color = '#ffd56a') {
  const [sx, sy] = project(gx, .4, gy);
  for (let i = 0; i < 14; i++) {
    const d = document.createElement('div'); d.className = 'spark'; d.style.left = sx + 'px'; d.style.top = sy + 'px'; d.style.background = i % 3 ? color : '#fff'; document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 50;
    d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r - 20}px)) scale(.2)`, opacity: 0 }], { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => d.remove();
  }
}
export function bounce(id) { const e = V.items.get(id); if (e) e.bounceT = performance.now(); }
export function setHover(h) { V.hover = h; }
