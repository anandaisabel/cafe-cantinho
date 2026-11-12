// Café simulation: customers, waiters, chefs, cooking and economy
import { ITEMS, RECIPES, recipe, burnAfter, keepFor, COUNTER_CAP, MASTERY_AT, BOOSTS, boost, DRINK_CAP, brewTime, brewYield, brewCost, WEAR_WARN, WEAR_MAX, REPAIR_ENERGY, DRINKS, DRINK_BONUS, drinkEnergy, BODIES, SKINS, HAIRS, SHIRTS, PANTS, STYLES } from './config.js';
import { G, level, charm, seats, seatInfo, itemAt, rep, save, addXP, addCoins, addGems, hasIngredients, addSpice, energy, spendEnergy, addPop, stars, masteryBonus, addBoost, boostCount } from './state.js';
import { findPath, standTiles, nearTiles, doorY, DIRS } from './path.js';
import { cafeQuality } from './events.js';
const SIDEWALK = n => n + 1.25, PATHX = -1.0;
// the street outside: customers walk along the sidewalk, up the little path and in through the door
function outsideIn(st) { const n = st.size, dy = doorY(st), dir = Math.random() < .5 ? -1 : 1; return { start: [n / 2 + dir * 11, SIDEWALK(n) - .2], wp: [[PATHX, SIDEWALK(n) - .2], [PATHX, dy + .5], [-.3, dy + .5], [.5, dy + .5]] }; }
function outsideOut(st) { const n = st.size, dy = doorY(st), dir = Math.random() < .5 ? -1 : 1; return [[-.3, dy + .5], [PATHX, dy + .5], [PATHX, SIDEWALK(n) + .2], [n / 2 + dir * 11, SIDEWALK(n) + .2]]; }
import { now, pick, uid, clamp, emit } from './util.js';

const CUST_SPEED = 1.5, STAFF_SPEED = 2.3;
const CAPS = ['#e8706a', '#7d9fd6', '#7fae74', '#f7c948'];

export function randLook(body = pick(BODIES), role) {
  const L = { body, skin: pick(SKINS), hair: pick(HAIRS), style: pick(STYLES), shirt: pick(SHIRTS), pants: pick(PANTS) };
  if (body === 'elder') { L.hair = pick(['#e9e4de', '#cfc8c0', '#b8b0a8']); L.glasses = Math.random() < .6; L.mustache = Math.random() < .4; L.cane = Math.random() < .4; L.style = pick(['short', 'bun', 'curly', 'bob']); }
  if (body === 'kid') { L.cap = Math.random() < .5 ? pick(CAPS) : null; L.style = pick(['short', 'pony', 'spiky', 'bob']); }
  // variety: eyes, outfit, accessory, shoes
  L.eye = pick(['#3a2418', '#4a6fa5', '#3f7a4a', '#6b4430', '#2b2b35']);
  L.lashes = Math.random() < .5;
  L.outfit = pick(body === 'elder' ? ['sweater', 'tee', 'dress'] : ['tee', 'tee', 'dress', 'overalls', 'sweater']);
  L.acc = pick(body === 'elder' ? ['none', 'scarf', 'beret'] : ['none', 'none', 'bow', 'beret', 'beanie', 'scarf', 'bag', 'glasses']);
  if (L.acc === 'glasses') L.glasses = true;
  L.shoes = pick(['#5a4038', '#c0533a', '#3d4f6b', '#f4efe6', '#e89cc0']);
  L.accent = pick(SHIRTS);
  L.model = role === 'chef' ? pick([4, 10, 7, 2, 6]) : role === 'waiter' ? pick([3, 9, 1, 11]) : body === 'elder' ? pick([7, 6, 10, 3, 0]) : Math.floor(Math.random() * 12);   // which of the 12 character models
  return L;
}

// ---------------------------------------------------------------
export function makeWorld(st, own) {
  const w = { st, own, custs: [], staff: [], floats: [], pops: [], tableFood: {}, spawnAt: now() + 2500 };
  syncStaff(w, true);
  return w;
}
export function syncStaff(w, initial) {
  const defs = w.st.avatar ? [w.st.avatar, ...w.st.staff] : w.st.staff;
  const keep = w.staff.filter(s => defs.some(d => d.id === s.id));
  for (const d of defs) if (!keep.some(s => s.id === d.id)) {
    const c = newChar(d.look, d.role);
    c.id = d.id; c.data = d;
    if (initial || d.role === 'owner') { const t = randomFree(w.st, inKitchen(d.role) ? 2 : 99); c.gx = t[0] + .5; c.gy = t[1] + .5; c.alpha = 1; }
    else { const o = outsideIn(w.st); c.gx = o.start[0]; c.gy = o.start[1]; c.alpha = 0; c.wp = o.wp; }
    keep.push(c);
  }
  for (const s of keep) { s.data = defs.find(d => d.id === s.id); s.role = s.data.role; s.look = s.data.look; }
  w.staff = keep;
}
const inKitchen = role => role === 'owner';
function newChar(look, role) {
  return { id: uid(), look, role, gx: 0, gy: 0, wp: [], moving: false, phase: 0, front: true, flip: false, alpha: 1, seed: Math.random() * 10, idleT: Math.random() * 3 };
}
function randomFree(st, maxY = 99) {
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(Math.random() * st.size), y = Math.floor(Math.random() * Math.min(st.size, maxY + 1));
    if (!itemAt(st, x, y) && !(x === 0 && y === doorY(st))) return [x, y];
  }
  return [1, doorY(st)];
}
const tileOf = c => [clamp(Math.floor(c.gx), 0, 99), clamp(Math.floor(c.gy), 0, 99)];

// ---------- pathing ----------
function route(w, c, target) {
  const st = w.st, from = tileOf(c);
  from[0] = Math.min(from[0], st.size - 1); from[1] = Math.min(from[1], st.size - 1);
  let goals, final = null;
  if (target.kind === 'seat') { const ch = st.items.find(i => i.id === target.id); if (!ch) return false; goals = [[ch.x, ch.y]]; final = [ch.x + .5, ch.y + .5]; }
  else if (target.kind === 'item') { const it = st.items.find(i => i.id === target.id); if (!it) return false; goals = standTiles(st, it); if (!goals.length && target.near) goals = nearTiles(st, it); if (Math.abs(from[0] - it.x) + Math.abs(from[1] - it.y) === 1 && !itemAt(st, ...from)) goals.push(from); }
  else if (target.kind === 'exit') { goals = [[0, doorY(st)]]; }
  else if (target.kind === 'tile') { goals = [target.t]; }
  if (!goals || !goals.length) return false;
  const p = findPath(st, from, goals, [from]);
  if (!p) return false;
  const wp = p.slice(1).map(([x, y]) => [x + .5, y + .5]);
  if (Math.hypot(c.gx - (from[0] + .5), c.gy - (from[1] + .5)) > .25 && !c.sitting) wp.unshift([from[0] + .5, from[1] + .5]);
  if (final) { if (wp.length) wp[wp.length - 1] = final; else wp.push(final); }
  if (target.kind === 'exit') wp.push(...outsideOut(st));
  if (target.kind === 'item') { const it = st.items.find(i => i.id === target.id); c.faceTo = [it.x + .5, it.y + .5]; } else c.faceTo = null;
  c.wp = wp; c.target = target;
  return true;
}
export function layoutChanged(w) {
  for (const c of [...w.custs, ...w.staff]) if (c.target && c.wp.length && !c.sitting) { if (!route(w, c, c.target)) { c.wp = []; if (c.job) dropJob(w, c); } }
}

