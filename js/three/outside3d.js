// THE WORLD AROUND THE CAFÉ — decorative and alive: a city block with a road loop, moving cars,
// a park with a pond, gardens, buildings and pedestrians. Driven only by world time (never by the café state).
import { THREE } from './engine.js';
import { model, hasModel } from './assets.js';
import { mat, mesh, box, cyl, sphere, lathe, cachedGeo, leafGeo, mergeParts, M4, disposeTree } from './kit.js';
import { labelTexture, radialTexture } from './textures.js';
import { buildChar, animateChar } from './chars3d.js';
import { registerNightGlow, NIGHT } from './daynight.js';
import { randLook } from '../sim.js';
import { doorY } from '../path.js';

export const CITY = 2.1;                  // KayKit city units -> tiles
const T = CITY * 2;                       // one road tile in world tiles
export const sidewalkZ = n => n + 1.25;
export const pathX = -1.0;
export let MARKET = null;      // { x, z } of the market stall, so the UI can place its tap target
const GY = -.02;                          // ground level (café floor is 0)

// layout of the block, derived from café size
export function layout(n) {
  const W = 6, H = 4;                     // road loop size in road tiles
  const XL = n / 2 - (W / 2) * T, ZB = n + 4.05, ZT = ZB - H * T, XR = XL + W * T;
  return { W, H, XL, XR, ZT, ZB };
}

// ---------- textures ----------
function paving(rep) {
  const t = labelTexture((x, W, H) => {
    x.fillStyle = '#e6dccf'; x.fillRect(0, 0, W, H);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.fillStyle = (i + j) % 3 ? '#ece3d7' : '#dfd3c4'; x.fillRect(i * W / 4 + 2, j * H / 4 + 2, W / 4 - 4, H / 4 - 4); }
  }, 128, 128);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
}
function promenade(rep) {
  const t = labelTexture((x, W, H) => {
    x.fillStyle = '#efe3cf'; x.fillRect(0, 0, W, H);
    // rounded cobbles in warm cream and blush tones
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const ox = (j % 2) * W / 8; x.fillStyle = ['#f6ecdc', '#ead9c2', '#f3dfd2', '#efe6d6'][(i * 3 + j) % 4];
      x.beginPath(); const rx = (i * W / 4 + ox) % W + 3, ry = j * H / 4 + 3; if (x.roundRect) x.roundRect(rx, ry, W / 4 - 6, H / 4 - 6, 10); else x.rect(rx, ry, W / 4 - 6, H / 4 - 6); x.fill();
    }
  }, 128, 128);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
}
function grassTex() {
  const t = labelTexture((x, W, H) => {
    x.fillStyle = '#9ccc7a'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) { const a = Math.random(); x.fillStyle = a < .5 ? 'rgba(120,180,90,.5)' : a < .85 ? 'rgba(170,215,130,.5)' : 'rgba(255,255,255,.22)'; x.fillRect(Math.random() * W, Math.random() * H, 2, 3); }
  }, 256, 256);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(26, 26); return t;
}
function flat(g, w, d, x, z, tex, y = GY + .012, color) {
  const m = mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, color: color || 0xffffff, roughness: .88 }), x, y, z, g);
  m.rotation.x = -Math.PI / 2; m.castShadow = false; return m;
}

