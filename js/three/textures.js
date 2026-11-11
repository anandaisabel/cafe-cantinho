// Procedural canvas textures: floors, wallpapers, faces, signs
import { THREE } from './engine.js';
import { SHARED } from './kit.js';
import { FLOORS, WALLS } from '../config.js';

const cache = new Map();
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function shared(t) { SHARED.add(t); return t; }
function tex(c, repeat) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; }
const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

// one floor tile, drawn in a S×S square
export function drawFloor(x, key, S = 128, seed = 1) {
  const F = FLOORS[key] || FLOORS.wood, r = rnd(seed * 97 + 13);
  if (F.kind === 'planks') {
    for (let i = 0; i < 4; i++) {
      const y = i * S / 4, off = r() * S;
      for (let k = -2; k < 2; k++) {
        const x0 = off + k * S * .8;
        const sh = (r() - .5) * 18;
        x.fillStyle = shade(F.a, sh); x.fillRect(x0, y, S * .8, S / 4);
        x.strokeStyle = 'rgba(120,80,45,.15)'; x.lineWidth = 1;
        for (let g = 0; g < 3; g++) { x.beginPath(); const gy = y + 4 + r() * (S / 4 - 8); x.moveTo(x0 + 4, gy); x.bezierCurveTo(x0 + S * .3, gy + 2, x0 + S * .5, gy - 2, x0 + S * .78, gy + 1); x.stroke(); }
        x.fillStyle = 'rgba(110,70,40,.16)'; x.fillRect(x0, y, 1.5, S / 4);
      }
      x.fillStyle = 'rgba(110,70,40,.2)'; x.fillRect(0, y, S, 1.5);
    }
  } else if (F.kind === 'checker') {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? F.b : F.a; x.fillRect(i * S / 2, j * S / 2, S / 2, S / 2); }
    x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; x.strokeRect(0, 0, S, S); x.beginPath(); x.moveTo(S / 2, 0); x.lineTo(S / 2, S); x.moveTo(0, S / 2); x.lineTo(S, S / 2); x.stroke();
  } else if (F.kind === 'tiles') {
    x.fillStyle = F.b; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = shade(F.a, (r() - .5) * 16); round(x, i * S / 2 + 3, j * S / 2 + 3, S / 2 - 6, S / 2 - 6, 6); x.fill(); x.fillStyle = 'rgba(255,255,255,.12)'; round(x, i * S / 2 + 6, j * S / 2 + 6, S / 2 - 12, S / 6, 4); x.fill(); }
  } else if (F.kind === 'hydraulic') {
    x.fillStyle = F.b; x.fillRect(0, 0, S, S);
    x.fillStyle = F.a; x.beginPath(); x.moveTo(S / 2, S * .1); x.lineTo(S * .9, S / 2); x.lineTo(S / 2, S * .9); x.lineTo(S * .1, S / 2); x.closePath(); x.fill();
    x.fillStyle = F.b; x.beginPath(); x.arc(S / 2, S / 2, S * .18, 0, 7); x.fill();
    x.fillStyle = '#e8a59a'; for (const [a, b] of [[0, 0], [S, 0], [0, S], [S, S]]) { x.beginPath(); x.arc(a, b, S * .16, 0, 7); x.fill(); }
    x.fillStyle = F.a; x.beginPath(); x.arc(S / 2, S / 2, S * .07, 0, 7); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; x.strokeRect(0, 0, S, S);
  } else if (F.kind === 'herring') {
    const w = S / 4;
    for (let i = -1; i < 5; i++) for (let j = -1; j < 5; j++) {
      x.save(); x.translate(i * w * 2 + (j % 2) * w, j * w); x.rotate(j % 2 ? Math.PI / 4 : -Math.PI / 4);
      x.fillStyle = shade((i + j) % 2 ? F.a : F.b, (r() - .5) * 14); x.fillRect(0, 0, w * 1.4, w * .7);
      x.strokeStyle = 'rgba(70,40,20,.3)'; x.strokeRect(0, 0, w * 1.4, w * .7); x.restore();
    }
  }
}
export function floorTexture(key, n) {
  const k = 'f' + key; let t = cache.get(k);
  if (!t) { const S = 256, [c, x] = canvas(S * 2, S * 2); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.save(); x.translate(i * S, j * S); x.beginPath(); x.rect(0, 0, S, S); x.clip(); x.scale(2, 2); drawFloor(x, key, 128, i * 2 + j + 1); x.restore(); } t = tex(c, true); cache.set(k, shared(t)); }
  const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(n / 2, n / 2); tt.userData.disposable = true; return tt;
}

