# Polyglot MVP — working app (Phase 0)

A complete, working first version of Polyglot: a zero-build, offline-first PWA in plain HTML/CSS/JS.
It exists so you can **learn today** while the full React/TypeScript build described in
`docs/ROADMAP.md` is developed phase by phase.

## What it already does

- **All 12 launch languages** — Urdu, Egyptian Arabic (dialect, not MSA), Mandarin, Cantonese,
  Spanish, French, Malay, Russian, German, Turkish, Japanese, Korean. Six units each
  (First Contact → People & Pronouns → Numbers & Time → Food & Ordering → Daily Verbs → Getting Around),
  with romanization/pinyin/jyutping/romaji and full RTL rendering for Urdu/Arabic.
- **Both tracks** — grammar notes + syntax exercises (sentence building, typing, cloze-style recall)
  and conversation (dialogues, role-play tutor).
- **AI tutor that listens** — speech recognition (Web Speech API in the browser / Chrome on Android)
  scores your pronunciation with per-word feedback; text-to-speech reads every word and dialogue.
  - Built-in tutor: free, offline, drills you on course sentences and corrects you.
  - Optional Claude mode: paste an Anthropic API key in Settings for open conversation with
    real grammar correction. ⚠️ Dev-mode only — the key lives in your browser's localStorage;
    the proper serverless proxy is Phase 3 of the roadmap.
- **Adaptive baby steps** — units unlock at ≥70% mastery of the previous unit.
- **Never-forget review** — every learned item is scheduled with SM-2 spaced repetition forever
  (the roadmap upgrades this to FSRS via `ts-fsrs`).
- **Progress by grammatical category** — every answer is tagged (verbs, word order, particles,
  politeness, pronunciation…) and the dashboard shows strengths vs. weaknesses; the tutor and
  review mix bias toward your weak categories.

## Run it

No build step. Serve the folder and open it:

```bash
cd mvp
python3 -m http.server 8000   # or: npx serve
# open http://localhost:8000
```

Or just use the deployed GitHub Pages site (Settings → Pages shows the URL after the
`deploy-pages` workflow runs). Install it from the browser menu ("Install app" / "Add to
Home screen") — it works offline after the first load.

## Android APK

The PWA is packaged to an APK with **PWABuilder** (same path as planned in ARCHITECTURE.md):

1. Wait for the `Deploy MVP to GitHub Pages` action to publish the site.
2. Go to <https://www.pwabuilder.com>, paste the Pages URL, click **Package for stores → Android**.
3. Download the APK (choose "unsigned"/test APK for sideloading) and install it on your phone.

Because a TWA runs in full Chrome, speech recognition and speech synthesis work in the APK.

## Known deviations from docs/ (deliberate, temporary)

| Spec says | MVP does | Fixed in |
|---|---|---|
| React + Vite + TS + Tailwind | vanilla JS, zero build | Phase 1 rewrite |
| ts-fsrs scheduling | SM-2 (same spacing principle) | Phase 1 |
| IndexedDB (Dexie) | localStorage | Phase 1 |
| Claude API via serverless proxy | optional client-side key (dev mode) | Phase 3 |
| Content pipeline from Tatoeba/Kaikki (≥1,500 words/lang) | ~90 hand-written items/lang (original content, MIT) | Phase 4 |
| Tone-contour visualization | pronunciation scoring via STT similarity only | Phase 4 |

Everything user-facing that the spec calls non-negotiable is present in some form:
one codebase, 12 languages, listening tutor, two tracks, mastery gating, category tracking,
permanent review, offline-first.