// ---------- vegetation, merged into a few draw calls, with a gentle wind ----------
let windShader = null;
function windMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75, flatShading: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = { value: 0 }; windShader = sh;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nfloat sway = max(0.0, position.y - 0.6) * 0.035;\ntransformed.x += sin(uTime * 1.3 + position.x * .7 + position.z * .4) * sway;\ntransformed.z += cos(uTime * 1.1 + position.z * .6) * sway;');
  };
  return m;
}
export function tickWind(t) { if (windShader) windShader.uniforms.uTime.value = t / 1000; }
class Veg {
  constructor() { this.trunks = []; this.leaves = []; this.flowers = []; this.models = []; this.rnd = 7; }
  r() { return (this.rnd = (this.rnd * 9301 + 49297) % 233280) / 233280; }
  // KayKit Forest pieces when the pack is loaded: brighter, chunkier, more varied than the procedural ones
  kk(name, x, z, s) { const m = model(name, s); m.position.set(x, GY, z); m.rotation.y = this.r() * 6.28; this.models.push(m); return m; }
  tuft(x, z) {
    const a = this.r() * 6.28, d = .5 + this.r() * .4;
    if (this.r() < .6) this.kk(['n_Bush_1_C', 'n_Bush_4_A', 'n_Bush_3_A'][Math.floor(this.r() * 3)], x + Math.cos(a) * d, z + Math.sin(a) * d, .45 + this.r() * .2);
    if (this.r() < .7) this.kk(['n_Grass_1_C', 'n_Grass_1_A', 'n_Grass_2_A'][Math.floor(this.r() * 3)], x - Math.cos(a) * d * .8, z - Math.sin(a) * d * .8, .5);
    if (this.r() < .25) this.kk(['n_Rock_1_A', 'n_Rock_3_A'][Math.floor(this.r() * 2)], x + Math.sin(a) * d, z - Math.cos(a) * d, .3);
  }
  tree(x, z, s = 1) {
    if (hasModel('n_Tree_1_A')) { this.kk(['n_Tree_1_A', 'n_Tree_1_B', 'n_Tree_3_A', 'n_Tree_3_B', 'n_Tree_2_A'][Math.floor(this.r() * 5)], x, z, .44 * s); this.tuft(x, z); return; }
    this.trunks.push({ geo: cachedGeo('trunk', () => new THREE.CylinderGeometry(.07, .1, .9, 8)), m: M4(x, GY + .45 * s, z, 0, 0, 0, s), color: '#8a5a3e' });
    const ball = cachedGeo('treeBall', () => new THREE.IcosahedronGeometry(1, 2));
    for (let i = 0; i < 7; i++) { const a = this.r() * 6.28, d = (.15 + this.r() * .2) * s, sz = (.32 + this.r() * .18) * s; this.leaves.push({ geo: ball, m: M4(x + Math.cos(a) * d, GY + (1 + this.r() * .45) * s, z + Math.sin(a) * d, 0, 0, 0, sz), color: ['#6fae5a', '#7fbd66', '#5f9e4f', '#8cc872'][i % 4] }); }
    this.leaves.push({ geo: ball, m: M4(x, GY + 1.5 * s, z, 0, 0, 0, .38 * s), color: '#86c46c' });
  }
  pine(x, z, s = 1) {
    if (hasModel('n_Tree_4_A')) { this.kk(this.r() < .5 ? 'n_Tree_4_A' : 'n_Tree_4_B', x, z, .4 * s); this.tuft(x, z); return; }
    this.trunks.push({ geo: cachedGeo('trunk', () => new THREE.CylinderGeometry(.07, .1, .9, 8)), m: M4(x, GY + .3 * s, z, 0, 0, 0, s * .8), color: '#7a4a2e' });
    const cone = cachedGeo('pineCone', () => new THREE.ConeGeometry(1, 1.4, 8));
    for (let i = 0; i < 3; i++) this.leaves.push({ geo: cone, m: M4(x, GY + (.75 + i * .42) * s, z, 0, i, 0, (.5 - i * .12) * s, (.6 - i * .1) * s, (.5 - i * .12) * s), color: ['#4f8a4a', '#5a9a52', '#66a85c'][i] });
  }
  hedge(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / .45)), ball = cachedGeo('treeBall', () => new THREE.IcosahedronGeometry(1, 2));
    for (let i = 0; i <= n; i++) { const k = i / n; this.leaves.push({ geo: ball, m: M4(x0 + (x1 - x0) * k, GY + .28, z0 + (z1 - z0) * k, 0, 0, 0, .3, .32, .3), color: i % 2 ? '#5f9e4f' : '#6aa857' }); }
  }
  bed(x, z, w, d, count) {
    const petal = cachedGeo('petal', () => new THREE.SphereGeometry(1, 8, 6)), cols = ['#f2a7a0', '#f7d58b', '#c7b2e6', '#ffffff', '#e8706a'];
    this.trunks.push({ geo: cachedGeo('bedBox', () => new THREE.BoxGeometry(1, 1, 1)), m: M4(x, GY + .06, z, 0, 0, 0, w, .12, d), color: '#7a5236' });
    for (let i = 0; i < count; i++) { const px = x + (this.r() - .5) * (w - .15), pz = z + (this.r() - .5) * (d - .15); this.flowers.push({ geo: petal, m: M4(px, GY + .17, pz, 0, 0, 0, .05, .03, .05), color: '#6faa58' }); this.flowers.push({ geo: petal, m: M4(px, GY + .22, pz, 0, 0, 0, .035), color: cols[i % cols.length] }); }
  }
  build(g) {
    if (this.trunks.length) mesh(mergeParts(this.trunks), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 }), 0, 0, 0, g);
    if (this.leaves.length) mesh(mergeParts(this.leaves), windMaterial(), 0, 0, 0, g);
    if (this.flowers.length) mesh(mergeParts(this.flowers), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 }), 0, 0, 0, g);
    for (const m of this.models) g.add(m);
  }
}

