// Shared materials & geometry helpers for procedural models
import { THREE } from './engine.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mats = new Map(), geos = new Map();
// shared resources are never disposed; everything else is freed when its object leaves the scene
export const SHARED = new WeakSet();

// Procedural models ask for geometries and materials by their exact numbers, so a builder that varies
// a size at all would otherwise add a new cached entry on every single build and never give it back.
// Keys are rounded to the millimetre, and the caches are capped: an evicted entry simply stops being
// shared, so it is freed normally the next time the object holding it leaves the scene.
const Q = v => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);
const GEO_CAP = 700, MAT_CAP = 500;
function capCache(map, cap) {
  if (map.size <= cap) return;
  const drop = map.size - Math.floor(cap * .8);
  let i = 0;
  for (const [k, v] of map) { SHARED.delete(v); map.delete(k); if (++i >= drop) break; }
}
export const cacheSizes = () => ({ geos: geos.size, mats: mats.size });
// o: rough, metal, coat (clearcoat), emissive, ei (emissive intensity), opacity, side
export function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  let m = mats.get(k); if (m) return m;
  const P = { color: new THREE.Color(color), roughness: o.rough ?? 0.55, metalness: o.metal ?? 0 };
  if (o.coat) { m = new THREE.MeshPhysicalMaterial({ ...P, clearcoat: o.coat, clearcoatRoughness: o.coatRough ?? 0.25, sheen: o.sheen || 0 }); }
  else m = new THREE.MeshStandardMaterial(P);
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  if (o.opacity != null) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = o.depthWrite ?? false; }
  if (o.side) m.side = o.side;
  if (o.map) m.map = o.map;
  SHARED.add(m); mats.set(k, m); capCache(mats, MAT_CAP); return m;
}
export function rbox(w, h, d, r = 0.03, seg = 3) {
  w = Q(w); h = Q(h); d = Q(d); r = Q(r);
  const k = `rb${w},${h},${d},${r}`; let g = geos.get(k);
  if (!g) { g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)); SHARED.add(g); geos.set(k, g); capCache(geos, GEO_CAP); }
  return g;
}
export function cachedGeo(key, make) {
  let g = geos.get(key);
  if (!g) { g = make(); SHARED.add(g); geos.set(key, g); capCache(geos, GEO_CAP); }
  return g;
}
export function mesh(geo, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m); return m;
}
// box sitting on y (bottom at y)
export function box(parent, w, h, d, color, x = 0, y = 0, z = 0, o = {}, r) {
  return mesh(rbox(w, h, d, r ?? Math.min(w, h, d) * 0.22), mat(color, o), x, y + h / 2, z, parent);
}
export function sphere(parent, r, color, x = 0, y = 0, z = 0, o = {}, seg = 20) {
  const m = mesh(cachedGeo('s' + seg, () => new THREE.SphereGeometry(1, seg, Math.round(seg * .7))), mat(color, o), x, y, z, parent);
  m.scale.setScalar(r); return m;
}
export function cyl(parent, rTop, rBot, h, color, x = 0, y = 0, z = 0, o = {}, seg = 24) {
  const a = Q(rTop), b = Q(rBot), c = Q(h);
  return mesh(cachedGeo(`c${a},${b},${c},${seg}`, () => new THREE.CylinderGeometry(a, b, c, seg)), mat(color, o), x, y + h / 2, z, parent);
}
// lathe from [radius, height] pairs
export function lathe(parent, pts, color, o = {}, seg = 28, key) {
  const P = pts.map(([r, y]) => [Q(r), Q(y)]);
  const g = cachedGeo('l' + (key || JSON.stringify(P)) + seg, () => new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), seg));
  return mesh(g, mat(color, o), 0, 0, 0, parent);
}
export function capsule(parent, r, len, color, o = {}) {
  r = Q(r); len = Q(len);
  return mesh(cachedGeo(`cap${r},${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 14)), mat(color, o), 0, 0, 0, parent);
}
export function torus(parent, r, tube, color, o = {}, arc = Math.PI * 2) {
  r = Q(r); tube = Q(tube);
  return mesh(cachedGeo(`t${r},${tube},${Q(arc)}`, () => new THREE.TorusGeometry(r, tube, 10, 28, arc)), mat(color, o), 0, 0, 0, parent);
}
// leaf: flattened, pointed ellipsoid
export function leafGeo() {
  return cachedGeo('leaf', () => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(.5, .15, .45, .75, 0, 1); s.bezierCurveTo(-.45, .75, -.5, .15, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: .02, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0, -.01); return g;
  });
}
export function shadowBlob(parent, r, tex, a = .35) {
  const m = new THREE.Mesh(cachedGeo('blob', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: a }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.scale.set(r * 2, r * 2, 1); m.renderOrder = 1; parent.add(m); return m;
}

// merge many (geometry, matrix, color) parts into one vertex-coloured geometry (one draw call)
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export function mergeParts(parts) {
  const list = parts.map(({ geo, m, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    const c = new THREE.Color(color), n = g.attributes.position.count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3)); return g;
  });
  const merged = mergeGeometries(list);
  for (const g of list) g.dispose();          // the per-part clones were only scratch space
  return merged;
}
export const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));

// free GPU memory of an object tree (skips shared geometries, materials and textures)
const TEX_KEYS = ['map', 'emissiveMap', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'lightMap', 'bumpMap', 'envMap', 'displacementMap', 'clearcoatMap', 'sheenColorMap'];
export function disposeTree(root) {
  if (!root) return;
  root.traverse(o => {
    if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose();   // per-instance bone texture
    if (o.geometry && !SHARED.has(o.geometry)) o.geometry.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) {
      if (!m || SHARED.has(m)) continue;
      // SHARED is the single source of truth: anything not in it belongs to this object alone
      for (const key of TEX_KEYS) { const t = m[key]; if (t && !SHARED.has(t)) { t.dispose(); m[key] = null; } }
      m.dispose();
    }
  });
  if (root.parent) root.parent.remove(root);
}
