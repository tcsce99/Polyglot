# Roadmap — Build in This Order

Claude Code: do not start a phase until the previous phase's checklist passes. The user will independently verify each checklist.

## Phase 1 — Skeleton PWA (1 language: Spanish)
- Vite + React + TS + Tailwind + PWA scaffold; Dexie schema; routing shell.
- Content pipeline v1: pull Spanish Tatoeba sentences + frequency list + Kaikki entries → `content/spa/`.
- Flashcard review with real FSRS scheduling (ts-fsrs) + unit tests.
- Basic progress screen (items learned, due count, streak).

**Accept when:** installable PWA works offline after first load; PWABuilder checklist passes (APK can be generated); FSRS tests green; Spanish deck of ≥500 words reviewable end-to-end. RTL smoke test: render one Urdu string correctly in a test page.

## Phase 2 — Grammar Track + Mastery Model
- Category taxonomy files for Spanish; exercise renderers: cloze, reorder, transform, error-spot.
- Mastery model + session generator (60/25/15) + tests.
- Dashboard: category strengths/weaknesses chart, review forecast.
- 40 Spanish micro-lessons (A0–A2) generated from Wikibooks/UD data, human-readable.

**Accept when:** completing exercises visibly moves category scores; weak categories appear more often in generated sessions; new content stays locked until prerequisites hit 0.8.

## Phase 3 — AI Tutor
- Serverless proxy (Claude API); conversation UI; grammar-correction JSON contract + parser + tests.
- Errors from free conversation update category mastery.
- STT via Web Speech API; pronunciation scoring v1 (word-match + per-word replay).
- 20 Spanish scenarios with role-play prompts.

**Accept when:** speak a flawed Spanish sentence → get corrected text + tagged explanations → dashboard reflects it; works on Android Chrome.

## Phase 4 — Scale to All 12 Languages
- Generalize pipeline; ingest per-language sources from RESOURCES.md.
- Language-specific: RTL + Nastaliq (Urdu), harakat toggle (Egyptian Arabic), ruby pinyin/jyutping/furigana (cmn/yue/jpn), stress marks (rus), vowel-harmony drills (tur), honorific tracks (kor/jpn).
- Tone trainer for Mandarin/Cantonese (pitch contour visualization).
- Category taxonomies for all 12 (SPEC §5).

**Accept when:** each language has ≥1,500 words, ≥3,000 sentences, ≥40 lessons, ≥20 scenarios, and a native-script rendering screenshot test passes. Egyptian Arabic content is dialect, not MSA (spot-check 50 random items).

## Phase 5 — Polish & Ship
- Placement mini-test per language; onboarding.
- Optional Firebase sync; export/import backup (JSON).
- Whisper fallback for STT; audio coverage report (% items with real recordings).
- APK build documented step-by-step (Bubblewrap); Play-Store-ready assets.
- CREDITS page auto-generated from content metadata.

**Accept when:** fresh user can install APK, place into a language, do a full session offline (minus tutor), and sync to a second device.

## Later / Ideas (not now)
- Handwriting practice (hanzi/kanji stroke order via Hanzi Writer, MIT).
- Community content submissions. iOS via same PWA. Listening comprehension from podcasts/YouTube CC-licensed media.