// ---------- lights that turn on at night ----------
function bulb(g, x, y, z, r = .06, base = 2.4) {
  const m = new THREE.MeshStandardMaterial({ color: '#fff3d0', emissive: '#ffd890', emissiveIntensity: base });
  registerNightGlow(m, base);
  const b = mesh(cachedGeo('bulbS', () => new THREE.SphereGeometry(1, 12, 8)), m, x, y, z, g); b.scale.setScalar(r); b.castShadow = false; return b;
}
const pools = [];
function lightPool(g, x, z, r = 1.6) {
  const m = new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,210,140,.9)', 'rgba(255,210,140,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const p = mesh(cachedGeo('poolPlane', () => new THREE.PlaneGeometry(1, 1)), m, x, GY + .03, z, g); p.rotation.x = -Math.PI / 2; p.scale.set(r * 2, r * 2, 1); p.castShadow = p.receiveShadow = false; p.renderOrder = 1;
  pools.push(m); return p;
}
const windowGlows = [];
function windowGlow(g, x, y, z, ry, w = .5, h = .55) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffd38a, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const p = mesh(cachedGeo('wglow' + w + h, () => new THREE.PlaneGeometry(w, h)), m, x, y, z, g); p.rotation.y = ry; p.castShadow = p.receiveShadow = false;
  windowGlows.push({ m, phase: Math.random() }); return p;
}
export function tickNightLights() {
  for (const m of pools) m.opacity = NIGHT.k * .55;
  for (const w of windowGlows) w.m.opacity = NIGHT.k * (w.phase > .3 ? .85 : .0);
}

