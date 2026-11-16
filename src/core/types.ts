export type LangId = 'spa' | 'urd' | 'pes' | 'mlt';
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Level = (typeof LEVELS)[number];

export interface Example { id: string; t: string; r?: string; en: string; cloze?: string }
export interface Vocab { id: string; t: string; r?: string; en: string }
export interface Line { who: string; t: string; r?: string; en: string }
export interface Question { q: string; opts: string[] } // opts[0] is the correct answer; shuffled at runtime
export interface Reading { title: string; text: string; en?: string; qs: Question[] }

export interface Unit {
  id: string;
  level: Level;
  title: string;
  cats: string[];
  note: string;
  examples: Example[];
  alts: string[];
  vocab: Vocab[];
  dialogue?: Line[];
  reading?: Reading;
  prereqs: string[];
}

export interface Course { lang: LangId; units: Unit[] }

export type ItemKind = 'example' | 'vocab' | 'word' | 'sentence';
/** Anything that can be scheduled by FSRS. */
export interface Item {
  id: string;
  kind: ItemKind;
  t: string;
  r?: string;
  en: string;
  cats: string[];
  level: number; // index into LEVELS
  unitId?: string;
  cloze?: string;
  pos?: string;
  by?: string; // Tatoeba contributor
}

export type Exercise =
  | { kind: 'mcq'; itemId: string; cats: string[]; prompt: string; promptIsTarget: boolean; sub?: string; options: string[]; optionsAreTarget: boolean; answer: number; instruction: string; speakText?: string; passage?: { title: string; text: string } }
  | { kind: 'cloze'; itemId: string; cats: string[]; before: string; after: string; answer: string; options?: string[]; en: string; full: string }
  | { kind: 'reorder'; itemId: string; cats: string[]; tokens: string[]; answer: string[]; en: string; full: string }
  | { kind: 'listen'; itemId: string; cats: string[]; text: string; options: string[]; answer: number }
  | { kind: 'speak'; itemId: string; cats: string[]; text: string; r?: string; en: string }
  | { kind: 'card'; itemId: string; cats: string[]; front: string; frontIsTarget: boolean; sub?: string; back: string; speakText: string };

export interface Result { itemId: string; cats: string[]; correct: boolean; rating?: 1 | 2 | 3 | 4; kind: Exercise['kind'] }
