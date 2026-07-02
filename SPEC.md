# Polyglot — Functional Specification

## 1. Users & Modes

- Single-user first (local profile), multi-profile later.
- Learner picks one or more target languages; each language has independent progress.
- Interface language: English at launch (i18n-ready).

## 2. Learning Tracks

Every language has two parallel tracks that share one mastery model:

### 2.1 Conversation Track
- Scenario-based dialogues (greetings → shopping → travel → opinions → abstract topics).
- AI tutor chat: text or voice. Tutor stays slightly above learner level (comprehensible input, i+1).
- Shadowing exercises: play native audio, learner repeats, app scores pronunciation.
- Role-play with branching: tutor plays shopkeeper/taxi driver/friend.

### 2.2 Grammar & Syntax Track
- Explicit micro-lessons (1 concept each, <3 min) with examples from real sentences (Tatoeba).
- Exercise types: cloze deletion, sentence reordering, transformation drills (e.g., present → past), error spotting, translation both directions.
- Each concept tagged with a grammatical category ID (see §5).

## 3. Adaptive Progression ("Baby Steps")

- Content organized as a **skill graph** per language (nodes = concepts, edges = prerequisites).
- A node unlocks only when all prerequisites reach mastery ≥ 0.8 (see §6).
- Session generator picks: ~60% due reviews, ~25% weak-category practice, ~15% new material.
- If the learner struggles (accuracy < 60% in a session), new material pauses and remediation kicks in.
- Levels map loosely to CEFR (A0 → C1) for user-facing labels.

## 4. AI Tutor

### 4.1 Pronunciation
- Learner speaks a prompted phrase; app captures audio.
- STT via Web Speech API (Chrome/Android native support) with per-language locale; fallback: serverless Whisper endpoint.
- Scoring: compare recognized text vs. target (word-level match), plus per-phoneme feedback where the STT confidence data allows. Highlight mismatched words; play native audio of just those words.
- Tone languages (Mandarin, Cantonese): pitch-contour extraction (autocorrelation on the recorded audio) compared to reference tone contours; show learner's contour vs. target visually.

### 4.2 Grammar Correction
- Free-form learner output (typed or spoken→text) goes to Claude API with a structured prompt: return JSON {corrected_text, errors:[{span, category_id, explanation, severity}]}.
- Every error's category_id feeds the mastery model (§6) — this is how conversation practice updates grammar tracking.
- Explanations adapt to level: A0 gets one-line fixes, B1+ gets rule references.

### 4.3 Conversation Partner
- Claude API, per-language system prompt: stay at learner's level, use vocab from learner's known-word list (passed in context), gently recast errors, occasionally ask questions that force target grammar categories the learner is weak in.

## 5. Grammatical Category Taxonomy

- Shared top-level taxonomy + language-specific extensions. Examples:
  - Universal: word-order, negation, questions, tense-past, tense-future, plurals, pronouns, comparatives, conditionals, relative-clauses...
  - Russian: case-genitive, case-dative, verb-aspect, verbs-of-motion...
  - Japanese: particles-wa-ga, particles-ni-de, keigo, te-form...
  - Mandarin/Cantonese: measure-words, aspect-le, ba-construction, tones-t1..t6...
  - Arabic (Egyptian): bi-prefix-present, negation-mish, idafa...
  - Urdu: ergative-ne, postpositions, izafat...
  - Turkish: vowel-harmony, case-suffixes, evidential-mis...
  - Korean: particles-eun-neun, honorifics, verb-endings...
  - German: cases, verb-second, separable-verbs, adjective-endings...
- Stored as JSON per language in `content/<lang>/categories.json`. Every exercise and every AI-detected error maps to ≥1 category.

## 6. Mastery & Progress Model

- Per (learner, language, category): mastery score ∈ [0,1] via Bayesian Knowledge Tracing or a simple ELO-style update — pick one, test it, document it.
- Per item (word/sentence/concept): FSRS scheduling state (stability, difficulty, due date).
- Dashboard:
  - Radar/bar chart of category mastery (strengths vs weaknesses).
  - Streaks, time studied, words known (active vs passive), sentences mastered.
  - Review forecast (items due today/this week).
  - Per-language CEFR-ish level estimate.

## 7. Never-Forget Review

- FSRS (open-source algorithm, ts-fsrs package) schedules every learned item indefinitely.
- Review sessions mix item types: flashcard recall, cloze, audio recognition, speak-the-answer.
- Even at C1, daily queue includes decayed A0 items when due. No item is ever "graduated" out of the system.
- Lapsed items (failed reviews) temporarily boost their categories' weight in session generation.

## 8. Content Requirements (per language, MVP)

- ≥ 1,500 frequency-ranked words with audio (Common Voice / Wiktionary / Lingua Libre).
- ≥ 3,000 example sentences with translations (Tatoeba), tagged by category where possible.
- ≥ 40 grammar micro-lessons covering A0–A2 categories.
- ≥ 20 conversation scenarios.
- Egyptian Arabic: use dialect corpora (see RESOURCES.md), not MSA-only sources; MSA items allowed only where dialect data is genuinely unavailable, and must be labeled MSA.

## 9. Non-Functional

- Offline: all lessons/reviews/local audio cached (service worker + IndexedDB). Online-only: AI tutor, cloud sync.
- Sync: optional Firebase (or Supabase) account; local-first with last-write-wins merge.
- Performance: first load < 3s on mid-range Android; lesson interactions < 100ms.
- Accessibility: full keyboard nav, screen-reader labels, adjustable font size, RTL layouts.
- Privacy: audio recordings processed and discarded by default; nothing stored server-side without opt-in.