// ---------- build ----------
const CORNER_ROT = { nw: Math.PI, ne: Math.PI / 2, sw: -Math.PI / 2, se: 0 };
let built = null;
export function buildOutside(st) {
  if (built) disposeOutside();
  pools.length = 0; windowGlows.length = 0;
  const n = st.size, g = new THREE.Group(), dy = doorY(st), sz = sidewalkZ(n), L = layout(n), veg = new Veg();
  // ground
  const grass = flat(g, 90, 90, n / 2, n / 2 - 4, grassTex(), GY);
  // café patio + front sidewalk + path to the door
  flat(g, n + 1.6, .7, n / 2 + .3, n + .35, paving([n + 1, 1]));
  flat(g, 40, 1.3, n / 2, sz, paving([30, 1]));
  box(g, 40, .05, .1, '#cfc3b3', n / 2, GY, sz + .68, { rough: .8 }, .02);
  const pl = n + .6 - dy; flat(g, 1.0, pl, pathX, dy + pl / 2 + .2, paving([1, pl]));
  // a soft paved promenade where the road loop used to be: no asphalt, no cars, just a light stone walk
  {
    const PW = 2.4, cxL = L.XL, cxR = L.XR, czT = L.ZT, czB = L.ZB, w = cxR - cxL, d = czB - czT;
    for (const z of [czT, czB]) { flat(g, w + PW, PW, (cxL + cxR) / 2, z, promenade([(w + PW) / 1.2, PW / 1.2]), GY + .008); }
    for (const x of [cxL, cxR]) { flat(g, PW, d - PW, x, (czT + czB) / 2, promenade([PW / 1.2, (d - PW) / 1.2]), GY + .009); }
    // low hedges and flower pots along the inner edge keep it cosy
    for (const z of [czT + PW / 2 + .15, czB - PW / 2 - .15]) for (let x = cxL + 2; x < cxR - 1.5; x += 3.4) veg.bed(x, z, 1.4, .3, 8);
  }
  // buildings around the block (facing it)
  const blds = ['c_building_B', 'c_building_F', 'c_building_D'];
  const ring = [];
  for (let i = 0; i <= L.W; i += 1) { ring.push([L.XL + i * T, L.ZB + T * 1.05, Math.PI]); ring.push([L.XL + i * T, L.ZT - T * 1.05, 0]); }
  for (let j = 0; j <= L.H; j += 1) { ring.push([L.XL - T * 1.05, L.ZT + j * T, Math.PI / 2]); ring.push([L.XR + T * 1.05, L.ZT + j * T, -Math.PI / 2]); }
  ring.forEach(([x, z, ry], k) => {
    const b = model(blds[k % 3], CITY); b.position.set(x, GY, z); b.rotation.y = ry; g.add(b);
    // lit windows at night, on the side facing the block
    const fx = Math.sin(ry), fz = Math.cos(ry);
    for (let w = 0; w < 4; w++) { const off = (w % 2 ? .9 : -.9), hgt = 1.5 + Math.floor(w / 2) * 1.1; windowGlow(g, x + fx * 2.12 + fz * off, GY + hgt, z + fz * 2.12 - fx * off, ry, .55, .5); }
  });
  // street lights with warm pools of light
  const lamps = [[-2.6, sz + .55, Math.PI], [n + 2.6, sz + .55, Math.PI], [L.XL + T * .55 + .3, n / 2, Math.PI / 2], [L.XR - T * .55 - .3, n / 2 - 2, -Math.PI / 2], [n / 2, L.ZT + T * .55 + .3, 0]];
  for (const [x, z, ry] of lamps) {
    const m = model('c_streetlight', CITY); m.position.set(x, GY, z); m.rotation.y = ry; g.add(m);
    const hx = x - Math.sin(ry + Math.PI / 2) * .5 * -1, hz = z - Math.cos(ry + Math.PI / 2) * .5 * -1;
    bulb(g, hx, GY + 1.92, hz, .07); lightPool(g, hx, hz, 1.5);
  }
  // street furniture
  for (const [k, x, z, ry] of [['c_bench', n + 1.4, sz - .45, 0], ['c_firehydrant', -3.4, sz + .5, 0], ['c_trash_A', n + 3.4, sz - .4, 0], ['c_bench', -4.8, sz - .45, 0]]) { const m = model(k, CITY); m.position.set(x, GY, z); m.rotation.y = ry; g.add(m); }
  // café garden
  veg.bed(n / 2, n + .3, n - 1.4, .35, Math.round(n * 7));
  veg.bed(n + .55, n / 2, .35, n - 1.6, Math.round(n * 6));
  for (const [x, z] of [[n + .9, n + .25], [-.45, n + .3]]) { const b = model('c_bush', CITY * 1.3); b.position.set(x, GY, z); g.add(b); }
  veg.hedge(-.6, -.7, n + .4, -.7); veg.hedge(-.7, -.6, -.7, dy - .4);
  // --- the little street market beside the café ---
  MARKET = buildMarket(g, n, sz);
  // left park: pond, path, benches, trees
  const px0 = L.XL + T * .5 + 1.2, px1 = -2.2, pz0 = L.ZT + T * .5 + 1.2, pz1 = sz - 1.2, pcx = (px0 + px1) / 2, pcz = (pz0 + pz1) / 2;
  if (px1 - px0 > 2) {
    const pond = mesh(cachedGeo('pond', () => new THREE.CircleGeometry(1, 40)), new THREE.MeshPhysicalMaterial({ color: '#7fc4d8', roughness: .08, clearcoat: 1, transparent: true, opacity: .9 }), pcx, GY + .02, pcz + .5, g);
    pond.rotation.x = -Math.PI / 2; pond.scale.set(Math.min(1.8, (px1 - px0) / 2.6), Math.min(1.3, (pz1 - pz0) / 4), 1); pond.castShadow = false;
    const rim = mesh(cachedGeo('pondRim', () => new THREE.TorusGeometry(1, .08, 8, 40)), mat('#c9b9a5', { rough: .8 }), pcx, GY + .03, pcz + .5, g); rim.rotation.x = -Math.PI / 2; rim.scale.set(pond.scale.x, pond.scale.y, 1);
    for (let k = 0; k < 3; k++) { const pad = mesh(cachedGeo('lily', () => new THREE.CircleGeometry(.12, 12)), mat('#6fae5a', { rough: .5 }), pcx - .5 + k * .5, GY + .035, pcz + .4 + (k % 2) * .4, g); pad.rotation.x = -Math.PI / 2; pad.castShadow = false; }
    flat(g, .9, pz1 - pz0 + 1, px1 - .6, pcz + .3, paving([1, pz1 - pz0]));
    for (const [x, z, ry] of [[pcx, pz0 + .3, 0], [px1 - 1.3, pcz - 1, Math.PI / 2]]) { const b = model('c_bench', CITY); b.position.set(x, GY, z); b.rotation.y = ry; g.add(b); }
    for (const [x, z, s] of [[px0 + .4, pz0 + .4, 1.2], [px0 + .3, pz1 - .5, 1.1], [pcx + 1.4, pz0 + .2, 1.0], [px0 + .2, pcz, .95]]) veg.tree(x, z, s);
    veg.bed(pcx, pz1 - .4, 1.6, .4, 14);
    const lampP = model('c_streetlight', CITY * .8); lampP.position.set(px1 - 1.2, GY, pz1 - .2); g.add(lampP); bulb(g, px1 - 1.6, GY + 1.55, pz1 - .2, .06); lightPool(g, px1 - 1.6, pz1 - .2, 1.2);
  }
  // right lawn and behind the café
  for (const [x, z, s] of [[n + 1.9, -2.3, 1.2], [n + 4.2, n * .5 + 2.6, 1.1], [L.XR - T * .5 - 1.2, -2.4, 1.25], [L.XR - T * .5 - 1.4, n - .6, 1.0], [-2.4, -2.2, 1.15], [n * .35, -2.6, 1.05], [n * .75, -3.3, 1.2]]) veg.tree(x, z, s);
  for (const [x, z] of [[n + 4.6, -2.8], [L.XR - T * .5 - 1, 2.6], [-3.6, -3.4], [n * .5, -3.9]]) veg.pine(x, z, 1.1);
  veg.bed(n + 3.4, n - .2, 1.2, .5, 12);
  { const b = model('c_bench', CITY); b.position.set(n + 3.6, GY, n / 2 - .8); b.rotation.y = -Math.PI / 2; g.add(b); }
  // trees on the far side of the roads
  for (let i = 0; i < 8; i++) veg.tree(L.XL - T * .55 + (i % 2) * .4, L.ZT + i * 2.1, .9 + (i % 3) * .1);
  veg.build(g);
  g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  // static: matrices computed once
  g.updateMatrixWorld(true); g.traverse(o => { o.matrixAutoUpdate = false; });
  if (vendor) vendor.root.traverse(o => { o.matrixAutoUpdate = true; });   // the vendor walks and animates: keep their matrices live
  built = g;
  return g;
}
function disposeOutside() { disposeTree(built); built = null; vendor = null; MARKET = null; clearCars(); }

