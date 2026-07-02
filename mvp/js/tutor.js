/* Polyglot — AI tutor.
   Two engines:
   1. Built-in tutor (always works, offline): drills you with prompts from the
      course, checks your answer against expected patterns, scores speech.
   2. Claude tutor (optional): if the user saves an Anthropic API key in
      Settings, free-form conversation with real grammar correction. */
(function () {
  /* ---------- shared ---------- */
  function courseMeta(courseId) {
    return window.LISAN_LANGS.find(function (l) { return l.id === courseId; });
  }

  /* Tags like [verbs] or [wordorder] in tutor replies feed weakness tracking. */
  function extractCatTags(text) {
    const cats = [];
    const re = /\[([a-z]+)\]/g; let m;
    while ((m = re.exec(text))) { if (window.LISAN_CATS[m[1]]) cats.push(m[1]); }
    return cats;
  }

  /* ---------- built-in (offline) tutor ---------- */
  function BuiltinTutor(courseId) {
    this.courseId = courseId;
    this.course = window.LISAN_COURSES[courseId];
    this.meta = courseMeta(courseId);
    this.pending = null; // the exercise we're waiting for an answer to
  }

  BuiltinTutor.prototype.pickExercise = function () {
    const unitsDone = window.SRS.course(this.courseId).units;
    // Prefer sentences from units the learner has started, weighted to weak cats.
    const weak = window.SRS.weakCats(this.courseId, 3);
    let pool = [];
    this.course.units.forEach(function (u, ui) {
      if (ui > 0 && !unitsDone["u" + ui]) return; // only unlocked material
      (u.sentences || []).forEach(function (s) { pool.push({ s: s, unit: u }); });
    });
    if (!pool.length) pool = this.course.units[0].sentences.map(function (s) { return { s: s, unit: null }; });
    const weighted = pool.filter(function (x) { return (x.s.cats || []).some(function (c) { return weak.indexOf(c) >= 0; }); });
    const from = weighted.length && Math.random() < 0.6 ? weighted : pool;
    return from[Math.floor(Math.random() * from.length)];
  };

  BuiltinTutor.prototype.greet = function () {
    const ex = this.pickExercise();
    this.pending = ex;
    return {
      text: "I'm your practice partner for " + this.meta.name + " (works offline — add a Claude API key in Settings for free conversation).\n\nSay or type this in " + this.meta.name + ":\n\n**" + ex.s.en + "**",
      hint: ex.s.t, hintR: ex.s.r || null, speakText: null, cats: [],
    };
  };

  BuiltinTutor.prototype.respond = function (userText, spoken) {
    const S = window.Speech;
    if (!this.pending) return this.greet();
    const target = this.pending.s;
    const sim = Math.max(S.similarity(userText, target.t), target.r ? S.similarity(userText, target.r) : 0);
    const cats = target.cats || ["vocabulary"];
    let feedback;
    const correct = sim >= 0.75;
    const close = sim >= 0.45 && sim < 0.75;

    window.SRS.record(this.courseId, "tutor:" + target.t, cats, correct, { xp: 8 });

    if (correct) {
      feedback = (spoken ? "🎤 " : "") + "✅ " + (sim >= 0.92 ? "Perfect!" : "Correct!") + "\n\n" + target.t + (target.r ? "  (" + target.r + ")" : "") + "\n_" + target.en + "_";
    } else if (close) {
      const diff = S.wordDiff(userText, target.t);
      const marked = diff.map(function (w) { return w.ok ? w.word : "**" + w.word + "**"; }).join(" ");
      feedback = "🔶 Close! Compare with the answer — the bold parts need work:\n\n" + marked + (target.r ? "\n(" + target.r + ")" : "") + "\n_" + target.en + "_";
    } else {
      feedback = "❌ Not quite. The answer is:\n\n" + target.t + (target.r ? "  (" + target.r + ")" : "") + "\n_" + target.en + "_\n\nListen and repeat, then we'll try another.";
    }

    const next = this.pickExercise();
    this.pending = next;
    return {
      text: feedback + "\n\n—\nNext one:\n**" + next.s.en + "**",
      speakText: target.t, cats: cats, correct: correct,
    };
  };

  /* ---------- Claude (cloud) tutor ---------- */
  function ClaudeTutor(courseId, apiKey) {
    this.courseId = courseId;
    this.apiKey = apiKey;
    this.meta = courseMeta(courseId);
    this.history = [];
  }

  ClaudeTutor.prototype.systemPrompt = function () {
    const done = Object.keys(window.SRS.course(this.courseId).units).length;
    const weak = window.SRS.weakCats(this.courseId, 3);
    const catList = Object.keys(window.LISAN_CATS).join(", ");
    return [
      "You are Polyglot, a friendly " + this.meta.name + " tutor for an English-speaking beginner.",
      "Learner level: has completed " + done + " of 6 beginner units.",
      weak.length ? "Known weak areas: " + weak.join(", ") + " — gently drill these." : "",
      "Rules:",
      "- Keep replies short (2-5 lines). Write " + this.meta.name + " with an English gloss in parentheses." + (this.meta.rtl || ["cmn","yue","ja","ko","ru","ur","arz"].indexOf(this.courseId) >= 0 ? " Include romanization for every " + this.meta.name + " phrase." : ""),
      "- ALWAYS correct the learner's mistakes: quote the wrong part, give the fix, and one-line why.",
      "- After each correction, tag the grammar area in square brackets using exactly one of: " + catList + ".",
      "- End every reply with a short question or prompt in " + this.meta.name + " to keep the conversation going.",
      "- If the learner writes in English, answer briefly and coax them back into " + this.meta.name + ".",
    ].filter(Boolean).join("\n");
  };

  ClaudeTutor.prototype.greet = function () {
    return {
      text: "Connected to Claude — let's talk in " + this.meta.name + "! Type or use the mic. I'll correct your grammar as we go.\n\nStart with anything — introduce yourself, or ask me a question.",
      speakText: null, cats: [],
    };
  };

  ClaudeTutor.prototype.respond = async function (userText) {
    this.history.push({ role: "user", content: userText });
    // keep context bounded
    if (this.history.length > 24) this.history = this.history.slice(-24);
    const body = {
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: this.systemPrompt(),
      messages: this.history,
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(function () { return ""; });
      throw new Error("Claude API error " + res.status + (errText ? ": " + errText.slice(0, 200) : ""));
    }
    const data = await res.json();
    let text = "";
    (data.content || []).forEach(function (b) { if (b.type === "text") text += b.text; });
    this.history.push({ role: "assistant", content: text });

    // Every [cat] tag = a correction in that area -> log as a miss for weakness tracking.
    const cats = extractCatTags(text);
    cats.forEach(function (c) {
      window.SRS.record(this.courseId, "tutor-correction:" + c, [c], false, { xp: 0 });
    }, this);
    if (!cats.length) window.SRS.record(this.courseId, "tutor-turn", ["speaking"], true, { xp: 6 });

    // Speak the first target-language line (strip tags/markdown/glosses).
    const firstLine = (text.split("\n").find(function (l) { return l.trim(); }) || "")
      .replace(/\[[a-z]+\]/g, "").replace(/\([^)]*\)/g, "").replace(/[*_#>`]/g, "").trim();
    return { text: text, speakText: firstLine || null, cats: cats };
  };

  window.Tutor = {
    create: function (courseId) {
      const key = (window.SRS.settings().apiKey || "").trim();
      return key ? new ClaudeTutor(courseId, key) : new BuiltinTutor(courseId);
    },
    isCloud: function (t) { return t instanceof ClaudeTutor; },
  };
})();
