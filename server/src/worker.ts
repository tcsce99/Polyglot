// Polyglot tutor proxy (Cloudflare Worker). Keeps the Anthropic key server-side (CLAUDE.md rule).
import Anthropic from '@anthropic-ai/sdk';

interface Env {
  ANTHROPIC_API_KEY: string;
  APP_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  MODEL?: string;
  AI: { run(model: string, input: unknown): Promise<{ text?: string }> };
}

const LANG_NAMES: Record<string, string> = {
  spa: 'Spanish', mlt: 'Maltese', urd: 'Urdu (Nastaliq script)', pes: 'Iranian Persian (Farsi, Perso-Arabic script)',
};
const WHISPER_LANG: Record<string, string> = { spa: 'es', mlt: 'mt', urd: 'ur', pes: 'fa' };
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MAX_BODY = 6 * 1024 * 1024;

const errorSchema = (cats: string[]) => ({
  type: 'array',
  items: {
    type: 'object', additionalProperties: false,
    required: ['span', 'correction', 'category_id', 'explanation', 'severity'],
    properties: {
      span: { type: 'string', description: 'The exact wrong fragment from the learner message' },
      correction: { type: 'string' },
      category_id: { type: 'string', enum: cats },
      explanation: { type: 'string', description: 'Plain-English explanation of the rule' },
      severity: { type: 'string', enum: ['minor', 'major'] },
    },
  },
});

function cors(env: Env, req: Request): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
  const origin = req.headers.get('Origin') || '';
  const allow = allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0];
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'Content-Type, X-App-Token, X-Lang', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' };
}

const json = (data: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

function levelGuide(level: string): string {
  const i = LEVELS.indexOf(level);
  if (i <= 0) return 'A1: very short, simple sentences; present tense; the most common words only. Explanations: one short line per error.';
  if (i === 1) return 'A2: short everyday sentences; basic past and future. Explanations: one or two plain lines per error.';
  if (i === 2) return 'B1: connected everyday language; opinions and narration. Explanations: name the rule briefly.';
  if (i === 3) return 'B2: natural, fluent language on general and abstract topics. Explanations: name the rule and give one contrasting example.';
  return 'C1/C2: fully natural, idiomatic, nuanced language. Explanations: concise, with register and nuance notes.';
}

async function ask(env: Env, system: string, user: Anthropic.Beta.BetaMessageParam[], schema: object, maxTokens: number, context?: string): Promise<unknown> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const res = await client.beta.messages.create({
    model: env.MODEL || 'claude-opus-5-5',
    max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }, ...(context ? [{ type: 'text' as const, text: context }] : [])],
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    messages: user,
  });
  if (res.stop_reason === 'refusal') throw new HttpError(422, 'The tutor declined to answer that message.');
  const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  try { return JSON.parse(text); } catch { throw new HttpError(502, 'The tutor returned an unreadable answer. Please try again.'); }
}

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

interface Common { lang: string; level: string; categories: string[] }
function common(b: Record<string, unknown>): Common {
  const lang = String(b.lang || '');
  if (!LANG_NAMES[lang]) throw new HttpError(400, 'Unknown language');
  const level = LEVELS.includes(String(b.level)) ? String(b.level) : 'A1';
  const categories = Array.isArray(b.categories) ? b.categories.map(String).filter((c) => /^[a-z0-9-]{2,40}$/.test(c)).slice(0, 80) : [];
  if (!categories.length) throw new HttpError(400, 'categories required');
  return { lang, level, categories };
}
const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n);

async function chat(env: Env, b: Record<string, unknown>) {
  const { lang, level, categories } = common(b);
  const name = LANG_NAMES[lang];
  const history = (Array.isArray(b.history) ? b.history : []).slice(-16)
    .map((m: { role?: string; text?: string }): Anthropic.Beta.BetaMessageParam => ({ role: m.role === 'tutor' ? 'assistant' : 'user', content: clip(m.text, 1200) }))
    .filter((m) => m.content);
  const system = `You are a warm, patient ${name} tutor in a language-learning app. The learner's interface language is English.

Each turn you do two things:
1. Check the learner's latest message for errors in ${name} (grammar, word choice, spelling, word order, register). If it came from speech recognition, ignore punctuation and capitalisation. Report each real error with the exact wrong fragment, the correction, one category_id from the allowed list, and a plain-English explanation. Do not invent errors; an empty list is the right answer for a correct message. corrected_text is the learner's whole message rewritten correctly (empty string if it was already correct or was not in ${name}).
2. Continue the conversation in ${name} only. Recast the learner's errors naturally in your reply, keep it to one to three sentences, and end with a question or prompt that keeps them talking. reply_translation is an English translation of your reply.

If the learner writes in English because they are stuck, show them how to say it in ${name} and invite them to try.
${lang === 'mlt' ? 'Use standard Maltese orthography (ċ, ġ, għ, ħ, ż, ie).' : ''}${lang === 'pes' ? 'Use standard written Iranian Persian by default; at B1 and above you may point out the colloquial (Tehrani) form when useful.' : ''}${lang === 'urd' ? 'Write Urdu in its own script, never in Roman letters or Devanagari.' : ''}`;
  const context = `Learner level: ${level}. ${levelGuide(level)}
${b.scenario ? `Role-play scenario (stay in character): ${clip(b.scenario, 600)}` : 'Free conversation: follow the learner’s interests.'}
${Array.isArray(b.weak) && b.weak.length ? `When it fits naturally, ask questions that make the learner use these weak areas: ${b.weak.map(String).slice(0, 4).join(', ')}.` : ''}
${Array.isArray(b.known) && b.known.length ? `Keep about 90–95% of your vocabulary within words the learner knows, such as: ${b.known.map(String).slice(0, 150).join(', ')}.` : ''}
Allowed category_id values: ${categories.join(', ')}.`;
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history,
    { role: 'user', content: clip(b.message, 1500) || '(The learner has just opened the conversation. Greet them and start.)' },
  ];
  return ask(env, system, messages, {
    type: 'object', additionalProperties: false, required: ['reply', 'reply_translation', 'corrected_text', 'errors'],
    properties: { reply: { type: 'string' }, reply_translation: { type: 'string' }, corrected_text: { type: 'string' }, errors: errorSchema(categories) },
  }, 2000, context);
}

