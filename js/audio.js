// Synthesized sound: effects, room murmur and a little lo-fi radio. No audio files needed.
import { G } from './state.js';
import { SFX_WAV } from './sfx-data.js';

// ---- player preferences (kept per device) ----
export const AUDIO = { music: .45, sfx: .8, amb: .4, bell: true, track: 0 };
try {
  const raw = localStorage.getItem('cc_audio');
  if (raw) Object.assign(AUDIO, JSON.parse(raw));
  else if (localStorage.getItem('cc_sound') === '0') { AUDIO.music = 0; AUDIO.sfx = 0; AUDIO.amb = 0; }
} catch (e) { }
function savePrefs() { try { localStorage.setItem('cc_audio', JSON.stringify(AUDIO)); } catch (e) { } }

let ac = null, master = null, sfxBus = null, ambBus = null, musicBus = null, dest = null;
function ctx() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
    if (ac) {
      master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.connect(master);
      ambBus = ac.createGain(); ambBus.connect(master);
      musicBus = ac.createGain(); musicBus.connect(master);
      applyVolumes(true);
      loadSamples();
    }
  }
  if (ac && ac.state === 'suspended' && !document.hidden) ac.resume();
  return ac;
}
function applyVolumes(now) {
  G.sound = AUDIO.sfx > .001;
  if (!ac) return;
  const set = (g, v) => now ? (g.gain.value = v) : g.gain.setTargetAtTime(v, ac.currentTime, .08);
  set(sfxBus, AUDIO.sfx); set(ambBus, AUDIO.amb * 1.25); set(musicBus, AUDIO.music * .55);
}
applyVolumes();
export function setVolume(kind, v) {
  AUDIO[kind] = Math.max(0, Math.min(1, v)); applyVolumes(); savePrefs();
  if (kind === 'music' && AUDIO.music > 0) startMusic();
}
export function setBell(on) { AUDIO.bell = !!on; savePrefs(); }

// iOS and Safari only let audio start from a real gesture: take the first one the page gets.
if (typeof window !== 'undefined') {
  const unlock = () => { const a = ctx(); if (a && a.state === 'running') { startMusic(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('touchend', unlock); window.removeEventListener('keydown', unlock); } };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchend', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  document.addEventListener('visibilitychange', () => { if (ac) { if (document.hidden) ac.suspend(); else ac.resume(); } });
}
const out = () => dest || sfxBus || (ctx(), sfxBus);
// ---- recorded samples (Kenney Impact Sounds, CC0) ----
const SAMPLES = {};
function loadSamples() {
  for (const [name, b64] of Object.entries(SFX_WAV)) {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
    const done = buf => { SAMPLES[name] = buf; };
    try { const p = ac.decodeAudioData(bin, done, () => { }); if (p && p.then) p.then(done, () => { }); } catch (e) { }
  }
}
// play one of a family of samples (e.g. 'impactPlate_light'), with a little random pitch and level
function sample(family, { rate = 1, vol = .5, when = 0, jitter = .06 } = {}) {
  const a = ctx(); if (!a) return false;
  const opts = Object.keys(SAMPLES).filter(k => k.startsWith(family)); if (!opts.length) return false;
  const src = a.createBufferSource(); src.buffer = SAMPLES[opts[Math.floor(Math.random() * opts.length)]];
  src.playbackRate.value = rate * (1 + (Math.random() - .5) * jitter);
  const g = a.createGain(); g.gain.value = vol * (1 + (Math.random() - .5) * .2);
  src.connect(g).connect(out()); src.start(a.currentTime + when);
  return true;
}

// one shared second of white noise: every noisy sound plays a random slice of it
let NOISE = null;
function noiseBuf(a) {
  if (!NOISE) { const n = a.sampleRate * 2; NOISE = a.createBuffer(1, n, a.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
  return NOISE;
}
// a short burst of filtered noise: the base of most kitchen and room sounds
function noise(dur, type, freq, q, v, when = 0, sweep = 0, at = null, to = null) {
  const a = ctx(); if (!a) return;
  const t0 = at !== null ? at : a.currentTime + when;
  const src = a.createBufferSource(); src.buffer = noiseBuf(a);
  const f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * sweep), t0 + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(v, t0 + Math.min(.03, dur / 3));
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  src.connect(f).connect(g).connect(to || out()); src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + .02);
}
function tone(f, d, type = 'sine', v = .12, when = 0, slide = 0, at = null, to = null) {
  const a = ctx(); if (!a) return;
  const t0 = at !== null ? at : a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t0 + d);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  o.connect(g).connect(to || out()); o.start(t0); o.stop(t0 + d + .02);
}
const SFX = {
  click: () => tone(660, .06, 'triangle', .07),
  pop: () => tone(420, .12, 'sine', .12, 0, 1.8),
  coin: () => { tone(988, .09, 'square', .045); tone(1319, .18, 'square', .045, .07); },
  ding: () => { tone(1047, .25, 'sine', .1); tone(1568, .3, 'sine', .06, .05); },
  cook: () => tone(300, .15, 'triangle', .08, 0, 1.4),
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'triangle', .08, i * .1)),
  bad: () => tone(300, .25, 'sawtooth', .04, 0, .6),
  // door: the little cluster of bells on a shop door, jingling as it swings (recorded)
  bell: () => {
    if (!AUDIO.bell) return;
    if (!sample('doorbell', { rate: 1, vol: .5, jitter: .05 })) tone(2350, .5, 'sine', .03);
  },
  bellOut: () => SFX.bell(),           // same bell on the way out, rate-limited separately from arrivals
  chew: () => { },                     // synthesized chewing sounded artificial: left silent
  // a cup set down: a soft recorded cutlery touch
  clink: () => { sample('cutlery_', { rate: 1.05, vol: .18 }); },
  // fork and knife on a plate (recorded)
  cutlery: () => { sample('cutlery_', { rate: 1, vol: .3 }); },
  // a plate set down on the table (recorded)
  plate: () => { sample('plate', { rate: 1, vol: .42 }); },
  sizzle: () => { noise(.9, 'highpass', 1800, .7, .035); },
  steam: () => { noise(.7, 'bandpass', 2400, 1.2, .05, .5); },
  grind: () => { noise(.55, 'lowpass', 700, 1.5, .05, 1.4); tone(120, .5, 'sawtooth', .025, 0, 1.2); },
  pourliq: () => { noise(.75, 'bandpass', 1500, 2, .045, 2.2); },
  chatter: () => { },                  // replaced by the recorded restaurant ambience
  footstep: () => { },
};
export function sfx(n) { if (G.sound && SFX[n]) try { SFX[n](); } catch (e) { } }

