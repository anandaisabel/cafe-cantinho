// Game state, derived values and persistence (device + account)
import { START_SIZE, START_COINS, ITEMS, xpForLevel, GOALS, gemsForLevel, isWallItem, canHoldWall, energyMax, ENERGY_REGEN_S } from './config.js';
import { now, wall, setClock, uid, emit } from './util.js';
import { DIRS, doorY } from './path.js';
import { FIREBASE_CONFIG } from './firebase-config.js';
import { connectFirebase } from './net-firebase.js';
import { loginScreen, takenOverScreen } from './login.js';

export const G = {
  S: null,            // the player's saved state
  world: null,        // running simulation (own café or a neighbour's)
  mode: 'play',       // 'play' | 'edit'
  sel: null,          // selected item id (edit mode)
  pending: null,      // item being placed {item, source:'shop'|'inv', price}
  visiting: null,
  db: null, user: null, me: null, docRef: null,
  gifts: [], cafes: {},
  net: null,          // 'claude' (artifact db) | 'firebase' (GitHub Pages) | null (this device only)
  sound: true,
};

export function freshState() {
  const I = (type, x, y, rot = 0) => ({ id: uid(), type, x, y, rot });
  return {
    v: 4, name: 'Meu Cantinho', coins: START_COINS, gems: 0, spice: {}, xp: 0, size: START_SIZE,
    floor: 'wood', wall: 'peach', owned: { floor: ['wood'], wall: ['peach'] },
    items: [
      I('door_wood', 0, START_SIZE - 2), I('win_classic', 1, 0), I('win_classic', 0, 2), I('sconce', 3, 0), I('sconce', 0, 1),
      I('counter', 2, 0), I('stove', 3, 0),   // no coffee machine at the start: it is bought in the shop
      I('table_round', 2, 2), I('chair_wood', 1, 2, 1), I('chair_wood', 3, 2, 3),
      I('table_round', 4, 4), I('chair_wood', 4, 3, 0), I('chair_wood', 5, 4, 3),
    ],
    inv: {},
    market: { at: -1e9, seed: 1, items: [] },
    sconceMig: 1,
    energy: { v: 30, t: 0 },
    pop: 10,
    avatar: { id: 'avatar', role: 'owner', name: 'Chef', look: { body: 'adult', model: 4 } },
    staff: [{ id: uid(), name: 'Bia', role: 'waiter', look: { body: 'adult', skin: '#f5cba7', hair: '#6b4430', style: 'bun', shirt: '#f2a7a0', pants: '#5b6b8c', model: 3 } }],
    stats: { served: 0, cooked: 0, bought: 0, happy: 0, hired: 0, expanded: 0, earned: 0, angry: 0 },
    goals: [], rep: [], lastSeen: wall(), t: 0, daily: { d: '', sent: [] }, lv: 1,
    open: true, world: { min: 8 * 60, day: 1 },
  };
}