function move(c, dt, speed) {
  if (!c.wp.length) {
    c.moving = false;
    if (c.faceTo) faceToward(c, c.faceTo[0] - c.gx, c.faceTo[1] - c.gy);
    return true;
  }
  const [tx, ty] = c.wp[0], dx = tx - c.gx, dy = ty - c.gy, d = Math.hypot(dx, dy), sp = speed * dt;
  faceToward(c, dx, dy);
  c.moving = true; c.phase += dt * 11;
  if (d <= sp) { c.gx = tx; c.gy = ty; c.wp.shift(); } else { c.gx += dx / d * sp; c.gy += dy / d * sp; }
  return false;
}
function faceToward(c, dx, dy) {
  if (Math.abs(dx) + Math.abs(dy) < .001) return;
  c.front = dx + dy >= -0.001;
  const sdx = dx - dy;
  if (Math.abs(sdx) > .01) c.flip = sdx < 0;
}
function sitFacing(c, rot) { c.front = rot === 0 || rot === 1; c.flip = rot === 0 || rot === 3; }

// ---------- cooking ----------
export function cookState(it) {
  if (!it.cook) return 'idle';
  const R = recipe(it.cook.r), el = (now() - it.cook.s) / 1000;
  if (el < R.t) return 'cooking';
  return el > R.t + burnAfter(R) ? 'burnt' : 'ready';   // left too long on the heat
}
// how long the player still has to take a ready dish off, 0..1 (1 = just finished)
export function burnLeft(it) {
  if (!it.cook) return 1;
  const R = recipe(it.cook.r), over = (now() - it.cook.s) / 1000 - R.t;
  return Math.max(0, 1 - over / burnAfter(R));
}
export const isOpen = st => st.open !== false;
export function startCook(w, it, rid, paid) {
  const R = recipe(rid);
  if (w.own && !paid) { if (G.S.coins < R.cost) return false; addCoins(-R.cost); addFloat(w, it.x + .5, it.y + .5, 60, '-' + R.cost, 'coin'); }
  it.cook = { r: rid, s: now() }; it.last = rid;
  if (w.own) { save(); emit('sound', 'cook'); }
  return true;
}
// The player picks a recipe on an equipment: it becomes a pending order the avatar walks over to start.
export function queueCook(w, it, rid) {
  const R = recipe(rid);
  if (it.cook || it.pending) return 'busy';   // cooking is allowed with the door closed: that's how the café gets ready
  if (w.own && G.S.coins < R.cost) return 'coins';
  if (w.own && !hasIngredients(R)) return 'ingredient';         // special ingredient missing from the pantry
  if (w.own) {
    addCoins(-R.cost); addFloat(w, it.x + .5, it.y + .5, 60, '-' + R.cost, 'coin');
    if (R.need) addSpice(R.need.id, -(R.need.n || 1));          // consumed as the order is placed
  }
  it.pending = { r: rid };
  if (w.pendT) delete w.pendT[it.id];
  if (w.own) { save(); emit('sound', 'click'); }
  return 'ok';
}
export function cancelCook(w, it) {
  if (!it.pending) return false;
  const R = recipe(it.pending.r);
  if (w.own) { addCoins(R.cost); if (R.need) addSpice(R.need.id, R.need.n || 1); save(); }
  it.pending = null;
  const s = w.staff.find(x => x.job && x.job.kind === 'cook' && x.job.eq === it.id);
  if (s) { s.job = null; s.cookAnim = false; s.wp = []; s.target = null; s.faceTo = null; }
  return true;
}
// spice shelf: uses one boost on this equipment's dish. Returns 'ok' or why it can't be used.
export function useBoost(w, it, id) {
  const B = boost(id); if (!B || !w.own) return 'no';
  if (boostCount(id) <= 0) return 'none';
  const st = cookState(it);
  if (B.use === 'burnt') {
    if (st !== 'burnt') return 'notburnt';
    const R = recipe(it.cook.r); it.cook.s = now() - R.t * 1000;   // back to "just finished", with the full wait before burning
  } else {
    if (st !== 'cooking') return 'notcooking';
    const R = recipe(it.cook.r);
    if (B.pct) { if (it.cook.b) return 'already'; it.cook.b = id; }
    else { const left = R.t - (now() - it.cook.s) / 1000; it.cook.s -= Math.min(left, B.cut) * 1000; }
  }
  addBoost(id, -1);
  addFloat(w, it.x + .5, it.y + .5, 80, '✨ ' + B.n, 'xp');
  emit('sound', 'ding'); save();
  return 'ok';
}
// throws away a dish that burned on the equipment
export function discardFood(w, it) {
  it.cook = null; it.last = null;
  if (w.own) { save(); emit('sound', 'click'); }
}
export function targetCounter(st, rid) {
  const cs = st.items.filter(i => i.type === 'counter');
  return cs.find(c => c.stock && c.stock.r === rid && c.stock.left > 0 && c.stock.left < COUNTER_CAP && !spoiled(c)) || cs.find(c => !c.stock || c.stock.left <= 0);
}
// portions a dish yields: recipe × (1 + mastery stars × 5% + spice-shelf salt/pepper)
export function portionsOf(st, it) {
  const R = recipe(it.cook.r), b = it.cook.b && boost(it.cook.b);
  return Math.max(1, Math.round(R.por * (1 + masteryBonus(R.id, st) + (b && b.pct || 0))));
}
// portions still on the stove (a big dish can need several counters; the rest waits, and can still burn)
export const dishLeft = (st, it) => it.cook ? (Number.isFinite(it.cook.left) ? it.cook.left : portionsOf(st, it)) : 0;
// Takes as many portions off the stove as fit on counter cnt. The first take pays the XP and counts for mastery.
function takeFromStove(w, it, cnt) {
  const R = recipe(it.cook.r), st = w.st;
  const left = dishLeft(st, it), room = cnt.stock && cnt.stock.left > 0 ? Math.max(0, COUNTER_CAP - cnt.stock.left) : COUNTER_CAP;
  const n = Math.min(left, room);
  if (n <= 0) return 0;
  if (!it.cook.took) { it.cook.took = 1; if (w.own) cookedReward(w, it, R); }
  it.cook.left = left - n;
  if (it.cook.left <= 0) it.cook = null;
  return n;
}
// XP (+5% per mastery star) and the mastery count; a new star pays coins and, on stars 2 and 4, a spice
function cookedReward(w, it, R) {
  const S = G.S, before = stars(R.id), xp = Math.round(R.xp * (1 + masteryBonus(R.id)));
  addXP(xp); S.stats.cooked++; addFloat(w, it.x + .5, it.y + .5, 70, '+' + xp, 'xp');
  S.mastery[R.id] = (S.mastery[R.id] || 0) + 1;
  const after = stars(R.id);
  if (after > before) {
    const coins = Math.round(R.cost * after);
    addCoins(coins);
    const gift = after === 2 ? 'tomilho' : after === 4 ? 'pimenta' : after === 5 ? 'instant' : null;
    if (gift) addBoost(gift, 1);
    emit('mastery', { rid: R.id, stars: after, coins, gift });
  }
}
// moves finished food from equipment onto a counter
export function collect(w, it) {
  if (cookState(it) === 'burnt') return 'burnt';
  if (cookState(it) !== 'ready') return 'notready';
  const R = recipe(it.cook.r);
  let moved = 0, c;
  while (it.cook && (c = targetCounter(w.st, R.id))) { const n = takeFromStove(w, it, c); if (!n) break; putOnCounter(c, R.id, n); moved += n; }
  if (!moved) return 'nocounter';
  if (w.own) { emit('sound', 'ding'); save(); }
  return it.cook ? 'partial' : 'ok';
}
function putOnCounter(c, rid, n) {
  if (c.stock && c.stock.r === rid && c.stock.left > 0 && !spoiled(c)) {
    // mixing a fresh batch into an older one: the shelf life lands in between, weighted by portions
    const old = c.stock.left;
    c.stock.at = (c.stock.at * old + now() * n) / (old + n);
    c.stock.left += n;
  } else c.stock = { r: rid, left: n, at: now() };
}
// the café a counter belongs to (the player's, or the neighbour's café being visited)
const counterState = c => (G.world && G.world.st && G.world.st.items.includes(c)) ? G.world.st : G.S;
// counters: a batch stays good for keepFor(recipe) seconds, then it spoils and has to be thrown away
export function spoiled(c) {
  const k = c && c.stock; if (!k || k.left <= 0) return false;
  const R = recipe(k.r); if (!R) return false;
  return (now() - (k.at || 0)) / 1000 > keepFor(R, counterState(c));
}
export function freshLeft(c) {
  const k = c && c.stock; if (!k || k.left <= 0) return 1;
  const R = recipe(k.r); if (!R) return 1;
  return Math.max(0, 1 - (now() - (k.at || 0)) / 1000 / keepFor(R, counterState(c)));
}
export function discardStock(w, c) { c.stock = null; if (w.own) { save(); emit('sound', 'click'); } }
const stockOf = (st, rid) => st.items.filter(i => i.type === 'counter' && i.stock && i.stock.r === rid && i.stock.left > 0 && !spoiled(i));
const anyStock = st => st.items.some(i => i.type === 'counter' && i.stock && i.stock.left > 0 && !spoiled(i));
const anyCooking = st => st.items.some(i => i.cook);

