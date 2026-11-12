// Characters: the CC0 "Mini Characters" by Kenney (kenney.nl) — rigged chibi people.
// Poses come from the pack's own animation clips, blended by weight; a few bones get small overrides
// (carrying a tray, eating, reading the menu, head tilts) so the café actions read clearly.
import { THREE } from './engine.js';
import { cyl, box, sphere, shadowBlob, SHARED } from './kit.js';
import { radialTexture } from './textures.js';
import { food3d } from './food3d.js';
import { charModel, CHAR_CLIPS, CHAR_POSE, CHAR_COUNT, heroModel, HERO_CLIPS } from './assets.js';

export const CHAR_SCALE = 1.4;    // model units -> tiles: chunky people that read clearly next to furniture and food
const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
export const modelOf = L => Number.isFinite(L.model) ? L.model : hash(JSON.stringify(L)) % CHAR_COUNT;
const bodyScale = L => L.body === 'kid' ? .8 : L.body === 'elder' ? .96 : 1;
const CLIPS = ['idle', 'walk', 'sit', 'interact-right', 'emote-yes', 'emote-no'];
const Q = new THREE.Quaternion(), EU = new THREE.Euler(), OVERRIDE = ['head', 'arm-left', 'arm-right'];
const HERO_MAP = { idle: 'Idle', walk: 'Walking_A', sit: 'Sit_Chair_Idle', 'interact-right': 'Interact', 'emote-yes': 'Cheer', 'emote-no': 'Idle' };
const HERO_K = .38;   // KayKit units -> Kenney character units (tuned by eye against chairs and staff)

// Staff wear a white uniform: the body mesh (clothes, arms, legs) is washed almost white, keeping a faint hint
// of the original shading; the head (face, hair) is untouched. One shared material per source material.
const uniformMats = new Map();
function uniformMaterial(src) {
  let m = uniformMats.get(src);
  if (!m) {
    m = src.clone(); m.roughness = .75;
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.97, .96, .93), .84);'); };
    m.customProgramCacheKey = () => 'staffUniform';
    SHARED.add(m); uniformMats.set(src, m);
  }
  return m;
}
export function buildChar(look, role) {
  const L = look;
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); rig.scale.setScalar(bodyScale(L) * CHAR_SCALE);
  shadowBlob(root, .2, radialTexture('rgba(60,30,15,.5)', 'rgba(60,30,15,0)'), .55);
  // VIP guests are KayKit adventurers: their own rig and clips, mapped onto the same clip names
  const hero = Number.isFinite(L.hero);
  const model = hero ? heroModel(L.hero) : charModel(modelOf(L));
  if (hero) { const hw = new THREE.Group(); hw.scale.setScalar(HERO_K); hw.add(model); rig.add(hw); } else rig.add(model);
  const bones = {}; model.traverse(o => { if (o.isBone) bones[o.name] = o; });
  if (!hero && (role === 'waiter' || role === 'chef' || role === 'owner')) model.traverse(o => { if (o.isMesh && /body/.test(o.name)) o.material = uniformMaterial(o.material); });
  const mixer = new THREE.AnimationMixer(model), acts = {}, w = {};
  for (const n of CLIPS) { const a = acts[n] = mixer.clipAction(hero ? HERO_CLIPS[HERO_MAP[n]] : CHAR_CLIPS[n]); w[n] = n === 'idle' ? 1 : 0; a.setEffectiveWeight(w[n]); a.play(); }
  mixer.update(0);
  // extras are placed in model space (y up, z forward) and then pinned to a bone so they follow the animation
  root.updateMatrixWorld(true);
  const pin = (bone, obj) => { rig.add(obj); bones[bone].attach(obj); return obj; };
  if (role === 'chef' || role === 'owner') {
    const hat = new THREE.Group(); hat.position.y = .63;
    cyl(hat, .15, .14, .1, '#ffffff', 0, .04, 0, { rough: .75, sheen: .5 }, 18);
    for (const [a, b] of [[-.09, 0], [.09, 0], [0, .09], [0, -.09], [0, 0]]) sphere(hat, .11, '#ffffff', a, .15 + (a || b ? 0 : .03), b, { rough: .8, sheen: .5 });
    pin('head', hat);
  }
  if (role === 'owner') {   // the player: chef's hat plus a golden kerchief, so the avatar reads apart from the staff
    const ap = new THREE.Group();
    box(ap, .21, .18, .02, '#fff6e4', 0, .2, .12, { rough: .8, sheen: .5 }, .008);
    for (const sx of [-1, 1]) box(ap, .06, .035, .02, '#e8b44a', sx * .035, .325, .126, { coat: .5 }, .008);
    pin('torso', ap);
  }
  if (role === 'waiter') {   // little waist apron + bow tie
    const ap = new THREE.Group();
    box(ap, .21, .09, .02, '#fffaf3', 0, .15, .118, { rough: .8, sheen: .5 }, .008);
    for (const sx of [-1, 1]) box(ap, .035, .035, .02, '#d9534a', sx * .028, .315, .125, { coat: .4 }, .008);
    pin('torso', ap);
  }
  // carried tray
  const tray = new THREE.Group(); tray.position.set(.2, .3, .2); tray.visible = false; rig.add(tray);
  cyl(tray, .14, .14, .014, '#cfc8c0', 0, 0, 0, { rough: .3, metal: .6 }, 20);
  // menu (when reading): a big open menu held with both hands in front of the chest, pages towards the guest
  const menu = new THREE.Group(); menu.position.set(0, .09, .18); menu.rotation.x = -.5; menu.visible = false; rig.add(menu);
  for (const sx of [-1, 1]) {
    const half = new THREE.Group(); half.position.x = sx * .071; half.rotation.y = sx * .34; menu.add(half);
    box(half, .142, .19, .012, '#e98d96', 0, 0, .004, { rough: .5 }, .008);              // cover (seen from outside)
    box(half, .126, .174, .004, '#fffaf3', 0, 0, -.004, { rough: .8 }, .002);            // page
    for (let i = 0; i < 4; i++) box(half, .088, .008, .003, '#c9a684', -.006, .06 - i * .036, -.0075, {}, .001);   // lines of text
    box(half, .024, .024, .003, '#f2be55', sx * .034, .066, -.0075, {}, .001);           // little sticker
  }
  box(menu, .014, .19, .016, '#c9606c', 0, 0, .012, { rough: .5 }, .005);                // spine
  const spoon = new THREE.Group(); spoon.position.set(-.31, .2, 0); spoon.visible = false;
  cyl(spoon, .008, .008, .2, '#c99a5c', 0, -.06, 0, { rough: .5 }, 6); sphere(spoon, .024, '#c99a5c', 0, -.16, 0, { rough: .4 });
  if (bones['arm-right']) pin('arm-right', spoon); else rig.add(spoon);
  // VIPs shine: a pulsing golden halo, a glowing ring on the floor and sparkles drifting up around them
  let vipFx = null;
  if (hero) {
    const glowTex = radialTexture('rgba(255,224,130,.95)', 'rgba(255,200,80,0)');
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe08a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 }));
    halo.scale.setScalar(1.25); halo.position.y = .55; halo.renderOrder = 3; root.add(halo);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.26, .36, 40), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .02; ring.renderOrder = 2; root.add(ring);
    const sparkTex = radialTexture('rgba(255,255,240,1)', 'rgba(255,220,120,0)'), sparks = [];
    for (let i = 0; i < 8; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, color: 0xfff1b0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.userData.ph = i / 8; sp.renderOrder = 4; root.add(sp); sparks.push(sp); }
    model.traverse(o => { if (o.isMesh && o.material && !o.material.userData.vipGlow) { o.material.userData.vipGlow = 1; o.material.emissive = new THREE.Color(0xffc94a); o.material.emissiveIntensity = .25; } });
    vipFx = { halo, ring, sparks };
  }
  return { root, rig, model, mixer, acts, w, bones, tray, menu, spoon, hero, vipFx, ov: hero ? ['head'] : OVERRIDE, trayFood: null, trayKey: null, look: L, yaw: 0, hx: 0, hz: 0, k: { carry: 0, eat: 0, menu: 0 }, base: {} };
}

