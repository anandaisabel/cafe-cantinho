// The café shell: floor, walls, windows, door and lived-in wall decoration
import { THREE } from './engine.js';
import { model } from './assets.js';
import { mat, mesh, box, sphere, cyl, lathe, cachedGeo, torus, leafGeo, mergeParts, M4 } from './kit.js';
import { floorTexture, wallTexture, labelTexture, skyTexture } from './textures.js';
import { WALLS } from '../config.js';
import { doorY } from '../path.js';
import { ITEMS } from '../config.js';
import { registerNightGlow, registerPane } from './daynight.js';

export const WALL_H = 2.1, WT = .14;
let clockHands = null;

let skyTex;

// window on a wall. axis: 'x' (wall along x at z=0) or 'z' (wall along z at x=0). u: start along wall
function windowOn(g, axis, u, w = 1.2) {
  const W = new THREE.Group(); g.add(W);
  if (axis === 'x') { W.position.set(u + w / 2, 0, WT / 2 + .001); } else { W.position.set(WT / 2 + .001, 0, u + w / 2); W.rotation.y = Math.PI / 2; }
  const y0 = .8, h = .95;
  skyTex = skyTex || skyTexture();
  const pane = mesh(cachedGeo('pane' + w, () => new THREE.PlaneGeometry(w, h)), new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }), 0, y0 + h / 2, .005, W); pane.castShadow = false; registerPane(pane.material);
  const fr = '#fffaf3';
  box(W, w + .12, .07, .08, fr, 0, y0 - .07, .02, { rough: .4, coat: .3 }, .02);
  box(W, w + .2, .05, .16, fr, 0, y0 - .1, .06, { rough: .4, coat: .3 }, .02); // sill
  box(W, w + .12, .07, .08, fr, 0, y0 + h, .02, { rough: .4 }, .02);
  for (const s of [-1, 1]) box(W, .07, h + .07, .08, fr, s * (w / 2 + .025), y0 - .02, .02, { rough: .4 }, .02);
  box(W, .04, h, .05, fr, 0, y0, .02, { rough: .4 }, .01);
  box(W, w, .03, .05, fr, 0, y0 + h * .55, .02, { rough: .4 }, .01);
  // curtains with folds
  for (const s of [-1, 1]) {
    const c = new THREE.Group(); c.position.set(s * (w / 2 + .08), y0 - .15, .1); W.add(c);
    for (let i = 0; i < 4; i++) { const m = cyl(c, .045, .06, h + .4, '#f2a7a0', (i - 1.5) * .055 * -s, 0, 0, { rough: .85, sheen: 1, coat: .01 }, 12); }
    const tie = torus(c, .1, .018, '#e8706a', { rough: .6 }); tie.position.y = .45; tie.rotation.x = Math.PI / 2; tie.scale.set(1, .6, 1);
  }
  { const rod = cyl(W, .018, .018, w + .5, '#8a5a3e', 0, 0, .1, { rough: .4, metal: .3 }, 8); rod.position.y = y0 + h + .18; rod.rotation.z = Math.PI / 2; }
  // little plant on the sill
  const pot = new THREE.Group(); pot.position.set(w * .28, y0 - .05, .07); W.add(pot);
  lathe(pot, [[0, 0], [.04, 0], [.055, .08], [0, .08]], '#e8a59a', { rough: .3, coat: .6 }, 14, 'spot');
  const parts = []; for (let i = 0; i < 7; i++) parts.push({ geo: leafGeo(), m: M4(0, .08, 0, -.7, i * .9, 0, .05, .07, .05), color: ['#5f9e4f', '#77b35f'][i % 2] });
  mesh(mergeParts(parts), Object.assign(mat('#fff', { rough: .45 }).clone(), { vertexColors: true }), 0, 0, 0, pot);
  return W;
}