// How the guest is feeling, as one of six faces. Waiting time, how fast they were served,
// whether the order was available and how long the whole visit has taken all feed into it.
// Expressions are feedback, not decoration: they pop for a moment at the points that matter
// (ordering, being served, losing patience, paying) instead of hovering over everyone all the time.
export function showMood(w, c, mood) {
  if (!c) return;
  const m = mood || moodOf(c);
  if (c._moodAt && now() - c._moodAt < 900 && c._moodKind === m) return;   // no stutter on repeated triggers
  c._moodAt = now(); c._moodKind = m;
  w.pops.push({ gx: c.gx, gy: c.gy, mood: m, face: true, cust: c.id, age: 0 });
}
export const waitBudget = st => 75 * (1 + Math.min(.4, charm(st) * .015));   // seconds a guest will wait for the order
export function moodOf(c) {
  if (!c) return 'neutral';
  if (c.state === 'leave') return c.mood === 'angry' ? 'angry' : c.mood === 'sad' ? 'sad' : (c.sat || 0) >= .85 ? 'love' : (c.sat || 0) >= .55 ? 'happy' : 'neutral';
  if (c.state === 'eat') { const s2 = (c.sat || 0) + (c.drinkSat ? .1 : 0); return s2 >= .85 ? 'love' : s2 >= .6 ? 'happy' : 'neutral'; }
  if (c.state === 'wait') {
    let p = Math.max(0, c.patience ?? 1);
    if (c.long) p -= .15;                                  // a very long visit wears the mood down
    return p > .78 ? 'happy' : p > .52 ? 'neutral' : p > .26 ? 'impatient' : 'angry';
  }
  if (c.state === 'waitSeat') return c.long ? 'impatient' : 'neutral';
  if (c.state === 'menu') return 'happy';
  return 'neutral';
}
// ---------- floats / pops ----------
export function addFloat(w, gx, gy, z, text, kind) { w.floats.push({ gx, gy, z, text, kind, age: 0 }); }

// ---------- customers ----------
function spawnInterval(w) {
  const n = Math.max(1, seats(w.st).length);
  const pop = Math.min(105, w.st.pop || 0) / 105;            // a popular café fills up faster (0.7× to 1.3× the wait)
  return Math.max(2.5, 15 / Math.sqrt(n)) * (1.35 - rep(w.st) * .5) * (1.3 - pop * .6) * 1000;
}
export function tableOf(st, chairId) { const ch = st.items.find(i => i.id === chairId); return ch ? seatInfo(st, ch) : null; }
// Dirty dishes belong to the seat that used them (documento mestre §14): chair.dirty = 1 while the plate is on
// the table, 2 while a waiter carries it to the sink. Only that seat is blocked until the dishes are washed.
export const isDirty = ch => !!(ch && ch.dirty);
export const dirtySeats = (st, t) => st.items.filter(ch => ch.dirty && ITEMS[ch.type].kind === 'chair' && (!t || seatInfo(st, ch) === t));
export const sinks = st => st.items.filter(i => ITEMS[i.type].kind === 'sink');
function freeSeats(w) {
  const st = w.st, taken = new Set();
  for (const c of w.custs) if (c.seat) taken.add(c.seat);
  // one guest per chair (a table with four chairs seats four); a seat with dirty dishes waits for the sink
  return seats(st).filter(ch => !taken.has(ch.id) && !isDirty(ch) && seatInfo(st, ch));
}

