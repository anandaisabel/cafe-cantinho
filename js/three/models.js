// Item models: KayKit CC0 models where they fit, procedural ones for the rest.
import { THREE } from './engine.js';
import { model } from './assets.js';
import { mat, mesh, box, sphere, cyl, lathe, cachedGeo, torus, leafGeo, mergeParts, M4, rbox, shadowBlob, disposeTree, SHARED } from './kit.js';
import { food3d, food3dWhole } from './food3d.js';
import { radialTexture, skyTexture } from './textures.js';
import { ITEMS, recipe, burnAfter } from '../config.js';
import { now } from '../util.js';
import { registerNightGlow, registerPane } from './daynight.js';

export const rotYaw = r => [0, Math.PI / 2, Math.PI, -Math.PI / 2][r || 0];
const blobTex = () => radialTexture('rgba(60,30,15,.55)', 'rgba(60,30,15,0)');
const steamTex = () => radialTexture('rgba(255,255,255,.95)', 'rgba(255,255,255,0)');

// ---------- plants (merged into one draw call each) ----------
function potMesh(g, color, r = .13, h = .17) {
  lathe(g, [[0, 0], [r * .72, 0], [r * .78, .01], [r, h * .9], [r * 1.08, h * .92], [r * 1.08, h], [r * .92, h], [r * .9, h * .9], [0, h * .88]], color, { rough: .3, coat: .7 }, 28);
  cyl(g, r * .88, r * .88, .01, '#5a3b28', 0, h * .86, 0, { rough: .9 }, 20);
}
function leafy(g, { n = 14, y = .16, spread = .9, size = .13, colors = ['#5f9e4f', '#77b35f', '#4e8a43', '#8cc46d'], trail = 0, seed = 1, height = 1 }) {
  const parts = [], L = leafGeo(); let s = seed;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) {
    const a = i * 2.399 + r() * .4, tilt = spread * (.5 + r() * .6), sc = size * (.75 + r() * .5);
    const lift = y + (.02 + r() * .12) * height;
    parts.push({ geo: L, m: M4(Math.sin(a) * .02, lift, Math.cos(a) * .02, -tilt, a, 0, sc, sc * 1.25, sc), color: colors[i % colors.length] });
  }
  for (let t = 0; t < trail; t++) {
    const a = t * 2.1 + .5;
    for (let k = 0; k < 5; k++) {
      const d = .12 + k * .012, yy = y - .02 - k * .05;
      parts.push({ geo: L, m: M4(Math.sin(a) * d, yy, Math.cos(a) * d, -2.6 + k * .1, a + (k % 2 ? .6 : -.6), 0, .06, .075, .06), color: colors[(t + k) % colors.length] });
    }
  }
  mesh(mergeParts(parts), mat('#ffffff', { rough: .45, coat: .35, side: THREE.DoubleSide }).clone(), 0, 0, 0, g).material.vertexColors = true;
}
function plantModel() { const g = new THREE.Group(); potMesh(g, '#f3eee8'); leafy(g, { n: 16, trail: 3, seed: 3 }); return g; }
function ficusModel() {
  const g = new THREE.Group(); potMesh(g, '#e8a59a', .15, .2);
  const trunk = cyl(g, .014, .022, .55, '#8a5a3e', 0, .18, 0, { rough: .8 }, 10); trunk.rotation.z = .05;
  const parts = [], L = leafGeo(); let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (const [cx, cy, cz, n] of [[0, .78, 0, 18], [-.1, .6, .05, 10], [.1, .66, -.04, 10], [.02, .92, .02, 8]])
    for (let i = 0; i < n; i++) { const a = r() * 6.28, el = r() * 1.2 - .2, sc = .07 + r() * .04;
      parts.push({ geo: L, m: M4(cx + Math.cos(a) * .08 * Math.cos(el), cy + Math.sin(el) * .07, cz + Math.sin(a) * .08 * Math.cos(el), -1.2 + el, a + 1.57, 0, sc, sc * 1.3, sc), color: ['#4f8a43', '#66a356', '#7cb866', '#3f7a38'][i % 4] }); }
  mesh(mergeParts(parts), mat('#ffffff', { rough: .45, coat: .35, side: THREE.DoubleSide }).clone(), 0, 0, 0, g).material.vertexColors = true;
  return g;
}
function flowersModel() {
  const g = new THREE.Group();
  box(g, .62, .16, .3, '#e8b98e', 0, 0, 0, { rough: .55, coat: .3 }, .04);
  box(g, .56, .02, .24, '#5a3b28', 0, .15, 0, { rough: .9 }, .01);
  const parts = [], L = leafGeo(), petal = cachedGeo('petal', () => new THREE.SphereGeometry(1, 10, 8)), cols = ['#f2a7a0', '#f7d58b', '#c7b2e6', '#ffffff', '#e8706a', '#f9b8d0'];
  for (let i = 0; i < 9; i++) {
    const x = -.24 + i * .06, z = (i % 2 ? .05 : -.05), h = .26 + (i % 3) * .05, c = cols[i % cols.length];
    parts.push({ geo: cachedGeo('stem', () => new THREE.CylinderGeometry(.006, .006, 1, 5)), m: M4(x, .16 + h / 2 - .08, z, 0, 0, 0, 1, h - .1, 1), color: '#5f9e4f' });
    parts.push({ geo: L, m: M4(x, .2, z, -.9, i, 0, .05, .07, .05), color: '#6faa58' });
    for (let p = 0; p < 6; p++) { const a = p * 1.047; parts.push({ geo: petal, m: M4(x + Math.cos(a) * .022, .1 + h, z + Math.sin(a) * .022, 0, 0, 0, .02, .012, .02), color: c }); }
    parts.push({ geo: petal, m: M4(x, .105 + h, z, 0, 0, 0, .013, .01, .013), color: '#f7c948' });
  }
  mesh(mergeParts(parts), mat('#ffffff', { rough: .5, coat: .3 }).clone(), 0, 0, 0, g).material.vertexColors = true;
  return g;
}
function sunflowerModel() {
  const g = new THREE.Group(); potMesh(g, '#9cc1e0', .11, .15);
  const parts = [], petal = cachedGeo('petal', () => new THREE.SphereGeometry(1, 10, 8)), L = leafGeo();
  parts.push({ geo: cachedGeo('stem', () => new THREE.CylinderGeometry(.006, .006, 1, 5)), m: M4(0, .38, 0, 0, 0, 0, 1.6, .46, 1.6), color: '#5f9e4f' });
  parts.push({ geo: L, m: M4(0, .3, 0, -1, .4, 0, .08, .1, .08), color: '#6faa58' }); parts.push({ geo: L, m: M4(0, .4, 0, -1, 3.4, 0, .07, .09, .07), color: '#6faa58' });
  for (let p = 0; p < 14; p++) { const a = p * .449; parts.push({ geo: petal, m: M4(Math.cos(a) * .055, .62 + Math.sin(a) * .055, .02, 0, 0, a, .035, .016, .01), color: '#f7c23a' }); }
  parts.push({ geo: petal, m: M4(0, .62, .03, 0, 0, 0, .035, .035, .015), color: '#6b3f22' });
  mesh(mergeParts(parts), mat('#ffffff', { rough: .5, coat: .2 }).clone(), 0, 0, 0, g).material.vertexColors = true;
  g.children[g.children.length - 1].rotation.y = .6;
  return g;
}
function teddyModel() {
  const g = new THREE.Group(), fur = { rough: .9, sheen: 1 }, c = '#c98e5c', l = '#ecc59a';
  sphere(g, .1, c, 0, .1, 0, fur); sphere(g, .065, l, 0, .1, .07, fur);
  sphere(g, .085, c, 0, .26, 0, fur); sphere(g, .032, c, -.065, .33, 0, fur); sphere(g, .032, c, .065, .33, 0, fur);
  sphere(g, .036, l, 0, .245, .07, fur); sphere(g, .012, '#3b2a20', 0, .255, .1, { rough: .2 });
  sphere(g, .01, '#3b2a20', -.03, .285, .075, { rough: .2 }); sphere(g, .01, '#3b2a20', .03, .285, .075, { rough: .2 });
  for (const s of [-1, 1]) { sphere(g, .04, c, s * .085, .14, .03, fur).scale.set(.035, .05, .035); sphere(g, .045, c, s * .06, .03, .06, fur).scale.set(.045, .035, .055); }
  const bow = torus(g, .03, .012, '#e8706a', { coat: .6 }); bow.position.set(0, .195, .05); bow.scale.set(1, .5, 1);
  return g;
}
function jukeboxModel(entry) {
  const g = new THREE.Group();
  box(g, .6, .62, .42, '#c0533a', 0, 0, 0, { rough: .3, coat: .8 }, .08);
  const arch = mesh(cachedGeo('jarch', () => new THREE.CylinderGeometry(.3, .3, .42, 28, 1, false, -Math.PI / 2, Math.PI)), mat('#c0533a', { rough: .3, coat: .8 }), 0, .62, 0, g); arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI / 2;
  const glow = mesh(cachedGeo('jglow', () => new THREE.TorusGeometry(.24, .03, 10, 28, Math.PI)), mat('#fff3c4', { emissive: '#ffd27a', ei: 1.6 }).clone(), 0, .62, .2, g);
  box(g, .4, .22, .02, '#3d3431', 0, .1, .21, { rough: .4 }, .01);
  box(g, .36, .2, .02, '#fff3d2', 0, .36, .21, { emissive: '#ffcf8a', ei: .5 }, .01);
  for (let i = 0; i < 5; i++) box(g, .04, .04, .02, ['#f2a7a0', '#f7d58b', '#a8c3a0', '#9cc1e0', '#c7b2e6'][i], -.12 + i * .06, .5, .215, { emissive: '#ffffff', ei: .2 }, .01);
  entry.parts.glow = glow;
  return g;
}
// Tall espresso machine: a floor-standing unit about the size of a big fridge, so it reads as
// real equipment in the room rather than a gadget on a worktop.
// A commercial espresso machine on a stainless counter: three group heads with black handles, two gauges,
// steam wands on both sides, a full-width drip tray and a rail of cups warming on top.
// Industrial silhouette, with mint enamel side panels so it still belongs in the pastel café.
function coffeeMachine(entry) {
  const g = new THREE.Group();
  const steel = { rough: .22, metal: .8 }, brushed = { rough: .38, metal: .65 }, dark = { rough: .5 }, B = .54;
  // stainless counter
  box(g, .96, .06, .86, '#5f6468', 0, .03, -.03, dark, .01);                               // toe-kick
  box(g, 1.0, B - .1, .9, '#c9ced2', 0, .06 + (B - .1) / 2, -.03, brushed, .02);
  box(g, 1.02, .04, .94, '#e4e7ea', 0, B - .01, -.03, steel, .012);                        // worktop
  for (const sx of [-.24, .24]) box(g, .44, .34, .015, '#b9bfc4', sx, .29, .425, brushed, .01);   // doors
  for (const sx of [-.04, .04]) box(g, .02, .14, .02, '#e4e7ea', sx, .3, .44, steel, .006);       // handles
  // machine body
  const y0 = B, MH = .5, MD = .56, zf = -.1 + MD / 2;
  box(g, .98, MH, MD, '#dfe3e6', 0, y0 + MH / 2, -.1, steel, .04);
  for (const sx of [-1, 1]) box(g, .05, MH - .04, MD - .04, '#a8dcc6', sx * .47, y0 + MH / 2, -.1, { rough: .3, coat: .8 }, .02);   // mint enamel sides
  box(g, .86, .26, .02, '#3d3f44', 0, y0 + .2, zf + .005, dark, .01);                      // shadowed brew bay
  box(g, .9, .1, .02, '#eef0f2', 0, y0 + .42, zf + .01, steel, .01);                      // top fascia
  // two gauges and a row of buttons
  let needle = null;
  for (const sx of [-.2, .2]) {
    const f = cyl(g, .05, .05, .02, '#fffaf2', sx, y0 + .42, zf + .02, { rough: .3, coat: .5 }, 20); f.rotation.x = Math.PI / 2;
    const r = torus(g, .052, .009, '#c9ced2', steel); r.position.set(sx, y0 + .42, zf + .025);
    const n = box(g, .006, .038, .005, '#e98d96', sx, y0 + .425, zf + .033, {}, .002); if (!needle) needle = n;
  }
  const btns = [];
  for (let i = 0; i < 2; i++) { const b2 = box(g, .05, .03, .015, '#cfe6cc', -.03 + i * .06, y0 + .42, zf + .02, { emissive: '#9cc79a', ei: .3 }, .006); btns.push(b2); }
  // three group heads with portafilters
  let pf = null;
  for (const gx of [-.3, 0, .3]) {
    cyl(g, .055, .05, .07, '#f2f4f5', gx, y0 + .28, zf + .05, steel, 16);
    cyl(g, .045, .045, .03, '#c9ced2', gx, y0 + .235, zf + .05, steel, 16);
    const h = box(g, .035, .035, .16, '#2f3034', gx, y0 + .225, zf + .17, { rough: .45 }, .014); h.rotation.x = .15; if (!pf) pf = h;
  }
  // steam wands
  for (const sx of [-1, 1]) { const w = cyl(g, .011, .011, .24, '#eef0f2', sx * .43, y0 + .2, zf + .06, steel, 8); w.rotation.z = sx * .18; box(g, .04, .04, .04, '#2f3034', sx * .43, y0 + .34, zf + .04, dark, .012); }
  // full-width drip tray with a grate
  box(g, .9, .03, .16, '#c9ced2', 0, y0 + .02, zf + .08, steel, .008);
  for (let i = 0; i < 12; i++) box(g, .018, .008, .13, '#9aa1a6', -.4 + i * .073, y0 + .038, zf + .08, steel, .003);
  // cup under the middle group
  const cup = new THREE.Group(); cup.position.set(0, y0 + .04, zf + .08); g.add(cup);
  lathe(cup, [[0, 0], [.04, 0], [.05, .065], [.045, .065], [.033, .007], [0, .007]], '#ffffff', { rough: .25, coat: .6 }, 16, 'ccup');
  const coffee = cyl(cup, .042, .042, .005, '#5a3524', 0, .04, 0, { rough: .15, coat: 1 }, 16);
  const stream = cyl(g, .006, .006, .12, '#6b3f26', 0, y0 + .14, zf + .08, { rough: .2 }, 6);
  // cup warmer rail on top, with a row of pastel cups upside down
  for (const sz of [-.3, .1]) { const r = cyl(g, .008, .008, .92, '#eef0f2', 0, y0 + MH + .05, sz, steel, 6); r.rotation.z = Math.PI / 2; }
  ['#ffffff', '#f6b3b8', '#ffffff', '#ffdf8e', '#ffffff', '#b4d8f2'].forEach((col, i) => {
    const c = new THREE.Group(); c.position.set(-.35 + i * .14, y0 + MH + .075, -.1); c.rotation.x = Math.PI; g.add(c);
    lathe(c, [[0, 0], [.035, 0], [.045, .06], [.04, .06], [.03, .006], [0, .006]], col, { rough: .3, coat: .6 }, 14, 'kcup' + col);
  });
  Object.assign(entry.parts, { btns, cup, coffee, stream, needle, pf });
  return g;
}
const LIQ_H = .46, LIQ_BASE = 0;      // juice column inside each tank: height, and the floor it rests on
// Commercial juice dispenser on the same stainless counter as the espresso machine: three tall tanks of
// bright juice (orange, strawberry, lime) on a chrome base with taps, a drip grate and mint enamel sides.
function blenderModel(entry) {
  const g = new THREE.Group();
  const steel = { rough: .22, metal: .8 }, brushed = { rough: .38, metal: .65 }, dark = { rough: .5 }, B = .54;
  // stainless counter (matches the coffee station)
  box(g, .96, .06, .86, '#5f6468', 0, .03, -.03, dark, .01);
  box(g, 1.0, B - .1, .9, '#c9ced2', 0, .06 + (B - .1) / 2, -.03, brushed, .02);
  box(g, 1.02, .04, .94, '#e4e7ea', 0, B - .01, -.03, steel, .012);
  for (const sx of [-.24, .24]) box(g, .44, .34, .015, '#b9bfc4', sx, .29, .425, brushed, .01);
  for (const sx of [-.04, .04]) box(g, .02, .14, .02, '#e4e7ea', sx, .3, .44, steel, .006);
  // dispenser base with mint enamel sides
  const y0 = B, BH = .2, zf = .16;
  box(g, .96, BH, .6, '#dfe3e6', 0, y0 + BH / 2, -.1, steel, .04);
  for (const sx of [-1, 1]) box(g, .05, BH - .03, .56, '#a8dcc6', sx * .46, y0 + BH / 2, -.1, { rough: .3, coat: .8 }, .02);
  box(g, .9, .1, .02, '#3d3f44', 0, y0 + .07, zf + .045, dark, .01);                       // shadowed tap bay
  // drip grate across the front
  box(g, .88, .025, .14, '#c9ced2', 0, y0 + .012, zf + .1, steel, .008);
  for (let i = 0; i < 12; i++) box(g, .018, .008, .12, '#9aa1a6', -.39 + i * .071, y0 + .028, zf + .1, steel, .003);
  // three tanks of juice
  const tanks = [];
  const JUICE = [[-.31, '#ff9f1c', '#ffdf8e', '#f7a531'], [0, '#ff5d8f', '#f6b3b8', '#e3364f'], [.31, '#7ed957', '#a8dcc6', '#8cc152']];
  for (const [x, col, lid, fruit] of JUICE) {
    const t = new THREE.Group(); t.position.set(x, y0 + BH, -.1); g.add(t);
    const liquid = cyl(t, .125, .115, LIQ_H, col, 0, LIQ_BASE + LIQ_H / 2, 0, { rough: .2, coat: .8 }, 20);
    lathe(t, [[0, 0], [.14, 0], [.145, .05], [.142, .52], [.125, .6], [.11, .6], [.125, .5], [.128, .05], [0, .04]], '#eef7fb',
      { rough: .04, coat: 1, opacity: .24 }, 22, 'jtank3');
    cyl(t, .148, .148, .05, lid, 0, .6, 0, { rough: .3, coat: .6 }, 22);                      // pastel lid
    sphere(t, .045, fruit, 0, .68, 0, { rough: .4, coat: .4 });                               // a fruit on top
    const leaf = box(t, .04, .01, .02, '#6faa58', .03, .72, 0, {}, .005); leaf.rotation.z = .5;
    const pad = new THREE.Group(); pad.position.y = .1; t.add(pad);
    cyl(pad, .01, .01, .38, '#e4e7ea', 0, 0, 0, steel, 8);
    for (const ang of [0, Math.PI]) { const bl = box(pad, .09, .18, .01, '#f4fafd', 0, .1, 0, { rough: .2, coat: .6, opacity: .7 }, .01); bl.rotation.y = ang; bl.position.set(Math.cos(ang) * .045, .1, Math.sin(ang) * .045); }
    // tap with a lever in the juice's colour
    cyl(g, .02, .02, .07, '#e4e7ea', x, y0 + .1, zf + .06, steel, 10);
    const lever = box(g, .035, .09, .025, lid, x, y0 + .17, zf + .08, { rough: .3, coat: .6 }, .01); lever.rotation.x = .35;
    tanks.push({ group: t, liquid, pad });
  }
  // a glass on the grate, filled while pouring
  const glass = new THREE.Group(); glass.position.set(0, y0 + .03, zf + .1); g.add(glass);
  const juice = cyl(glass, .045, .04, .1, '#ff9f1c', 0, .05, 0, { rough: .25, coat: .7 }, 16);
  lathe(glass, [[0, 0], [.05, 0], [.056, .13], [.05, .13], [.043, .006], [0, .006]], '#eef7fb', { rough: .03, coat: 1, opacity: .32 }, 18, 'jglass');
  cyl(glass, .005, .005, .12, '#e98d96', .02, .09, .01, { rough: .4 }, 6).rotation.z = .2;
  Object.assign(entry.parts, { tanks, glass, juice, jar: tanks[0].group, liquid: tanks[0].liquid });
  return g;
}
// --- kitchen equipment unlocked later on ---
function fornoModel(entry) {
  const g = new THREE.Group(); const stone = { rough: .9 };
  box(g, .95, .5, .66, '#9c8a7c', 0, .25, 0, stone, .04);                       // masonry base
  box(g, .9, .56, .62, '#d98b5a', 0, .78, 0, { rough: .85 }, .22);              // terracotta dome
  for (let i = 0; i < 5; i++) box(g, .16, .07, .62, '#c47a4c', -.32 + i * .16, 1.05, 0, { rough: .9 }, .03);   // brick ribs
  box(g, .5, .3, .08, '#3a2c26', 0, .72, .3, { rough: 1 }, .06);                // mouth
  const fire = box(g, .36, .14, .05, '#ff8a3c', 0, .68, .28, { emissive: '#ff6a1c', ei: 1.8, rough: .4 }, .03);
  box(g, .9, .07, .62, '#8a5a3e', 0, .5, 0, { rough: .6 }, .025);               // ledge between base and oven
  cyl(g, .1, .12, .5, '#9c8a7c', -.3, 1.05, -.2, stone, 12);                    // chimney
  for (const [x, z] of [[-.3, .2], [.3, .18]]) cyl(g, .085, .085, .035, '#c9a06a', x, .54, z, { rough: .7 }, 14);
  const peel = new THREE.Group(); peel.position.set(.52, .62, .22); peel.rotation.z = -.45; g.add(peel);
  cyl(peel, .014, .014, .5, '#b9814e', 0, 0, 0, { rough: .6 }, 8);
  box(peel, .22, .018, .22, '#d9a86c', 0, -.26, 0, { rough: .6 }, .02);
  entry.lightAnchors = [[0, .72, .28]];
  Object.assign(entry.parts, { fire });
  return g;
}
function gelatoModel(entry) {
  const g = new THREE.Group(); const steel = { rough: .25, metal: .7 };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, .035, .045, .08, '#6f6a66', sx * .42, 0, sz * .22, steel, 10);
  box(g, 1.0, .5, .58, '#f2f7fa', 0, .33, 0, { rough: .3, coat: .6 }, .05);     // cabinet
  box(g, 1.04, .06, .62, '#7fb0d9', 0, .61, 0, { rough: .3, coat: .7 }, .025);  // counter lip
  box(g, .86, .2, .025, '#dbe7ee', 0, .3, .3, { rough: .2, coat: .6 }, .015);   // front window
  // four tubs of gelato set into the top
  ['#f3d6a8', '#9bc46a', '#e8a0b4', '#6b4a3a'].forEach((c, i) => {
    const x = -.33 + i * .22;
    box(g, .18, .07, .3, '#cfd6da', x, .64, 0, steel, .018);
    const scoop = sphere(g, .085, c, x, .69, 0, { rough: .45 }); scoop.scale.set(.085, .045, .13);
    const sign = box(g, .12, .07, .012, '#fffaf2', x, .5, .3, { rough: .5 }, .012); sign.rotation.x = -.3;
  });
  // flat glass guard on two slim posts: no dome, nothing to balloon
  for (const sx of [-1, 1]) cyl(g, .012, .012, .3, '#cfd6da', sx * .46, .68, 0, steel, 8);
  const guard = box(g, .98, .26, .018, '#eaf6ff', 0, .85, -.12, { rough: .03, coat: 1, opacity: .25 }, .01);
  guard.rotation.x = -.22;
  for (let i = 0; i < 4; i++) cyl(g, .032, .024, .11, '#e8c99a', -.24 + i * .16, .68, -.24, { rough: .7 }, 10);  // cones at the back
  return g;
}
function chocoModel(entry) {
  const g = new THREE.Group(); const gold = { rough: .2, metal: .8 };
  cyl(g, .46, .5, .12, '#f0cd72', 0, 0, 0, gold, 28);                           // wide catch basin
  cyl(g, .43, .43, .06, '#7a5236', 0, .12, 0, { rough: .2, coat: .95 }, 26);    // the chocolate it collects
  cyl(g, .055, .055, 1.0, '#f0cd72', 0, .16, 0, gold, 14);                      // column
  const tiers = [];
  for (let i = 0; i < 3; i++) {
    const r = .38 - i * .09, y = .36 + i * .26;
    cyl(g, r, r * .9, .04, '#f0cd72', 0, y, 0, gold, 24);                       // the gold tier
    const flow = cyl(g, r * .94, r * .94, .03, '#8a5f3c', 0, y + .04, 0, { rough: .15, coat: 1 }, 22);
    // a thin curtain of chocolate falling to the tier below
    cyl(g, r * .9, r * .86, .22, '#9a6b45', 0, y - .22, 0, { rough: .15, coat: 1, opacity: .85 }, 22);
    tiers.push(flow);
  }
  cyl(g, .1, .13, .09, '#f0cd72', 0, 1.16, 0, gold, 16);                        // crown
  sphere(g, .05, '#fff3cf', 0, 1.27, 0, { rough: .15, metal: .6 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sphere(g, .05, i % 2 ? '#e3364f' : '#f7c948', Math.cos(a) * .38, .16, Math.sin(a) * .38, { rough: .35, coat: .5 }); }
  Object.assign(entry.parts, { tiers });
  return g;
}
// --- premium pieces (bought with Diamantes) ---
function lustreModel(entry) {
  const g = new THREE.Group(); const gold = { rough: .2, metal: .85 };
  cyl(g, .012, .012, .75, '#caa23e', 0, 1.6, 0, gold, 8);
  lathe(g, [[0, 0], [.3, .14], [.26, .17], [.1, .07], [0, .06]], '#e8c362', gold, 24, 'lus').position.y = 1.18;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, r = .27;
    const c = cyl(g, .028, .02, .085, '#fff6d8', Math.cos(a) * r, 1.12, Math.sin(a) * r, { rough: .1, coat: 1, emissive: '#ffd98a', ei: .9 }, 10);
    sphere(g, .022, '#fff3cf', Math.cos(a) * r, 1.19, Math.sin(a) * r, { rough: .05, coat: 1, opacity: .7 });
    sphere(g, .016, '#eaf3ff', Math.cos(a) * r * 1.25, 1.02, Math.sin(a) * r * 1.25, { rough: .05, coat: 1, opacity: .6 });
  }
  sphere(g, .05, '#fff6d8', 0, 1.02, 0, { rough: .05, coat: 1, emissive: '#ffd98a', ei: .7 });
  entry.lightAnchors = [[0, 1.1, 0]];
  return g;
}
function goldCaseModel(entry) {
  const g = new THREE.Group(); const gold = { rough: .2, metal: .9 };
  box(g, .78, .12, .5, '#caa23e', 0, .06, 0, gold, .03);
  for (const x of [-.34, .34]) for (const z of [-.2, .2]) cyl(g, .022, .022, .5, '#caa23e', x, .35, z, gold, 8);
  box(g, .8, .06, .52, '#e8c362', 0, .62, 0, gold, .03);
  lathe(g, [[0, 0], [.07, 0], [.085, .055], [.07, .085], [0, .09]], '#fff3cf', { rough: .1, coat: 1, opacity: .45 }, 18, 'gdome').position.set(0, .64, 0);
  for (const [x, z, c] of [[-.22, 0, '#f2a7b5'], [0, .06, '#f7c948'], [.22, -.04, '#b48ae0']]) {
    cyl(g, .085, .085, .055, c, x, .15, z, { rough: .35, coat: .6 }, 18);
    sphere(g, .03, '#fff6ea', x, .19, z, { rough: .25, coat: .7 });
  }
  box(g, .72, .44, .02, '#eaf6ff', 0, .35, .25, { rough: .03, coat: 1, opacity: .22 }, .01);
  return g;
}
function rugModel(entry) {
  const g = new THREE.Group();
  box(g, 1.3, .035, .95, '#8d2f36', 0, .018, 0, { rough: .85 }, .03);
  box(g, 1.12, .012, .78, '#c2463f', 0, .04, 0, { rough: .85 }, .02);
  box(g, .86, .012, .56, '#1f4f6b', 0, .048, 0, { rough: .85 }, .02);
  for (const [x, z] of [[-.26, 0], [.26, 0], [0, 0]]) {
    const d = box(g, .2, .012, .2, '#e8c362', x, .056, z, { rough: .6 }, .03); d.rotation.y = Math.PI / 4;
  }
  for (let i = -5; i <= 5; i++) { box(g, .02, .01, .07, '#f0d9a8', i * .115, .03, .51, { rough: .9 }, .004); box(g, .02, .01, .07, '#f0d9a8', i * .115, .03, -.51, { rough: .9 }, .004); }
  return g;
}
// --- wall openings -------------------------------------------------------
// Built facing +z (as if on the back wall). view.js turns and slides the body onto whichever
// wall the item's cell touches, so the same model works on both walls and while being dragged.
const SKY = () => (skyPane = skyPane || skyTexture());
let skyPane = null;
// one shared shade material: registered for the night glow once, never disposed
let SCONCE_MAT = null;
function sconceMat() {
  if (!SCONCE_MAT) { SCONCE_MAT = new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffcf8a', emissiveIntensity: 1, roughness: .6, side: THREE.DoubleSide }); SHARED.add(SCONCE_MAT); registerNightGlow(SCONCE_MAT, 1.8, 'item'); }
  return SCONCE_MAT;
}
function sconceModel() {
  const g = new THREE.Group(), S = new THREE.Group(); S.position.set(0, 1.5, .02); g.add(S);
  box(S, .1, .14, .03, '#c9a24a', 0, -.07, 0, { rough: .3, metal: .7 }, .01);
  const arm = cyl(S, .012, .012, .14, '#c9a24a', 0, 0, .07, { rough: .3, metal: .7 }, 6); arm.rotation.x = Math.PI / 2;
  mesh(cachedGeo('sconceShade', () => new THREE.CylinderGeometry(.06, .1, .13, 16, 1, true)), sconceMat(), 0, .03, .15, S);
  return g;
}
function windowModel(entry, style) {
  if (style === 'sconce') return sconceModel();
  const g = new THREE.Group();
  const fr = '#fffaf3', trim = { rough: .4, coat: .3 };
  const W = style === 'wide' ? 1.75 : style === 'round' ? 1 : style === 'arch' ? 1.15 : 1.3;
  const H = style === 'round' ? 1 : style === 'arch' ? 1.35 : style === 'wide' ? 1 : .95;
  const y0 = style === 'round' ? 1.0 : style === 'arch' ? .72 : .8;
  const paneMat = () => {
    const m = new THREE.MeshBasicMaterial({ map: SKY(), toneMapped: false });
    if (style === 'vitral') { m.color = new THREE.Color('#cfe6ff'); }
    registerPane(m); return m;
  };
  if (style === 'round') {
    const pane = mesh(cachedGeo('wpaneR', () => new THREE.CircleGeometry(.44, 28)), paneMat(), 0, y0, .02, g); pane.castShadow = false;
    const ring = torus(g, .49, .07, fr, trim); ring.position.set(0, y0, .03);
    for (const a of [0, Math.PI / 2]) { const b = box(g, .055, .95, .05, fr, 0, y0 - .475, .04, trim, .01); b.rotation.z = a; b.position.y = y0; b.position.set(0, y0, .04); b.rotation.z = a; }
    box(g, .9, .06, .14, fr, 0, y0 - .58, .06, trim, .02);
  } else if (style === 'arch') {
    const pane = mesh(cachedGeo('wpaneA', () => {
      const sh = new THREE.Shape(); sh.moveTo(-.5, 0); sh.lineTo(-.5, .62); sh.absarc(0, .62, .5, Math.PI, 0, true); sh.lineTo(.5, 0); sh.closePath();
      return new THREE.ShapeGeometry(sh, 24);
    }), paneMat(), 0, y0, .02, g); pane.castShadow = false; pane.scale.set(W / 1.1, H / 1.25, 1);
    for (const sx of [-1, 1]) box(g, .07, H * .55, .09, fr, sx * (W / 2 - .02), y0, .03, trim, .02);
    const arc = torus(g, W / 2 - .02, .045, fr, trim, Math.PI); arc.position.set(0, y0 + H * .55, .03);
    box(g, .05, H * .5, .06, fr, 0, y0, .03, trim, .01);
    box(g, W + .2, .07, .16, fr, 0, y0 - .06, .06, trim, .02);
  } else {
    const pane = mesh(cachedGeo('wpane' + W + H, () => new THREE.PlaneGeometry(W, H)), paneMat(), 0, y0 + H / 2, .015, g); pane.castShadow = false;
    box(g, W + .12, .07, .08, fr, 0, y0 - .07, .02, trim, .02);
    box(g, W + .2, .05, .16, fr, 0, y0 - .1, .06, trim, .02);
    box(g, W + .12, .07, .08, fr, 0, y0 + H, .02, trim, .02);
    for (const sx of [-1, 1]) box(g, .07, H + .07, .08, fr, sx * (W / 2 + .025), y0 - .02, .02, trim, .02);
    box(g, .04, H, .05, fr, 0, y0, .02, trim, .01);
    box(g, W, .03, .05, fr, 0, y0 + H * .55, .02, trim, .01);
    if (style !== 'wide') {
      for (const sx of [-1, 1]) {
        const c = new THREE.Group(); c.position.set(sx * (W / 2 + .08), y0 - .15, .08); g.add(c);
        for (let i = 0; i < 4; i++) cyl(c, .045, .06, H + .4, '#f2a7a0', (i - 1.5) * .055 * -sx, 0, 0, { rough: .85, sheen: 1, coat: .01 }, 12);
        const tie = torus(c, .1, .018, '#e8706a', { rough: .6 }); tie.position.y = .45; tie.rotation.x = Math.PI / 2; tie.scale.set(1, .6, 1);
      }
      const rod = cyl(g, .018, .018, W + .5, '#8a5a3e', 0, y0 + H + .18, .09, { rough: .4, metal: .3 }, 8); rod.rotation.z = Math.PI / 2;
    }
  }
  if (style === 'vitral') {
    // coloured leading over the glass
    const cols = ['#e2643a', '#f2c14e', '#5b93c9', '#7fae6a', '#b06ab3'];
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2, r = .3 + (i % 3) * .07;
      const q = box(g, .17, .17, .012, cols[i % cols.length], Math.cos(a) * r, y0 + H / 2 + Math.sin(a) * r * .8, .025, { rough: .25, coat: .8, opacity: .85 }, .03);
      q.rotation.z = a;
    }
    box(g, W + .14, .08, .1, '#caa23e', 0, y0 - .08, .03, { rough: .3, metal: .7 }, .02);
    box(g, W + .14, .08, .1, '#caa23e', 0, y0 + H, .03, { rough: .3, metal: .7 }, .02);
  }
  entry.openW = W;
  return g;
}
function doorMarkModel(entry) {
  // The doorway itself (gap, frame, leaf, sign) is part of the wall; this is only what the player grabs.
  const g = new THREE.Group();
  const m = box(g, .22, 1.5, .95, '#ffffff', 0, 0, 0, { opacity: .001 }, .02);
  m.visible = false;
  return g;
}
function displayModel(entry) {
  const g = new THREE.Group();
  g.add(model('r_kitchencounter_straight_B'));
  const top = new THREE.Group(); top.position.y = .5; g.add(top);
  box(top, .86, .02, .7, '#fffaf2', 0, 0, 0, { rough: .3 }, .01);
  [['bolo', -.22, 0], ['torta', .2, -.08], ['brigadeiro', .02, .15], ['paoqueijo', .25, .15]].forEach(([f, x, z]) => { const m = food3d(f); m.position.set(x, .02, z); m.scale.setScalar(1.15); top.add(m); });
  box(top, .9, .34, .74, '#dff0f5', 0, .02, 0, { rough: .02, coat: 1, opacity: .22 }, .05);
  box(top, .92, .03, .76, '#c99a5c', 0, .36, 0, { rough: .4, coat: .4 }, .015);
  return g;
}
function vase(g, y) {
  lathe(g, [[0, 0], [.025, 0], [.035, .03], [.02, .06], [.024, .075], [0, .075]], '#9cc1e0', { rough: .1, coat: 1 }, 16, 'vase').position.y = y;
  const parts = [], petal = cachedGeo('petal', () => new THREE.SphereGeometry(1, 10, 8));
  for (const [x, z, c] of [[0, 0, '#f2a7a0'], [.02, .01, '#f7d58b'], [-.015, .015, '#ffffff']]) {
    parts.push({ geo: cachedGeo('stem', () => new THREE.CylinderGeometry(.006, .006, 1, 5)), m: M4(x * .5, y + .1, z * .5, 0, 0, 0, .6, .07, .6), color: '#5f9e4f' });
    for (let p = 0; p < 5; p++) { const a = p * 1.256; parts.push({ geo: petal, m: M4(x + Math.cos(a) * .012, y + .14, z + Math.sin(a) * .012, 0, 0, 0, .012, .008, .012), color: c }); }
  }
  mesh(mergeParts(parts), mat('#ffffff', { rough: .5 }).clone(), 0, 0, 0, g).material.vertexColors = true;
}

