# CLAUDE.md — Instructions for Claude Code

You are building **Polyglot**, an adaptive language-learning app. Read `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/RESOURCES.md`, `docs/METHODS.md`, and `docs/ROADMAP.md` before writing any code.

## Non-Negotiable Requirements

1. **Platforms:** One PWA codebase → installable web/desktop app + Android APK via Bubblewrap/PWABuilder. Do not fork into separate native codebases.
2. **Languages (4, each complete A1→C1):** Maltese, Urdu, Persian (Iranian), Spanish. The owner narrowed the scope from the original 12 in November 2026; depth per language matters more than breadth. Each language needs a placement test, test-outs, CEFR-style level exams, and a quiet (no audio) study path.
3. **AI tutor:** speech input → pronunciation scoring + grammar correction with plain-language explanations. Uses Web Speech API for STT where supported, with a server/API fallback. Claude API powers conversation and grammar feedback.
4. **Two parallel tracks per language:** Conversation track and Grammar/Syntax track. Both feed the same mastery model.
5. **Adaptive difficulty:** content gated by demonstrated mastery, never by time or lesson count alone.
6. **Progress tracking per grammatical category** — every exercise result maps to one or more tagged categories (see SPEC §5). Dashboard shows strengths/weaknesses per category.
7. **FSRS spaced repetition** for ALL learned items, forever. Review queue never disappears.
8. **Offline-first:** lessons and review work without a network. AI tutor requires network and degrades gracefully.
9. **Free data only:** all linguistic content from the sources in `docs/RESOURCES.md` (CC0/CC-BY/CC-BY-SA). Track attribution in a generated CREDITS page.

## Working Rules

- Work phase by phase per `docs/ROADMAP.md`. Do not start Phase N+1 until Phase N passes its acceptance checklist.
- Write tests for the FSRS scheduler, mastery model, and content pipeline — these are the app's brain.
- Prefer boring, proven tech (see ARCHITECTURE.md). No experimental frameworks.
- RTL support (Urdu in Nastaliq, Persian in Naskh) is a launch requirement, not an afterthought; the smoke test checks it.
- Course units are AI-authored (`content/<lang>/*.ts`) and not yet native-reviewed. Never present them as verified; keep the README's "Known limits" honest when content changes.
- Keep API keys out of the client. AI tutor calls go through a thin serverless proxy.
- The user will verify your work independently. Leave clear run/test instructions in each PR/commit message.

## Commands

```bash
npm run dev        # local dev server
npm run test       # unit tests (vitest)
npm run build      # production PWA build
npm run data:build # run content pipeline (scripts/data/)
npm run smoke      # headless-browser smoke test of the built app
```