const lerpAng = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
// c: simulation character. o: { seatY, seatYaw, celebrate }
export function animateChar(C, c, t, dt, o = {}) {
  const sit = !!c.sitting, mv = !!c.moving, k = t / 1000;
  // facing
  if (sit && o.seatYaw != null) C.yaw = lerpAng(C.yaw, o.seatYaw, .3);
  else if (C.last) { const dx = c.gx - C.last[0], dz = c.gy - C.last[1]; if (Math.hypot(dx, dz) > .0005) C.yaw = lerpAng(C.yaw, Math.atan2(dx, dz), .25); else if (c.faceTo) C.yaw = lerpAng(C.yaw, Math.atan2(c.faceTo[0] - c.gx, c.faceTo[1] - c.gy), .15); }
  C.last = [c.gx, c.gy];
  C.root.rotation.y = C.yaw;
  // seated: keep the hip joint on the seat whatever the body size (measured: hip sits .026 above the root per unit of scale)
  // KayKit adventurers' sit clip already lifts the hips to chair height from a root on the floor (measured hips +.256
  // above the root), so they only need a small lift; the Kenney people are raised to the seat instead.
  const sitY = C.hero ? (o.seatY || .29) - .26 : (o.seatY || .29) + SIT_DY - .026 * bodyScale(c.look) * CHAR_SCALE;
  C.root.position.set(c.gx, sit ? sitY : 0, c.gy);
  // which clip
  let clip = 'idle', headX = 0, headZ = 0, jump = 0;
  if (mv) clip = 'walk';
  if (sit) clip = 'sit';
  if (c.cookAnim) { clip = 'interact-right'; headX = .2; }
  if (c.state === 'menu') headX = .3;
  if (c.state === 'wait') { headZ = Math.sin(k * 1.3 + c.seed) * .14; if (c.mood === 'sad') headX = .25; if (c.mood === 'angry') headZ = Math.sin(k * 14) * .12; }
  if (c.state === 'eat') headX = .12 + Math.max(0, Math.sin(k * 5)) * .1;
  if (o.celebrate) { if (!sit) clip = 'emote-yes'; jump = Math.abs(Math.sin(o.celebrate * Math.PI * 2)) * .1; }
  // blend clip weights so poses flow into each other (walk -> sit -> eat ...)
  const e = Math.min(1, dt * 12);
  for (const n of CLIPS) { const tgt = n === clip ? 1 : 0; if (C.w[n] !== tgt) { C.w[n] += (tgt - C.w[n]) * e; if (Math.abs(C.w[n] - tgt) < .01) C.w[n] = tgt; C.acts[n].setEffectiveWeight(C.w[n]); } }
  C.acts.walk.timeScale = c.role === 'cust' ? (c.sp ? .5 + c.sp * .8 : 1.5) : 1.9;
  // undo last frame's overrides first: the mixer only rewrites a bone when its animated value changes
  for (const n in C.base) C.bones[n].quaternion.copy(C.base[n]);
  C.mixer.update(dt);
  for (const n of C.ov) (C.base[n] || (C.base[n] = new THREE.Quaternion())).copy(C.bones[n].quaternion);
  // partial overrides on top of the clip
  const K = C.k, ease = (key, on) => { K[key] += ((on ? 1 : 0) - K[key]) * e; return K[key]; };
  const B = C.bones, aR = B['arm-right'], aL = B['arm-left'];
  const carry = ease('carry', !!c.carry), eat = ease('eat', c.state === 'eat'), menu = ease('menu', c.state === 'menu');
  if (C.hero) { /* adventurers keep their own arm poses */ } else {
  if (carry > .01) aL.quaternion.slerp(CHAR_POSE['holding-both']['arm-left'], carry);
  if (menu > .01) { aR.quaternion.slerp(CHAR_POSE['holding-both']['arm-right'], menu); aL.quaternion.slerp(CHAR_POSE['holding-both']['arm-left'], menu); }
  if (eat > .01) aR.quaternion.slerp(CHAR_POSE['holding-both']['arm-right'], eat * (.35 + .65 * Math.max(0, Math.sin(k * 5))));
  }
  C.hx += (headX - C.hx) * e; C.hz += (headZ - C.hz) * e;
  if (Math.abs(C.hx) + Math.abs(C.hz) > .002) B.head.quaternion.multiply(Q.setFromEuler(EU.set(C.hx, 0, C.hz)));
  if (!mv && !sit) C.rig.position.y = jump + Math.sin(k * 2.2 + (c.seed || 0)) * .004; else C.rig.position.y = jump;
  C.menu.visible = c.state === 'menu';
  C.spoon.visible = !!c.cookAnim;
  // tray
  C.tray.visible = !!c.carry;
  if (C.trayKey !== (c.carry || null)) { if (C.trayFood) C.tray.remove(C.trayFood); C.trayFood = null; C.trayKey = c.carry || null; if (c.carry) { C.trayFood = food3d(c.carry); C.trayFood.position.y = .014; C.trayFood.scale.setScalar(2.4); C.tray.add(C.trayFood); } }
  if (C.vipFx) {   // shimmer: halo breathes, ring pulses, sparkles spiral upward and fade
    const F = C.vipFx, pulse = .5 + .5 * Math.sin(k * 3.2);
    F.halo.material.opacity = (.55 + .35 * pulse) * Math.min(1, c.alpha ?? 1); F.halo.scale.setScalar(1.1 + .25 * pulse);
    F.ring.material.opacity = .45 + .4 * pulse; F.ring.scale.setScalar(1 + .15 * pulse);
    for (const sp of F.sparks) {
      const u = (k * .35 + sp.userData.ph) % 1, ang = sp.userData.ph * Math.PI * 2 + k * 1.4;
      sp.position.set(Math.cos(ang) * .32, .1 + u * 1.15, Math.sin(ang) * .32);
      sp.material.opacity = Math.sin(u * Math.PI) * Math.min(1, c.alpha ?? 1); sp.scale.setScalar(.07 + .06 * Math.sin(u * Math.PI));
    }
    C.model.traverse(o => { if (o.isMesh && o.material && o.material.userData.vipGlow) o.material.emissiveIntensity = .18 + .3 * pulse; });
  }
  const a = c.alpha ?? 1;
  C.root.visible = a > .05;
  C.rig.scale.setScalar(bodyScale(c.look) * CHAR_SCALE * (.6 + .4 * Math.min(1, a)));
}
const SIT_DY = -.041;
// still pose for portraits
// KayKit's 'Idle' clip is shared by idle and emote-no (same action), and the build loop leaves it at weight 0
export function poseChar(C) { if (C.hero) C.acts.idle.setEffectiveWeight(1); C.mixer.update(C.hero ? .4 : 0); }
