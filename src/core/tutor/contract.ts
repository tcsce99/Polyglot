// Grammar-correction contract between the app and the AI tutor (SPEC §4.2).
// The server asks Claude for exactly this JSON; this parser is defensive so a malformed reply
// degrades to "no corrections" instead of breaking the chat.

export type Severity = 'minor' | 'major';
export interface TutorError { span: string; correction: string; category_id: string; explanation: string; severity: Severity }
export interface TutorTurn { reply: string; reply_translation: string; corrected_text: string; errors: TutorError[] }
export interface Grade { score: number; cefr: string; feedback: string; corrected_text: string; errors: TutorError[] }

function extractJson(raw: string): unknown {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(text); } catch { /* fall through */ }
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch { /* ignore */ } }
  return null;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function parseErrors(v: unknown, validCats: readonly string[], fallbackCat = 'word-order'): TutorError[] {
  if (!Array.isArray(v)) return [];
  const valid = new Set(validCats);
  return v.flatMap((e): TutorError[] => {
    if (!e || typeof e !== 'object') return [];
    const o = e as Record<string, unknown>;
    const explanation = str(o.explanation);
    if (!explanation && !str(o.span)) return [];
    const cat = str(o.category_id);
    return [{ span: str(o.span), correction: str(o.correction), explanation, category_id: valid.has(cat) ? cat : fallbackCat, severity: o.severity === 'major' ? 'major' : 'minor' }];
  });
}

export function parseTutorTurn(raw: string | object, validCats: readonly string[]): TutorTurn {
  const data = (typeof raw === 'string' ? extractJson(raw) : raw) as Record<string, unknown> | null;
  if (!data || typeof data !== 'object') return { reply: typeof raw === 'string' ? raw.trim() : '', reply_translation: '', corrected_text: '', errors: [] };
  return { reply: str(data.reply), reply_translation: str(data.reply_translation), corrected_text: str(data.corrected_text), errors: parseErrors(data.errors, validCats) };
}

export function parseGrade(raw: string | object, validCats: readonly string[]): Grade {
  const data = (typeof raw === 'string' ? extractJson(raw) : raw) as Record<string, unknown> | null;
  if (!data || typeof data !== 'object') return { score: 0, cefr: '', feedback: '', corrected_text: '', errors: [] };
  const n = typeof data.score === 'number' ? data.score : Number(data.score);
  const score = Number.isFinite(n) ? Math.min(1, Math.max(0, n > 1 ? n / 100 : n)) : 0;
  return { score, cefr: str(data.cefr), feedback: str(data.feedback), corrected_text: str(data.corrected_text), errors: parseErrors(data.errors, validCats) };
}