export function migrate(st) {
  if (!st || !st.items) return freshState();
  if (st.v !== 4) return freshState();   // fresh start for the new version
  if (!Number.isFinite(st.xp) || st.xp < 0) st.xp = 0;
  if (!Number.isFinite(st.coins)) st.coins = START_COINS;
  if (!Number.isFinite(st.gems) || st.gems < 0) st.gems = 0;            // Diamantes, the premium currency
  if (!st.spice || typeof st.spice !== 'object') st.spice = {};          // special ingredients in stock
  if (!st.market || typeof st.market !== 'object') st.market = { at: -1e9, seed: 1, items: [] };   // the stall's rotating stock
  // saves from before windows and doors were objects: give them the openings the room used to draw
  if (!st.items.some(i => ITEMS[i.type] && ITEMS[i.type].kind === 'door')) st.items.push({ id: uid(), type: 'door_wood', x: 0, y: Math.max(0, st.size - 2), rot: 0 });
  if (!st.items.some(i => ITEMS[i.type] && ITEMS[i.type].kind === 'window')) {
    st.items.push({ id: uid(), type: 'win_classic', x: 1, y: 0, rot: 0 });
    if (st.size >= 7) st.items.push({ id: uid(), type: 'win_classic', x: Math.min(st.size - 2, 4), y: 0, rot: 0 });
    st.items.push({ id: uid(), type: 'win_classic', x: 0, y: Math.max(1, st.size - 5), rot: 0 });
  }
  // saves from before sconces were objects: put the ones the walls used to draw back as movable items
  if (!st.sconceMig) {
    st.sconceMig = 1;
    const n = st.size, wallFree = (x, y) => !st.items.some(i => i.x === x && i.y === y && ITEMS[i.type] && (ITEMS[i.type].kind === 'window' || ITEMS[i.type].kind === 'door'));
    const near = cells => cells.find(([x, y]) => x >= 0 && y >= 0 && x < n && y < n && wallFree(x, y));
    const dy = (st.items.find(i => ITEMS[i.type] && ITEMS[i.type].kind === 'door') || { y: n - 2 }).y;
    for (const want of [Math.floor(n * .32), Math.floor(n * .72)]) { const c = near([want, want + 1, want - 1, want + 2].map(x => [x, 0]).filter(([x]) => x > 0)); if (c) st.items.push({ id: uid(), type: 'sconce', x: c[0], y: 0, rot: 0 }); }
    { const want = Math.max(1, dy - 2); const c = near([want, want - 1, want + 1, want - 2].map(y => [0, y]).filter(([, y]) => y > 0)); if (c) st.items.push({ id: uid(), type: 'sconce', x: 0, y: c[1], rot: 0 }); }
  }
  if (!Number.isFinite(st.pop)) st.pop = Math.round(Math.min(60, 10 + (st.stats && st.stats.happy || 0) * .1) * 10) / 10;   // popularity, 0–105
  if (!Array.isArray(st.friends)) st.friends = [];   // neighbour codes added by hand (Firebase builds)
  if (!st.energy || !Number.isFinite(st.energy.v)) st.energy = { v: energyMax(level(st)), t: st.t || 0 };   // energy for serving drinks
  // saves made before shelf life existed: treat what is on the counters as freshly placed
  for (const i of st.items || []) if (i.stock && !Number.isFinite(i.stock.at)) i.stock.at = st.t || 0;
  if (st.open === undefined) st.open = true;
  if (!st.world || typeof st.world !== 'object') st.world = { min: 8 * 60, day: 1 };
  if (!Number.isFinite(st.t) || st.t < 0) st.t = 0;   // game clock, resumes where it stopped
  st.inv = st.inv || {}; st.stats = { ...freshState().stats, ...st.stats }; st.goals = st.goals || []; st.rep = st.rep || [];
  st.owned = st.owned || { floor: ['wood'], wall: ['peach'] }; st.daily = st.daily || { d: '', sent: [] };
  st.items = st.items.filter(i => ITEMS[i.type]);
  if (!st.avatar || typeof st.avatar !== 'object') st.avatar = freshState().avatar;
  st.avatar.id = 'avatar'; st.avatar.role = 'owner';
  if (!st.avatar.look || typeof st.avatar.look !== 'object') st.avatar.look = { body: 'adult', model: 4 };
  if (!Number.isFinite(st.avatar.look.model)) st.avatar.look.model = 4;
  if (!st.avatar.name) st.avatar.name = 'Chef';
  // hired chefs used to cook on their own; now only the player's avatar starts recipes
  for (const s of st.staff || []) if (s.role === 'chef') s.role = 'waiter';
  for (const s of st.staff || []) if (s.look && s.name === 'Bia' && !Number.isFinite(s.look.model)) s.look.model = 3;
  return st;
}

// ---------- derived ----------
export const level = (st = G.S) => { let l = 1; while (l < 99 && st.xp >= xpForLevel(l + 1)) l++; return l; };
export const charm = st => st.items.reduce((s, i) => s + (ITEMS[i.type].charm || 0), 0);
export const itemAt = (st, x, y) => st.items.find(i => i.x === x && i.y === y && !isWallItem(i));
export const wallAt = (st, x, y) => st.items.find(i => i.x === x && i.y === y && isWallItem(i));
export const rep = st => st.rep.length ? st.rep.reduce((a, b) => a + b, 0) / st.rep.length : .8;

// a chair is a usable seat when it faces a table
export function seatInfo(st, chair) {
  if (ITEMS[chair.type].kind !== 'chair') return null;
  const [dx, dy] = DIRS[chair.rot || 0];
  const t = itemAt(st, chair.x + dx, chair.y + dy);
  return t && ITEMS[t.type].kind === 'table' ? t : null;
}
export const seats = st => st.items.filter(i => seatInfo(st, i));

