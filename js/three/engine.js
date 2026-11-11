// Three.js renderer, isometric orthographic camera, lighting and post-processing
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { N8AOPass } from 'n8ao';

export { THREE };
const VIEW_DIR = new THREE.Vector3(1, 1.08, 1).normalize();

export const E = {
  renderer: null, scene: null, camera: null, composer: null, aoPass: null, bloom: null,
  target: new THREE.Vector3(4, 0, 4), view: 10, w: 1, h: 1, dpr: 1,
  quality: 'high', sun: null, mobile: false,
};

// sky behind everything; repainted by the day/night system
function bgTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; E.bgCanvas = c; return t;
}
export function paintSky(top, mid, bottom, stars) {
  const c = E.bgCanvas, x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, bottom);
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  if (stars > 0.02) { x.fillStyle = `rgba(255,250,230,${stars})`; for (let i = 0; i < 40; i++) { const sx = (i * 37) % 64, sy = (i * 53) % 140; x.fillRect(sx, sy, i % 5 ? 1 : 2, 1); } }
  E.scene.background.needsUpdate = true;
}
export const POOL_SIZE = 6;

export function initEngine(canvas) {
  E.mobile = Math.min(innerWidth, innerHeight) < 700 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  let q = null; try { q = localStorage.getItem('cc_quality'); } catch (e) { }
  E.quality = q || (E.mobile ? 'medium' : 'high');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0;   // Neutral keeps hues saturated (ACES washed them out)
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  E.renderer = r;

  const s = new THREE.Scene(); E.scene = s;
  s.background = bgTexture();
  const pm = new THREE.PMREMGenerator(r);
  s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  s.environmentIntensity = 0.3;

  // warm ambient + key light from the windows
  E.hemi = new THREE.HemisphereLight(0xfff4e6, 0xa8806a, 0.85); s.add(E.hemi);
  const sun = new THREE.DirectionalLight(0xffdcb0, 2.6);
  sun.castShadow = true; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  s.add(sun, sun.target); E.sun = sun;
  const fill = new THREE.DirectionalLight(0xffd9e6, 0.45); fill.position.set(12, 6, 2); s.add(fill); E.fill = fill;
  // fixed pool of point lights: lamps reuse these, so buying a lamp never changes the light count
  // (a changing light count forces every material to recompile its shader, which freezes the game)
  E.pool = [];
  for (let i = 0; i < POOL_SIZE; i++) { const L = new THREE.PointLight(0xffc98a, 0, 3.4, 1.6); L.position.set(0, -20, 0); s.add(L); E.pool.push(L); }

  E.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  applyQuality();
  resize();
  return E;
}

export function applyQuality() {
  const q = E.quality, r = E.renderer;
  E.dpr = Math.min(window.devicePixelRatio || 1, q === 'high' ? 2 : q === 'medium' ? 1.6 : 1.25);
  r.setPixelRatio(E.dpr);
  const sm = q === 'low' ? 1024 : 2048;
  E.sun.shadow.mapSize.set(sm, sm); if (E.sun.shadow.map) { E.sun.shadow.map.dispose(); E.sun.shadow.map = null; }
  // post-processing chain
  if (E.composer) E.composer.dispose();
  const c = new EffectComposer(r);
  if (q !== 'low') {
    const ao = new N8AOPass(E.scene, E.camera, E.w, E.h);
    ao.configuration.aoRadius = 0.55; ao.configuration.distanceFalloff = 0.6; ao.configuration.intensity = 2.4;
    ao.configuration.color = new THREE.Color(0x5a3626); ao.configuration.halfRes = q !== 'high'; ao.configuration.gammaCorrection = false;
    ao.setQualityMode(q === 'high' ? 'Medium' : 'Performance');
    c.addPass(ao); E.aoPass = ao;
  } else { c.addPass(new RenderPass(E.scene, E.camera)); E.aoPass = null; }
  E.bloom = new UnrealBloomPass(new THREE.Vector2(E.w / 2, E.h / 2), 0.32, 0.55, 0.88);
  c.addPass(E.bloom);
  c.addPass(new OutputPass());
  c.addPass(new ShaderPass(VIBRANT));
  E.composer = c;
  resize();
}
// final grade: a little more saturation and contrast, for a toy-box, candy-coloured look
const VIBRANT = {
  uniforms: { tDiffuse: { value: null }, sat: { value: 1.12 }, con: { value: 1.03 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float sat, con; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(.2126, .7152, .0722)); vec3 g = mix(vec3(l), c.rgb, sat); g = (g - .5) * con + .5; gl_FragColor = vec4(clamp(g, 0., 1.), c.a); }',
};
export function setQuality(q) { E.quality = q; try { localStorage.setItem('cc_quality', q); } catch (e) { } applyQuality(); }

