// Turns a course + pipeline JSON into one in-memory registry of schedulable items.
import type { Course, Item, LangId, Unit } from '../types';
import { LEVELS } from '../types';

export interface WordsJson { meta: Record<string, string>; words: { w: string; g: string; p: string; l: number; r?: string; ipa?: string }[] }
export interface SentencesJson { meta: Record<string, string>; sentences: { i: number | string; t: string; e: string; l: number; c: string[]; b?: string; r?: string; x?: number }[] }

export interface Content {
  lang: LangId;
  course: Course;
  units: Map<string, Unit>;
  items: Map<string, Item>;
  unitItems: Map<string, Item[]>;
  words: Item[];      // frequency order
  sentences: Item[];  // level order
}

const POS_CAT: Record<string, string> = { noun: 'vocab-nouns', verb: 'vocab-verbs', adj: 'vocab-adj', adv: 'vocab-adj' };

export function buildContent(lang: LangId, course: Course, wordsJson?: WordsJson, sentencesJson?: SentencesJson): Content {
  const items = new Map<string, Item>();
  const unitItems = new Map<string, Item[]>();
  const units = new Map<string, Unit>();
  for (const u of course.units) {
    units.set(u.id, u);
    const level = LEVELS.indexOf(u.level);
    const list: Item[] = [
      ...u.examples.map((e): Item => ({ id: `${lang}/${e.id}`, kind: 'example', t: e.t, r: e.r, en: e.en, cats: u.cats, level, unitId: u.id, cloze: e.cloze })),
      ...u.vocab.map((v): Item => ({ id: `${lang}/${v.id}`, kind: 'vocab', t: v.t, r: v.r, en: v.en, cats: ['vocabulary'], level, unitId: u.id })),
    ];
    unitItems.set(u.id, list);
    for (const it of list) items.set(it.id, it);
  }
  const words = (wordsJson?.words ?? []).map((w): Item => ({
    id: `${lang}/w/${w.w}`, kind: 'word', t: w.w, r: w.r, en: w.g, cats: [POS_CAT[w.p] ?? 'vocab-function'], level: w.l, pos: w.p,
  }));
  const sentences = (sentencesJson?.sentences ?? []).map((s): Item => ({
    id: `${lang}/s/${s.i}`, kind: 'sentence', t: s.t, r: s.r, en: s.e, cats: s.c?.length ? s.c : ['reading'], level: s.l, by: s.b,
  }));
  for (const it of words) items.set(it.id, it);
  for (const it of sentences) items.set(it.id, it);
  return { lang, course, units, items, unitItems, words, sentences };
}

export function unitsOfLevel(c: Content, level: number): Unit[] {
  return c.course.units.filter((u) => LEVELS.indexOf(u.level) === level);
}
