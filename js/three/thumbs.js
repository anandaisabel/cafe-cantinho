// Menu thumbnails rendered from the real 3D models.
// Non-blocking: a placeholder canvas is returned at once and filled in a later frame, a few per frame,
// so opening a menu or levelling up never freezes the game. Each model is rendered once, cached as a
// small 2D canvas, then the temporary 3D objects are disposed. Uses the game's own renderer (no second
// WebGL context) and never toggles renderer state that would force shader recompiles.
import { THREE, E } from './engine.js';
import { buildItem } from './models.js';
import { food3d } from './food3d.js';
import { buildChar, poseChar } from './chars3d.js';
import { disposeTree } from './kit.js';

const SZ = 128;
let scene = null, cam = null;
const done = new Map();      // key -> source canvas
const waiting = new Map();   // key -> { build, zoom, lift, targets: [] }
const queue = [];
// same light setup as the game scene (types, counts, shadow flag), so the shaders compiled for the game are
// reused here instead of compiling new ones (shader compilation is what causes long frames on phones)
function init() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#fff8ef');
  scene.add(new THREE.HemisphereLight(0xfff0dc, 0xb88d6c, 1.2));
  const d = new THREE.DirectionalLight(0xffe6c4, 2.2); d.position.set(-2, 5, 3); d.castShadow = true; d.shadow.mapSize.set(256, 256); scene.add(d, d.target);
  const f = new THREE.DirectionalLight(0xffd9e6, .3); f.position.set(3, 2, -2); scene.add(f);
  for (let i = 0; i < E.pool.length; i++) { const L = new THREE.PointLight(0xffc98a, 0, 3.4, 1.6); L.position.set(0, -20, 0); scene.add(L); }
  cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 50);
}
function render(obj, zoom, lift) {
  if (!scene) init();
  const R = E.renderer; scene.environment = E.scene.environment; scene.environmentIntensity = .45;
  scene.add(obj);
  const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.z) * .78 + size.y * .45;
  cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r; cam.zoom = zoom; cam.updateProjectionMatrix();
  ctr.y += lift * size.y;
  cam.position.copy(ctr).add(new THREE.Vector3(1, .9, 1).normalize().multiplyScalar(10)); cam.lookAt(ctr);
  const pr = R.getPixelRatio(), vp = new THREE.Vector4(); R.getViewport(vp);
  R.setRenderTarget(null); R.setScissorTest(true);
  R.setViewport(0, 0, SZ / pr, SZ / pr); R.setScissor(0, 0, SZ / pr, SZ / pr);
  R.render(scene, cam);
  const src = document.createElement('canvas'); src.width = src.height = SZ;
  const c = R.domElement; src.getContext('2d').drawImage(c, 0, c.height - SZ, SZ, SZ, 0, 0, SZ, SZ);
  R.setScissorTest(false); R.setViewport(vp);
  scene.remove(obj);
  return src;
}
// Thumbnails are cached by key. Character portraits are keyed on a random look, so the cache would
// grow for as long as the player keeps asking for new candidates: keep only the most recent ones.
const DONE_CAP = 180;
function capDone() {
  if (done.size <= DONE_CAP) return;
  let drop = done.size - Math.floor(DONE_CAP * .8);
  for (const k of done.keys()) { done.delete(k); if (--drop <= 0) break; }
}
function make(key, build, size, zoom = 1, lift = 0) {
  const c = document.createElement('canvas'); c.width = c.height = SZ; c.className = 'th3d';
  c.style.width = c.style.height = size + 'px';
  const src = done.get(key);
  if (src) c.getContext('2d').drawImage(src, 0, 0);
  else {
    c.classList.add('loading');
    let w = waiting.get(key);
    if (!w) { w = { build, zoom, lift, targets: [] }; waiting.set(key, w); queue.push(key); }
    w.targets.push(c);
  }
  return c;
}
// call once per frame BEFORE the main render (the corner of the canvas is overwritten right after)
export function pumpThumbs(budget = 7) {
  if (!queue.length) return;
  const t0 = performance.now();
  while (queue.length && performance.now() - t0 < budget) {
    const key = queue.shift(), w = waiting.get(key); waiting.delete(key);
    const obj = w.build();
    const src = render(obj, w.zoom, w.lift);
    disposeTree(obj);
    done.set(key, src);
    for (const c of w.targets) { c.getContext('2d').drawImage(src, 0, 0); c.classList.remove('loading'); }
    w.targets.length = 0;                      // the canvases belong to panels that may already be gone
    capDone();
  }
}
export function thumbItem(type, size = 72, rot = 0) { return make('i' + type + rot, () => buildItem({ id: 't', type, x: 0, y: 0, rot }, { thumb: true }).group, size, 1.05); }
export function thumbFood(id, size = 52) { return make('f' + id, () => food3d(id), size, 1.7, .05); }
export function thumbChar(look, role, size = 56) {
  return make('c' + JSON.stringify(look) + role, () => {
    const C = buildChar(look, role); C.root.rotation.y = .78; poseChar(C);
    const blob = C.root.children.find(o => o.isMesh); if (blob) C.root.remove(blob);
    return C.root;
  }, size, 1.8, .27);
}