function stringLights(g, axis, len, t0) {
  const bulbs = [];
  const pts = []; for (let i = 0; i <= len * 6; i++) { const u = i / 6, sag = Math.sin((u % 1) * Math.PI) * .14; pts.push(axis === 'x' ? new THREE.Vector3(u, WALL_H - .12 - sag, WT / 2 + .05) : new THREE.Vector3(WT / 2 + .05, WALL_H - .12 - sag, u)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  mesh(new THREE.TubeGeometry(curve, len * 24, .006, 5), mat('#6b4430', { rough: .6 }), 0, 0, 0, g).castShadow = false;
  const bulbMat = mat('#fff1c8', { emissive: '#ffcf7a', ei: 2.6 });
  const geo = cachedGeo('bulb', () => new THREE.SphereGeometry(.028, 10, 8));
  for (let i = 1; i < len * 3; i++) { const p = curve.getPoint(i / (len * 3)); const b = mesh(geo, bulbMat, p.x, p.y - .03, p.z, g); b.castShadow = false; bulbs.push(b); }
  return bulbs;
}
function hangingPlant(g, x, z) {
  const H = new THREE.Group(); H.position.set(x, WALL_H - .35, z); g.add(H);
  for (let i = 0; i < 3; i++) { const a = i * 2.09; const r = cyl(H, .003, .003, .35, '#c9a27a', Math.cos(a) * .05, .05, Math.sin(a) * .05, {}, 4); r.rotation.z = Math.cos(a) * .15; r.rotation.x = -Math.sin(a) * .15; }
  lathe(H, [[0, 0], [.07, .01], [.1, .1], [0, .1]], '#fffaf3', { rough: .3, coat: .7 }, 18, 'hpot').position.y = -.06;
  const parts = [], L = leafGeo(); let s = 11; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 10; i++) parts.push({ geo: L, m: M4(0, .05, 0, -1.1, i * 2.4, 0, .07, .09, .07), color: ['#5f9e4f', '#77b35f', '#4e8a43'][i % 3] });
  for (let t = 0; t < 5; t++) { const a = t * 1.3; for (let k = 0; k < 7; k++) parts.push({ geo: L, m: M4(Math.cos(a) * (.1 + k * .008), -.02 - k * .07, Math.sin(a) * (.1 + k * .008), -2.7, a + (k % 2 ? .7 : -.7), 0, .045, .055, .045), color: ['#6faa58', '#4e8a43'][k % 2] }); }
  mesh(mergeParts(parts), Object.assign(mat('#fff', { rough: .45, coat: .3, side: THREE.DoubleSide }).clone(), { vertexColors: true }), 0, 0, 0, H);
}
function clock(g, x, y, z) {
  const C = new THREE.Group(); C.position.set(x, y, z); g.add(C);
  const face = cyl(C, .16, .16, .04, '#fffaf2', 0, 0, 0, { rough: .3, coat: .6 }, 28); face.rotation.x = Math.PI / 2;
  const rim = torus(C, .16, .022, '#8a5a3e', { rough: .4, coat: .4 }); rim.position.z = .02;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(C, .012, .025, .01, '#6b4430', Math.sin(a) * .12, Math.cos(a) * .12 - .012, .045, {}, .003); }
  const hh = new THREE.Group(), mh = new THREE.Group(); hh.position.z = mh.position.z = .05; C.add(hh, mh);
  box(hh, .018, .08, .01, '#6b4430', 0, 0, 0, {}, .004); box(mh, .012, .11, .01, '#6b4430', 0, 0, .005, {}, .004);
  clockHands = { hh, mh };
}
export function tickRoom(t, st, inUse) {
  if (room && room.userData.sign && st && room.userData.sign.open !== (st.open !== false)) {
    const S = room.userData.sign; S.open = st.open !== false; S.mesh.material.map = S.open ? S.tOpen : S.tClosed; S.mesh.material.emissiveMap = S.mesh.material.map; S.mesh.material.needsUpdate = true; S.flip = performance.now();
  }
  if (room && room.userData.sign && room.userData.sign.flip) { const k = (performance.now() - room.userData.sign.flip) / 500; room.userData.sign.mesh.rotation.x = k < 1 ? Math.sin(k * Math.PI * 2) * .5 * (1 - k) : 0; if (k >= 1) room.userData.sign.flip = 0; }
  // the door is shut by default and swings open only while somebody walks through it
  if (room && room.userData.doorLeaf) {
    const L = room.userData.doorLeaf;
    const want = inUse ? -1.15 : 0;
    const k = inUse ? .16 : .07;                 // opens briskly, eases shut
    L.rotation.y += (want - L.rotation.y) * k;
  }
  if (clockHands) { const d = new Date(); clockHands.hh.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2; clockHands.mh.rotation.z = -d.getMinutes() / 60 * Math.PI * 2; }
  if (room && room.userData.bulbs) room.userData.bulbs.forEach((b, i) => { b.scale.setScalar(.85 + .15 * Math.sin(t / 600 + i * 1.7)); });
}