export function goalProgress(st, g) {
  if (g.stat) return st.stats[g.stat] || 0;
  if (g.count === 'seats') return seats(st).length;
  if (g.count === 'charm') return charm(st);
  if (g.count === 'level') return level(st);
  return 0;
}
export const activeGoals = st => GOALS.filter(g => !st.goals.includes(g.id)).slice(0, 5);
export const claimable = st => activeGoals(st).filter(g => goalProgress(st, g) >= g.goal).length;

export function addXP(n) {
  const S = G.S, before = level(S);
  if (!Number.isFinite(n)) return;
  S.xp += n;
  const after = level(S);
  if (after > before) {
    S.lv = after;
    let g = 0; for (let l = before + 1; l <= after; l++) g += gemsForLevel(l);
    if (g) { S.gems = (S.gems || 0) + g; S.stats.gems = (S.stats.gems || 0) + g; }
    emit('levelup', after);
  }
  emit('hud');
}
export function addCoins(n) { G.S.coins += n; if (n > 0) G.S.stats.earned += n; emit('hud'); }
export function addGems(n) { G.S.gems = Math.max(0, (G.S.gems || 0) + n); if (n > 0) G.S.stats.gems = (G.S.stats.gems || 0) + n; emit('hud'); }
export const spiceCount = (id, st = G.S) => (st.spice && st.spice[id]) || 0;
export function addSpice(id, n) { const S = G.S; S.spice = S.spice || {}; S.spice[id] = Math.max(0, (S.spice[id] || 0) + n); emit('hud'); }
// every recipe that needs a special ingredient checks here before it can be started
export function hasIngredients(R, st = G.S) { return !R.need || spiceCount(R.need.id, st) >= (R.need.n || 1); }

// ---------- persistence ----------
let dirty = false;
export const save = () => { dirty = true; };
// Firebase's free plan allows 20k writes a day: the cloud copy is written at most every 30 s
// (and always when the tab is hidden or closed); this device keeps saving every few seconds.
const REMOTE_GAP = 30000;
let remoteDirty = false, lastRemote = 0;
// device copy: one per account on GitHub Pages (two people on one phone never share a café); the plain key elsewhere
const LEGACY_KEY = 'cafecantinho4';
let localKey = LEGACY_KEY;
// the same café open on two devices or tabs: the newest session wins and the older one stops saving
let claimed = false;
export async function flush(force) {
  if ((!dirty && !force && !remoteDirty) || !G.S) return;
  if (dirty || force) {
    dirty = false; G.S.lastSeen = wall(); G.S.t = now();
    try { localStorage.setItem(localKey, JSON.stringify(G.S)); } catch (e) { }
    remoteDirty = true;
  }
  if (!G.docRef || !remoteDirty) return;
  if (!force && G.net === 'firebase' && Date.now() - lastRemote < REMOTE_GAP) return;
  remoteDirty = false; lastRemote = Date.now();
  const ref = G.docRef;
  try { await ref.set(G.sess ? { ...G.S, owner: G.me, sess: G.sess } : { ...G.S, owner: G.me }); claimed = true; } catch (e) { remoteDirty = true; }
}
setInterval(flush, 3000);
addEventListener('pagehide', () => flush(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(true); });

const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsJson = k => { try { return JSON.parse(lsGet(k)); } catch (e) { return null; } };
function docData(d) { if (!d) return null; if (typeof d.data === 'function') return d.data(); if (d.data !== undefined) return d.data; return d; }
export function docsOf(snap) { const arr = snap?.docs || snap || []; return Array.from(arr).map(d => ({ id: d.id || d.path?.split('/').pop(), data: docData(d) })); }

