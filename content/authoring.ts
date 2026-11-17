// Compact authoring format for course units.
//
//   examples / vocab:  'target|english'  or  'target|romanisation|english'
//   Mark the word to blank out in cloze exercises with *asterisks*:  'Yo *soy* de Malta.|I am from Malta.'
//   dialogue lines:    'A: target|english'  (or with romanisation as the middle field)
//   reading questions: 'Question?|correct answer|wrong|wrong'
import type { Course, LangId, Level, Unit } from '../src/core/types';

export interface UnitSrc {
  id: string; title: string; cats: string[]; note: string;
  ex: string[]; alts?: string[]; vocab: string[]; dlg?: string[];
  read?: { title: string; text: string; en?: string; qs: string[] };
  prereqs?: string[];
}

function split3(s: string): { t: string; r?: string; en: string } {
  const p = s.split('|').map((x) => x.trim());
  if (p.length === 2) return { t: p[0], en: p[1] };
  if (p.length === 3) return { t: p[0], r: p[1], en: p[2] };
  throw new Error(`Bad content line (need 2 or 3 fields): ${s}`);
}

export function level(lv: Level, units: UnitSrc[]): Unit[] {
  return units.map((u) => ({
    id: u.id, level: lv, title: u.title, cats: u.cats, note: u.note.trim(), alts: u.alts ?? [], prereqs: u.prereqs ?? [],
    examples: u.ex.map((s, i) => {
      const { t, r, en } = split3(s);
      const m = t.match(/\*([^*]+)\*/);
      return { id: `${u.id}:e${i}`, t: t.replace(/\*/g, ''), r, en, cloze: m?.[1] };
    }),
    vocab: u.vocab.map((s, i) => ({ id: `${u.id}:v${i}`, ...split3(s) })),
    dialogue: u.dlg?.map((s) => {
      const { t, r, en } = split3(s);
      const k = t.indexOf(': ');
      return { who: t.slice(0, k), t: t.slice(k + 2), r, en };
    }),
    reading: u.read && { title: u.read.title, text: u.read.text.trim(), en: u.read.en, qs: u.read.qs.map((q) => { const [head, ...opts] = q.split('|').map((x) => x.trim()); return { q: head, opts }; }) },
  }));
}

/** Chain units linearly (each requires the previous one) unless a unit lists explicit prerequisites. */
export function course(lang: LangId, ...levels: Unit[][]): Course {
  const units = levels.flat();
  units.forEach((u, i) => { if (!u.prereqs.length && i > 0) u.prereqs = [units[i - 1].id]; });
  return { lang, units };
}