function trySeat(w, c) {
  const list = freeSeats(w).sort(() => Math.random() - .5);
  for (const s of list) if (route(w, c, { kind: 'seat', id: s.id })) { c.seat = s.id; c.state = 'toSeat'; return true; }
  return false;
}
function leave(w, c, mood) {
  if (c.sitting) { const ch = w.st.items.find(i => i.id === c.seat); if (ch) { c.gx = ch.x + .5; c.gy = ch.y + .5; } }
  c.sitting = false;
  const tid = c.table;
  if (tid && w.tableFood[tid]) w.tableFood[tid] = w.tableFood[tid].filter(f => f.cust !== c.id);
  if (tid && c.dish && c.seat) { const ch = w.st.items.find(i => i.id === c.seat); if (ch) { ch.dirty = 1; if (w.own) save(); } }
  c.state = 'leave'; c.seat = null; c.mood = mood || c.mood;
  if (!route(w, c, { kind: 'exit' })) c.wp = [[.5, doorY(w.st) + .5], ...outsideOut(w.st)];
}
function chooseOrder(w) {
  const st = w.st, lv = w.own ? level() : 99;
  const inStock = RECIPES.filter(r => !r.drink && stockOf(st, r.id).length);
  if (inStock.length) return pick(inStock).id;
  // a guest only waits for a dish that will be ready soon (not a feijoada with two days to go)
  const cooking = st.items.filter(i => i.cook && !recipe(i.cook.r).drink && recipe(i.cook.r).t - (now() - i.cook.s) / 1000 < 600).map(i => i.cook.r);
  if (cooking.length) return pick(cooking);
  // nothing ready or on the stove: ask for any dish the café can actually cook, and the player makes it
  const eqs = new Set(st.items.filter(i => ITEMS[i.type].kind === 'equip').map(i => ITEMS[i.type].eq));
  const can = RECIPES.filter(r => !r.drink && !r.long && r.lv <= lv && eqs.has(r.eq) && hasIngredients(r, st));
  if (!can.length) return null;
  const quick = can.filter(r => r.t <= 120);              // favour dishes that can be made while the guest waits
  return pick(quick.length && Math.random() < .75 ? quick : can).id;
}
// a guest only asks for a drink the café can actually make
function chooseDrink(w) {
  if (Math.random() > .45) return null;
  const st = w.st, lv = w.own ? level() : 99;
  const can = DRINKS().filter(R => R.lv <= lv && drinkMachine(st, R.id));   // only what a working machine has in stock
  return can.length ? pick(can).id : null;
}
// The machine for a drink order, if the café has one.
// Each drink machine keeps the drinks the player paused (`it.off`); anything else it serves,
// so a drink unlocked later starts on the menu.
export const serves = (it, rid) => !!(it.dstock && it.dstock.r === rid && it.dstock.left > 0);
export const isBroken = it => (it.wear || 0) >= WEAR_MAX;
export const isWorn = it => (it.wear || 0) >= WEAR_WARN;
// a working machine with this drink in stock
export const drinkMachine = (st, rid) => st.items.find(i => ITEMS[i.type].kind === 'equip' && serves(i, rid) && !isBroken(i)) || null;
// brewing: one flavour at a time; a batch adds to the same flavour's stock, up to DRINK_CAP
export function startBrew(w, it, rid) {
  const R = recipe(rid); if (!R || !R.drink || !w.own) return 'no';
  if (isBroken(it)) return 'broken';
  if (it.brew) return 'busy';
  if (it.dstock && it.dstock.left > 0 && it.dstock.r !== rid) return 'other';
  if ((it.dstock && it.dstock.left || 0) + brewYield(R) > DRINK_CAP) return 'full';
  if (G.S.coins < brewCost(R)) return 'coins';
  if (!hasIngredients(R)) return 'ingredient';
  addCoins(-brewCost(R)); if (R.need) addSpice(R.need.id, -(R.need.n || 1));
  it.brew = { r: rid, s: now() };
  addFloat(w, it.x + .5, it.y + .5, 60, '-' + brewCost(R), 'coin');
  emit('sound', R.eq === 'coffee' ? 'grind' : 'pourliq'); save();
  return 'ok';
}
export const brewLeft = it => it.brew ? brewTime(recipe(it.brew.r)) - (now() - it.brew.s) / 1000 : 0;
// throw away what is left in the machine, to switch flavour
export function emptyMachine(w, it) { it.dstock = null; if (w.own) save(); }
export function repairMachine(w, it) {
  if (!isWorn(it) || !w.own) return 'no';
  if (!spendEnergy(REPAIR_ENERGY)) return 'energy';
  it.wear = 0; addFloat(w, it.x + .5, it.y + .5, 70, '✨ consertada', 'xp'); emit('sound', 'ding'); save();   // stock kept
  return 'ok';
}
function tickBrews(w) {
  for (const it of w.st.items) {
    if (!it.brew || brewLeft(it) > 0) continue;
    const R = recipe(it.brew.r);
    if (!it.dstock || it.dstock.r !== R.id || it.dstock.left <= 0) it.dstock = { r: R.id, left: 0 };
    it.dstock.left = Math.min(DRINK_CAP, it.dstock.left + brewYield(R)); it.brew = null;
    if (w.own) { addFloat(w, it.x + .5, it.y + .5, 70, '+' + brewYield(R) + ' copos', 'xp'); emit('sound1', 'ding'); save(); }
  }
}
// A waiter has reached the machine: it pours, and the glass goes straight onto the tray.
function pourDrink(w, mach, c) {
  const R = recipe(c.drink);
  if (w.own) {
    if (G.S.coins < R.cost) return false;
    if (!hasIngredients(R)) return false;
    addCoins(-R.cost);
    if (R.need) addSpice(R.need.id, -(R.need.n || 1));
  }
  mach.pour = now(); mach.drinkR = c.drink;
  emit('sound1', recipe(c.drink).eq === 'coffee' ? 'grind' : 'pourliq');
  return true;
}
// The glass reaches the guest: paid for, counted and a small lift in patience.
function giveDrink(w, c) {
  const R = recipe(c.drink), bonus = DRINK_BONUS[R.id] || 'coins', pay = Math.round(R.price * (bonus === 'coins' ? 2.1 : 1.3));
  c.drinkDone = 1; c.drinkSat = 1; c.drinkWaiter = null;
  c.patience = Math.min(1, (c.patience ?? 1) + (bonus === 'rep' ? .4 : .18));
  if (bonus === 'rep') { c.sat = Math.min(1, (c.sat || 0) + .2); c.drinkSat = 2; }
  if (w.own) {
    const xp = R.xp * (bonus === 'xp' ? 2 : 1);
    addCoins(pay); addXP(xp);
    if (bonus === 'xp') addFloat(w, c.gx, c.gy, 95, '+' + xp, 'xp');
    if (bonus === 'rep') { G.S.rep.push(1); if (G.S.rep.length > 20) G.S.rep.shift(); }
    G.S.stats.drinks = (G.S.stats.drinks || 0) + 1;
    addFloat(w, c.gx, c.gy, 70, '+' + pay, 'coin');
    save();
  }
  showMood(w, c, 'happy');
  if (w.own) emit('sound1', 'clink');
}
// The player taps a guest's drink bubble: the machine pours and the glass lands at once.
// why a drink can't be poured: a machine has it but is broken, or nothing has it in stock
const st0 = (st, rid) => st.items.some(i => serves(i, rid)) ? 'broken' : 'nostock';
export function serveDrink(w, c) {
  if (!c || !c.drink || c.drinkDone || (c.state !== 'wait' && c.state !== 'eat')) return 'no';
  const R = recipe(c.drink), mach = drinkMachine(w.st, c.drink);
  if (!mach) return st0(w.st, c.drink);
  if (w.own) {
    const need = drinkEnergy(R);
    if (energy().v < need) return 'energy';
    spendEnergy(need);                     // the drink itself was paid for when the batch was brewed
  }
  mach.dstock.left--; mach.wear = (mach.wear || 0) + 1;
  if (w.own && isBroken(mach)) emit('broke', mach.type);
  mach.pour = now(); mach.drinkR = c.drink;
  emit('sound1', R.eq === 'coffee' ? 'grind' : 'pourliq');
  giveDrink(w, c);
  return 'ok';
}
function deliver(w, c, rid) {
  if (w.own) emit('sound1', 'plate');            // the plate lands on the table
  c.state = 'eat'; c.eatT = 0; c.dish = rid; c.mood = 'eating';
  const ch = w.st.items.find(i => i.id === c.seat), t = ch && seatInfo(w.st, ch);
  if (t) { c.table = t.id; (w.tableFood[t.id] = w.tableFood[t.id] || []).push({ r: rid, dir: ((ch.rot || 0) + 2) % 4, cust: c.id, eaten: 0 }); }
  c.sat = clamp(.25 + c.patience * .75 + Math.min(.15, charm(w.st) * .01) + (c.drinkSat === 2 ? .2 : 0), 0, 1);   // a 'rep' drink served first still counts
  showMood(w, c, c.sat >= .85 ? 'love' : c.sat >= .55 ? 'happy' : 'neutral');          // the food arrives
  if (w.own) emit('sound1', 'cutlery');
}
export function serveDirect(w, c) {
  if (c.state !== 'wait' || c.waiter || !c.order) return 'no';
  const cnt = stockOf(w.st, c.order)[0];
  if (!cnt) return 'nostock';
  cnt.stock.left--; if (cnt.stock.left <= 0) cnt.stock = null;
  deliver(w, c, c.order); if (w.own) save();
  return 'ok';
}
function pay(w, c) {
  const R = recipe(c.dish), sat = c.sat;
  let tip = Math.round(R.price * sat * .6 + charm(w.st) * .08);
  if (c.vip) tip = Math.round(tip * 2.2);
  if (w.own) {
    addCoins(R.price + tip); addXP(c.vip ? 4 : 1);
    if (c.vip) vipReward(w, c, sat);
    const S = G.S; S.stats.served++; if (sat >= .8) S.stats.happy++;
    S.rep.push(sat); if (S.rep.length > 20) S.rep.shift();
    if (sat >= .6) addPop(c.vip ? .5 : .1);                                    // a happy guest spreads the word
    emit('sound', 'coin'); save();
  }
  addFloat(w, c.gx, c.gy, 58, '+' + (R.price + tip), 'coin');
  showMood(w, c, sat >= .85 ? 'love' : sat >= .6 ? 'happy' : 'neutral');               // finished, tip left
}