let room = null;
export function buildRoom(st) {
  const n = st.size, Wf = WALLS[st.wall] || WALLS.peach, g = new THREE.Group(); room = g;
  // floor + slab
  const floor = mesh(new THREE.PlaneGeometry(n, n), new THREE.MeshStandardMaterial({ map: floorTexture(st.floor, n), roughness: .62, metalness: 0, envMapIntensity: .6, color: new THREE.Color(.86, .82, .78) }), n / 2, 0, n / 2, g);
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  box(g, n + .08, .07, n + .08, '#c9b9a5', n / 2, -.076, n / 2, { rough: .8 }, .02); // low stone foundation, café sits on the ground
  // walls
  const wm = new THREE.MeshStandardMaterial({ map: wallTexture(st.wall, n), roughness: .82 });
  const wmL = new THREE.MeshStandardMaterial({ map: wallTexture(st.wall, n), roughness: .82, color: new THREE.Color(1, .97, .95) });
  const dItem = (st.items || []).find(i => ITEMS[i.type] && ITEMS[i.type].kind === 'door');
  const dStyle = (dItem && ITEMS[dItem.type].style) || 'wood';
  const dy = doorY(st), DW = .9, DH = dStyle === 'arch' ? 1.72 : 1.5;
  // back wall (along x at z=0)
  const back = mesh(new THREE.BoxGeometry(n + WT, WALL_H, WT), wm, n / 2 - WT / 2, WALL_H / 2, -WT / 2 + WT / 2 - WT / 2, g);
  back.position.z = -WT / 2 + .0;
  // left wall (along z at x=0) with a door gap
  const segs = [[-WT, dy + .05], [dy + .05 + DW, n]];
  for (const [a, b] of segs) if (b > a) { const len = b - a; const s = mesh(new THREE.BoxGeometry(WT, WALL_H, len), wmL, -WT / 2, WALL_H / 2, a + len / 2, g); const tx = wallTexture(st.wall, len); s.material = wmL.clone(); s.material.map = tx; }
  mesh(new THREE.BoxGeometry(WT, WALL_H - DH, DW), wmL, -WT / 2, DH + (WALL_H - DH) / 2, dy + .05 + DW / 2, g);
  // trims: baseboard + crown
  const trim = { rough: .4, coat: .3 };
  box(g, n, .1, .04, Wf.trim, n / 2, 0, .02, trim, .015);
  box(g, .04, .1, dy + .05, Wf.trim, .02, 0, (dy + .05) / 2, trim, .015);
  box(g, .04, .1, n - dy - .05 - DW, Wf.trim, .02, 0, (n + dy + .05 + DW) / 2, trim, .015);
  box(g, n + WT + .1, .08, WT + .1, shadeHex(Wf.trim, 30), n / 2 - WT / 2, WALL_H, -WT / 2, trim, .03);
  box(g, WT + .1, .08, n + .1, shadeHex(Wf.trim, 30), -WT / 2, WALL_H, n / 2 - .05, trim, .03);
  // door: frame, open leaf, glow from outside, mat
  const D = new THREE.Group(); D.position.set(0, 0, dy + .05); g.add(D);
  const fc = '#8a5a3e';
  box(D, .2, .1, DW + .2, fc, -WT / 2, DH, DW / 2, { rough: .5, coat: .3 }, .03);
  for (const zz of [-.05, DW + .05]) box(D, .2, DH, .1, fc, -WT / 2, 0, zz, { rough: .5, coat: .3 }, .03);
  const outside = mesh(new THREE.PlaneGeometry(DW, DH), new THREE.MeshBasicMaterial({ color: 0xfff1d0, toneMapped: false }), -WT - .01, DH / 2, DW / 2, D); outside.rotation.y = Math.PI / 2;
  const leaf = new THREE.Group(); leaf.position.set(.02, 0, 0); leaf.rotation.y = 0; D.add(leaf);
  const leafCol = dStyle === 'glass' ? '#f3f7f8' : dStyle === 'arch' ? '#b9814e' : '#c98f5c';
  box(leaf, .05, DH - .04, DW - .04, leafCol, 0, 0, (DW - .04) / 2, { rough: .45, coat: .5 }, .02);
  if (dStyle === 'glass') {
    for (const yy of [.28, .78, 1.12]) box(leaf, .06, .36, .58, '#d9eef4', 0, yy, (DW - .04) / 2, { rough: .05, coat: 1, opacity: .62 }, .02);
  } else if (dStyle === 'arch') {
    box(leaf, .06, .5, .55, '#d9eef4', 0, .55, (DW - .04) / 2, { rough: .05, coat: 1, opacity: .7 }, .02);
    const fan = cyl(leaf, .4, .4, .06, '#d9eef4', 0, DH - .42, (DW - .04) / 2, { rough: .05, coat: 1, opacity: .7 }, 16);
    fan.rotation.z = Math.PI / 2; fan.scale.set(1, 1, .55);
    for (let i = 0; i < 4; i++) { const sp = box(leaf, .07, .36, .03, '#caa23e', 0, DH - .42, (DW - .04) / 2, { rough: .3, metal: .6 }, .01); sp.rotation.x = i * .5 - .75; }
  } else {
    box(leaf, .06, .45, .5, '#d9eef4', 0, .85, (DW - .04) / 2, { rough: .05, coat: 1, opacity: .7 }, .02);
  }
  sphere(leaf, .03, '#f7c948', .04, .72, DW - .14, { metal: .8, rough: .2 });
  box(D, .7, .015, DW - .1, '#c0533a', .4, 0, DW / 2, { rough: .95 }, .01);
  box(D, .6, .017, DW - .2, '#e0785e', .4, 0, DW / 2, { rough: .95 }, .01);
  // open / closed sign over the door
  const signTex = s => labelTexture((x, w, h) => { x.fillStyle = '#fffaf2'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a5a3e'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); x.fillStyle = s ? '#5f9e4f' : '#c0533a'; x.font = '700 54px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s ? 'ABERTO' : 'FECHADO', w / 2, h / 2 + 3); });
  const tOpen = signTex(true), tClosed = signTex(false);
  const signMat = new THREE.MeshStandardMaterial({ map: tOpen, roughness: .5, emissive: '#ffffff', emissiveMap: tOpen, emissiveIntensity: .25 });
  registerNightGlow(signMat, .6);
  const sign = mesh(new THREE.PlaneGeometry(.5, .2), signMat, WT / 2 + .03, DH + .25, dy + .05 + DW / 2, g);
  sign.rotation.y = Math.PI / 2;
  g.userData.sign = { mesh: sign, tOpen, tClosed, open: true };
  g.userData.doorLeaf = leaf;
  // warm wall sconces (architectural lighting; their light comes from the shared light pool)
  const anchors = [];
  const sconce = (x, z, ry) => {
    const S = new THREE.Group(); S.position.set(x, 1.5, z); S.rotation.y = ry; g.add(S);
    box(S, .1, .14, .03, '#c9a24a', 0, -.07, 0, { rough: .3, metal: .7 }, .01);
    const arm = cyl(S, .012, .012, .14, '#c9a24a', 0, 0, .07, { rough: .3, metal: .7 }, 6); arm.rotation.x = Math.PI / 2; arm.position.y = 0;
    const shadeMat = new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffcf8a', emissiveIntensity: 1, roughness: .6, side: THREE.DoubleSide });
    registerNightGlow(shadeMat, 1.8);
    const sh = mesh(cachedGeo('sconceShade', () => new THREE.CylinderGeometry(.06, .1, .13, 16, 1, true)), shadeMat, 0, .03, .15, S);
    const p = new THREE.Vector3(0, .05, .3).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(S.position); anchors.push(p);
  };
  // sconces are wall items now (ITEMS.sconce), movable like windows
  g.userData.lightAnchors = anchors;
  // windows are placeable items now (see models.js): the shell only carries the doorway
  // warm glow by windows (fake light shafts)
  const shaft = new THREE.MeshBasicMaterial({ color: 0xfff1cf, transparent: true, opacity: .07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  for (const u of (n >= 7 ? [1.0, n - 2.6] : [1.0])) { const s = mesh(cachedGeo('shaft', () => { const ge = new THREE.PlaneGeometry(1.3, 2.4); ge.translate(0, -1.2, 0); return ge; }), shaft, u + .65, 1.75, .25, g); s.rotation.x = .75; s.castShadow = s.receiveShadow = false; }
  g.traverse(o => { if (o.isMesh && o.material && o.material.toneMapped === false) o.castShadow = false; });
  return g;
}
function shadeHex(hex, a) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, a / 255); return '#' + c.getHexString(); }