// --- room murmur -----------------------------------------------------------
// Only the little sounds of a working café (voices, cups, cutlery), on their own volume.
// The old continuous noise bed is gone: it read as traffic rumble.
// A recorded restaurant ambience (murmur, cups, plates) loops under everything, silent when the room is
// empty and rising as it fills; a fork on a plate now and then while people eat.
let busy = 0, bed = null, bedGain = null, nextDine = 0;
function startBed() {
  if (bed || !ac || !SAMPLES.ambience) return;
  bed = ac.createBufferSource(); bed.buffer = SAMPLES.ambience; bed.loop = true;
  bedGain = ac.createGain(); bedGain.gain.value = 0;
  bed.connect(bedGain).connect(ambBus); bed.start();
}
export function setAmbience(level) {
  busy = Math.max(0, Math.min(1, level || 0));
  startBed();
  if (bedGain) bedGain.gain.setTargetAtTime(busy > .01 ? .12 + busy * .55 : 0, ac.currentTime, 1.2);
}
export function tickAmbience(nowMs) {
  if (!ac || AUDIO.amb < .01) return;
  const eating = G.world && !G.visiting ? G.world.custs.filter(c => c.state === 'eat').length : 0;
  if (eating && nowMs >= nextDine) {
    dest = ambBus; try { SFX.cutlery(); } catch (e) { } dest = null;
    nextDine = nowMs + (4000 + Math.random() * 5000) / Math.min(2, Math.sqrt(eating));
  }
}
// Some sounds can fire several times at once (a queue of guests at the door).
const lastAt = {};
export function sfxOnce(n, gap = 900) {
  const t = Date.now(); if (lastAt[n] && t - lastAt[n] < gap) return false;
  lastAt[n] = t; sfx(n); return true;
}
export function unlockAudio() { ctx(); }