// A VIP only pays off if they leave satisfied: that is where Diamantes and rare ingredients come from.
function vipReward(w, c, sat) {
  G.S.stats.vip = (G.S.stats.vip || 0) + 1;
  if (sat >= .85) {
    addGems(2); addSpice(pick(['cacau', 'baunilha']), 1);
    G.S.stats.vipHappy = (G.S.stats.vipHappy || 0) + 1;
    addFloat(w, c.gx, c.gy, 86, '+2 diamantes', 'xp'); emit('toast', 'Cliente VIP saiu encantado! +2 diamantes e um ingrediente especial');
  } else if (sat >= .6) {
    addGems(1); addFloat(w, c.gx, c.gy, 86, '+1 diamante', 'xp'); emit('toast', 'Cliente VIP bem atendido! +1 diamante');
  } else {
    emit('toast', 'O cliente VIP saiu sem se impressionar');
  }
}
function updateCustomers(w, dt) {
  const st = w.st, t = now();
  // spawn
  if (t >= w.spawnAt) {
    w.spawnAt = t + spawnInterval(w) * (.7 + Math.random() * .6);
    if (isOpen(st) && freeSeats(w).length && w.custs.length < seats(st).length + 1) {   // guests come in even before anything is cooked
      const c = newChar(randLook(), 'cust');
      // VIP guests: rarer, and more likely the better the café is doing
      if (w.own && level() >= 3) {
        // special but noticeable: roughly 1 guest in 30 at a modest café, 1 in 11 at an excellent one
        const q = cafeQuality(st);
        if (Math.random() < .03 + q * .06) { c.vip = true; c.look.model = pick([5, 11, 1, 8]); c.look.hero = Math.floor(Math.random() * 5); }   // VIPs arrive as one of the KayKit adventurers
      }
      const o = outsideIn(st); c.gx = o.start[0]; c.gy = o.start[1]; c.alpha = 0; c.state = 'enter'; c.wp = o.wp;
      c.name = pick(['Ana', 'João', 'Clara', 'Seu Zé', 'Dona Rosa', 'Pedro', 'Luísa', 'Marcos', 'Tati', 'Léo', 'Helena', 'Vó Cida', 'Joaquim', 'Sofia', 'Gui']);
      if (c.vip) c.name = ['Sir Lancelote', 'Grunhilda', 'Maga Estrela', 'Raposa', 'Capuz Sombrio'][c.look.hero];
      w.custs.push(c);
    }
  }
  for (const i of st.items) if (i.pour && now() - i.pour > 2000) i.pour = 0;
  // anything that burned is discarded after a moment, so the equipment is usable again
  for (const i of st.items) {
    if (!i.cook || cookState(i) !== 'burnt') continue;
    const R = recipe(i.cook.r);
    if ((now() - i.cook.s) / 1000 < R.t + burnAfter(R) + BURN_LINGER) continue;
    i.cook = null; i.last = null;
    if (w.own) { addFloat(w, i.x + .5, i.y + .5, 60, 'queimou', 'neg'); emit('sound1', 'bad'); save(); }
  }
  const closed = !isOpen(st);
  for (const c of w.custs) {
    // closing time: guests who haven't ordered yet leave kindly; those with an order finish their meal
    if (closed && ['enter', 'waitSeat', 'toSeat', 'menu'].includes(c.state)) { leave(w, c, 'ok'); continue; }
    if (c.state !== 'leave' && c.alpha < 1) c.alpha = Math.min(1, c.alpha + dt * 2.5);
    if (!c.bornT) c.bornT = t; c.long = t - c.bornT > 70000;   // total time in the café
    const arrived = c.sitting ? true : move(c, dt, CUST_SPEED * (c.look.body === 'elder' ? .75 : c.look.body === 'kid' ? 1.15 : 1));
    switch (c.state) {
      case 'enter':
        if (!c.rang && c.gx > .15 && c.alpha > .4) { c.rang = 1; if (w.own) emit('sound1', 'bell'); }
        if (arrived) { if (!trySeat(w, c)) { c.state = 'waitSeat'; c.t0 = t; } }
        break;
      case 'waitSeat':
        c.retry = (c.retry || 0) + dt;
        if (c.retry > 1) { c.retry = 0; if (trySeat(w, c)) break; }
        if (t - c.t0 > 12000 && !c._noSeatMood) { c._noSeatMood = 1; showMood(w, c, 'impatient'); }
        if (t - c.t0 > 14000) { leave(w, c, 'sad'); showMood(w, c, 'sad'); if (w.own) { G.S.rep.push(.3); if (G.S.rep.length > 20) G.S.rep.shift(); addPop(-.3); addFloat(w, c.gx, c.gy, 80, '-0,3 fama', 'neg'); } }
        break;
      case 'toSeat': {
        const ch = st.items.find(i => i.id === c.seat);
        if (!ch || !seatInfo(st, ch)) { c.seat = null; if (!trySeat(w, c)) { c.state = 'waitSeat'; c.t0 = t; } break; }
        if (arrived) { c.sitting = true; c.gx = ch.x + .5; c.gy = ch.y + .5; sitFacing(c, ch.rot || 0); c.state = 'menu'; c.t0 = t; c.moving = false; }
        break;
      }
      case 'menu':
        // places the order (food, plus a drink when the café can make one)
        if (t - c.t0 > 2600) {
          const o = chooseOrder(w);
          if (o) { c.order = o; c.drink = chooseDrink(w); c.state = 'wait'; c.patience = 1; c.mood = 'happy'; showMood(w, c, 'happy'); }
          else if (t - c.t0 > 15000) leave(w, c, 'sad');
        }
        break;
      case 'wait': {
        const pat = waitBudget(st);
        c.patience -= dt / pat;
        const wasMood = c.mood;
        c.mood = c.patience > .6 ? 'happy' : c.patience > .3 ? 'ok' : 'sad';
        if (c.mood !== wasMood && c.mood !== 'happy') showMood(w, c, c.mood === 'ok' ? 'neutral' : 'impatient');   // starts to get tired of waiting
        if (c.patience <= 0) {
          if (c.waiter) { const s = w.staff.find(s => s.id === c.waiter); if (s) dropJob(w, s); }
          showMood(w, c, 'angry');                                                     // ran out of patience
          c.mood = 'angry';
          if (w.own) { G.S.stats.angry++; G.S.rep.push(0); if (G.S.rep.length > 20) G.S.rep.shift(); addPop(-.3); addFloat(w, c.gx, c.gy, 80, '-0,3 fama', 'neg'); save(); }
          leave(w, c, 'angry');
        }
        break;
      }
      case 'eat':
        if (w.own && (!c._chew || t - c._chew > 1400 + Math.random() * 1200)) { c._chew = t; emit('sound1', 'chew'); } {
        c.eatT += dt;
        const f = (w.tableFood[c.table] || []).find(f => f.cust === c.id); if (f) f.eaten = Math.min(1, c.eatT / 8);
        if (c.eatT > 8) { pay(w, c); leave(w, c, 'happy'); }
        break;
      }
      case 'leave':
        // the bell rings on the way out too, as the guest steps through the doorway
        if (!c.rangOut && c.gx < .3 && c.alpha > .4 && Math.abs(c.gy - (doorY(st) + .5)) < .9) { c.rangOut = 1; if (w.own) emit('sound1', 'bellOut'); }
        if (arrived) { c.alpha -= dt * 3; if (c.alpha <= 0) c.dead = true; }
        break;
    }
  }
  w.custs = w.custs.filter(c => !c.dead);
}

