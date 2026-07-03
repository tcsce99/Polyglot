/* Polyglot — speech layer: text-to-speech + speech recognition.
   Uses Capacitor native plugins inside the Android app (web APIs don't work
   in the Android WebView) and falls back to the Web Speech API in browsers. */
(function () {
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  function nativePlugin(name) {
    try { return window.Capacitor.registerPlugin(name); } catch (e) { return null; }
  }
  const NativeTTS = isNative ? nativePlugin("TextToSpeech") : null;
  const NativeSR = isNative ? nativePlugin("SpeechRecognition") : null;

  /* ---------- Text to speech ---------- */
  let voicesCache = [];
  let voicesReady = false;
  function refreshVoices() {
    if (!window.speechSynthesis) return;
    const list = speechSynthesis.getVoices() || [];
    voicesCache = list;
    if (list.length) voicesReady = true;
  }
  if (window.speechSynthesis) {
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
  }

  /* Voices load asynchronously on some engines (notably Android WebView / TWA):
     getVoices() is empty until 'voiceschanged' fires. Wait briefly for them. */
  function ensureVoices() {
    if (voicesReady || !window.speechSynthesis) return Promise.resolve();
    return new Promise(function (resolve) {
      let done = false;
      const finish = function () { if (done) return; done = true; refreshVoices(); resolve(); };
      const poll = setInterval(function () { refreshVoices(); if (voicesReady) { clearInterval(poll); finish(); } }, 120);
      setTimeout(function () { clearInterval(poll); finish(); }, 1500);
    });
  }

  function norm(l) { return String(l || "").toLowerCase().replace("_", "-"); }

  function pickVoice(lang) {
    const want = norm(lang), prefix = want.split("-")[0];
    let v = voicesCache.find(function (x) { return norm(x.lang) === want; });
    if (!v) v = voicesCache.find(function (x) { return norm(x.lang).indexOf(prefix) === 0; });
    return v || null;
  }

  /* Does this device actually have an installed voice for the language? */
  function hasVoice(lang) {
    if (NativeTTS) return true;
    if (!window.speechSynthesis) return false;
    return !!pickVoice(lang);
  }

  /* Returns a Promise<{ ok, reason }>. reason ∈ 'unsupported' | 'no-voice' | 'error'. */
  async function speak(text, lang, rate) {
    rate = rate || 0.9;
    if (NativeTTS) {
      try { await NativeTTS.speak({ text: text, lang: lang, rate: rate, category: "playback" }); return { ok: true }; }
      catch (e) { /* fall through to web */ }
    }
    if (!window.speechSynthesis) return { ok: false, reason: "unsupported" };
    await ensureVoices();
    return new Promise(function (resolve) {
      try { speechSynthesis.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate;
      const v = pickVoice(lang);
      if (v) u.voice = v;
      let settled = false, started = false, failTimer = null, safety = null;
      const done = function (res) {
        if (settled) return; settled = true;
        clearTimeout(failTimer); clearTimeout(safety);
        resolve(res);
      };
      u.onstart = function () { started = true; };
      u.onend = function () { done({ ok: true }); };
      u.onerror = function (e) { done({ ok: false, reason: (e && e.error) || "error" }); };
      /* If playback never starts and no matching voice is installed, the
         language pack is missing (common on Android for Arabic/Urdu/CJK). */
      failTimer = setTimeout(function () {
        if (started || hasVoice(lang)) return;
        try { speechSynthesis.cancel(); } catch (e) {}
        done({ ok: false, reason: "no-voice" });
      }, 3000);
      /* Absolute backstop so an awaiting caller can never hang. */
      safety = setTimeout(function () { done({ ok: true }); }, 20000);
      speechSynthesis.speak(u);
      /* Work around the Chrome/Android bug where synthesis starts paused. */
      try { speechSynthesis.resume(); } catch (e) {}
    });
  }

  function ttsAvailable() {
    if (NativeTTS) return true;
    return !!window.speechSynthesis;
  }

  /* ---------- Speech recognition ---------- */
  const WebSR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  function srAvailable() { return !!(NativeSR || WebSR); }

  /* listen(lang) -> Promise<{text, alternatives[]}>; rejects on error/no-speech */
  async function listen(lang, onPartial) {
    if (NativeSR) {
      try {
        const perm = await NativeSR.checkPermissions();
        if (perm.speechRecognition !== "granted") await NativeSR.requestPermissions();
        const res = await NativeSR.start({ language: lang, maxResults: 5, partialResults: false, popup: false });
        const matches = (res && res.matches) || [];
        if (!matches.length) throw new Error("no-speech");
        return { text: matches[0], alternatives: matches };
      } catch (e) { throw new Error(e && e.message || "recognition-failed"); }
    }
    if (!WebSR) throw new Error("unsupported");
    return new Promise(function (resolve, reject) {
      const rec = new WebSR();
      rec.lang = lang; rec.interimResults = !!onPartial; rec.maxAlternatives = 5;
      let done = false;
      rec.onresult = function (ev) {
        const res = ev.results[ev.results.length - 1];
        if (!res.isFinal && onPartial) { onPartial(res[0].transcript); return; }
        if (res.isFinal) {
          done = true;
          const alts = [];
          for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
          resolve({ text: res[0].transcript, alternatives: alts });
        }
      };
      rec.onerror = function (ev) { if (!done) { done = true; reject(new Error(ev.error || "recognition-failed")); } };
      rec.onend = function () { if (!done) { done = true; reject(new Error("no-speech")); } };
      try { rec.start(); } catch (e) { reject(e); }
    });
  }

  /* ---------- Pronunciation scoring ---------- */
  function normalize(s) {
    return (s || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")     // strip latin diacritics
      .replace(/[.,!?;:'"¿¡。、，？！「」・؟،٬۔\-–—()《》""'']/g, "")
      .replace(/\s+/g, " ").trim();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      const tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }

  /* similarity 0..1 between what was said and the target */
  function similarity(said, target) {
    const a = normalize(said), b = normalize(target);
    if (!a.length || !b.length) return 0;
    const d = levenshtein(a, b);
    return Math.max(0, 1 - d / Math.max(a.length, b.length));
  }

  /* Score against target and romanization; return best. */
  function scorePronunciation(result, target, roman) {
    let best = 0, bestText = result.text;
    (result.alternatives || [result.text]).forEach(function (alt) {
      const s1 = similarity(alt, target);
      const s2 = roman ? similarity(alt, roman) : 0;
      const s = Math.max(s1, s2);
      if (s > best) { best = s; bestText = alt; }
    });
    return { score: best, heard: bestText };
  }

  /* Per-word diff for feedback: returns [{word, ok}] against the target. */
  function wordDiff(said, target) {
    const saidW = normalize(said).split(" ");
    const targetW = normalize(target).split(" ");
    return targetW.map(function (w, i) {
      const ok = saidW.some(function (sw) { return similarity(sw, w) >= 0.6; });
      return { word: target.split(/\s+/)[i] || w, ok: ok };
    });
  }

  window.Speech = {
    isNative: isNative,
    speak: speak,
    ttsAvailable: ttsAvailable,
    hasVoice: hasVoice,
    ensureVoices: ensureVoices,
    srAvailable: srAvailable,
    listen: listen,
    normalize: normalize,
    similarity: similarity,
    scorePronunciation: scorePronunciation,
    wordDiff: wordDiff,
  };
})();