// --- lo-fi radio -------------------------------------------------------------
// A small generative lo-fi loop: warm electric piano chords, round bass and a soft pulse.
// Deliberately no noise (no vinyl crackle, hats or snare): it read as hiss. Each track is a 4-bar progression; the melody and fills are random,
// so it never repeats exactly. Tracks marked `juke` need a jukebox in the café.
const m2f = m => 440 * Math.pow(2, (m - 69) / 12);
export const TRACKS = [
  { n: 'Café da manhã', bpm: 74, chords: [[53, [57, 60, 64, 67]], [52, [55, 59, 62, 66]], [50, [53, 57, 60, 64]], [48, [52, 55, 59, 62]]], mel: [72, 74, 76, 79, 81], voice: 'epiano', groove: 'lofi', d: 'Piano elétrico e batida lo-fi' },
  { n: 'Tarde de chuva', bpm: 68, chords: [[45, [55, 59, 60, 64]], [50, [53, 57, 60, 64]], [43, [53, 57, 59, 64]], [48, [52, 55, 59, 62]]], mel: [69, 72, 74, 76, 79], voice: 'musicbox', groove: 'none', d: 'Caixinha de música, sem bateria' },
  { n: 'Noite no balcão', bpm: 64, chords: [[51, [55, 58, 62, 65]], [50, [53, 57, 60, 64]], [48, [51, 55, 58, 62]], [46, [50, 53, 56, 60]]], mel: [70, 72, 74, 77, 79], voice: 'vibes', groove: 'jazz', juke: true, d: 'Vibrafone e baixo andando, jazz' },
  { n: 'Domingo de sol', bpm: 82, chords: [[48, [52, 55, 59, 62]], [45, [52, 55, 60, 64]], [50, [53, 57, 60, 64]], [43, [53, 57, 59, 62]]], mel: [72, 74, 76, 79, 81, 84], voice: 'guitar', groove: 'bossa', juke: true, d: 'Violão de bossa nova' },
];
export const hasJukebox = () => !!(G.S && G.S.items && G.S.items.some(i => i.type === 'jukebox'));
export const trackOk = i => TRACKS[i] && (!TRACKS[i].juke || hasJukebox());
let mus = null; // { tone, crackle, timer, next, step, bar, lastMel }
function startMusic() {
  const a = ctx(); if (!a || mus || AUDIO.music <= 0) return;
  // tone shaping: everything goes through a warm low-pass, like an old radio
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000; lp.Q.value = .5;
  const wob = a.createOscillator(), wobG = a.createGain(); wob.frequency.value = .13; wobG.gain.value = 250; wob.connect(wobG).connect(lp.frequency); wob.start();
  lp.connect(musicBus);
  mus = { lp, wob, next: a.currentTime + .15, step: 0, bar: 0, lastMel: -1 };
  if (!trackOk(AUDIO.track)) AUDIO.track = 0;
  mus.timer = setInterval(schedule, 60);
}
export function setTrack(i) {
  if (!trackOk(i)) return false;
  AUDIO.track = i; savePrefs();
  if (mus) {
    // a short dip so the change is heard as a new song, then the new one starts from its first bar
    const g = musicBus.gain, now = ac.currentTime, v = AUDIO.music * .55;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + .25); g.linearRampToValueAtTime(v, now + .9);
    mus.step = 0; mus.bar = 0; mus.next = ac.currentTime + .4;
  } else startMusic();
  return true;
}
export const trackName = () => (TRACKS[AUDIO.track] || TRACKS[0]).n;
export function nextTrack() {
  for (let k = 1; k <= TRACKS.length; k++) { const i = (AUDIO.track + k) % TRACKS.length; if (trackOk(i)) { if (AUDIO.music <= 0) setVolume('music', .45); setTrack(i); return TRACKS[i]; } }
  return null;
}
// instruments: each track has its own voice so they really sound different
function voice(kind, m, t, dur, vel) {
  if (kind === 'epiano') return epiano(m, t, dur, vel);
  const f = m2f(m), L = mus.lp;
  if (kind === 'musicbox') { tone(f * 2, Math.min(1.6, dur + .6), 'sine', vel * 5.4, 0, 0, t, L); tone(f * 4, .5, 'sine', vel * 1.4, 0, 0, t, L); tone(f, Math.min(1.2, dur + .3), 'triangle', vel * 2.2, 0, 0, t, L); return; }
  if (kind === 'vibes') {
    const o = ac.createOscillator(), gg = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 5.5; vel *= 1.8; lg.gain.value = vel * .35; lfo.connect(lg).connect(gg.gain);
    gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(vel, t + .01); gg.gain.exponentialRampToValueAtTime(.0001, t + dur + .8);
    o.connect(gg).connect(L); o.start(t); lfo.start(t); o.stop(t + dur + .9); lfo.stop(t + dur + .9); return;
  }
  if (kind === 'guitar') { tone(f, .55, 'triangle', vel * 2.4, 0, 0, t, L); tone(f * 2, .3, 'sine', vel * .8, 0, 0, t, L); return; }
}
function epiano(m, t, dur, vel) {
  const a = ac, f = m2f(m), g = a.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .012);
  g.gain.exponentialRampToValueAtTime(vel * .35, t + .7); g.gain.setTargetAtTime(.0001, t + dur, .25);
  const o1 = a.createOscillator(); o1.type = 'sine'; o1.frequency.value = f; o1.detune.value = (Math.random() - .5) * 8;
  const o2 = a.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.002;
  const g2 = a.createGain(); g2.gain.value = .25;
  o1.connect(g); o2.connect(g2).connect(g); g.connect(mus.lp);
  // a short bell-like tine on top of each note
  tone(f * 2, .3, 'sine', vel * .08, 0, 0, t, mus.lp);
  const end = t + dur + 1.4; o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
}
function schedule() {
  const a = ac; if (!a || !mus) return;
  if (AUDIO.music <= 0 || a.state !== 'running') return;
  if (mus.next < a.currentTime - .1) mus.next = a.currentTime + .05; // back from a hidden tab
  const T = TRACKS[AUDIO.track] || TRACKS[0], sd = 60 / T.bpm / 4;
  while (mus.next < a.currentTime + .35) {
    const s = mus.step, t = mus.next + (s % 2 ? sd * .28 : 0), [root, chord] = T.chords[mus.bar % 4], L = mus.lp;
    const V = T.voice || 'epiano', gr = T.groove || 'lofi', bass = (m, d, v = .14) => tone(m2f(m), d, 'sine', v, 0, 0, t, L);
    if (gr === 'bossa') {
      // syncopated guitar comping and a bossa bass (root, fifth)
      if ([0, 3, 6, 10, 12].includes(s)) chord.forEach((m, i) => voice('guitar', m, t + i * .01, sd * 2, .03));
      if (s === 0 || s === 8) bass(root - 12, sd * 5); if (s === 6 || s === 14) bass(root - 5, sd * 2, .1);
      if ([0, 3, 6, 10, 12].includes(s)) tone(1400, .03, 'sine', .03, 0, .7, t, L);     // clave tick
    } else {
      if (s === 0) { chord.forEach((m, i) => voice(V, m, t + i * (V === 'musicbox' ? .09 : .012), sd * 14, V === 'musicbox' ? .025 : .05)); }
      if (gr === 'jazz') { if (s % 4 === 0) bass(root - 12 + [0, 4, 7, 9][s / 4], sd * 3.5, .15); }       // walking bass, one note a beat
      else if (gr !== 'none') { if (s === 0) bass(root - 12, sd * 7, .16); if (s === 6 || (s === 11 && Math.random() < .4)) bass(root - 12 + (Math.random() < .5 ? 7 : 0), sd * 3, .13); }
      else if (s === 0) bass(root - 12, sd * 12, .13);
      if (s === 10 && V !== 'musicbox' && Math.random() < .5) chord.slice(1).forEach(m => voice(V, m, t, sd * 4, .03));
      if (gr === 'lofi') { if (s === 0 || s === 10 || (s === 7 && Math.random() < .3)) tone(90, .3, 'sine', .22, 0, .5, t, L); if (s === 4 || s === 12) tone(330, .07, 'sine', .05, 0, .8, t, L); }
      if (gr === 'jazz' && (s === 4 || s === 12)) tone(520, .05, 'sine', .035, 0, .8, t, L);                // soft rim on 2 and 4
    }
    // melody: a few notes from the scale in the track's own voice
    const busy = V === 'musicbox' ? .45 : gr === 'bossa' ? .2 : (mus.bar % 4 >= 2 ? .3 : .15);
    if (s % 2 === 0 && Math.random() < busy) {
      let k; do k = Math.floor(Math.random() * T.mel.length); while (k === mus.lastMel && T.mel.length > 1);
      mus.lastMel = k; voice(V, T.mel[k] + (V === 'musicbox' ? 12 : 0), t, sd * (2 + Math.floor(Math.random() * 3)), V === 'musicbox' ? .03 : .035);
    }
    mus.next += sd; mus.step = (s + 1) % 16; if (mus.step === 0) mus.bar++;
  }
}
// test hook: lets a headless check measure what the music bus actually outputs
if (typeof window !== 'undefined') window.__AUDIO = () => ({ ac, musicBus, AUDIO, mus, samples: Object.keys(SAMPLES), bed: !!bed, bedLevel: bedGain ? bedGain.gain.value : null });