// ---------- staff ----------
function dropJob(w, s) {
  const j = s.job; if (!j) return;
  if (j.kind === 'serve') { const c = w.custs.find(c => c.id === j.cust); if (c && c.waiter === s.id) c.waiter = null; if (s.carry && j.phase === 'toTable') { const cnt = targetCounter(w.st, s.carry); if (cnt) putOnCounter(cnt, s.carry, 1); } }
  if (j.kind === 'drink') { const c = w.custs.find(x => x.id === j.cust); if (c && c.drinkWaiter === s.id) c.drinkWaiter = null; }
  if (j.kind === 'clean' || j.kind === 'bin') s.cookAnim = false;
  if (j.kind === 'bus' && j.phase === 'toSink') { const ch = w.st.items.find(i => i.id === j.seat); if (ch && ch.dirty === 2) ch.dirty = 1; }   // dishes go back on the table, never vanish
  if (j.kind === 'plate' && s.carry) { const cnt = targetCounter(w.st, s.carry); if (cnt) putOnCounter(cnt, s.carry, s.carryN || 1); }
  s.carry = null; s.job = null; s.wp = []; s.target = null; s.faceTo = null; s.cookAnim = false;
}
function wander(w, s, dt) {
  s.idleT -= dt;
  if (s.idleT > 0 || s.wp.length) return;
  s.idleT = 3 + Math.random() * 5;
  const t = randomFree(w.st, inKitchen(s.role) ? 2 : 99);
  route(w, s, { kind: 'tile', t });
}
function waiterAI(w, s) {
  if (s.job) return;
  const waiting = w.custs.filter(c => c.state === 'wait' && !c.waiter && c.order && stockOf(w.st, c.order).length)
    .sort((a, b) => a.patience - b.patience);
  for (const c of waiting) {
    const cnts = stockOf(w.st, c.order);
    for (const cnt of cnts) if (route(w, s, { kind: 'item', id: cnt.id })) { c.noRoute = 0; c.waiter = s.id; s.job = { kind: 'serve', cust: c.id, counter: cnt.id, phase: 'toCounter' }; return; }
    // no route to any counter: only after a persistent failure (not a one-off) does the easter egg kick in
    if (!c.noRoute) c.noRoute = now();
    else if (now() - c.noRoute > 3000) { c.noRoute = 0; magicServe(w, s, c, false); return; }
  }
  // drinks are served by the player tapping the guest's bubble (serveDrink); waiters only carry dishes
  if (false) {
  const takenD = new Set(w.staff.filter(x => x.job && x.job.kind === 'drink').map(x => x.job.cust));
  for (const c of w.custs) {
    if (!c.drink || c.drinkDone || takenD.has(c.id)) continue;
    if (c.state !== 'wait' && c.state !== 'eat') continue;
    const mach = drinkMachine(w.st, c.drink);
    if (!mach) continue;
    if (w.own && (G.S.coins < recipe(c.drink).cost || !hasIngredients(recipe(c.drink)))) continue;
    if (route(w, s, { kind: 'item', id: mach.id })) { c.drinkWaiter = s.id; s.job = { kind: 'drink', cust: c.id, mach: mach.id, phase: 'toMach' }; return; }
  }
  }
  // nothing to serve: take the dirty dishes guests left to the sink
  const busy = new Set(w.staff.filter(x => x.job && x.job.kind === 'bus').map(x => x.job.seat));
  const sk = sinks(w.st);
  w.noSink = !sk.length && dirtySeats(w.st).length > 0;
  if (w.noSink && w.own && !w.noSinkWarned) { w.noSinkWarned = 1; emit('nosink'); }   // once per session
  if (!sk.length) return;                                   // no sink: the dishes wait and the player is warned
  w.cleanT = w.cleanT || {};
  for (const ch of w.st.items.filter(i => i.dirty === 1 && !busy.has(i.id))) {
    const t = seatInfo(w.st, ch);
    if (!t) { ch.dirty = 0; continue; }                     // the table was moved away: nothing left to pick up
    // `near`: a table boxed in by chairs on every side is reached from the closest free tile
    if (route(w, s, { kind: 'item', id: t.id, near: true })) { delete w.cleanT[ch.id]; s.job = { kind: 'bus', seat: ch.id, table: t.id, phase: 'toTable' }; return; }
    // no way to reach it at all: after a few seconds the waiter improvises instead of leaving it dirty forever
    if (!w.cleanT[ch.id]) w.cleanT[ch.id] = now();
    else if (now() - w.cleanT[ch.id] > 3000) {
      delete w.cleanT[ch.id]; s.wp = []; s.target = null;
      s.job = { kind: 'bus', seat: ch.id, table: t.id, phase: 'toTable', t0: now(), magic: 1 }; s.cookAnim = true; s.faceTo = [t.x + .5, t.y + .5];
      return;
    }
  }
}
// The player's avatar: the only character that starts recipes. It walks to the equipment the player
// picked a recipe on, plays a short preparation animation, and is free again while the dish cooks.
function ownerAI(w, s) {
  if (s.job) return;
  const st = w.st;
  const taken = new Set(w.staff.filter(x => x.job && x.job.eq).map(x => x.job.eq));
  // Finished dishes come off the heat on their own. Whatever is closest to burning goes first,
  // so a busy kitchen loses as little as possible.
  const ready = st.items
    .filter(i => ITEMS[i.type].kind === 'equip' && !taken.has(i.id) && cookState(i) === 'ready')
    .sort((a, b) => burnLeft(a) - burnLeft(b));
  w.plateT = w.plateT || {};
  for (const it of ready) {
    const cnt = targetCounter(st, it.cook.r);
    if (!cnt) continue;                                      // no counter free for this dish yet
    if (route(w, s, { kind: 'item', id: it.id })) { delete w.plateT[it.id]; s.job = { kind: 'plate', eq: it.id, phase: 'toEq' }; return; }
    // the chef cannot even reach this stove: after a moment the dish goes to the counter by itself
    if (!w.plateT[it.id]) w.plateT[it.id] = now();
    else if (now() - w.plateT[it.id] > 2000) { delete w.plateT[it.id]; magicPlate(w, it, cnt); return; }
  }
  // Nowhere to put a dish that is about to burn: clear a counter whose food has already spoiled.
  if (ready.length) {
    for (const c of st.items) {
      if (c.type !== 'counter' || !spoiled(c)) continue;
      if (route(w, s, { kind: 'item', id: c.id })) { s.job = { kind: 'bin', counter: c.id }; return; }
    }
  }
  // left alone with nothing on the go for 5 minutes, the chef starts the simplest dish by themself
  if (w.own && isOpen(st)) {
    const busyKitchen = st.items.some(i => i.cook || i.pending);
    if (busyKitchen) w.idleSince = 0;
    else if (!w.idleSince) w.idleSince = now();
    else if (now() - w.idleSince > AUTO_COOK_MS) {
      w.idleSince = now();
      const lv = level(), eqs = st.items.filter(i => ITEMS[i.type].kind === 'equip' && !i.cook && !i.pending);
      const opts = [];
      for (const e of eqs) for (const R of RECIPES) if (!R.drink && R.eq === ITEMS[e.type].eq && R.lv <= lv && hasIngredients(R) && G.S.coins >= R.cost) opts.push([e, R]);
      opts.sort((a, b) => a[1].t - b[1].t || a[1].cost - b[1].cost);
      if (opts.length && queueCook(w, opts[0][0], opts[0][1].id) === 'ok') emit('autocook', opts[0][1].n);
    }
  }
  w.pendT = w.pendT || {};
  const pend = st.items.filter(i => i.pending && !i.cook);
  for (const it of pend) {
    if (route(w, s, { kind: 'item', id: it.id })) { s.job = { kind: 'cook', eq: it.id }; delete w.pendT[it.id]; return; }
    // equipment walled in: after a few seconds the recipe starts anyway instead of jamming the kitchen
    if (!w.pendT[it.id]) w.pendT[it.id] = now();
    else if (now() - w.pendT[it.id] > 3000) {
      delete w.pendT[it.id];
      const r = it.pending.r; it.pending = null;
      if (startCook(w, it, r, true) && w.own) addFloat(w, it.x + .5, it.y + .5, 70, '✨', 'xp');
      return;
    }
  }
}
// A ready dish moved straight from its equipment to a counter (with a sparkle), when no path exists.
function nearestSink(w, s) {
  const list = sinks(w.st); if (!list.length) return null;
  return list.sort((a, b) => Math.hypot(a.x + .5 - s.gx, a.y + .5 - s.gy) - Math.hypot(b.x + .5 - s.gx, b.y + .5 - s.gy))[0];
}
function magicPlate(w, it, cnt) {
  const R = recipe(it.cook.r), n = takeFromStove(w, it, cnt);
  if (!n) return;
  putOnCounter(cnt, R.id, n);
  if (w.own) { addFloat(w, cnt.x + .5, cnt.y + .5, 60, '✨', 'xp'); save(); emit('sound', 'ding'); }
}
function magicServe(w, s, c, picked) {
  s.wp = []; s.target = null; c.waiter = s.id;
  s.job = { kind: 'magic', cust: c.id, picked, t0: now() };
  s.carry = c.order;
  if (!picked) { const cnt = stockOf(w.st, c.order)[0]; if (!cnt) { s.job = null; s.carry = null; c.waiter = null; return; } cnt.stock.left--; if (cnt.stock.left <= 0) cnt.stock = null; if (w.own) save(); }
}
const AUTO_COOK_MS = 5 * 60000;   // minutes of play with an idle kitchen before the chef cooks on their own
const PREP_MS = 1400, CLEAN_MS = 1200, POUR_MS = 900, BURN_LINGER = 6;   // how long the avatar works at the equipment before the dish cooks on its own
function jobArrive(w, s) {
  const j = s.job, st = w.st;
  if (j.kind === 'serve') {
    const c = w.custs.find(c => c.id === j.cust);
    if (!c || c.state !== 'wait') { dropJob(w, s); return; }
    if (j.phase === 'toCounter') {
      const cnt = st.items.find(i => i.id === j.counter && i.stock && i.stock.r === c.order && i.stock.left > 0 && !spoiled(i)) || stockOf(st, c.order)[0];
      if (!cnt) { dropJob(w, s); return; }
      cnt.stock.left--; if (cnt.stock.left <= 0) cnt.stock = null; if (w.own) save();
      s.carry = c.order;
      const ch = st.items.find(i => i.id === c.seat), t = ch && seatInfo(st, ch);
      if (!t) { dropJob(w, s); return; }
      if (!route(w, s, { kind: 'item', id: t.id })) { magicServe(w, s, c, true); return; } // table unreachable
      j.phase = 'toTable';
    } else {
      deliver(w, c, s.carry); c.waiter = null; s.carry = null; s.job = null; s.idleT = 1.5; if (w.own) save();
    }
  } else if (j.kind === 'magic') {
    // holds the plate a moment, stuck where he is... and the guest has it
    if (now() - j.t0 < 700) return;
    const c = w.custs.find(c => c.id === j.cust);
    if (c && c.state === 'wait' && c.waiter === s.id) { deliver(w, c, s.carry); c.waiter = null; if (w.own) save(); }
    else { const cnt = targetCounter(st, s.carry); if (cnt) putOnCounter(cnt, s.carry, 1); }
    s.carry = null; s.job = null; s.idleT = 1.5;
  } else if (j.kind === 'cook') {
    const it = st.items.find(i => i.id === j.eq);
    if (!it || it.cook || !it.pending) { s.job = null; s.cookAnim = false; s.idleT = .8; return; }
    if (!j.t0) { j.t0 = now(); s.cookAnim = true; s.faceTo = [it.x + .5, it.y + .5]; return; }
    if (now() - j.t0 < PREP_MS) return;                      // short hands-on preparation
    s.cookAnim = false;
    const r = it.pending.r; it.pending = null;
    startCook(w, it, r, true);                               // paid when the player picked the recipe
    if (w.own) emit('sound1', 'sizzle');
    s.job = null; s.idleT = .5;
  } else if (j.kind === 'drink') {
    const c = w.custs.find(x => x.id === j.cust);
    if (!c || c.drinkDone || (c.state !== 'wait' && c.state !== 'eat')) { dropJob(w, s); return; }
    if (j.phase === 'toMach') {
      const mach = st.items.find(i => i.id === j.mach);
      if (!mach) { dropJob(w, s); return; }
      if (!j.t0) { j.t0 = now(); s.faceTo = [mach.x + .5, mach.y + .5]; if (!pourDrink(w, mach, c)) { dropJob(w, s); return; } return; }
      if (now() - j.t0 < POUR_MS) return;                  // the machine pours into the glass
      s.carry = c.drink; s.carryN = 1;
      const ch = st.items.find(i => i.id === c.seat), tb = ch && seatInfo(st, ch);
      if (!tb || !route(w, s, { kind: 'item', id: tb.id })) { giveDrink(w, c); s.carry = null; s.job = null; s.idleT = 1; return; }
      j.phase = 'toTable';
    } else {
      giveDrink(w, c); s.carry = null; s.job = null; s.idleT = 1.2;
    }
  } else if (j.kind === 'bin') {
    const c = st.items.find(i => i.id === j.counter);
    if (!c || !spoiled(c)) { s.job = null; s.idleT = .4; return; }
    if (!j.t0) { j.t0 = now(); s.cookAnim = true; s.faceTo = [c.x + .5, c.y + .5]; return; }
    if (now() - j.t0 < CLEAN_MS) return;
    s.cookAnim = false; c.stock = null; s.job = null; s.idleT = .4;
    if (w.own) { addFloat(w, c.x + .5, c.y + .5, 60, 'descartado', 'neg'); save(); }
  } else if (j.kind === 'clean') { s.job = null; s.cookAnim = false;   // old saves' table wiping: now done by 'bus'
  } else if (j.kind === 'bus') {
    const ch = st.items.find(i => i.id === j.seat);
    if (!ch || !ch.dirty) { s.job = null; s.cookAnim = false; s.carry = null; s.idleT = .5; return; }
    if (j.phase === 'toTable') {
      const t = st.items.find(i => i.id === j.table);
      if (!j.t0) { j.t0 = now(); s.cookAnim = true; s.faceTo = t ? [t.x + .5, t.y + .5] : null; return; }
      if (now() - j.t0 < CLEAN_MS) return;
      s.cookAnim = false; ch.dirty = 2; s.carry = 'dirty'; j.phase = 'toSink'; j.t0 = 0;
      if (w.own) emit('sound1', 'cutlery');
      const sink = nearestSink(w, s);
      if (!sink || !route(w, s, { kind: 'item', id: sink.id })) { j.sink = sink && sink.id; j.stuck = now(); } else j.sink = sink.id;
    } else {
      const sink = st.items.find(i => i.id === j.sink) || nearestSink(w, s);
      if (!sink) { ch.dirty = 1; s.carry = null; s.job = null; s.idleT = 1; return; }   // the sink was removed: dishes back on the table
      // can't reach the sink from here: after a few seconds the dishes get washed anyway, never left in the air
      if (j.stuck && now() - j.stuck < 3000) return;
      if (!j.t0) { j.t0 = now(); s.cookAnim = true; s.faceTo = [sink.x + .5, sink.y + .5]; return; }
      if (now() - j.t0 < (ITEMS[sink.type].wash || 2000)) return;
      s.cookAnim = false; ch.dirty = 0; s.carry = null; s.job = null; s.idleT = .6;
      if (w.own) { emit('sound1', 'cutlery'); addFloat(w, sink.x + .5, sink.y + .5, 70, '✨', 'xp'); save(); }
    }
  } else if (j.kind === 'plate') {
    const it = st.items.find(i => i.id === j.eq);
    if (j.phase === 'toEq') {
      if (!it || cookState(it) !== 'ready') { s.job = null; return; }
      const R = recipe(it.cook.r), cnt = targetCounter(st, R.id);
      if (!cnt) { s.job = null; return; }
      // walled in with the stoves and no way to a counter: the dish reaches it anyway, never left to burn
      if (!route(w, s, { kind: 'item', id: cnt.id })) { magicPlate(w, it, cnt); s.job = null; s.idleT = 1; return; }
      const n = takeFromStove(w, it, cnt);
      if (!n) { s.job = null; return; }
      s.carry = R.id; s.carryN = n; j.phase = 'toCounter'; j.counter = cnt.id;
      if (w.own) save();
    } else {
      const cnt = st.items.find(i => i.id === j.counter && (!i.stock || i.stock.r === s.carry)) || targetCounter(st, s.carry);
      if (cnt) { putOnCounter(cnt, s.carry, s.carryN); s.carry = null; s.job = null; s.idleT = 1; if (w.own) save(); }
      else s.idleT = 1;
    }
  }
}
// true while a guest is crossing the doorway, so the leaf can swing open just for the passage
export function doorInUse(w) {
  if (w.doorPulse && now() < w.doorPulse) return true;   // the player just opened or closed the café
  const dy = doorY(w.st) + .5;
  for (const c of w.custs) {
    if (c.state !== 'enter' && c.state !== 'leave') continue;
    if (c.gx > -1.6 && c.gx < 1.5 && Math.abs(c.gy - dy) < 1.6) return true;
  }
  return false;
}
function updateStaff(w, dt) {
  for (const s of w.staff) {
    if (s.alpha < 1) s.alpha = Math.min(1, s.alpha + dt * 2.5);
    const px = s.gx, pz = s.gy, arrived = move(s, dt, STAFF_SPEED);
    if (s.wp.length && Math.hypot(s.gx - px, s.gy - pz) < 1e-4) s.stuckT = (s.stuckT || 0) + dt; else s.stuckT = 0;
    if (s.job && s.job.kind === 'serve' && s.stuckT > 4) {                   // stuck on the way: improvise
      const c = w.custs.find(c => c.id === s.job.cust); s.stuckT = 0;
      if (c && c.state === 'wait') magicServe(w, s, c, !!s.carry); else dropJob(w, s);
    }
    if (s.job && s.job.kind === 'bus' && s.stuckT > 4) { s.stuckT = 0; dropJob(w, s); }   // blocked on the way: pick it up again later
    if (s.job) { if (arrived) jobArrive(w, s); continue; }
    if (!isOpen(w.st) && s.role !== 'owner') { if (!s.wp.length) s.idleT = Math.max(s.idleT, .5); continue; }   // closed: waiters stand down, the chef keeps cooking
    if (s.role === 'owner') ownerAI(w, s); else waiterAI(w, s);
    if (!s.job) wander(w, s, dt);
  }
}

export function tick(w, dt, paused) {
  for (const f of w.floats) f.age += dt;
  w.floats = w.floats.filter(f => f.age < 1.4);
  for (const p of w.pops) p.age += dt;
  w.pops = w.pops.filter(p => p.age < (p.face ? 1.8 : 1.2));
  if (paused) return;
  tickBrews(w);
  updateCustomers(w, dt);
  updateStaff(w, dt);
}

