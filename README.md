# Polyglot — Adaptive Language Learning App

A free, open-source language learning platform that runs as a **web app / desktop PWA** and an **Android APK**, with an **AI tutor** that listens to your speech and corrects pronunciation and grammar in real time.

## Core Goals

1. **12 launch languages:** Urdu, Egyptian Arabic, Mandarin Chinese, Cantonese, Spanish, French, Malay (Bahasa Melayu), Russian, German, Turkish, Japanese, Korean
2. **AI tutor** — conversational partner that listens (speech-to-text), evaluates pronunciation against native audio, and corrects grammar with explanations
3. **Dual-track learning** — conversational fluency track AND explicit grammar/syntax track, always in parallel
4. **Adaptive progression** — starts with baby steps; unlocks advanced material only when mastery is demonstrated
5. **Granular progress tracking** — mastery scored per grammatical category (e.g., past tense, case endings, measure words, particles) so weaknesses vs. strengths are visible at a glance
6. **Never forget** — permanent spaced-repetition review (FSRS algorithm) covering everything ever learned, no matter how advanced the learner gets
7. **Evidence-based methods only** — spaced repetition, retrieval practice, comprehensible input, sentence mining, shadowing, interleaving, cloze deletion

## Platform Strategy

- **One codebase:** Progressive Web App (installable on desktop + mobile)
- **Android APK:** generated from the PWA via PWABuilder / Bubblewrap (TWA)
- **Offline-first:** IndexedDB local storage, optional cloud sync

## Repo Guide

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Instructions for Claude Code — read this first |
| `docs/SPEC.md` | Full functional specification |
| `docs/ARCHITECTURE.md` | Tech stack, data model, project structure |
| `docs/RESOURCES.md` | Free/open data sources and APIs per language |
| `docs/METHODS.md` | The learning science the app must implement |
| `docs/ROADMAP.md` | Phased build plan (MVP → full app) |

## Getting Started (for Claude Code)

```bash
claude
# then: "Read CLAUDE.md and docs/, then begin Phase 1 of docs/ROADMAP.md"
```

## License

MIT (app code). Bundled linguistic data retains its original licenses (mostly CC-BY-SA / CC0) — see `docs/RESOURCES.md` for attribution requirements.

## Current Status

✅ **A complete working MVP is live in [`mvp/`](mvp/)** — all 12 languages, the listening/speaking
AI tutor, spaced-repetition review, mastery-gated units, and per-category strengths/weaknesses
tracking, as an installable offline PWA. See [`mvp/README.md`](mvp/README.md) for how to run it,
install it, and package the Android APK with PWABuilder.

The phased React/TypeScript build in `docs/ROADMAP.md` supersedes the MVP over time; the MVP's
course content and exercise design carry forward into it.