// wallpaper: one tile wide (S px) × wall height (H px)
export function drawWall(x, key, S = 128, H = 280) {
  const W = WALLS[key] || WALLS.peach;
  x.fillStyle = W.a; x.fillRect(0, 0, S, H);
  if (W.kind === 'stripes') { for (let i = 0; i < 6; i += 2) { x.fillStyle = W.b; x.fillRect(i * S / 6, 0, S / 6, H); } x.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 6; i += 2) x.fillRect(i * S / 6 + S / 12 - 1, 0, 2, H); }
  if (W.kind === 'dots') { for (let j = 0; j < H / 22; j++) for (let i = 0; i < 4; i++) { x.fillStyle = W.b; x.beginPath(); x.arc(i * S / 4 + (j % 2) * S / 8 + S / 16, j * 22 + 11, 4.5, 0, 7); x.fill(); } }
  if (W.kind === 'wainscot') { x.fillStyle = W.b; x.fillRect(0, H * .58, S, H * .42); x.strokeStyle = 'rgba(80,50,90,.25)'; x.lineWidth = 3; for (let i = 0; i < 2; i++) { round(x, i * S / 2 + 8, H * .62, S / 2 - 16, H * .32, 6); x.stroke(); } x.fillStyle = W.trim; x.fillRect(0, H * .56, S, 10); }
  if (W.kind === 'floral') { for (let j = 0; j < 5; j++) for (let i = 0; i < 2; i++) { const cx = i * S / 2 + (j % 2) * S / 4 + S / 8, cy = j * 56 + 26; for (let p = 0; p < 5; p++) { const a = p * 1.256; x.fillStyle = W.b; x.beginPath(); x.arc(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 6, 0, 7); x.fill(); } x.fillStyle = W.trim; x.beginPath(); x.arc(cx, cy, 4, 0, 7); x.fill(); x.fillStyle = '#9cc39a'; x.beginPath(); x.ellipse(cx + 13, cy + 10, 7, 3, .6, 0, 7); x.fill(); } }
  if (W.kind === 'brick') { for (let j = 0; j < H / 24; j++) for (let i = -1; i < 3; i++) { x.fillStyle = shade(W.b, ((i * 7 + j * 3) % 5 - 2) * 6); round(x, i * S / 2 + (j % 2) * S / 4 + 3, j * 24 + 3, S / 2 - 6, 18, 3); x.fill(); } }
}
export function wallTexture(key, n) {
  const k = 'w' + key; let t = cache.get(k);
  if (!t) { const [c, x] = canvas(256, 560); x.scale(2, 2); drawWall(x, key); t = tex(c, true); cache.set(k, shared(t)); }
  const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(n, 1); tt.userData.disposable = true; return tt;
}
// swatch for the shop (2D)
export function swatch(floorKey, wallKey, size = 72) {
  const [c, x] = canvas(size * 2, size * 2); x.scale(2, 2);
  x.save(); x.beginPath(); x.roundRect ? x.roundRect(0, 0, size, size, 14) : x.rect(0, 0, size, size); x.clip();
  x.save(); x.scale(size / 128, (size * .5) / 280); drawWall(x, wallKey); x.restore();
  x.save(); x.translate(0, size * .5); x.scale(size / 128, size / 256); drawFloor(x, floorKey); x.restore();
  x.fillStyle = (WALLS[wallKey] || WALLS.peach).trim; x.fillRect(0, size * .5 - 3, size, 4);
  x.restore();
  c.style.width = c.style.height = size + 'px'; return c;
}

