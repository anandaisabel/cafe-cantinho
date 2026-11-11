// CC0 model pack (KayKit Restaurant & Furniture Bits by Kay Lousberg, kaylousberg.com),
// embedded as base64 so the game stays a single self-contained page.
import { THREE } from './engine.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KAYKIT_GLB } from './kaykit-data.js';
import { SHARED } from './kit.js';
import { CHARS_GLB } from './chars-data.js';
import { HEROES_GLB } from './heroes-data.js';
import { EXTRA_GLB } from './extra-data.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

// CC0 "Mini Characters" by Kenney (kenney.nl): 12 rigged little people sharing one skeleton layout and one texture
const chars = [];
export const CHAR_CLIPS = {};          // name -> AnimationClip (shared by every character)
export const CHAR_POSE = {};           // clip name -> { bone name -> first-key quaternion } for partial pose overrides
const plain = n => n.replace(/_\d+$/, '');
async function loadChars() {
  const bin = Uint8Array.from(atob(CHARS_GLB), c => c.charCodeAt(0)).buffer;
  const gltf = await new Promise((res, rej) => new GLTFLoader().parse(bin, '', res, rej));
  for (const c of [...gltf.scene.children]) {
    c.traverse(o => {
      o.name = plain(o.name);      // the loader makes node names unique; every character must expose the same bone names
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; SHARED.add(o.geometry); SHARED.add(o.material); const m = o.material; m.roughness = .7; m.metalness = 0; m.envMapIntensity = .8; }
    });
    chars.push(c);
  }
  for (const clip of gltf.animations) {
    for (const tr of clip.tracks) { const i = tr.name.lastIndexOf('.'); tr.name = plain(tr.name.slice(0, i)) + tr.name.slice(i); }
    CHAR_CLIPS[clip.name] = clip;
    const pose = CHAR_POSE[clip.name] = {};
    for (const tr of clip.tracks) if (tr.name.endsWith('.quaternion')) pose[tr.name.slice(0, -11)] = new THREE.Quaternion().fromArray(tr.values, 0);
  }
}
// CC0 KayKit Adventurers (Kay Lousberg): the VIP guests. One rig, one shared set of clips.
const heroes = [];
export const HERO_CLIPS = {};
async function loadHeroes() {
  const bin = Uint8Array.from(atob(HEROES_GLB), c => c.charCodeAt(0)).buffer;
  const gltf = await new Promise((res, rej) => new GLTFLoader().parse(bin, '', res, rej));
  for (const c of [...gltf.scene.children]) {
    c.traverse(o => {
      o.name = plain(o.name);
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; SHARED.add(o.geometry); SHARED.add(o.material); const m = o.material; m.roughness = .65; m.metalness = 0; m.envMapIntensity = .8; }
    });
    heroes.push(c);
  }
  for (const clip of gltf.animations) {
    for (const tr of clip.tracks) { const i = tr.name.lastIndexOf('.'); tr.name = plain(tr.name.slice(0, i)) + tr.name.slice(i); }
    HERO_CLIPS[clip.name] = clip;
  }
}
export const HERO_COUNT = 5;
export function heroModel(i) { return cloneSkinned(heroes[((i % heroes.length) + heroes.length) % heroes.length]); }
export const CHAR_COUNT = 12;
export function charModel(i) { return cloneSkinned(chars[((i % chars.length) + chars.length) % chars.length]); }

const models = {};
export const KAY = 0.5; // KayKit units -> tiles

export async function loadAssets() {
  const bin = Uint8Array.from(atob(KAYKIT_GLB), c => c.charCodeAt(0)).buffer;
  const gltf = await new Promise((res, rej) => new GLTFLoader().parse(bin, '', res, rej));
  const seen = new Set();
  gltf.scene.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = true; SHARED.add(o.geometry); SHARED.add(o.material);
      const m = o.material;
      if (m && !seen.has(m)) { seen.add(m); m.roughness = 0.62; m.metalness = 0; m.envMapIntensity = 0.9; if (m.map) m.map.anisotropy = 4; }
    }
  });
  for (const c of gltf.scene.children) models[c.name] = c;
  // extra pack: Forest trees/bushes/rocks (n_*) and more Restaurant Bits (r_*)
  const bx = Uint8Array.from(atob(EXTRA_GLB), c => c.charCodeAt(0)).buffer;
  const gx = await new Promise((res, rej) => new GLTFLoader().parse(bx, '', res, rej));
  gx.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; SHARED.add(o.geometry); SHARED.add(o.material); const m = o.material; if (m && !seen.has(m)) { seen.add(m); m.roughness = .7; m.metalness = 0; m.envMapIntensity = .9; } } });
  for (const c of [...gx.scene.children]) models[c.name] = c;
  await loadChars();
  await loadHeroes();
}
export const hasModel = n => !!models[n];
// returns a fresh instance (geometry & materials shared)
export function model(name, scale = KAY) {
  const src = models[name];
  const g = new THREE.Group();
  if (!src) return g;
  const c = src.clone(true); c.position.set(0, 0, 0);
  if (typeof scale === 'number') c.scale.setScalar(scale); else c.scale.set(scale[0], scale[1], scale[2]);
  g.add(c);
  return g;
}