// ---------- build entry ----------
const KAY_MAP = {
  table_round: ['r_table_round_A_small', [.6, .5, .6]], table_square: ['f_table_small', [.9, .5, .9]], table_marble: ['r_table_round_B', [.3, .5, .3]],
  chair_wood: ['f_chair_A_wood', .5], chair_cushion: ['f_chair_A', .5], chair_bistro: ['r_chair_A', .5],
  counter: ['r_kitchencounter_straight_A', .5], stove: ['r_stove_single', .5],
  lamp: ['f_lamp_standing', .5], shelf: ['f_cabinet_small_decorated', .62], cactus: ['f_cactus_medium_A', .5],
  armchair: ['f_armchair_pillows', .5], cabinet: ['f_cabinet_medium_decorated', .45], fridge: ['r_fridge_A_decorated', .45], crates: ['r_crate_buns', .42],
  crate_carrots: ['r_crate_carrots', .42], crate_cheese: ['r_crate_cheese', .42], crate_lettuce: ['r_crate_lettuce', .42], crate_steak: ['r_crate_steak', .42], kcabinet: ['r_kitchencabinet', .45],
};
const PROC = { forno: fornoModel, gelateria: gelatoModel, chocolateira: chocoModel, lustre: lustreModel, vitrine_ouro: goldCaseModel, tapete_persa: rugModel, plant: plantModel, ficus: ficusModel, flowers: flowersModel, sunflower: sunflowerModel, teddy: teddyModel, jukebox: jukeboxModel, display: displayModel };
const HEIGHT = { kcabinet: 1, forno: 1.55, gelateria: 1.35, chocolateira: 1.3, lustre: 1.9, vitrine_ouro: 1.05, tapete_persa: .06, stove: 1.1, coffee: 1.2, blender: 1.45, counter: .9, lamp: 1.3, ficus: 1.1, shelf: 1.05, fridge: 1.2, jukebox: 1, display: 1, cabinet: .9 };