async function grade(env: Env, b: Record<string, unknown>) {
  const { lang, level, categories } = common(b);
  const name = LANG_NAMES[lang];
  const mode = b.mode === 'speaking' ? 'speaking' : 'writing';
  const system = `You are an experienced CEFR examiner for ${name}. You grade one ${'{mode}'} answer against the CEFR descriptors for the target level, the way DELE/SIELE-style exams do: task completion, coherence, range, and accuracy.

Return: score from 0 to 1 (0.7 = clearly meets the target level; 0.5 = borderline; below 0.4 = well under it; answers that are off-task, not in ${name}, or far too short score under 0.3), cefr = the level this sample actually demonstrates, feedback = two or three plain-English sentences on what to improve first, corrected_text = the answer rewritten correctly at the same level, and the errors list (exact fragment, correction, category_id from the allowed list, plain-English explanation).
For speaking answers the text is a speech-recognition transcript: ignore punctuation, capitalisation and likely recognition slips; judge the language.`.replace('{mode}', mode);
  const user = `Target level: ${level}\nMode: ${mode}\nTask given to the learner: ${clip(b.task, 600)}\nAllowed category_id values: ${categories.join(', ')}\n\nLearner's answer:\n${clip(b.answer, 4000)}`;
  return ask(env, system, [{ role: 'user', content: user }], {
    type: 'object', additionalProperties: false, required: ['score', 'cefr', 'feedback', 'corrected_text', 'errors'],
    properties: { score: { type: 'number' }, cefr: { type: 'string', enum: ['below A1', ...LEVELS] }, feedback: { type: 'string' }, corrected_text: { type: 'string' }, errors: errorSchema(categories) },
  }, 2500);
}

async function read(env: Env, b: Record<string, unknown>) {
  const { lang, level } = common({ ...b, categories: ['reading'] });
  const name = LANG_NAMES[lang];
  const system = `You write graded reading texts for ${name} learners. Write an original, interesting, self-contained text at exactly the requested CEFR level (A1 ≈ 60 words, A2 ≈ 100, B1 ≈ 160, B2 ≈ 230, C1/C2 ≈ 300), a faithful English translation, a glossary of the 5–8 hardest words, and four multiple-choice comprehension questions. Questions and options are in English up to A2 and in ${name} from B1. Each question has exactly four options and the FIRST option is the correct one (the app shuffles them). Never write ${name} in Roman letters unless that is its standard script.`;
  const user = `Level: ${level}\nTopic: ${clip(b.topic, 120) || 'surprise me — everyday life, culture, travel, science or a short story'}`;
  const strArr = { type: 'array', items: { type: 'string' } };
  return ask(env, system, [{ role: 'user', content: user }], {
    type: 'object', additionalProperties: false, required: ['title', 'text', 'translation', 'glossary', 'questions'],
    properties: {
      title: { type: 'string' }, text: { type: 'string' }, translation: { type: 'string' },
      glossary: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['word', 'meaning'], properties: { word: { type: 'string' }, meaning: { type: 'string' } } } },
      questions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['q', 'opts'], properties: { q: { type: 'string' }, opts: strArr } } },
    },
  }, 4000);
}

async function stt(env: Env, req: Request) {
  const lang = req.headers.get('X-Lang') || '';
  if (!WHISPER_LANG[lang]) throw new HttpError(400, 'Unknown language');
  const buf = await req.arrayBuffer();
  if (!buf.byteLength) throw new HttpError(400, 'No audio');
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const out = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: btoa(bin), language: WHISPER_LANG[lang], task: 'transcribe' });
  return { text: (out.text || '').trim() };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const headers = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const path = new URL(req.url).pathname.replace(/\/+$/, '');
    try {
      if (env.APP_TOKEN && req.headers.get('X-App-Token') !== env.APP_TOKEN) throw new HttpError(401, 'Wrong or missing tutor access code.');
      if (req.method === 'GET' && path === '/health') return json({ ok: true, stt: !!env.AI, claude: !!env.ANTHROPIC_API_KEY }, 200, headers);
      if (req.method !== 'POST') throw new HttpError(404, 'Not found');
      if (Number(req.headers.get('Content-Length') || 0) > MAX_BODY) throw new HttpError(413, 'Request too large');
      if (path === '/stt') return json(await stt(env, req), 200, headers);
      if (!env.ANTHROPIC_API_KEY) throw new HttpError(500, 'ANTHROPIC_API_KEY is not set on the proxy.');
      const body = (await req.json()) as Record<string, unknown>;
      if (path === '/chat') return json(await chat(env, body), 200, headers);
      if (path === '/grade') return json(await grade(env, body), 200, headers);
      if (path === '/read') return json(await read(env, body), 200, headers);
      throw new HttpError(404, 'Not found');
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status, headers);
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'The tutor is busy. Try again in a moment.' }, 429, headers);
      if (e instanceof Anthropic.AuthenticationError) return json({ error: 'The proxy’s Anthropic API key is invalid.' }, 500, headers);
      if (e instanceof Anthropic.APIError) return json({ error: `Tutor service error (${e.status ?? 'network'}).` }, 502, headers);
      return json({ error: 'Unexpected proxy error.' }, 500, headers);
    }
  },
};