// character faces (transparent), by mood and accessories
export function faceTexture(mood, glasses, mustache, hair, eye = '#3a2418', lashes = false) {
  const k = `face${mood}${glasses ? 1 : 0}${mustache ? 1 : 0}${hair}${eye}${lashes ? 1 : 0}`; if (cache.has(k)) return cache.get(k);
  const [c, x] = canvas(256, 128);
  const ey = 64, ex = 40, cx = 128;
  x.lineCap = 'round'; x.lineJoin = 'round';
  // soft blush
  for (const s of [-1, 1]) { const g = x.createRadialGradient(cx + s * 66, 88, 2, cx + s * 66, 88, 22); g.addColorStop(0, 'rgba(255,120,135,.6)'); g.addColorStop(1, 'rgba(255,120,135,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(cx + s * 66, 88, 24, 14, 0, 0, 7); x.fill(); }
  x.strokeStyle = '#3a2418'; x.fillStyle = '#3a2418';
  // eyebrows (soft)
  x.lineWidth = 4; x.strokeStyle = 'rgba(58,36,24,.7)';
  for (const s of [-1, 1]) { x.beginPath(); if (mood === 'angry') { x.moveTo(cx + s * (ex + 18), ey - 34); x.lineTo(cx + s * (ex - 12), ey - 24); } else if (mood === 'sad') { x.moveTo(cx + s * (ex + 16), ey - 26); x.lineTo(cx + s * (ex - 10), ey - 33); } else { x.arc(cx + s * ex, ey - 16, 16, Math.PI * 1.25, Math.PI * 1.75); } x.stroke(); }
  if (mood === 'eating' || mood === 'joy') {
    x.lineWidth = 7; x.strokeStyle = '#3a2418';
    for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * ex, ey + 8, 15, Math.PI + .35, -.35); x.stroke(); }
  } else {
    for (const s of [-1, 1]) {
      const X = cx + s * ex;
      x.fillStyle = '#2a1a12'; x.beginPath(); x.ellipse(X, ey, 17, 22, 0, 0, 7); x.fill();                 // outline
      const g = x.createLinearGradient(0, ey - 20, 0, ey + 22); g.addColorStop(0, '#1e140e'); g.addColorStop(1, eye);
      x.fillStyle = g; x.beginPath(); x.ellipse(X, ey + 1, 14, 19, 0, 0, 7); x.fill();                      // iris
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(X + 5, ey - 8, 6.5, 7.5, 0, 0, 7); x.fill();           // sparkle
      x.beginPath(); x.arc(X - 5, ey + 9, 3.2, 0, 7); x.fill();
      if (lashes) { x.strokeStyle = '#2a1a12'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(X + s * 14, ey - 12); x.lineTo(X + s * 21, ey - 18); x.moveTo(X + s * 15, ey - 4); x.lineTo(X + s * 23, ey - 7); x.stroke(); }
    }
  }
  if (glasses) { x.strokeStyle = '#6b4430'; x.lineWidth = 5; for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * ex, ey, 27, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(cx - ex + 27, ey); x.lineTo(cx + ex - 27, ey); x.stroke(); }
  // mouth
  x.strokeStyle = '#5a2a1a'; x.lineWidth = 5.5; x.beginPath();
  const my = 94;
  if (mood === 'happy' || mood === 'joy') { x.moveTo(cx - 11, my - 3); x.quadraticCurveTo(cx, my + 9, cx + 11, my - 3); x.stroke(); if (mood === 'joy') { x.fillStyle = '#c94a4a'; x.beginPath(); x.moveTo(cx - 10, my - 2); x.quadraticCurveTo(cx, my + 14, cx + 10, my - 2); x.fill(); } }
  else if (mood === 'eating') { x.fillStyle = '#9c3a2c'; x.beginPath(); x.ellipse(cx, my, 8, 7, 0, 0, 7); x.fill(); }
  else if (mood === 'ok') { x.moveTo(cx - 8, my); x.lineTo(cx + 8, my); x.stroke(); }
  else { x.arc(cx, my + 10, 10, Math.PI + .4, -.4); x.stroke(); }
  if (mustache) { x.fillStyle = hair || '#ddd'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 13, my - 10, 15, 7, s * .3, 0, 7); x.fill(); } }
  const t = shared(tex(c)); cache.set(k, t); return t;
}
export function labelTexture(draw, w = 256, h = 128, keep) { const [c, x] = canvas(w, h); draw(x, w, h); const t = tex(c); if (!keep) t.userData.disposable = true; return t; }
export function radialTexture(inner = 'rgba(0,0,0,.45)', outer = 'rgba(0,0,0,0)') {
  const k = 'rad' + inner + outer; if (cache.has(k)) return cache.get(k);
  const [c, x] = canvas(128, 128), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = shared(tex(c)); cache.set(k, t); return t;
}

function round(x, a, b, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); }
function shade(hex, amt) {
  const c = hex.replace('#', ''); let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// the view through a window: one cached sky/garden panel shared by every pane
let skyT = null;
export function skyTexture() {
  if (skyT) return skyT;
  skyT = labelTexture((x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fd3f0'); g.addColorStop(.7, '#e3f4f6'); g.addColorStop(1, '#fff6df');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.9)'; for (const [a, b, r] of [[60, 40, 18], [80, 36, 22], [100, 42, 16], [190, 70, 14], [206, 66, 18]]) { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); }
    x.fillStyle = '#a6d494'; x.beginPath(); x.ellipse(70, h, 120, 46, 0, 0, 7); x.fill(); x.fillStyle = '#8cc47c'; x.beginPath(); x.ellipse(200, h + 6, 110, 40, 0, 0, 7); x.fill();
    x.fillStyle = '#6fa864'; x.beginPath(); x.arc(196, h - 52, 22, 0, 7); x.fill(); x.fillStyle = '#8a5a3e'; x.fillRect(193, h - 34, 6, 20);
  }, 256, 256, true);;
  SHARED.add(skyT); return skyT;
}