export async function load() {
  let local = lsJson(LEGACY_KEY), noNet = false;
  let remote = null, isNew = false;
  const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
  try {
    if (window.claude && window.claude.use) {
      const [db, user] = await withTimeout(Promise.all([claude.use("db"), claude.use("user")]), 7000) || [];
      G.db = db || null; G.user = user || null; if (G.db) G.net = 'claude';
      if (G.user) G.me = await G.user.id();
      if (G.db && G.me) {
        G.docRef = G.db.doc('cafes/' + G.me);
        remote = docData(await withTimeout(G.docRef.get(), 6000));
      }
    } else if (FIREBASE_CONFIG && !/[?&]offline/.test(location.search)) {   // ?offline: local testing without touching the live database
      // outside claude.ai: an account is required (e-mail, Google); the café lives in Firestore under that account
      const r = await withTimeout(connectFirebase(FIREBASE_CONFIG), 15000);
      if (!r) {
        // no connection: a device that already signed in keeps playing from its copy; a new one has to wait
        const last = lsGet('cc_last_uid'), mine = last && lsJson(LEGACY_KEY + ':' + last);
        if (!mine) { noNet = true; throw new Error('offline'); }
        localKey = LEGACY_KEY + ':' + last; local = mine;
      } else {
        const before = r.account.user();
        const legacy = lsJson(LEGACY_KEY);
        if (!before || before.anonymous) await loginScreen(r.account, { hasCafe: !!(before || (legacy && legacy.items)) });
        G.db = r.db; G.user = r.user; G.net = 'firebase'; G.me = await G.user.id(); G.sess = uid();
        localKey = LEGACY_KEY + ':' + G.me;
        try { localStorage.setItem('cc_last_uid', G.me); } catch (e) { }
        G.docRef = G.db.doc('cafes/' + G.me);
        remote = docData(await withTimeout(G.docRef.get(), 8000));
        local = lsJson(localKey);
        // an account with no café yet takes the one this device was playing before accounts existed
        if (!(remote && remote.items) && !local) {
          let carry = null;
          if (before && before.anonymous && before.uid !== G.me) carry = docData(await withTimeout(G.db.doc('cafes/' + before.uid).get(), 6000));
          local = (carry && carry.items) ? carry : legacy;
          if (local) { try { localStorage.removeItem(LEGACY_KEY); } catch (e) { } }
        }
        // the newest session wins: once this one has written, another session's write means it took over
        G.docRef.onSnapshot(s => { const d = docData(s); if (claimed && d && d.sess && d.sess !== G.sess && G.docRef) { G.docRef = null; takenOverScreen(); } }, () => { });
      }
    }
  } catch (e) { if (noNet) throw new Error('Sem internet para entrar na sua conta. Confira a conexão e abra de novo.'); }
  let st;
  // work on a plain copy: data coming back from the account store may be read-only
  if (remote && remote.items) { try { st = JSON.parse(JSON.stringify(remote)); } catch (e) { st = { ...remote }; } delete st.owner; delete st.sess; }
  else { st = local; isNew = !local; }
  if (!st || st.v !== 4) isNew = true;
  G.S = migrate(st);
  if (!G.S.world || typeof G.S.world !== 'object') G.S = { ...G.S, world: { min: 8 * 60, day: 1 } };
  G.S.lv = level(G.S);
  if (G.docRef && (G.sess || !(remote && remote.v === 4))) { save(); flush(true); }   // a new session claims the café right away
  return { isNew, online: !!(G.db && G.me) };
}
export function resetGame() {
  G.S = freshState(); save(); flush(true);
}

// ---- energy (serving drinks): refills one point per ENERGY_REGEN_S of game time ----
export function energy(st = G.S) {
  const max = energyMax(level(st)), e = st.energy || (st.energy = { v: max, t: now() }), step = ENERGY_REGEN_S * 1000;
  if (e.v >= max) { e.v = Math.min(e.v, max); e.t = now(); return { v: e.v, max, next: 0 }; }
  const gained = Math.floor((now() - e.t) / step);
  if (gained > 0) { e.v = Math.min(max, e.v + gained); e.t += gained * step; if (e.v >= max) e.t = now(); }
  return { v: e.v, max, next: e.v >= max ? 0 : Math.ceil((step - (now() - e.t)) / 1000) };
}
export function spendEnergy(n, st = G.S) { const e = energy(st); if (e.v < n) return false; if (e.v >= e.max) st.energy.t = now(); st.energy.v -= n; save(); emit('hud'); return true; }

// ---- popularity (0–105, Café Mania style): +0.1 per happy guest, −0.3 per guest who leaves upset ----
export const POP_MAX = 105;
export function addPop(d, st = G.S) { st.pop = Math.round(Math.max(0, Math.min(POP_MAX, (st.pop || 0) + d)) * 10) / 10; emit('hud'); return st.pop; }