export function resize() {
  E.w = innerWidth; E.h = innerHeight;
  if (!E.renderer) return;
  E.renderer.setSize(E.w, E.h, false);
  E.renderer.domElement.style.width = E.w + 'px'; E.renderer.domElement.style.height = E.h + 'px';
  if (E.composer) { E.composer.setPixelRatio(E.dpr); E.composer.setSize(E.w, E.h); }
  updateCamera();
}
export function updateCamera() {
  const cam = E.camera, a = E.w / E.h, v = E.view;
  cam.left = -v * a / 2; cam.right = v * a / 2; cam.top = v / 2; cam.bottom = -v / 2;
  cam.position.copy(E.target).addScaledVector(VIEW_DIR, 40);
  cam.lookAt(E.target); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
}
// fit the café in view, leaving room for HUD
// farthest zoom-out: the café fills ~43% of the screen width (value chosen from the reference screenshot)
// farthest zoom-out = the fitted view: the café stays the protagonist, the city is only a backdrop
// a little room past the fitted view, so the market and the street can be brought into frame
export const maxView = () => (E.fitView || 12) * 1.3;
export function fitRoom(size, top = 90, bottom = 100) {
  E.roomSize = size;
  const a = E.w / E.h, usable = (E.h - top - bottom) / E.h;
  const needW = size * 1.414 + .2, needH = size * .86 + 1.4;
  E.view = Math.max(needH / usable, needW / a);
  if (E.w < 640) E.view = needW / a * .9; // phones: closer, pan to explore
  E.fitView = E.view;
  E.target.set(size / 2, 0.55, size / 2);
  E.fitTarget = null; updateCamera(); panScreen(0, (top - bottom) / 2); E.fitTarget = E.target.clone(); setSun(size);
}
export function setSun(size) {
  const s = E.sun; s.position.set(size * 0.25 - 2, 9, -3); s.target.position.set(size / 2, 0, size / 2);
  const sc = s.shadow.camera, half = size * 0.95 + 2;
  sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 1; sc.far = 40; sc.updateProjectionMatrix();
}
// pan by screen pixels
export function panScreen(dx, dy) {
  const k = E.view / E.h;
  const right = new THREE.Vector3(1, 0, -1).normalize();
  const fwd = new THREE.Vector3(-1, 0, -1).normalize().multiplyScalar(1 / Math.sin(Math.atan2(1.08, Math.SQRT2)));
  E.target.addScaledVector(right, -dx * k).addScaledVector(fwd, dy * k);
  clampTarget(); updateCamera();
}
export function zoomAt(px, py, f) {
  const before = groundAt(px, py);
  E.view = Math.max(3, Math.min(maxView(), E.view / f)); updateCamera();
  const after = groundAt(px, py);
  if (before && after) { E.target.add(before.sub(after)); clampTarget(); updateCamera(); }
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function rayFrom(px, py) { ndc.set(px / E.w * 2 - 1, -(py / E.h) * 2 + 1); ray.setFromCamera(ndc, E.camera); return ray; }
export function groundAt(px, py, y = 0) { ground.constant = -y; const p = new THREE.Vector3(); return rayFrom(px, py).ray.intersectPlane(ground, p) ? p : null; }
const tmp = new THREE.Vector3();
export function project(x, y, z) { tmp.set(x, y, z).project(E.camera); return [(tmp.x + 1) / 2 * E.w, (1 - tmp.y) / 2 * E.h]; }
export function render() { E.composer.render(); }

// pan stays around the café: almost locked at the fitted view, freer when zoomed in
function clampTarget() {
  const c = E.fitTarget, fv = E.fitView || 12; if (!c) return;
  const n = E.roomSize || 8, m = 2.2 + Math.max(0, (fv - E.view) / fv) * n * .65 + Math.max(0, E.view - fv) * .4;
  E.target.x = Math.max(c.x - m, Math.min(c.x + m, E.target.x)); E.target.z = Math.max(c.z - m, Math.min(c.z + m, E.target.z));
}