// ---------- cars on the road loop ----------
let cars = [], scene = null, paths = null;
function roundedLoop(L, off, clockwise) {
  // centre line of the loop with rounded corners, offset by `off` (positive = outward)
  const cxL = L.XL + T / 2, cxR = L.XR - T / 2, czT = L.ZT + T / 2, czB = L.ZB - T / 2, r = T / 2 + off, pts = [];
  const arc = (cx, cz, a0, a1) => { for (let k = 0; k <= 10; k++) { const a = a0 + (a1 - a0) * k / 10; pts.push(new THREE.Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r)); } };
  // clockwise seen from above (+x right, +z down): top edge +x, right edge +z, bottom -x, left -z
  arc(cxR, czT, -Math.PI / 2, 0); arc(cxR, czB, 0, Math.PI / 2); arc(cxL, czB, Math.PI / 2, Math.PI); arc(cxL, czT, Math.PI, Math.PI * 1.5);
  if (!clockwise) pts.reverse();
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  return { curve, len: curve.getLength() };
}
function clearCars() { for (const c of cars) disposeTree(c.obj); cars = []; }
export function setupCars(sc, n) {
  scene = sc; clearCars();
  const L = layout(n);
  paths = [roundedLoop(L, -.62, true), roundedLoop(L, .62, false)];   // drive on the right
  const models = ['c_car_sedan', 'c_car_taxi', 'c_car_hatchback'];
  for (let i = 0; i < 6; i++) {
    const lane = i % 2, p = paths[lane];
    const obj = model(models[i % 3], CITY); scene.add(obj);
    cars.push({ obj, lane, s: (i >> 1) / 3 * p.len + lane * 2, v: 0, vmax: 2.2 + Math.random() * 1.2, stopUntil: 0, stopAt: Math.random() * p.len, stops: Math.random() < .5 });
  }
}
const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3();
export function tickCars(t, dt) {
  if (!paths) return;
  for (const lane of [0, 1]) {
    const list = cars.filter(c => c.lane === lane).sort((a, b) => a.s - b.s), len = paths[lane].len;
    list.forEach((c, i) => {
      const next = list[(i + 1) % list.length];
      const gap = list.length > 1 ? (next.s - c.s + len) % len : 99;
      let target = c.vmax;
      if (gap < 4) target = Math.min(target, next.v * .9 + (gap - 2) * .8);
      if (t < c.stopUntil) target = 0;
      else if (c.stops && Math.abs(c.s - c.stopAt) < .15) { c.stopUntil = t + 2500 + Math.random() * 3000; c.stopAt = Math.random() * len; c.stops = Math.random() < .5; }
      target = Math.max(0, target);
      c.v += (target - c.v) * Math.min(1, dt * (target < c.v ? 3 : 1.2));
      c.s = (c.s + c.v * dt) % len;
    });
  }
  for (const c of cars) {
    const p = paths[c.lane], u = c.s / p.len;
    p.curve.getPointAt(u, tmpP); p.curve.getTangentAt(u, tmpT);
    c.obj.position.set(tmpP.x, GY + Math.sin(t / 90 + c.s) * .004 * c.v, tmpP.z);
    c.obj.rotation.y = Math.atan2(tmpT.x, tmpT.z);
  }
}