export function buildItem(it, opt = {}) {
  const d = ITEMS[it.type], kind = d.kind;
  const entry = { type: it.type, rot: it.rot || 0, group: new THREE.Group(), body: new THREE.Group(), parts: {}, topY: .5, foods: [], hit: null };
  entry.group.add(entry.body);
  const k = KAY_MAP[it.type];
  if (k) entry.body.add(model(k[0], k[1]));
  if (it.type === 'coffee') entry.body.add(coffeeMachine(entry));
  if (it.type === 'blender') entry.body.add(blenderModel(entry));
  if (d.kind === 'window') entry.body.add(windowModel(entry, d.style));
  else if (d.kind === 'door') entry.body.add(doorMarkModel(entry));
  else if (PROC[it.type]) entry.body.add(PROC[it.type](entry));
  if (kind === 'table') { vase(entry.body, .5); entry.topY = .5; }
  if (it.type === 'stove') {
    const pot = model('r_pot_A', .62); pot.position.set(.02, .55, .03); pot.visible = false; entry.body.add(pot);
    const lid = model('r_lid_A', .56); lid.position.set(.02, .9, .03); lid.visible = false; entry.body.add(lid);
    const flame = mesh(cachedGeo('flame', () => new THREE.CircleGeometry(.17, 24)), mat('#ff9a4a', { emissive: '#ff7a2a', ei: 2.2, opacity: .85 }), .02, .548, .03, entry.body); flame.rotation.x = -Math.PI / 2; flame.visible = false;
    Object.assign(entry.parts, { pot, lid, flame });
  }
  if (d.light) {
    // no PointLight per item: the view lends this lamp one from the shared pool (keeps the light count constant)
    entry.parts.lightAnchor = d.style === 'sconce' ? new THREE.Vector3(0, 1.55, -.2) : new THREE.Vector3(0, it.type === 'lamp' ? 1.02 : .8, 0); entry.parts.lightPower = it.type === 'lamp' ? 1 : .6;
    if (it.type === 'lamp') { const bm = mat('#fff2d0', { emissive: '#ffd890', ei: 3 }); registerNightGlow(bm, 3, 'item'); sphere(entry.body, .05, '#fff2d0', 0, .98, 0, { emissive: '#ffd890', ei: 3 }); }
  }
  if (kind === 'equip' && !opt.thumb) {
    // steam puffs & ready glow
    const puffs = [];
    for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex(), transparent: true, depthWrite: false, opacity: 0 })); sp.scale.setScalar(.2); entry.group.add(sp); puffs.push(sp); }
    const halo = mesh(cachedGeo('halo', () => new THREE.TorusGeometry(.42, .025, 10, 40)), mat('#fff2b0', { emissive: '#ffd56a', ei: 2.2 }).clone(), 0, .03, 0, entry.group); halo.rotation.x = -Math.PI / 2; halo.visible = false; halo.castShadow = false;
    Object.assign(entry.parts, { puffs, halo });
  }
  if (opt.thumb) { entry.group.rotation.y = rotYaw(it.rot); return entry; }
  shadowBlob(entry.group, kind === 'chair' ? .3 : .5, blobTex(), kind === 'decor' ? .35 : .45);
  // hover / select ring
  const ring = mesh(cachedGeo('selring', () => new THREE.RingGeometry(.44, .5, 40)), new THREE.MeshBasicMaterial({ color: 0xffd56a, transparent: true, opacity: .0, depthWrite: false }), 0, .012, 0, entry.group);
  ring.rotation.x = -Math.PI / 2; ring.castShadow = false; ring.receiveShadow = false; ring.renderOrder = 2; entry.parts.ring = ring;
  // generous hitbox (invisible), sized by role
  const opening = kind === 'window' || kind === 'door';
  const pri = kind === 'equip' ? 4 : kind === 'counter' ? 3 : opening ? 2 : kind === 'table' ? 1 : kind === 'chair' ? 1 : 0;
  const w = opening ? .95 : kind === 'equip' || kind === 'counter' ? 1.06 : kind === 'decor' ? .78 : .92;
  const h = opening ? 1.6 : HEIGHT[it.type] || (kind === 'chair' ? .9 : .8);
  const hd = opening ? .4 : w;
  const hit = new THREE.Mesh(cachedGeo(`hit${w},${h},${hd}`, () => new THREE.BoxGeometry(w, h, hd)), new THREE.MeshBasicMaterial());
  hit.position.y = opening ? .9 : h / 2; hit.visible = false;
  hit.userData = { pick: 'item', pri }; entry.group.add(hit); entry.hit = hit;
  if (opening) { entry.opening = kind; hit.position.z = -.3; entry.parts.ring.position.y = .012; }
  entry.group.rotation.y = rotYaw(it.rot);
  return entry;
}

