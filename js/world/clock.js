// WORLD CLOCK — global simulation time, independent of the café.
// Nothing in the café (open/closed, decoration mode, menus, visits) can pause or reset it.
// One full day lasts DAY_LENGTH_MIN real minutes; change it here to tune the pace.
export const DAY_HOUR = 11;        // the café always sits in late-morning light
export const DAY_LENGTH_MIN = 24;              // 24 real minutes = 24 game hours (1 game hour per real minute)
const GAME_MIN_PER_SEC = 1440 / (DAY_LENGTH_MIN * 60);

export const Clock = {
  minutes: 8 * 60,          // 0..1440, starts at 08:00 on a new save
  day: 1,
  bind(store) {             // store: object persisted with the save ({ min, day })
    if (!store || typeof store !== 'object') store = { min: this.minutes, day: this.day };
    this.store = store;
    if (Number.isFinite(store.min)) this.minutes = store.min; else store.min = this.minutes;
    if (Number.isFinite(store.day)) this.day = store.day; else store.day = this.day;
  },
  tick(dt) {
    return;          // the day/night cycle is off: the light stays at DAY_HOUR
    /* eslint-disable no-unreachable */
    this.minutes += dt * GAME_MIN_PER_SEC;
    if (this.minutes >= 1440) { this.minutes -= 1440; this.day++; }
    if (this.store) { this.store.min = this.minutes; this.store.day = this.day; }
    /* eslint-enable no-unreachable */
  },
  set(h) { this.minutes = ((h % 24) + 24) % 24 * 60; if (this.store) this.store.min = this.minutes; },
  get hours() { return this.minutes / 60; },
  label() { const m = Math.floor(this.minutes); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); },
  period() {
    const h = this.hours;
    if (h < 5) return 'Madrugada'; if (h < 6.5) return 'Amanhecer'; if (h < 11) return 'Manhã'; if (h < 13.5) return 'Meio-dia';
    if (h < 16.8) return 'Tarde'; if (h < 18) return 'Golden hour'; if (h < 19.2) return 'Pôr do sol'; return 'Noite';
  },
};
