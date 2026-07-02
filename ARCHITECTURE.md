# Architecture

## Stack (boring on purpose)

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite + TypeScript | mature, Claude Code fluent in it |
| Styling | Tailwind CSS | fast iteration, RTL plugin support |
| State | Zustand + IndexedDB (Dexie.js) | offline-first local state |
| PWA | vite-plugin-pwa (Workbox) | service worker, install prompts |
| Android APK | Bubblewrap / PWABuilder (TWA) | one codebase; same path used for Mizan |
| Spaced repetition | ts-fsrs | maintained open-source FSRS implementation |
| Charts | recharts | mastery dashboard |
| STT | Web Speech API → Whisper API fallback | free on-device where available |
| TTS | Web Speech synthesis + bundled native audio | audio files preferred over TTS |
| AI tutor | Claude API via serverless proxy | grammar JSON + conversation |
| Serverless proxy | Cloudflare Workers or Vercel functions | hides API key, rate-limits |
| Sync (optional) | Firebase Firestore | user already knows it from Mizan |
| Tests | Vitest + Playwright (smoke) | scheduler/mastery logic must be tested |

## Project Structure

```
polyglot/
├── src/
│   ├── app/              # routing, shell, PWA setup
│   ├── features/
│   │   ├── lessons/      # grammar micro-lessons + exercise renderers
│   │   ├── conversation/ # AI tutor chat, scenarios, role-play
│   │   ├── pronunciation/# recorder, scoring, tone contour viz
│   │   ├── review/       # FSRS queue + mixed review session
│   │   ├── progress/     # dashboard, category charts
│   │   └── onboarding/   # language pick, placement mini-test
│   ├── core/
│   │   ├── fsrs/         # scheduling wrapper + tests
│   │   ├── mastery/      # category mastery model + tests
│   │   ├── session/      # session generator (60/25/15 mix)
│   │   └── db/           # Dexie schema, sync adapter
│   └── shared/           # ui components, i18n, rtl utils
├── content/
│   └── <lang>/           # ur, arz, cmn, yue, es, fr, ms, ru, de, tr, ja, ko
│       ├── categories.json
│       ├── words.json
│       ├── sentences.json
│       ├── lessons/
│       ├── scenarios/
│       └── audio/        # or manifest pointing to CDN
├── scripts/data/         # content pipeline (Tatoeba/Wiktionary/etc. → content/)
├── server/               # serverless proxy (Claude API, Whisper fallback)
└── docs/
```

## Data Model (Dexie tables)

- `items` — {id, lang, type: word|sentence|concept, content, audio, categories[]}
- `srs` — {itemId, stability, difficulty, due, reps, lapses, lastReview}
- `mastery` — {lang, categoryId, score, attempts, lastUpdated}
- `sessions` — {id, date, lang, results[]} (for analytics/streaks)
- `profile` — settings, known-word cache for AI context

## Language Codes

Use ISO 639-3: `urd, arz (Egyptian Arabic), cmn, yue, spa, fra, zsm (Malay), rus, deu, tur, jpn, kor`.

## Key Decisions

1. **Content is compiled offline** by `scripts/data/` into static JSON shipped with the app (or lazy-loaded per language). No scraping at runtime.
2. **Audio strategy:** prefer real recordings (Common Voice, Lingua Libre, Tatoeba audio); fall back to device TTS per-item when no recording exists.
3. **RTL:** `dir="rtl"` at the component level for Urdu/Arabic content while UI chrome stays LTR. Test with Noto Nastaliq Urdu and Noto Naskh Arabic fonts (bundled).
4. **CJK:** bundle Noto Sans SC/TC/JP/KR subsets; ruby annotations (furigana/pinyin/jyutping) rendered with `<ruby>`.
5. **APK:** PWA must score 100 on PWABuilder checklist (manifest, icons, offline page) — this is a Phase 1 acceptance item, not an end-of-project step.
