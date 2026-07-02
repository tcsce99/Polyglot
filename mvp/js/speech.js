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
  if (window.speechSynthesis) {
    const loadVoices = function () { voicesCache = speechSynthesis.getVoices(); };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickVoice(lang) {
    const prefix = lang.split("-")[0].toLowerCase();
    let v = voicesCache.find(function (x) { return x.lang.toLowerCase() === lang.toLowerCase(); });
    if (!v) v = voicesCache.find(function (x) { return x.lang.toLowerCase().indexOf(prefix) === 0; });
    return v || null;
  }

  async function speak(text, lang, rate) {
    rate = rate || 0.9;
    if (NativeTTS) {
      try { await NativeTTS.speak({ text: text, lang: lang, rate: rate, category: "playback" }); return true; }
      catch (e) { /* fall through to web */ }
    }
    if (!window.speechSynthesis) return false;
    return new Promise(function (resolve) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate;
      const v = pickVoice(lang);
      if (v) u.voice = v;
      u.onend = function () { resolve(true); };
      u.onerror = function () { resolve(false); };
      speechSynthesis.speak(u);
    });
  }

  function ttsAvailable(lang) {
    if (NativeTTS) return true;
    if (!window.speechSynthesis) return false;
    return true; // engines usually accept any lang; voice pick is best-effort
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
    srAvailable: srAvailable,
    listen: listen,
    normalize: normalize,
    similarity: similarity,
    scorePronunciation: scorePronunciation,
    wordDiff: wordDiff,
  };
})();
