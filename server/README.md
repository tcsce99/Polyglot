# Polyglot tutor proxy

A thin Cloudflare Worker that keeps the Anthropic API key off the client. The app talks only to this
worker; the worker talks to Claude (conversation, correction, grading, graded reading) and to Workers AI
Whisper (speech-to-text fallback).

## Deploy (about five minutes)

```bash
cd server
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY     # paste your key from console.anthropic.com
npx wrangler secret put APP_TOKEN             # optional: any passphrase; enter the same one in the app
npx wrangler deploy
```

Wrangler prints a URL like `https://polyglot-tutor.<you>.workers.dev`. Paste it into the app under
**Settings → AI tutor → Proxy URL**. Before sharing the app, set `ALLOWED_ORIGINS` in `wrangler.toml`
to your site's origin and redeploy.

## Endpoints

| Route | Purpose |
|---|---|
| `GET /health` | Connectivity check used by the Settings screen |
| `POST /chat` | One tutor turn → `{reply, reply_translation, corrected_text, errors[]}` |
| `POST /grade` | CEFR grading of a written or spoken answer → `{score, cefr, feedback, corrected_text, errors[]}` |
| `POST /read` | A short text at the learner's level with comprehension questions |
| `POST /stt` | Audio (webm/ogg/mp4) → `{text}` via Whisper |

Every error category the model returns is constrained to the app's taxonomy, so corrections feed the
mastery dashboard directly. Refusal fallbacks are enabled (`fallbacks: "default"`).
