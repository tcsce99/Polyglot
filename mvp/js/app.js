/* Polyglot — main app: views, lesson player, exercise engine, review, progress. */
(function () {
  "use strict";
  const $ = function (sel, el) { return (el || document).querySelector(sel); };
  const app = $("#app");

  /* ---------- settings / course helpers ---------- */
  function settings() { return window.SRS.settings(); }
  function setSetting(k, v) { const s = settings(); s[k] = v; window.SRS.saveSettings(s); }
  function currentCourseId() { return settings().courseId || null; }
  function meta(id) { return window.LISAN_LANGS.find(function (l) { return l.id === id; }); }
  function course(id) { return window.LISAN_COURSES[id]; }

  function itemId(kind, ui, i) { return kind + ":" + ui + ":" + i; }
  function itemById(c, id) {
    const p = id.split(":");
    const u = c.units[+p[1]];
    if (!u) return null;
    return p[0] === "v" ? u.vocab[+p[2]] : (u.sentences || [])[+p[2]];
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function md(s) { // markdown-lite: **bold**, _italic_, newlines
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/_(.+?)_/g, "<i>$1</i>").replace(/\n/g, "<br>");
  }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function dirAttr(cid) { return meta(cid).rtl ? ' dir="rtl"' : ""; }

  /* Non-Latin scripts (Arabic, Urdu, CJK, Cyrillic) always show a romanization
     cue so a beginner is never asked to read unfamiliar characters cold. */
  function nonLatin(cid) { const m = meta(cid); return !!(m && m.latin === false); }
  function romanCue(item, cid) {
    return (nonLatin(cid) && item && item.r) ? '<div class="prompt-roman">' + esc(item.r) + "</div>" : "";
  }

  /* Non-blocking toast — used to explain silent audio failures (e.g. a missing
     Android voice pack) instead of leaving the user tapping 🔊 with no result. */
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 6000);
  }
  function ttsFailToast(reason, cid) {
    const name = meta(cid) ? meta(cid).name : "this language";
    if (reason === "no-voice")
      toast("No " + name + " voice is installed on this device. Android: Settings → System → Languages & input → Text-to-speech, then install the " + name + " voice.");
    else if (reason === "unsupported")
      toast("Audio playback isn't supported on this device.");
    else
      toast("Couldn't play audio just now — please try again.");
  }
  async function say(text, cid, notify) {
    const res = await window.Speech.speak(text, meta(cid).bcp47, settings().ttsRate || 0.9);
    if (notify && res && res.ok === false) ttsFailToast(res.reason, cid);
    return res;
  }

  function voiceCheckHtml() {
    return '<div class="vc-title">🔊 Text-to-speech voices on this device</div>' +
      window.LISAN_LANGS.map(function (l) {
        const ok = window.Speech.hasVoice(l.bcp47);
        return '<div class="vc-row"><span>' + l.flag + " " + esc(l.name) + "</span>" +
          '<span class="' + (ok ? "vc-ok" : "vc-no") + '">' + (ok ? "✓ ready" : "✗ not installed") + "</span></div>";
      }).join("") +
      '<p class="hint-text">Missing a voice? On Android add it in Settings → System → Languages &amp; input → Text-to-speech output → install voice data. Most desktop browsers include these already.</p>';
  }

  function speakBtn(text, cid, cls) {
    return '<button class="speak-btn ' + (cls || "") + '" data-say="' + esc(text) + '" title="Listen">🔊</button>';
  }
  function bindSpeak(root, cid) {
    (root || document).querySelectorAll(".speak-btn").forEach(function (b) {
      if (b._bound) return; b._bound = true;
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        say(b.getAttribute("data-say"), cid, true);
      });
    });
  }

  /* ---------- top bar + tabs ---------- */
  function chrome(content, activeTab) {
    const cid = currentCourseId();
    const m = cid ? meta(cid) : null;
    const streak = window.SRS.streak();
    const due = cid ? window.SRS.dueCount(cid) : 0;
    return '<div class="topbar">' +
      '<div class="brand"><span class="brand-char">🌐</span><div><div class="brand-name">Polyglot</div><div class="brand-sub">AI language tutor</div></div></div>' +
      '<div class="topbar-right">' +
        (m ? '<button class="chip course-chip" id="switch-course">' + m.flag + " " + esc(m.name) + "</button>" : "") +
        '<span class="chip">🔥 ' + streak.count + "</span>" +
      "</div></div>" +
      '<div class="view">' + content + "</div>" +
      '<nav class="tabbar">' + [
        ["learn", "📖", "Learn"],
        ["review", "🔁", "Review" + (due ? ' <span class="badge">' + due + "</span>" : "")],
        ["tutor", "🎓", "Tutor"],
        ["progress", "📊", "Progress"],
        ["settings", "⚙️", "More"],
      ].map(function (t) {
        return '<button class="tab' + (activeTab === t[0] ? " active" : "") + '" data-tab="' + t[0] + '"><span class="tab-icon">' + t[1] + "</span><span>" + t[2] + "</span></button>";
      }).join("") + "</nav>";
  }

  function render(content, activeTab) {
    app.innerHTML = chrome(content, activeTab);
    app.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-tab")); });
    });
    const sw = $("#switch-course");
    if (sw) sw.addEventListener("click", function () { viewCoursePicker(); });
    window.scrollTo(0, 0);
  }

  function go(tab) {
    if (!currentCourseId() && tab !== "settings") return viewCoursePicker();
    if (tab === "learn") viewLearn();
    else if (tab === "review") viewReview();
    else if (tab === "tutor") viewTutor();
    else if (tab === "progress") viewProgress();
    else viewSettings();
  }

  /* ---------- course picker ---------- */
  function viewCoursePicker() {
    const html = '<h1 class="h1">Choose a language</h1><p class="sub">Baby steps first — advanced concepts unlock as you show progress. You can switch anytime; progress is saved per language.</p>' +
      '<div class="course-grid">' + window.LISAN_LANGS.map(function (l) {
        const c = window.SRS.course(l.id);
        const started = Object.keys(c.items).length > 0;
        return '<button class="course-card" data-course="' + l.id + '">' +
          '<span class="course-flag">' + l.flag + "</span>" +
          '<span class="course-name">' + esc(l.name) + "</span>" +
          '<span class="course-native">' + esc(l.native) + "</span>" +
          (started ? '<span class="course-xp">' + c.xp + " XP</span>" : "") +
          "</button>";
      }).join("") + "</div>";
    render(html, "learn");
    app.querySelectorAll(".course-card").forEach(function (b) {
      b.addEventListener("click", function () {
        setSetting("courseId", b.getAttribute("data-course"));
        viewLearn();
      });
    });
  }

  /* ---------- Learn: unit list ---------- */
  function unitUnlocked(cid, ui) {
    if (ui === 0) return true;
    return window.SRS.unitScore(cid, "u" + (ui - 1)) >= 70;
  }

  function viewLearn() {
    const cid = currentCourseId();
    const c = course(cid); const m = meta(cid);
    let html = '<h1 class="h1">' + m.flag + " " + esc(m.name) + '</h1><p class="sub">' + esc(c.intro) + "</p>";
    html += c.units.map(function (u, ui) {
      const unlocked = unitUnlocked(cid, ui);
      const score = window.SRS.unitScore(cid, "u" + ui);
      return '<button class="unit-card' + (unlocked ? "" : " locked") + '" data-ui="' + ui + '"' + (unlocked ? "" : " disabled") + ">" +
        '<div class="unit-left"><div class="unit-title">' + (ui + 1) + ". " + esc(u.title) + '</div>' +
        '<div class="unit-meta">' + esc(u.level) + " · " + u.vocab.length + " words · " + (u.notes || []).length + " grammar notes</div></div>" +
        '<div class="unit-right">' + (unlocked ? (score ? '<span class="score ' + (score >= 70 ? "good" : "") + '">' + score + "%</span>" : '<span class="score new">start</span>') : "🔒") + "</div>" +
        "</button>";
    }).join("");
    html += '<p class="hint-text">🔒 Units unlock at 70% on the previous unit — mastery first, then bigger steps. Everything you learn keeps coming back in Review so you never forget it.</p>';
    render(html, "learn");
    app.querySelectorAll(".unit-card:not(.locked)").forEach(function (b) {
      b.addEventListener("click", function () { startLesson(+b.getAttribute("data-ui")); });
    });
  }

  /* ---------- exercise builders ---------- */
  function mcqStep(cid, ui, kind, idx, reverse) {
    return { type: "mcq", cid: cid, ui: ui, kind: kind, idx: idx, reverse: !!reverse };
  }

  function buildLessonSteps(cid, ui) {
    const u = course(cid).units[ui];
    const steps = [];
    // 1. teach: interleave grammar notes and vocab cards (comprehensible input first)
    (u.notes || []).forEach(function (n, i) { steps.push({ type: "note", ui: ui, idx: i }); });
    u.vocab.forEach(function (v, i) { steps.push({ type: "teach", ui: ui, idx: i }); });
    if (u.dialogue) steps.push({ type: "dialogue", ui: ui });
    // 2. easy recognition
    u.vocab.forEach(function (v, i) { steps.push(mcqStep(cid, ui, "v", i, false)); });
    // 3. production (interleaved & harder)
    const prod = [];
    u.vocab.forEach(function (v, i) { if (i % 2 === 0) prod.push(mcqStep(cid, ui, "v", i, true)); });
    (u.sentences || []).forEach(function (s, i) { prod.push({ type: "order", ui: ui, idx: i }); });
    // Listening exercises need a working voice for this language on this device.
    if (window.Speech.hasVoice(meta(cid).bcp47)) {
      u.vocab.slice(0, 3).forEach(function (v, i) { prod.push({ type: "listen", ui: ui, kind: "v", idx: i }); });
    }
    u.vocab.slice(3, 5).forEach(function (v, i) { prod.push({ type: "type", ui: ui, idx: i + 3 }); });
    if (window.Speech.srAvailable()) {
      (u.sentences || []).slice(0, 2).forEach(function (s, i) { prod.push({ type: "speak", ui: ui, idx: i }); });
    }
    return steps.concat(shuffle(prod));
  }

  /* ---------- lesson player ---------- */
  function startLesson(ui) {
    const cid = currentCourseId();
    const steps = buildLessonSteps(cid, ui);
    runSession({
      cid: cid, steps: steps, title: course(cid).units[ui].title,
      isLesson: true, ui: ui,
    });
  }

  function runSession(sess) {
    sess.i = 0; sess.correct = 0; sess.scored = 0;
    nextStep(sess);
  }

  function sessionChrome(sess, inner) {
    const pct = Math.round(100 * sess.i / sess.steps.length);
    return '<div class="lesson-head"><button class="icon-btn" id="quit">✕</button>' +
      '<div class="progressbar"><div class="progressfill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="lesson-body">' + inner + "</div>";
  }

  function nextStep(sess) {
    if (sess.i >= sess.steps.length) return finishSession(sess);
    const step = sess.steps[sess.i];
    const cid = sess.cid;
    const u = course(cid).units[step.ui != null ? step.ui : 0];

    let inner = "";
    if (step.type === "note") inner = renderNote(cid, u.notes[step.idx]);
    else if (step.type === "teach") inner = renderTeach(cid, step, u.vocab[step.idx]);
    else if (step.type === "dialogue") inner = renderDialogue(cid, u.dialogue);
    else if (step.type === "mcq") inner = renderMCQ(cid, step);
    else if (step.type === "order") inner = renderOrder(cid, step);
    else if (step.type === "type") inner = renderType(cid, step);
    else if (step.type === "listen") inner = renderListen(cid, step);
    else if (step.type === "speak") inner = renderSpeak(cid, step);
    else if (step.type === "flash") inner = renderFlash(cid, step);

    app.innerHTML = sessionChrome(sess, inner);
    $("#quit").addEventListener("click", function () { if (confirm("Leave this session? Progress on answered questions is saved.")) go(sess.isLesson ? "learn" : "review"); });
    bindSpeak(app, cid);
    bindStep(sess, step);
    window.scrollTo(0, 0);
  }

  function advance(sess) { sess.i += 1; nextStep(sess); }

  function answer(sess, step, correct, cats, id) {
    sess.scored += 1;
    if (correct) sess.correct += 1;
    if (id) {
      window.SRS.introduce(sess.cid, id);
      window.SRS.record(sess.cid, id, cats, correct, { review: !sess.isLesson });
    }
  }

  function feedbackBar(sess, correct, correctAnswer, cid) {
    const bar = document.createElement("div");
    bar.className = "feedback " + (correct ? "ok" : "bad");
    bar.innerHTML = "<div><b>" + (correct ? "Correct!" : "Not quite.") + "</b>" +
      (correctAnswer ? '<div class="fb-answer"' + dirAttr(cid) + ">" + esc(correctAnswer) + "</div>" : "") +
      '</div><button class="btn primary" id="continue">Continue</button>';
    $(".lesson-body").appendChild(bar);
    $("#continue").addEventListener("click", function () { advance(sess); });
    $("#continue").focus();
  }

  /* ---------- step renderers + binders ---------- */
  function renderNote(cid, n) {
    return '<div class="card note-card"><div class="note-cat">' + (window.LISAN_CATS[n.cat] ? window.LISAN_CATS[n.cat].icon + " " + window.LISAN_CATS[n.cat].label : "") + "</div>" +
      "<h2>" + esc(n.title) + "</h2><p>" + esc(n.body) + "</p>" +
      (n.examples || []).map(function (ex) {
        return '<div class="example"><span class="ex-t"' + dirAttr(cid) + ">" + esc(ex.t) + "</span> " + speakBtn(ex.t, cid) +
          (ex.r ? '<span class="ex-r">' + esc(ex.r) + "</span>" : "") + '<span class="ex-en">' + esc(ex.en) + "</span></div>";
      }).join("") +
      '</div><button class="btn primary big" id="next">Got it</button>';
  }

  function renderTeach(cid, step, v) {
    return '<div class="card teach-card"><div class="teach-t"' + dirAttr(cid) + ">" + esc(v.t) + " " + speakBtn(v.t, cid, "big") + "</div>" +
      (v.r ? '<div class="teach-r">' + esc(v.r) + "</div>" : "") +
      '<div class="teach-en">' + esc(v.en) + "</div></div>" +
      '<p class="hint-text">Listen, say it out loud (shadowing), then continue.</p>' +
      '<button class="btn primary big" id="next">Next</button>';
  }

  function renderDialogue(cid, d) {
    return '<div class="card"><h2>💬 ' + esc(d.title) + '</h2><p class="sub">Real conversation — read along while you listen. This is your comprehensible input.</p>' +
      d.turns.map(function (t) {
        return '<div class="turn ' + (t.s === "A" ? "a" : "b") + '"><div class="turn-t"' + dirAttr(cid) + ">" + esc(t.t) + " " + speakBtn(t.t, cid) + "</div>" +
          (t.r ? '<div class="turn-r">' + esc(t.r) + "</div>" : "") + '<div class="turn-en">' + esc(t.en) + "</div></div>";
      }).join("") + "</div>" +
      '<button class="btn" id="playall">▶ Play whole dialogue</button> <button class="btn primary big" id="next">Continue</button>';
  }

  function renderMCQ(cid, step) {
    const c = course(cid);
    const u = c.units[step.ui];
    const v = u.vocab[step.idx];
    // distractors from the whole course, same kind
    const pool = [];
    c.units.forEach(function (uu) { uu.vocab.forEach(function (x) { if (x !== v) pool.push(x); }); });
    const opts = shuffle(shuffle(pool).slice(0, 3).concat([v]));
    step._opts = opts; step._v = v;
    const prompt = step.reverse ? v.en : v.t;
    return '<h2 class="q">' + (step.reverse ? "Which is “" + esc(v.en) + "”?" : "What does this mean?") + "</h2>" +
      '<div class="prompt"' + (step.reverse ? "" : dirAttr(cid)) + ">" + esc(prompt) + " " + (step.reverse ? "" : speakBtn(v.t, cid)) + "</div>" +
      (step.reverse ? "" : romanCue(v, cid)) +
      '<div class="opts">' + opts.map(function (o, i) {
        const label = step.reverse ? o.t : o.en;
        const cue = step.reverse && nonLatin(cid) && o.r ? '<span class="opt-roman">' + esc(o.r) + "</span>" : "";
        return '<button class="opt" data-i="' + i + '"' + (step.reverse ? dirAttr(cid) : "") + ">" + esc(label) + cue + "</button>";
      }).join("") + "</div>";
  }

  function renderOrder(cid, step) {
    const s = course(cid).units[step.ui].sentences[step.idx];
    const toks = (s.tok || s.t.split(/\s+/)).filter(function (t) { return t.trim(); });
    step._s = s; step._toks = toks;
    return '<h2 class="q">Build the sentence</h2><div class="prompt-en">' + esc(s.en) + "</div>" +
      romanCue(s, cid) +
      '<div class="order-target" id="order-target"' + dirAttr(cid) + "></div>" +
      '<div class="order-bank" id="order-bank"' + dirAttr(cid) + ">" +
      shuffle(toks.map(function (t, i) { return { t: t, i: i }; })).map(function (x) {
        return '<button class="token" data-i="' + x.i + '">' + esc(x.t) + "</button>";
      }).join("") + "</div>" +
      '<button class="btn primary big" id="check" disabled>Check</button>';
  }

  function renderType(cid, step) {
    const v = course(cid).units[step.ui].vocab[step.idx];
    step._v = v;
    return '<h2 class="q">Type it in ' + esc(meta(cid).name) + "</h2>" +
      '<div class="prompt-en">' + esc(v.en) + "</div>" +
      '<input class="type-input" id="type-input"' + dirAttr(cid) + ' autocomplete="off" autocapitalize="none" placeholder="' + (v.r ? "target or romanization" : "type here") + '">' +
      '<button class="btn primary big" id="check">Check</button>';
  }

  function renderListen(cid, step) {
    const c = course(cid);
    const v = c.units[step.ui].vocab[step.idx];
    const pool = [];
    c.units.forEach(function (uu) { uu.vocab.forEach(function (x) { if (x !== v) pool.push(x); }); });
    const opts = shuffle(shuffle(pool).slice(0, 3).concat([v]));
    step._opts = opts; step._v = v;
    return '<h2 class="q">👂 What do you hear?</h2>' +
      '<button class="btn big" id="replay">🔊 Play</button>' +
      '<div class="opts">' + opts.map(function (o, i) {
        return '<button class="opt" data-i="' + i + '">' + esc(o.en) + "</button>";
      }).join("") + "</div>";
  }

  function renderSpeak(cid, step) {
    const s = course(cid).units[step.ui].sentences[step.idx];
    step._s = s;
    return '<h2 class="q">🎤 Say it out loud</h2>' +
      '<div class="prompt"' + dirAttr(cid) + ">" + esc(s.t) + " " + speakBtn(s.t, cid) + "</div>" +
      (s.r ? '<div class="teach-r">' + esc(s.r) + "</div>" : "") +
      '<div class="prompt-en">' + esc(s.en) + "</div>" +
      '<button class="btn primary big" id="mic">🎤 Hold on… tap to speak</button>' +
      '<div id="speak-result"></div>' +
      '<button class="btn ghost" id="skip">Skip (no mic)</button>';
  }

  function renderFlash(cid, step) {
    const v = step._item;
    return '<h2 class="q">Do you remember this?</h2>' +
      '<div class="prompt"' + dirAttr(cid) + ">" + esc(v.t) + " " + speakBtn(v.t, cid) + "</div>" +
      (v.r ? '<div class="teach-r">' + esc(v.r) + "</div>" : "") +
      '<div id="flash-answer" class="hidden"><div class="teach-en">' + esc(v.en) + "</div>" +
      '<div class="flash-grade"><button class="btn bad-btn" id="g-no">Forgot</button><button class="btn" id="g-hard">Hard</button><button class="btn primary" id="g-yes">Knew it</button></div></div>' +
      '<button class="btn primary big" id="reveal">Show answer</button>';
  }

  function bindStep(sess, step) {
    const cid = sess.cid;
    if (step.type === "note" || step.type === "teach") {
      if (step.type === "teach") {
        const v = course(cid).units[step.ui].vocab[step.idx];
        window.SRS.introduce(cid, itemId("v", step.ui, step.idx));
        say(v.t, cid);
      }
      $("#next").addEventListener("click", function () { advance(sess); });
    }
    else if (step.type === "dialogue") {
      const d = course(cid).units[step.ui].dialogue;
      $("#next").addEventListener("click", function () { advance(sess); });
      $("#playall").addEventListener("click", async function () {
        for (const t of d.turns) {
          const res = await say(t.t, cid);
          if (res && res.ok === false) { ttsFailToast(res.reason, cid); break; }
        }
      });
    }
    else if (step.type === "mcq" || step.type === "listen") {
      const v = step._v;
      const id = itemId("v", step.ui, step.idx);
      if (step.type === "listen") {
        const play = function () { say(v.t, cid, true); };
        $("#replay").addEventListener("click", play); play();
      }
      app.querySelectorAll(".opt").forEach(function (b) {
        b.addEventListener("click", function () {
          const chosen = step._opts[+b.getAttribute("data-i")];
          const ok = chosen === v;
          b.classList.add(ok ? "right" : "wrong");
          app.querySelectorAll(".opt").forEach(function (x) { x.disabled = true; if (step._opts[+x.getAttribute("data-i")] === v) x.classList.add("right"); });
          const cats = (v.cats || ["vocabulary"]).concat(step.type === "listen" ? ["listening"] : []);
          answer(sess, step, ok, cats, id);
          feedbackBar(sess, ok, v.t + (v.r ? " (" + v.r + ")" : "") + " — " + v.en, cid);
        });
      });
    }
    else if (step.type === "order") {
      const s = step._s; const toks = step._toks;
      const target = $("#order-target"); const bank = $("#order-bank"); const check = $("#check");
      const picked = [];
      bank.querySelectorAll(".token").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.classList.contains("used")) return;
          b.classList.add("used");
          picked.push(+b.getAttribute("data-i"));
          const chip = document.createElement("button");
          chip.className = "token placed"; chip.textContent = toks[+b.getAttribute("data-i")];
          chip.addEventListener("click", function () {
            picked.splice(picked.indexOf(+b.getAttribute("data-i")), 1);
            chip.remove(); b.classList.remove("used");
            check.disabled = picked.length !== toks.length;
          });
          target.appendChild(chip);
          check.disabled = picked.length !== toks.length;
        });
      });
      check.addEventListener("click", function () {
        const ok = picked.every(function (p, idx) { return toks[p] === toks[idx]; });
        const id = itemId("s", step.ui, step.idx);
        answer(sess, step, ok, (s.cats || []).concat(["wordorder"]), id);
        feedbackBar(sess, ok, s.t + (s.r ? " (" + s.r + ")" : ""), cid);
        check.disabled = true;
      });
    }
    else if (step.type === "type") {
      const v = step._v; const input = $("#type-input");
      input.focus();
      const doCheck = function () {
        const S = window.Speech;
        const said = input.value;
        const sim = Math.max(S.similarity(said, v.t), v.r ? S.similarity(said, v.r) : 0);
        const ok = sim >= 0.8;
        const id = itemId("v", step.ui, step.idx);
        answer(sess, step, ok, v.cats || ["vocabulary"], id);
        feedbackBar(sess, ok, v.t + (v.r ? " (" + v.r + ")" : ""), cid);
        $("#check").disabled = true; input.disabled = true;
      };
      $("#check").addEventListener("click", doCheck);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") doCheck(); });
    }
    else if (step.type === "speak") {
      const s = step._s;
      const id = itemId("s", step.ui, step.idx);
      $("#skip").addEventListener("click", function () { advance(sess); });
      $("#mic").addEventListener("click", async function () {
        const btn = $("#mic");
        btn.textContent = "🎙️ Listening… speak now"; btn.disabled = true;
        try {
          const res = await window.Speech.listen(meta(cid).bcp47);
          const sc = window.Speech.scorePronunciation(res, s.t, s.r);
          const pct = Math.round(sc.score * 100);
          const ok = sc.score >= 0.65;
          const diff = window.Speech.wordDiff(sc.heard, s.t);
          $("#speak-result").innerHTML = '<div class="card speak-card"><div class="speak-score ' + (ok ? "ok" : "bad") + '">' + pct + "%</div>" +
            '<div class="speak-heard">You said: “' + esc(sc.heard) + "”</div>" +
            '<div class="speak-diff"' + dirAttr(cid) + ">" + diff.map(function (w) { return '<span class="' + (w.ok ? "w-ok" : "w-bad") + '">' + esc(w.word) + "</span>"; }).join(" ") + "</div></div>";
          answer(sess, step, ok, (s.cats || []).concat(["speaking", "pronunciation"]), id);
          feedbackBar(sess, ok, ok ? null : s.t + (s.r ? " (" + s.r + ")" : ""), cid);
        } catch (e) {
          $("#speak-result").innerHTML = '<div class="card speak-card"><p>Couldn’t hear you (' + esc(e.message) + "). Check mic permission — or skip.</p></div>";
          btn.textContent = "🎤 Try again"; btn.disabled = false;
        }
      });
    }
    else if (step.type === "flash") {
      const v = step._item; const id = step._id;
      $("#reveal").addEventListener("click", function () {
        $("#flash-answer").classList.remove("hidden");
        $("#reveal").classList.add("hidden");
      });
      const grade = function (correct, hard) {
        window.SRS.record(cid, id, v.cats || ["vocabulary"], correct, { hard: hard, review: true });
        sess.scored += 1; if (correct) sess.correct += 1;
        advance(sess);
      };
      $("#g-no").addEventListener("click", function () { grade(false); });
      $("#g-hard").addEventListener("click", function () { grade(true, true); });
      $("#g-yes").addEventListener("click", function () { grade(true, false); });
    }
  }

  function finishSession(sess) {
    const pct = sess.scored ? Math.round(100 * sess.correct / sess.scored) : 100;
    if (sess.isLesson) window.SRS.setUnitScore(sess.cid, "u" + sess.ui, pct);
    const passed = pct >= 70;
    const html = '<div class="card finish-card">' +
      "<h1>" + (passed ? "🎉" : "💪") + " " + pct + "%</h1>" +
      "<p>" + (sess.isLesson
        ? (passed ? "Unit passed! The next unit is unlocked, and today's words joined your review deck — they'll resurface right before you'd forget them."
                  : "Almost — you need 70% to unlock the next unit. Review the words and try again; repetition is the method, not a setback.")
        : "Review done. Every answer reschedules the card: easy words drift far into the future, hard ones come back sooner.") + "</p>" +
      '<button class="btn primary big" id="done">Continue</button></div>';
    render(html, sess.isLesson ? "learn" : "review");
    $("#done").addEventListener("click", function () { go(sess.isLesson ? "learn" : "review"); });
  }

  /* ---------- Review (SRS) ---------- */
  function viewReview() {
    const cid = currentCourseId();
    const due = window.SRS.due(cid);
    const total = Object.keys(window.SRS.course(cid).items).length;
    let html = '<h1 class="h1">🔁 Review</h1>';
    if (!total) {
      html += '<div class="card"><p>Nothing to review yet — finish a lesson first and its words will start cycling here on a spaced-repetition schedule (the same science behind Anki).</p></div>';
      return render(html, "review");
    }
    html += '<div class="stat-row"><div class="stat"><div class="stat-n">' + due.length + '</div><div class="stat-l">due now</div></div>' +
      '<div class="stat"><div class="stat-n">' + total + '</div><div class="stat-l">learning</div></div></div>';
    if (due.length) {
      html += '<button class="btn primary big" id="start-review">Start review (' + Math.min(due.length, 20) + ")</button>";
    } else {
      html += '<div class="card"><p>✅ All caught up. Cards come back just before you’d forget them — check again later today or tomorrow.</p></div>';
    }
    render(html, "review");
    const b = $("#start-review");
    if (b) b.addEventListener("click", function () { startReview(); });
  }

  function startReview() {
    const cid = currentCourseId();
    const c = course(cid);
    const due = shuffle(window.SRS.due(cid)).slice(0, 20);
    const canHear = window.Speech.hasVoice(meta(cid).bcp47);
    const steps = due.map(function (id) {
      const item = itemById(c, id);
      if (!item) return null;
      const p = id.split(":"); const ui = +p[1]; const idx = +p[2];
      if (p[0] === "s") {
        // sentences: alternate word-order and speaking
        if (window.Speech.srAvailable() && Math.random() < 0.35) return { type: "speak", ui: ui, idx: idx };
        return { type: "order", ui: ui, idx: idx };
      }
      const r = Math.random();
      if (r < 0.35) return { type: "flash", _item: item, _id: id, ui: ui, idx: idx };
      if (r < 0.6) return mcqStep(cid, ui, "v", idx, Math.random() < 0.5);
      // Listening only when a voice exists; otherwise fall back to recognition.
      if (r < 0.8) return canHear ? { type: "listen", ui: ui, idx: idx } : mcqStep(cid, ui, "v", idx, false);
      return { type: "type", ui: ui, idx: idx };
    }).filter(Boolean);
    runSession({ cid: cid, steps: steps, isLesson: false });
  }

  /* ---------- Tutor ---------- */
  let tutorInstance = null, tutorCourse = null;

  function viewTutor() {
    const cid = currentCourseId();
    if (!tutorInstance || tutorCourse !== cid) {
      tutorInstance = window.Tutor.create(cid);
      tutorCourse = cid;
      tutorInstance._log = [];
    }
    const cloud = window.Tutor.isCloud(tutorInstance);
    const html = '<div class="tutor-head"><h1 class="h1">🎓 Tutor</h1>' +
      '<span class="chip ' + (cloud ? "cloud" : "") + '">' + (cloud ? "Claude · full conversation" : "Built-in · offline") + "</span></div>" +
      '<div class="chat" id="chat"></div>' +
      '<div class="chat-input-row">' +
        (window.Speech.srAvailable() ? '<button class="icon-btn mic" id="chat-mic" title="Speak">🎤</button>' : "") +
        '<input class="chat-input" id="chat-input" placeholder="Type in ' + esc(meta(cid).name) + ' or English…" autocomplete="off">' +
        '<button class="icon-btn send" id="chat-send" title="Send">➤</button>' +
      "</div>";
    render(html, "tutor");
    const chat = $("#chat");
    if (!tutorInstance._log.length) {
      const g = tutorInstance.greet();
      tutorInstance._log.push({ who: "tutor", text: g.text });
    }
    tutorInstance._log.forEach(function (m) { appendMsg(chat, m.who, m.text, cid); });
    chat.scrollTop = chat.scrollHeight;

    const input = $("#chat-input");
    const send = async function (text, spoken) {
      text = (text || input.value).trim();
      if (!text) return;
      input.value = "";
      tutorInstance._log.push({ who: "me", text: text });
      appendMsg(chat, "me", text, cid);
      const typing = appendMsg(chat, "tutor", "…", cid);
      try {
        const reply = await tutorInstance.respond(text, spoken);
        typing.remove();
        tutorInstance._log.push({ who: "tutor", text: reply.text });
        const el = appendMsg(chat, "tutor", reply.text, cid);
        if (reply.speakText) {
          const btn = document.createElement("button");
          btn.className = "speak-btn"; btn.textContent = "🔊";
          btn.addEventListener("click", function () { say(reply.speakText, cid, true); });
          el.appendChild(btn);
        }
      } catch (e) {
        typing.remove();
        appendMsg(chat, "tutor", "⚠️ " + e.message + (window.Tutor.isCloud(tutorInstance) ? "\n(Check your API key in Settings, or clear it to use the offline tutor.)" : ""), cid);
      }
      chat.scrollTop = chat.scrollHeight;
    };
    $("#chat-send").addEventListener("click", function () { send(); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
    const micBtn = $("#chat-mic");
    if (micBtn) micBtn.addEventListener("click", async function () {
      micBtn.classList.add("rec"); micBtn.textContent = "🎙️";
      try {
        const res = await window.Speech.listen(meta(cid).bcp47);
        send(res.text, true);
      } catch (e) { appendMsg(chat, "tutor", "⚠️ Mic: " + e.message, cid); }
      micBtn.classList.remove("rec"); micBtn.textContent = "🎤";
    });
  }

  function appendMsg(chat, who, text, cid) {
    const el = document.createElement("div");
    el.className = "msg " + (who === "me" ? "me" : "tutor");
    el.innerHTML = md(text);
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
  }

  /* ---------- Progress ---------- */
  function viewProgress() {
    const cid = currentCourseId();
    const c = window.SRS.course(cid);
    const stats = window.SRS.catStats(cid);
    const streak = window.SRS.streak();
    const due = window.SRS.dueCount(cid);
    const days = window.SRS.lastNDays(cid, 14);
    const maxDay = Math.max.apply(null, days.map(function (d) { return d.answers; }).concat([1]));
    const unitsDone = course(cid).units.filter(function (u, i) { return window.SRS.unitScore(cid, "u" + i) >= 70; }).length;

    let html = '<h1 class="h1">📊 Progress — ' + esc(meta(cid).name) + "</h1>" +
      '<div class="stat-row">' +
        '<div class="stat"><div class="stat-n">' + c.xp + '</div><div class="stat-l">XP</div></div>' +
        '<div class="stat"><div class="stat-n">🔥 ' + streak.count + '</div><div class="stat-l">day streak</div></div>' +
        '<div class="stat"><div class="stat-n">' + unitsDone + "/" + course(cid).units.length + '</div><div class="stat-l">units passed</div></div>' +
        '<div class="stat"><div class="stat-n">' + due + '</div><div class="stat-l">due reviews</div></div>' +
      "</div>";

    html += '<div class="card"><h2>Strengths & weaknesses</h2><p class="sub">Accuracy by grammatical category, weakest first — the tutor and review mix automatically target the red bars.</p>';
    if (!stats.length) html += "<p>Answer some exercises first and your per-category profile will appear here.</p>";
    else html += stats.map(function (s) {
      const info = window.LISAN_CATS[s.cat] || { label: s.cat, icon: "" };
      const pct = Math.round(s.acc * 100);
      const cls = pct >= 80 ? "good" : pct >= 55 ? "mid" : "weak";
      return '<div class="cat-row"><div class="cat-label">' + info.icon + " " + esc(info.label) + '<span class="cat-count">' + s.correct + "/" + s.total + "</span></div>" +
        '<div class="cat-bar"><div class="cat-fill ' + cls + '" style="width:' + pct + '%"></div></div></div>';
    }).join("");
    html += "</div>";

    html += '<div class="card"><h2>Last 14 days</h2><div class="chart">' + days.map(function (d) {
      const h = Math.round(64 * d.answers / maxDay);
      return '<div class="chart-col" title="' + d.date + ": " + d.answers + ' answers"><div class="chart-bar" style="height:' + Math.max(h, d.answers ? 4 : 0) + 'px"></div><div class="chart-x">' + d.date.slice(8) + "</div></div>";
    }).join("") + "</div></div>";

    html += '<div class="card"><h2>All languages</h2>' + window.LISAN_LANGS.map(function (l) {
      const cc = window.SRS.course(l.id);
      const n = Object.keys(cc.items).length;
      if (!n && !cc.xp) return "";
      return '<div class="lang-row"><span>' + l.flag + " " + esc(l.name) + "</span><span>" + cc.xp + " XP · " + n + " items</span></div>";
    }).join("") + "</div>";

    render(html, "progress");
  }

  /* ---------- Settings ---------- */
  function viewSettings() {
    const s = settings();
    const cid = currentCourseId();
    let html = '<h1 class="h1">⚙️ Settings</h1>' +
      '<div class="card"><h2>Language</h2><button class="btn" id="pick-course">' + (cid ? meta(cid).flag + " " + esc(meta(cid).name) + " — change" : "Choose a language") + "</button></div>" +
      '<div class="card"><h2>AI tutor (optional upgrade)</h2>' +
      '<p class="sub">The built-in tutor works offline and free, forever. For open conversation with deep grammar correction, paste an Anthropic API key (console.anthropic.com). The key is stored only on this device.</p>' +
      '<input class="type-input" id="api-key" type="password" placeholder="sk-ant-..." value="' + esc(s.apiKey || "") + '">' +
      '<button class="btn primary" id="save-key">Save key</button></div>' +
      '<div class="card"><h2>Speech</h2><label class="sub">Speaking speed: <span id="rate-val">' + (s.ttsRate || 0.9) + "</span></label>" +
      '<input type="range" id="tts-rate" min="0.5" max="1.2" step="0.1" value="' + (s.ttsRate || 0.9) + '">' +
      "<p class=\"sub\">" + (window.Speech.srAvailable() ? "🎤 Speech recognition available on this device." : "🎤 Speech recognition isn't supported in this browser — the Android app and Chrome/Edge support it.") + "</p>" +
      '<div class="voice-check" id="voice-check">' + voiceCheckHtml() + "</div></div>";

    if (cid) {
      const res = (window.LISAN_RESOURCES[cid] || []).concat(window.LISAN_RESOURCES.all);
      html += '<div class="card"><h2>Free resources for ' + esc(meta(cid).name) + "</h2>" + res.map(function (r) {
        return '<a class="res-link" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.name) + '<span class="res-desc">' + esc(r.desc) + "</span></a>";
      }).join("") + "</div>";
    }

    html += '<div class="card"><h2>About the method</h2><p class="sub">Polyglot combines proven techniques: spaced repetition (SM-2) so you review right before forgetting, comprehensible input (dialogues), active recall (typing & multiple choice), shadowing & pronunciation scoring (speech recognition), sentence-building for syntax, interleaving, and mastery gating so difficulty grows with you.</p></div>' +
      '<div class="card danger"><h2>Reset</h2><button class="btn bad-btn" id="reset">Erase all progress</button></div>';

    render(html, "settings");
    // Voices can enumerate asynchronously (Android WebView); refresh once ready.
    if (window.Speech.ensureVoices) window.Speech.ensureVoices().then(function () {
      const vc = document.getElementById("voice-check");
      if (vc) vc.innerHTML = voiceCheckHtml();
    });
    $("#pick-course").addEventListener("click", viewCoursePicker);
    $("#save-key").addEventListener("click", function () {
      setSetting("apiKey", $("#api-key").value.trim());
      tutorInstance = null; // rebuild tutor with/without key
      alert("Saved. The Tutor tab now uses " + ($("#api-key").value.trim() ? "Claude." : "the built-in offline tutor."));
    });
    $("#tts-rate").addEventListener("input", function (e) {
      $("#rate-val").textContent = e.target.value;
      setSetting("ttsRate", parseFloat(e.target.value));
    });
    $("#reset").addEventListener("click", function () {
      if (confirm("Really erase ALL progress for every language?")) {
        localStorage.removeItem("lisan.progress");
        viewSettings();
      }
    });
  }

  /* ---------- boot ---------- */
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  // Warm the TTS voice list early so listen-exercise gating is accurate.
  if (window.Speech.ensureVoices) window.Speech.ensureVoices();
  if (currentCourseId()) viewLearn(); else viewCoursePicker();
})();