// A small produce stall on the pavement: striped awning, crates of fruit and a vendor behind the counter.
function buildMarket(g, n, sz) {
  // right lawn, beside the café's side wall: in plain view instead of under the bottom dock
  const x = n + 2.15, z = .55, m = new THREE.Group();
  m.position.set(x, GY, z); m.rotation.y = Math.PI * .25; g.add(m);   // faces the camera, so the produce on the counter shows under the awning
  const wood = { rough: .7 };
  // counter and crates
  box(m, 1.9, .1, .78, '#b9814e', 0, .72, 0, wood, .03);
  box(m, 1.82, .62, .7, '#d9a86c', 0, .4, 0, wood, .04);
  for (const sx of [-.8, .8]) box(m, .09, .74, .09, '#8a5a3e', sx, .37, .3, wood, .02);
  // awning posts and striped canopy
  for (const sx of [-.85, .85]) for (const sz2 of [-.32, .32]) cyl(m, .035, .035, 1.95, '#8a5a3e', sx, .97, sz2, wood, 8);
  for (let i = 0; i < 7; i++) {
    const c = i % 2 ? '#fff8ec' : '#f6b3b8';
    const p2 = box(m, .3, .06, 1.2, c, -.9 + i * .3, 2.02, 0, { rough: .6 }, .02);
    p2.rotation.x = 0; p2.position.y = 2.02 - Math.abs(i - 3) * .012;
  }
  box(m, 2.1, .1, .12, '#e98d96', 0, 1.96, .62, { rough: .6 }, .03);
  for (let i = 0; i < 6; i++) box(m, .24, .14, .04, i % 2 ? '#fff8ec' : '#f6b3b8', -.85 + i * .34, 1.86, .66, { rough: .6 }, .02);
  // produce on the counter
  const bowl = (bx, col, berry) => {
    cyl(m, .17, .14, .09, '#c9a06a', bx, .82, .05, wood, 16);
    for (const [ox, oz] of [[0, 0], [.06, .04], [-.06, .03], [.02, -.06]]) sphere(m, berry, col, bx + ox, .89, .05 + oz, { rough: .45 });
  };
  // the counter is piled high: little pyramids of fruit in baskets, plus loose bunches
  const pyramid = (bx, bz, col, r) => {
    r *= 1.55;
    cyl(m, .21, .17, .08, '#d9b07c', bx, .81, bz, wood, 16);
    let k = 0;
    for (const [ox, oz, oy] of [[-.07, -.06, 0], [.07, -.06, 0], [-.07, .06, 0], [.07, .06, 0], [0, 0, 0], [0, 0, 1], [-.035, -.03, 1], [.035, .03, 1], [0, 0, 2]])
      sphere(m, r, col, bx + ox * 1.25 * (oy ? .5 : 1), .85 + r + oy * r * 1.45, bz + oz * 1.25 * (oy ? .5 : 1), { rough: .45, coat: .3 }), k++;
  };
  pyramid(-.62, .2, '#f7a531', .048);   // oranges
  pyramid(-.2, .2, '#e8574f', .045);    // apples
  pyramid(.22, .2, '#f2d33a', .044);    // lemons
  pyramid(.64, .2, '#8cc152', .046);    // limes
  bowl(-.4, '#e3364f', .03); bowl(.43, '#9b7ad8', .03);    // strawberries and grapes at the back
  // a little scale
  box(m, .16, .05, .12, '#f6b3b8', .85, .8, -.2, { rough: .4, coat: .5 }, .02); cyl(m, .07, .08, .015, '#dcd6d0', .85, .84, -.2, { rough: .2, metal: .8 }, 16);
  // pastel bunting along the awning
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(cachedGeo('flag', () => { const sh = new THREE.Shape(); sh.moveTo(-.08, 0); sh.lineTo(.08, 0); sh.lineTo(0, -.15); sh.lineTo(-.08, 0); return new THREE.ShapeGeometry(sh); }), new THREE.MeshStandardMaterial({ color: ['#a8dcc6', '#ffdf8e', '#b4d8f2', '#cfc0ec', '#ffc9a3'][i % 5], roughness: .6, side: THREE.DoubleSide })); f.position.set(-.9 + i * .225, 1.8 - Math.sin(i / 8 * Math.PI) * .07, .69); m.add(f); }
  // hanging garlic and peppers from the awning
  for (const [hx, col] of [[-.7, '#fff3e0'], [-.55, '#e8574f'], [.6, '#fff3e0'], [.75, '#8cc152']]) {
    cyl(m, .004, .004, .25, '#c9a684', hx, 1.78, .35, {}, 4);
    for (let j = 0; j < 3; j++) sphere(m, .035, col, hx + (j % 2 ? .02 : -.02), 1.6 - j * .06, .35, { rough: .5 });
  }
  // (no burger-bun crates: they had nothing to do with a fruit stall)
  // no sign: the stall says what it is with its produce
  // the vendor, standing behind the stall
  const look = { body: 'adult', model: 7 };
  const V = buildChar(look, 'waiter');
  // the vendor stands out front beside the crates, facing the street, so you can see them
  V.root.position.set(1.3, 0, .6); V.root.rotation.y = -.3; m.add(V.root);
  vendor = V;
  // produce crates out front, tilted toward the street so the goods read from far away
  const CRATES = [['#f08a24', .055], ['#d8343f', .04], ['#8cc152', .05], ['#9b7ad8', .036], ['#9a6a3c', .04]];
  CRATES.forEach(([col, r], k) => {
    const row = k < 3, c = new THREE.Group(); c.scale.setScalar(1.3);
    if (row) c.position.set(-.6 + k * .6, .16, .62); else c.position.set(-.3 + (k - 3) * .6, .52, .5);   // three on the ground, two stacked behind
    c.rotation.x = row ? .38 : .5; m.add(c);
    box(c, .4, .04, .34, '#b98554', 0, -.1, 0, wood, .01);                                  // floor
    for (const sx of [-.19, .19]) box(c, .03, .2, .34, '#a8744a', sx, 0, 0, wood, .01);      // ends
    for (const sz2 of [-.16, .16]) box(c, .4, .12, .03, '#c4925e', 0, -.03, sz2, wood, .01); // slats
    const nx = Math.max(2, Math.floor(.34 / (r * 2.1))), nz = Math.max(2, Math.floor(.28 / (r * 2.1)));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const px = -.15 + (i + .5) * (.3 / nx) + ((i + j) % 2 ? .006 : -.006), pz = -.13 + (j + .5) * (.26 / nz);
      sphere(c, r, col, px, -.06 + r + ((i * 7 + j * 3) % 3) * .008, pz, { rough: .5 });
    }
  });
  // generous invisible hitbox: tapping anywhere on the stall opens it
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 1.9), new THREE.MeshBasicMaterial());
  hit.position.set(0, 1.1, .2); hit.visible = false; hit.userData = { pick: 'market', pri: 1 }; m.add(hit);
  return { x, z, hit };
}
let vendor = null;
// The vendor strolls around the stall (stall-local coordinates, +z is the street side) and pauses
// at each spot facing the street: tidying the crates, checking the side, stepping behind the counter.
const VENDOR_SPOTS = [[1.3, .6], [.55, 1.25], [-.55, 1.25], [-1.35, .55], [-1.35, -.45], [0, -.85], [1.35, -.45]];
const vw = { gx: 1.3, gy: .6, i: 0, wait: 2, moving: false };
export function tickVendor(t, dt) {
  if (!vendor) return;
  if (dt > 0) {
    if (vw.wait > 0) { vw.wait -= dt; vw.moving = false; }
    else {
      const [tx, tz] = VENDOR_SPOTS[(vw.i + 1) % VENDOR_SPOTS.length], dx = tx - vw.gx, dz = tz - vw.gy, d = Math.hypot(dx, dz), sp = .45 * dt;
      vw.moving = true;
      if (d <= sp) { vw.gx = tx; vw.gy = tz; vw.i = (vw.i + 1) % VENDOR_SPOTS.length; vw.wait = 2.5 + Math.random() * 4; }
      else { vw.gx += dx / d * sp; vw.gy += dz / d * sp; }
    }
  }
  animateChar(vendor, { gx: vw.gx, gy: vw.gy, sitting: false, moving: vw.moving, sp: .6, seed: 3, state: vw.moving ? 'walk' : 'idle', alpha: 1, look: vendor.look, role: 'cust',
    faceTo: vw.moving ? null : [vw.gx, vw.gy + 1] }, t, dt);
}
// ---------- pedestrians (decorative, no interaction) ----------
const walkers = [];
let nextWalker = 0;
export function tickPedestrians(sc, st, t, dt) {
  const n = st.size, z0 = sidewalkZ(n);
  if (t > nextWalker && walkers.length < 6) {
    nextWalker = t + 2500 + Math.random() * 4000;
    const dir = Math.random() < .5 ? 1 : -1, look = randLook();
    const c = { gx: n / 2 - dir * 16, gy: z0 + (dir > 0 ? -.25 : .25), moving: true, phase: Math.random() * 6, seed: Math.random() * 10, look, role: 'cust', state: 'walk', alpha: 1, dir, sp: .8 + Math.random() * .5 };
    c.C = buildChar(look, 'cust'); sc.add(c.C.root); walkers.push(c);
  }
  for (const c of walkers) {
    c.gx += c.dir * c.sp * dt; c.phase += dt * 10 * c.sp;
    animateChar(c.C, c, t, dt, {}); c.C.root.position.y = GY;
    if (Math.abs(c.gx - n / 2) > 17) { disposeTree(c.C.root); c.dead = true; }
  }
  for (let i = walkers.length - 1; i >= 0; i--) if (walkers[i].dead) walkers.splice(i, 1);
}
export function clearPedestrians() { for (const c of walkers) disposeTree(c.C.root); walkers.length = 0; }
