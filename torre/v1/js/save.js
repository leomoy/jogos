const Save = {
  KEY: 'torre_v1_save',
  data: null,
  fresh() { return { unlocked: 1, stars: Array(10).fill(0), best: Array(10).fill(0), sound: true }; },
  load() {
    try { this.data = Object.assign(this.fresh(), JSON.parse(localStorage.getItem(this.KEY))); }
    catch (e) { this.data = this.fresh(); }
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {} },
  reset() { this.data = this.fresh(); this.save(); },
  record(i, stars, score) {
    const d = this.data;
    d.stars[i] = Math.max(d.stars[i], stars);
    d.best[i] = Math.max(d.best[i], score);
    d.unlocked = Math.max(d.unlocked, Math.min(10, i + 2));
    this.save();
  },
};
