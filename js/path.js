// Grid pathfinding (BFS — grids are small, so this is fast and exact)
import { ITEMS } from './config.js';
const isOpening = it => ITEMS[it.type] && (ITEMS[it.type].kind === 'window' || ITEMS[it.type].kind === 'door');
// the door is an item on the left wall; fall back to the old fixed row if a save has none yet
export const doorY = st => {
  const d = (st.items || []).find(i => ITEMS[i.type] && ITEMS[i.type].kind === 'door');
  return d ? Math.max(0, Math.min(st.size - 1, d.y)) : st.size - 2;
};
export const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // rot 0..3 => +y, +x, -y, -x

export function blockedGrid(st) {
  const n = st.size, g = new Uint8Array(n * n);
  for (const it of st.items) if (!isOpening(it) && it.x >= 0 && it.y >= 0 && it.x < n && it.y < n) g[it.y * n + it.x] = 1;
  return g;
}

// start: [x,y] tile. goals: array of [x,y]. allow: tiles walkable even if blocked (destination chair, own tile)
export function findPath(st, start, goals, allow = []) {
  const n = st.size, g = blockedGrid(st);
  const key = (x, y) => y * n + x;
  const ok = new Set(allow.map(([x, y]) => key(x, y)));
  const goalSet = new Set(goals.map(([x, y]) => key(x, y)));
  let [sx, sy] = start;
  sx = Math.max(0, Math.min(n - 1, sx)); sy = Math.max(0, Math.min(n - 1, sy));
  const sk = key(sx, sy);
  if (goalSet.has(sk)) return [[sx, sy]];
  const prev = new Int32Array(n * n).fill(-2); prev[sk] = -1;
  const q = [sk];
  for (let qi = 0; qi < q.length; qi++) {
    const k = q[qi], x = k % n, y = (k / n) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const nk = key(nx, ny);
      if (prev[nk] !== -2) continue;
      if (g[nk] && !ok.has(nk) && !goalSet.has(nk)) continue;
      prev[nk] = k;
      if (goalSet.has(nk)) {
        const path = []; let c = nk;
        while (c !== -1) { path.push([c % n, (c / n) | 0]); c = prev[c]; }
        return path.reverse();
      }
      q.push(nk);
    }
  }
  return null;
}

// free neighbour tiles around an item (where a person can stand to use it)
export function standTiles(st, it) {
  const n = st.size, g = blockedGrid(st), out = [];
  for (const [dx, dy] of DIRS) {
    const x = it.x + dx, y = it.y + dy;
    if (x >= 0 && y >= 0 && x < n && y < n && !g[y * n + x]) out.push([x, y]);
  }
  return out;
}

// free tiles near an item (diagonals and one ring further out), closest first: where someone can
// reach a table that is boxed in by chairs, walls or other tables on all four sides
export function nearTiles(st, it, r = 2) {
  const n = st.size, g = blockedGrid(st), out = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = it.x + dx, y = it.y + dy;
    if ((dx || dy) && x >= 0 && y >= 0 && x < n && y < n && !g[y * n + x]) out.push([x, y, Math.hypot(dx, dy)]);
  }
  return out.sort((a, b) => a[2] - b[2]).map(([x, y]) => [x, y]);
}
