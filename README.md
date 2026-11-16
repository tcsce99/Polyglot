# Polyglot

An adaptive, offline-first language-learning PWA for **Maltese, Urdu, Persian and Spanish**, from first
words to C1, with placement tests, CEFR-style level exams, an AI tutor that listens and corrects, and
FSRS review that never lets anything go.

One codebase → installable web/desktop app → Android APK (PWABuilder / Bubblewrap).

## What is in it

| | |
|---|---|
| **Courses** | 40 lessons per language (A1 10 · A2 9 · B1 8 · B2 7 · C1 6). Each has a grammar note, 8 examples, vocabulary, and a dialogue (A1–A2) or a reading with comprehension questions (B1+). |
| **Decks** | Real data from Tatoeba and Wiktionary, banded A1–C2 by frequency: Spanish 6,500 words / 6,000 sentences · Persian 6,500 / 6,000 · Urdu 4,861 / 3,094 · Maltese 5,000 / 1,275. |
| **Placement test** | Adaptive staircase, about five minutes, multiple choice only (no audio, no special keyboard). Everything below your level is marked known and moved into long-term review. |
| **Skipping** | Test out of any unlocked lesson (10 questions, 80%), or pass a level exam to skip the whole level. Lessons otherwise unlock only when the previous one reaches 80% mastery. |
| **Level exams** | A1–C2 mock exams in the CEFR format: vocabulary, grammar, reading, writing, listening, speaking. 70% overall and 50% per skill to pass. Writing and speaking tasks are marked by the AI examiner. |
| **AI tutor** | Free conversation and 24 role-plays. Speak or type; every message comes back with the corrected text and each error explained and tagged to a grammar category that feeds your dashboard. |
| **Quiet mode** | One switch turns off all sound and the microphone. Sessions, lessons, exams and the tutor carry on with reading, vocabulary, sentence building and typing — for meetings, class and transit. |
| **Review** | FSRS (`ts-fsrs`) schedules every learned item forever. Sessions mix 60% due reviews, 25% weak categories, 15% new material, and pause new material after a session under 60%. |
| **Progress** | Mastery per grammatical category (strengths and weaknesses), review forecast, streak, level. |
| **Offline** | Lessons, review, reading, placement and exams work with no network. The tutor needs a connection and says so. |

**"International testing"** is the **CEFR** scale (A1–C2). Official exams: Spanish — DELE and SIELE;
Maltese — the Maltese as a Foreign Language (MFL) certificates; Persian — SAMFA / AMFA; Urdu has no CEFR
exam (the ACTFL OPI is the closest). The exams in this app follow the CEFR format and are a practice
estimate, not a certificate.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm test             # 91 unit tests: FSRS, mastery, session planner, placement, exams, tutor contract, content, pipeline
npm run build        # type-check + production PWA in dist/
npm run smoke        # drives the built app in headless Chromium (needs: npm i -D playwright)
npm run data:build   # rebuild word/sentence decks from Tatoeba, Kaikki and frequency lists (needs curl; ~1.5 GB download)
```

## Turn on the AI tutor (one-time, about five minutes)

The app never holds an API key. The tutor runs through a small Cloudflare Worker that you deploy once:
see [`server/README.md`](server/README.md). Paste the worker URL into **Settings → AI tutor** and press
*Test connection*. The same worker transcribes speech with Whisper where the browser cannot
(Maltese, and browsers without the Web Speech API).

## Deploy and package

- **Web:** pushing to `main` runs tests, builds, and publishes `dist/` to GitHub Pages
  (`.github/workflows/deploy-pages.yml`). Enable Pages → Source: GitHub Actions.
- **Android APK:** open <https://www.pwabuilder.com>, enter the Pages URL, choose *Package for stores →
  Android*, and install the generated APK. The build ships a manifest, maskable icons and an offline
  service worker, which is what PWABuilder checks.

## Layout

```
content/<lang>/        authored course units (a1.ts … c1.ts) in a compact format — see content/authoring.ts
content/categories.ts  grammatical-category taxonomy (shared + per language)
content/scenarios.ts   tutor role-plays
public/content/<lang>/ generated decks (words.json, sentences.json) + credits.json
scripts/data/          content pipeline
src/core/              fsrs · mastery · session · exam · tutor · speech · db  (pure logic, unit-tested)
src/features/          lessons · review · reading · conversation · pronunciation · exam · progress · onboarding
server/                Cloudflare Worker proxy (Claude + Whisper)
tests/                 vitest suites
mvp/                   the earlier zero-build 12-language prototype, kept for reference
```

## Known limits — read before relying on it

- **The lessons were written by an AI and have not been reviewed by native speakers.** Spanish is the
  safest; Urdu and Persian should be good; **Maltese carries the most risk**, especially B2–C1. Treat
  anything odd as a possible error and have a native speaker spot-check before sharing widely.
- **Deck levels are estimates** from frequency rank, and glosses are the first Wiktionary sense, which is
  occasionally not the commonest meaning. Maltese has no open frequency list, so its ranking is
  approximated from English gloss frequency.
- **Thin Maltese and Urdu sentence corpora:** Tatoeba has only ~700 Maltese and ~2,900 Urdu sentences
  with English translations, below the 3,000 target in `docs/SPEC.md` for Maltese.
- **Audio is the device's own text-to-speech.** Most devices have Spanish, many have Persian and Urdu,
  very few have Maltese; without a voice, listen buttons and listening sections are hidden. There are no
  bundled recordings yet.
- **Pronunciation scoring is word-level** (what the recogniser heard versus the target), not phoneme-level.
- **Not exercised here:** the tutor proxy has not been run against the live API, and microphone flows
  cannot be tested in headless CI. Nothing has been tested on a physical Android device.
- Not built: cloud sync between devices (use Settings → Export / Import backup), C2 lessons (C2 has a deck
  band and an exam only).

## Credits

Sentences: Tatoeba (CC-BY 2.0 FR). Words: Wiktionary via Kaikki.org (CC-BY-SA 4.0). Frequency ranking:
hermitdave/FrequencyWords (CC-BY-SA 4.0). Fonts: Noto Nastaliq Urdu, Noto Naskh Arabic (OFL). Per-source
detail and Tatoeba contributor names are generated into the in-app **Credits** page.
