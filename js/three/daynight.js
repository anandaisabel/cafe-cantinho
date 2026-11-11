// Day/night lighting driven by the world clock (never by the café state).
import { THREE, E, paintSky } from './engine.js';

// keyframes by hour: sky (top, mid, bottom), sun colour/intensity, ambient sky/ground/intensity, exposure
const K = [
  { h: 0,    sky: ['#0b1130', '#1b2650', '#2e335a'], sun: '#8aa0ff', si: .22, amb: ['#5e6aa8', '#2a2440'], ai: .26, exp: .9 },
  { h: 4.6,  sky: ['#0f1636', '#232e5c', '#3e3f68'], sun: '#8aa0ff', si: .22, amb: ['#5e6aa8', '#2a2440'], ai: .28, exp: .9 },
  { h: 5.6,  sky: ['#36457a', '#c08fa8', '#f0a882'], sun: '#ffab80', si: .55, amb: ['#b9a2bf', '#5f4a56'], ai: .45, exp: .9 },
  { h: 6.6,  sky: ['#86b6dd', '#f5c9aa', '#ffbf8e'], sun: '#ffbe90', si: 1.4, amb: ['#ffdcc4', '#86675a'], ai: .58, exp: .88 },
  { h: 8.5,  sky: ['#95c8ec', '#d6ecfb', '#f8e6d4'], sun: '#ffeed2', si: 2.1, amb: ['#fff0e2', '#93745e'], ai: .66, exp: .86 },
  { h: 12,   sky: ['#82c2ee', '#d2eafb', '#f3ece3'], sun: '#fff7ea', si: 2.3, amb: ['#fbf6ee', '#987c62'], ai: .68, exp: .85 },
  { h: 15.5, sky: ['#93c6ea', '#e2eaf0', '#f6e0cb'], sun: '#ffecd0', si: 2.2, amb: ['#fff0e0', '#93745e'], ai: .66, exp: .86 },
  { h: 17.3, sky: ['#eeac78', '#ffd290', '#ffbb7a'], sun: '#ffb460', si: 2.1, amb: ['#ffdcb6', '#946446'], ai: .6, exp: .9 },
  { h: 18.5, sky: ['#5f5ea0', '#ec8c78', '#ffa86e'], sun: '#ff7c4c', si: 1.1, amb: ['#d9a8a8', '#5e424c'], ai: .46, exp: .92 },
  { h: 19.6, sky: ['#232a5e', '#4c3f76', '#7a5c82'], sun: '#8a9cff', si: .35, amb: ['#7a7cb8', '#33294a'], ai: .32, exp: .92 },
  { h: 21,   sky: ['#0e1534', '#1f2b56', '#333862'], sun: '#8aa0ff', si: .24, amb: ['#5e6aa8', '#2a2440'], ai: .27, exp: .9 },
  { h: 24,   sky: ['#0b1130', '#1b2650', '#2e335a'], sun: '#8aa0ff', si: .22, amb: ['#5e6aa8', '#2a2440'], ai: .26, exp: .9 },
];
const c1 = new THREE.Color(), c2 = new THREE.Color();
const mix = (a, b, t) => c1.set(a).lerp(c2.set(b), t);
const hex = (a, b, t) => '#' + mix(a, b, t).getHexString();
export const NIGHT = { k: 0 };       // 0 = full day, 1 = full night (artificial lights)
// glow that gets stronger at night. 'world' entries are rebuilt with the room; item entries register once per material
let emissives = [];
const panes = [], once = new WeakSet();
export function registerNightGlow(mat, base, group = 'world') { if (group !== 'world') { if (once.has(mat)) return; once.add(mat); } emissives.push({ mat, base, group }); }
export function registerPane(mat) { panes.push(mat); }
export function clearWorldRegistries() { emissives = emissives.filter(e => e.group !== 'world'); panes.length = 0; }

let lastSky = '';
export function applyDayNight(hours, center, size) {
  let i = 0; while (i < K.length - 2 && hours >= K[i + 1].h) i++;
  const a = K[i], b = K[i + 1], t = Math.min(1, Math.max(0, (hours - a.h) / (b.h - a.h)));
  const s = t * t * (3 - 2 * t);
  // sun path: rises behind the left wall, highest behind the back wall at noon, sets to the right
  const day = Math.min(1, Math.max(0, (hours - 6) / 12.6));
  const elev = Math.sin(day * Math.PI);                       // 0 at sunrise/sunset, 1 at noon
  const isDay = hours > 5.7 && hours < 19.3;
  const az = Math.PI + Math.PI * day;
  const sun = E.sun, R = 14;
  if (isDay) sun.position.set(center.x + Math.cos(az) * R * (1 - elev * .6), 2 + elev * 12, center.z + Math.sin(az) * R * (1 - elev * .6) - 2);
  else { const m = (((hours + 24) - 19.3) % 24) / 10.4; sun.position.set(center.x + Math.cos(Math.PI + Math.PI * m) * R * .7, 9, center.z - 6); }
  sun.target.position.set(center.x, 0, center.z);
  sun.color.copy(mix(a.sun, b.sun, s));
  sun.intensity = a.si + (b.si - a.si) * s;
  E.hemi.color.copy(mix(a.amb[0], b.amb[0], s)); E.hemi.groundColor.copy(mix(a.amb[1], b.amb[1], s));
  E.hemi.intensity = a.ai + (b.ai - a.ai) * s;
  E.fill.intensity = .45 * (a.ai + (b.ai - a.ai) * s);
  E.renderer.toneMappingExposure = a.exp + (b.exp - a.exp) * s;
  // artificial lights come on gradually as it gets dark
  const target = hours < 5.8 || hours > 19 ? 1 : hours < 7 ? 1 - (hours - 5.8) / 1.2 : hours > 17.6 ? (hours - 17.6) / 1.4 : 0;
  NIGHT.k += (Math.min(1, Math.max(0, target)) - NIGHT.k) * .05;
  for (const g of emissives) g.mat.emissiveIntensity = g.base * (.12 + .88 * NIGHT.k);
  const pane = mix('#ffffff', '#3a4a7a', NIGHT.k * .85);
  for (const p of panes) p.color.copy(pane);
  if (E.bloom) E.bloom.strength = .3 + NIGHT.k * .25;
  E.scene.environmentIntensity = .28 * (1 - NIGHT.k * .7);
  // repaint the sky only when it visibly changes
  const top = hex(a.sky[0], b.sky[0], s), mid = hex(a.sky[1], b.sky[1], s), bot = hex(a.sky[2], b.sky[2], s);
  const key = top + mid + bot + Math.round(NIGHT.k * 10);
  if (key !== lastSky) { lastSky = key; paintSky(top, mid, bot, NIGHT.k * .9); }
}
