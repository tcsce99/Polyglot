/* Polyglot — spaced repetition (SM-2 variant) + progress store.
   Everything persists in localStorage under "lisan.*". */
(function () {
  const KEY = "lisan.progress";
  const SETTINGS_KEY = "lisan.settings";
  const DAY = 24 * 60 * 60 * 1000;

  function todayStr(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { courses: {}, streak: { count: 0, last: null } }; }
    catch (e) { return { courses: {}, streak: { count: 0, last: null } }; }
  }
  function save(p) { localStorage.setItem(KEY, JSON.stringify(p)); }

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

  function courseState(p, courseId) {
    if (!p.courses[courseId]) {
      p.courses[courseId] = { items: {}, cats: {}, units: {}, xp: 0, log: {} };
    }
    const c = p.courses[courseId];
    c.items = c.items || {}; c.cats = c.cats || {}; c.units = c.units || {};
    c.xp = c.xp || 0; c.log = c.log || {};
    return c;
  }

  /* SM-2: grade 0-5. We use 5 (easy/correct fast), 4 (correct), 2 (hard/almost), 0 (wrong). */
  function review(item, grade) {
    item.reps = item.reps || 0;
    item.ef = item.ef == null ? 2.5 : item.ef;
    item.interval = item.interval || 0;
    item.lapses = item.lapses || 0;

    if (grade < 3) {
      item.reps = 0;
      item.interval = 0;          // relearn today
      item.lapses += 1;
      item.due = Date.now() + 10 * 60 * 1000; // retry in ~10 min (or same session)
    } else {
      item.reps += 1;
      if (item.reps === 1) item.interval = 1;
      else if (item.reps === 2) item.interval = 3;
      else item.interval = Math.round(item.interval * item.ef);
      item.ef = Math.max(1.3, item.ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
      item.due = Date.now() + item.interval * DAY;
    }
    return item;
  }

  const SRS = {
    todayStr,
    settings: loadSettings,
    saveSettings,

    getState() { return load(); },

    course(courseId) { const p = load(); const c = courseState(p, courseId); save(p); return c; },

    /* Introduce an item into the SRS deck (first exposure). */
    introduce(courseId, itemId) {
      const p = load(); const c = courseState(p, courseId);
      if (!c.items[itemId]) {
        c.items[itemId] = { ef: 2.5, reps: 0, interval: 0, lapses: 0, due: Date.now(), seen: Date.now() };
        save(p);
      }
    },

    /* Record an answer: updates SRS scheduling, per-category stats, XP, streak, daily log. */
    record(courseId, itemId, cats, correct, opts) {
      opts = opts || {};
      const p = load(); const c = courseState(p, courseId);
      const item = c.items[itemId] || (c.items[itemId] = { ef: 2.5, reps: 0, interval: 0, lapses: 0, due: Date.now(), seen: Date.now() });
      review(item, correct ? (opts.hard ? 4 : 5) : 0);

      (cats || ["vocabulary"]).forEach(function (cat) {
        const s = c.cats[cat] || (c.cats[cat] = { correct: 0, total: 0, streak: 0 });
        s.total += 1;
        if (correct) { s.correct += 1; s.streak += 1; } else { s.streak = 0; }
      });

      c.xp += correct ? (opts.xp != null ? opts.xp : 10) : 2;

      const t = todayStr();
      const day = c.log[t] || (c.log[t] = { answers: 0, correct: 0, reviews: 0 });
      day.answers += 1;
      if (correct) day.correct += 1;
      if (opts.review) day.reviews += 1;

      // streak (global across courses)
      const st = p.streak || (p.streak = { count: 0, last: null });
      if (st.last !== t) {
        const yesterday = todayStr(new Date(Date.now() - DAY));
        st.count = st.last === yesterday ? st.count + 1 : 1;
        st.last = t;
      }
      save(p);
      return item;
    },

    /* Items due for review now. */
    due(courseId) {
      const c = this.course(courseId);
      const now = Date.now();
      return Object.keys(c.items).filter(function (id) { return c.items[id].due <= now; });
    },

    dueCount(courseId) { return this.due(courseId).length; },

    setUnitScore(courseId, unitId, score) {
      const p = load(); const c = courseState(p, courseId);
      c.units[unitId] = Math.max(c.units[unitId] || 0, score);
      save(p);
    },

    unitScore(courseId, unitId) { return this.course(courseId).units[unitId] || 0; },

    /* Category stats sorted weakest-first. */
    catStats(courseId) {
      const c = this.course(courseId);
      return Object.keys(c.cats).map(function (cat) {
        const s = c.cats[cat];
        return { cat: cat, correct: s.correct, total: s.total, acc: s.total ? s.correct / s.total : 0, streak: s.streak };
      }).sort(function (a, b) { return a.acc - b.acc; });
    },

    /* Weakest categories with enough data, for the tutor + review mixer. */
    weakCats(courseId, n) {
      return this.catStats(courseId).filter(function (s) { return s.total >= 4 && s.acc < 0.8; })
        .slice(0, n || 3).map(function (s) { return s.cat; });
    },

    streak() { const p = load(); return p.streak || { count: 0, last: null }; },

    lastNDays(courseId, n) {
      const c = this.course(courseId);
      const out = [];
      for (let i = n - 1; i >= 0; i--) {
        const t = todayStr(new Date(Date.now() - i * DAY));
        const d = c.log[t] || { answers: 0, correct: 0, reviews: 0 };
        out.push({ date: t, answers: d.answers, correct: d.correct, reviews: d.reviews });
      }
      return out;
    },
  };

  window.SRS = SRS;
})();
