import { categoriesFor } from '../../../content/categories';
import { LEVELS, type LangId } from '../types';
import { parseGrade, parseTutorTurn, type Grade, type TutorTurn } from './contract';

export class TutorUnavailable extends Error {}

export interface Proxy { url: string; token: string }
export interface ChatMsg { role: 'learner' | 'tutor'; text: string }
export interface GeneratedReading { title: string; text: string; translation: string; glossary: { word: string; meaning: string }[]; questions: { q: string; opts: string[] }[] }

export const tutorReady = (p: Proxy) => !!p.url && (typeof navigator === 'undefined' || navigator.onLine !== false);

async function post(p: Proxy, path: string, body: unknown): Promise<unknown> {
  if (!p.url) throw new TutorUnavailable('The AI tutor is not set up yet. Add your proxy URL in Settings.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new TutorUnavailable('You are offline. The AI tutor needs a connection — lessons, review and reading still work.');
  let res: Response;
  try {
    res = await fetch(`${p.url.replace(/\/+$/, '')}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Token': p.token }, body: JSON.stringify(body) });
  } catch { throw new TutorUnavailable('Could not reach the AI tutor. Check your connection and the proxy URL in Settings.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new TutorUnavailable((data as { error?: string }).error || `The AI tutor returned an error (${res.status}).`);
  return data;
}

const cats = (lang: LangId) => Object.keys(categoriesFor(lang));

export async function chatTurn(p: Proxy, a: { lang: LangId; level: number; message: string; history: ChatMsg[]; scenario?: string; weak?: string[]; known?: string[] }): Promise<TutorTurn> {
  const data = await post(p, 'chat', { ...a, level: LEVELS[Math.min(a.level, 5)], categories: cats(a.lang) });
  return parseTutorTurn(data as object, cats(a.lang));
}

export async function gradeAnswer(p: Proxy, a: { lang: LangId; level: number; mode: 'writing' | 'speaking'; task: string; answer: string }): Promise<Grade> {
  const data = await post(p, 'grade', { ...a, level: LEVELS[Math.min(a.level, 5)], categories: cats(a.lang) });
  return parseGrade(data as object, cats(a.lang));
}

export async function generateReading(p: Proxy, a: { lang: LangId; level: number; topic?: string }): Promise<GeneratedReading> {
  const d = (await post(p, 'read', { ...a, level: LEVELS[Math.min(a.level, 5)] })) as Partial<GeneratedReading>;
  return { title: String(d.title ?? ''), text: String(d.text ?? ''), translation: String(d.translation ?? ''), glossary: Array.isArray(d.glossary) ? d.glossary : [], questions: (Array.isArray(d.questions) ? d.questions : []).filter((q) => Array.isArray(q.opts) && q.opts.length >= 2) };
}

export async function ping(p: Proxy): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${p.url.replace(/\/+$/, '')}/health`, { headers: { 'X-App-Token': p.token } });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.ok) return { ok: true, message: d.claude ? 'Connected.' : 'Connected, but the proxy has no ANTHROPIC_API_KEY set.' };
    return { ok: false, message: d.error || `Proxy answered ${res.status}.` };
  } catch { return { ok: false, message: 'Could not reach that URL.' }; }
}