// per-frame updates: cooking animations, stock on counters, highlight
const foodsOn = (entry, list, positions, y, scale = 1, whole = false) => {
  const key = list.join(',');
  if (entry.foodKey === key) return; entry.foodKey = key;
  for (const f of entry.foods) disposeTree(f); entry.foods = [];
  list.forEach((r, i) => { const m = whole ? food3dWhole(r) : food3d(r); const p = positions[i]; m.position.set(p[0], y, p[1]); m.rotation.y = p[2] || 0; m.scale.setScalar(p[3] || scale); entry.body.add(m); entry.foods.push(m); });
};
// a little charcoal cloud shown over an equipment whose dish burned
function burntPuff() {
  const g = new THREE.Group();
  for (const [x, y, z, r] of [[0, 0, 0, .13], [.1, .06, .03, .1], [-.11, .05, -.02, .095], [.02, .13, -.05, .085]]) sphere(g, r, '#5b4f48', x, y, z, { rough: .95 });
  sphere(g, .07, '#2f2a27', 0, -.1, 0, { rough: 1 });
  return g;
}
export function updateItem(entry, it, t, o) {
  const P = entry.parts, kind = ITEMS[it.type].kind;
  // counter stock
  if (kind === 'counter') {
    const n = it.stock && it.stock.left > 0 ? Math.min(3, it.stock.left) : 0;
    foodsOn(entry, n ? [it.stock.r] : [], [[0, 0, .3, 3.2]], .5, 1, true);   // one whole dish on show; the badge tells how many portions are left
  }
  if (kind === 'equip') {
    const R = it.cook && recipe(it.cook.r), p = R ? Math.min(1, (now() - it.cook.s) / (R.t * 1000)) : 0;
    const over = R ? (now() - it.cook.s) / 1000 - R.t : 0, burnt = R && over > burnAfter(R);
    const pouring = !!(it.pour && now() - it.pour < 1500);
    const cooking = (R && p < 1) || pouring, ready = R && p >= 1 && !burnt;
    if (it.type === 'stove') { P.pot.visible = P.lid.visible = !!R; P.flame.visible = !!cooking; if (cooking) { P.lid.position.y = .9 + Math.abs(Math.sin(t / 140)) * .022; P.lid.rotation.z = Math.sin(t / 90) * .05; P.flame.material.emissiveIntensity = 2 + Math.sin(t / 60) * .5; } else P.lid.position.y = .9; }
    if (it.type === 'coffee') { P.cup.visible = !!R || pouring; P.stream.visible = !!cooking || pouring; P.coffee.position.y = .012 + p * .042; const blink = cooking ? (Math.floor(t / 400) % 2) : 0, sk = (cooking ? 'c' + blink : ready ? 'r' : 'i'); if (P.btnKey !== sk) { P.btnKey = sk; P.btns.forEach(b => { b.material = mat(cooking ? '#f7c948' : ready ? '#8fd18a' : '#cfe6cc', { emissive: cooking ? '#f7a531' : ready ? '#6fd36a' : '#9cc79a', ei: cooking ? (blink ? 1.4 : .3) : ready ? 1.5 : .3 }); }); } P.needle.rotation.z = cooking ? Math.sin(t / 300) * .6 : 0; }
    if (it.type === 'blender' && P.tanks) {
      // The tanks always hold juice: the level dips while a glass is poured and refills smoothly,
      // and the surface moves while the floor of the tank stays put.
      const want = pouring ? .62 : 1;
      P.liqF = P.liqF === undefined ? want : P.liqF + (want - P.liqF) * .05;
      for (const tk of P.tanks) {
        tk.liquid.scale.y = P.liqF;
        tk.liquid.position.y = LIQ_BASE + LIQ_H * P.liqF / 2;
        tk.pad.rotation.y = t / 700;                 // the paddles turn slowly, as these machines do
      }
      P.glass.visible = true;
      const fill = pouring ? Math.min(1, ((now() - it.pour) % 1500) / 900) : .35;
      P.juice.scale.y = Math.max(.08, fill);
      P.juice.position.y = .006 + .11 * Math.max(.08, fill) / 2;
    }
    // steam
    (P.puffs || []).forEach((sp, i) => {
      const k = ((t / 1300) + i / 3) % 1;
      sp.visible = !!cooking; if (!cooking) return;
      const base = it.type === 'stove' ? [.02, 1.05, .03] : it.type === 'coffee' ? [0, 1.1, .33] : [0, .95, .22];
      sp.position.set(base[0] + Math.sin(t / 500 + i * 2) * .04, base[1] + k * .45, base[2]); sp.material.opacity = .55 * (1 - k) * Math.min(1, k * 4); sp.scale.setScalar(.12 + k * .22);
    });
    // ready: floating dish + halo
    if (P.halo) P.halo.visible = !!ready;
    if (ready && P.halo) {
      // the halo turns amber and pulses faster as the dish gets close to burning
      const risk = Math.min(1, over / burnAfter(R));
      P.halo.material.emissiveIntensity = 1.6 + Math.sin(t / (200 - risk * 130)) * (.7 + risk);
      P.halo.material.color.setHex(risk > .55 ? 0xe8893f : 0xffd98a);
    }
    const want = ready ? R.id : burnt ? 'burnt' : null;
    if (entry.readyKey !== want) { if (P.readyFood) disposeTree(P.readyFood); P.readyFood = null; entry.readyKey = want; if (want === 'burnt') { P.readyFood = burntPuff(); entry.group.add(P.readyFood); } else if (want) { P.readyFood = food3d(want); P.readyFood.scale.setScalar(3.2); entry.group.add(P.readyFood); } }
    if (P.readyFood) { P.readyFood.position.set(0, 1.12 + Math.sin(t / 260) * .05, 0); P.readyFood.rotation.y = t / 700 - entry.group.rotation.y; }
  }
  if (it.type === 'jukebox' && P.glow) P.glow.material.emissive.setHSL(((t / 25) % 360) / 360, .8, .62);
  // highlight ring (hover / selection) + tap bounce
  if (!P.ring) return;
  const hl = o.selected ? .85 : o.hover ? .55 : 0;
  P.ring.material.opacity += (hl - P.ring.material.opacity) * .25;
  P.ring.material.color.set(o.selected ? 0xffc94a : 0xfff2c4);
  const s = 1 + (o.selected ? Math.sin(t / 180) * .02 : 0);
  let sy = s, sxz = s;
  if (entry.bounceT) { const k = (t - entry.bounceT) / 380; if (k >= 1) entry.bounceT = 0; else { sy = 1 - Math.sin(k * Math.PI) * .12 * (1 - k) * Math.cos(k * 9); sxz = 1 + (1 - sy) * .6; } }
  entry.body.scale.set(sxz, sy, sxz);
}
// food served on a table, placed towards each diner
// the empty plate and crumbs a guest leaves behind, until a waiter wipes the table
function dirtyDishes() {
  const g = new THREE.Group();
  cyl(g, .26, .23, .022, '#f4ece2', 0, 0, 0, { rough: .35, coat: .4 }, 20);
  cyl(g, .2, .2, .009, '#e7dbcc', 0, .017, 0, { rough: .5 }, 18);
  for (const [x, z, r] of [[.05, .03, .022], [-.04, .06, .017], [.02, -.06, .015]]) sphere(g, r, '#c9a97e', x, .026, z, { rough: .9 });
  cyl(g, .012, .012, .17, '#cfc8c0', .1, .03, .08, { rough: .3, metal: .6 }, 6).rotation.set(0, .4, 1.45);
  return g;
}
export function updateTableFood(entry, foods, dirty) {
  const key = (dirty ? 'D' : '') + (foods || []).map(f => f.r + f.dir + (f.eaten > .66 ? 'e' : '')).join(',');
  if (entry.tfKey !== key) {
    entry.tfKey = key;
    for (const f of entry.tfoods || []) disposeTree(f); entry.tfoods = [];
    if (dirty) { const d = dirtyDishes(); d.position.set(0, entry.topY, 0); entry.group.add(d); entry.tfoods.push(d); d.userData.f = { eaten: 0, dirty: 1 }; }
    for (const f of foods || []) {
      const m = food3d(f.r); const D = [[0, 1], [1, 0], [0, -1], [-1, 0]][f.dir];
      // table group is rotated; place in world-aligned offset by undoing its yaw
      const v = new THREE.Vector3(D[0] * .12, entry.topY, D[1] * .12).applyAxisAngle(new THREE.Vector3(0, 1, 0), -entry.group.rotation.y);
      m.position.copy(v); m.scale.setScalar(2.7); entry.group.add(m); entry.tfoods.push(m); m.userData.f = f;
    }
  }
  for (const m of entry.tfoods || []) { const f = m.userData.f; if (f.dirty) continue; m.scale.setScalar(2.7 * (1 - (f.eaten || 0) * .35)); }
}
