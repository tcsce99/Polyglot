// Builds exercises from content items. All exercise types require production or recognition under
// uncertainty (METHODS §2); production is preferred as an item becomes better known.
import type { Content } from './content/build';
import type { Exercise, Item, LangId, Question, Unit } from './types';
import { normalize, shuffle } from './text';

export interface ExerciseOpts {
  quiet: boolean;      // no audio in or out
  canSpeak: boolean;   // speech recognition available
  canListen: boolean;  // a TTS voice exists for this language
  typing: boolean;     // learner types answers in the target script
  reps?: number;       // how many times the item has been reviewed
  exam?: boolean;      // no flashcards / speech; hardest available form
  showRoman?: boolean;
  rnd?: () => number;
}

type Kind = Exercise['kind'] | 'mcq-rev' | 'type';

const distinct = (xs: string[]) => { const seen = new Set<string>(); return xs.filter((x) => { const k = x.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }); };

function pickOptions(correct: string, pool: string[], rnd: () => number, n = 3): { options: string[]; answer: number } {
  const others = shuffle(distinct(pool).filter((p) => p.toLowerCase() !== correct.toLowerCase()), rnd).slice(0, n);
  const options = shuffle([correct, ...others], rnd);
  return { options, answer: options.indexOf(correct) };
}

/** Items an item can be confused with: same unit first, then same kind and level. */
function peers(item: Item, c: Content): Item[] {
  if (item.unitId) {
    const same = (c.unitItems.get(item.unitId) ?? []).filter((x) => x.kind === item.kind && x.id !== item.id);
    if (same.length >= 3) return same;
    const lvl = c.course.units.filter((u) => u.level === c.units.get(item.unitId!)!.level).flatMap((u) => c.unitItems.get(u.id) ?? []);
    return lvl.filter((x) => x.kind === item.kind && x.id !== item.id);
  }
  const pool = item.kind === 'word' ? c.words : c.sentences;
  const idx = pool.indexOf(item);
  const near = pool.slice(Math.max(0, idx - 40), idx + 40).filter((x) => x.id !== item.id);
  if (item.kind === 'word') { const samePos = near.filter((x) => x.pos === item.pos); if (samePos.length >= 3) return samePos; }
  return near;
}

function splitCloze(item: Item): { before: string; after: string; answer: string } | null {
  if (!item.cloze) return null;
  const i = item.t.indexOf(item.cloze);
  if (i < 0) return null;
  return { before: item.t.slice(0, i), after: item.t.slice(i + item.cloze.length), answer: item.cloze };
}

export function tokens(t: string): string[] {
  return t.split(/\s+/).filter(Boolean);
}

function kindsFor(item: Item, o: ExerciseOpts): Kind[] {
  const known = (o.reps ?? 0) >= 2 || !!o.exam;
  const n = tokens(item.t).length;
  const kinds: Kind[] = [];
  if (item.kind === 'example' || item.kind === 'sentence') {
    if (item.cloze) kinds.push('cloze', 'cloze');
    if (n >= 3 && n <= 9) kinds.push('reorder');
    kinds.push('mcq');
    if (!o.exam && !o.quiet && o.canSpeak && n <= 12) kinds.push('speak');
    if (!o.exam && !o.quiet && o.canListen) kinds.push('listen');
    if (!o.exam && known) kinds.push('card');
  } else {
    kinds.push('mcq', 'mcq-rev');
    if (o.typing && known && n <= 2) kinds.push('type', 'type');
    if (!o.exam && !o.quiet && o.canListen) kinds.push('listen');
    if (!o.exam && !o.quiet && o.canSpeak && known) kinds.push('speak');
    if (!o.exam) kinds.push('card');
  }
  return kinds;
}

export function makeExercise(item: Item, c: Content, o: ExerciseOpts, force?: Kind): Exercise {
  const rnd = o.rnd ?? Math.random;
  const kinds = kindsFor(item, o);
  const kind = force && kinds.includes(force) ? force : kinds[Math.floor(rnd() * kinds.length)];
  const base = { itemId: item.id, cats: item.cats };
  const sub = o.showRoman ? item.r : undefined;
  const others = peers(item, c);
  switch (kind) {
    case 'cloze': {
      const parts = splitCloze(item)!;
      const unit = item.unitId ? c.units.get(item.unitId) : undefined;
      const typed = o.typing && ((o.reps ?? 0) >= 2 || !!o.exam);
      const pool = [...(unit?.alts ?? []), ...others.flatMap((x) => (x.cloze ? [x.cloze] : []))];
      const { options } = pickOptions(parts.answer, pool, rnd);
      return { kind: 'cloze', ...base, ...parts, en: item.en, full: item.t, options: typed || options.length < 2 ? undefined : options };
    }
    case 'type':
      return { kind: 'cloze', ...base, before: '', after: '', answer: item.t, en: item.en, full: item.t };
    case 'reorder': {
      const answer = tokens(item.t);
      let shuffled = shuffle(answer, rnd);
      if (shuffled.join(' ') === answer.join(' ')) shuffled = [...answer.slice(1), answer[0]];
      return { kind: 'reorder', ...base, tokens: shuffled, answer, en: item.en, full: item.t };
    }
    case 'speak':
      return { kind: 'speak', ...base, text: item.t, r: item.r, en: item.en };
    case 'listen': {
      const { options, answer } = pickOptions(item.en, others.map((x) => x.en), rnd);
      return { kind: 'listen', ...base, text: item.t, options, answer };
    }
    case 'card':
      return { kind: 'card', ...base, front: item.t, frontIsTarget: true, sub, back: item.en, speakText: item.t };
    case 'mcq-rev': {
      const { options, answer } = pickOptions(item.t, others.map((x) => x.t), rnd);
      return { kind: 'mcq', ...base, prompt: item.en, promptIsTarget: false, options, optionsAreTarget: true, answer, instruction: 'Choose the translation' };
    }
    default: {
      const { options, answer } = pickOptions(item.en, others.map((x) => x.en), rnd);
      return { kind: 'mcq', ...base, prompt: item.t, promptIsTarget: true, sub, options, optionsAreTarget: false, answer, instruction: 'What does this mean?', speakText: item.t };
    }
  }
}

/** The guided lesson for a unit: every example once, in rotating formats, then its vocabulary. */
export function unitLesson(unit: Unit, c: Content, o: ExerciseOpts): Exercise[] {
  const list = c.unitItems.get(unit.id) ?? [];
  const cycle: Kind[] = ['mcq', 'cloze', 'reorder', 'cloze', 'speak', 'cloze', 'reorder', 'listen'];
  const ex = list.filter((i) => i.kind === 'example').map((it, i) => makeExercise(it, c, o, cycle[i % cycle.length]));
  const vocab = list.filter((i) => i.kind === 'vocab').map((it, i) => makeExercise(it, c, o, i % 2 ? 'mcq-rev' : 'mcq'));
  return [...ex, ...vocab];
}

/** Ten exam-style questions used to test out of a unit (no hints, no speech — works in quiet mode). */
export function unitTest(unit: Unit, c: Content, o: ExerciseOpts, n = 10): Exercise[] {
  const rnd = o.rnd ?? Math.random;
  const list = c.unitItems.get(unit.id) ?? [];
  const ex = shuffle(list.filter((i) => i.kind === 'example'), rnd);
  const vocab = shuffle(list.filter((i) => i.kind === 'vocab'), rnd);
  const picked = [...ex.slice(0, 7), ...vocab].slice(0, n);
  return picked.map((it, i) => makeExercise(it, c, { ...o, exam: true, showRoman: false }, it.kind === 'vocab' ? 'mcq-rev' : i % 3 === 2 ? 'reorder' : 'cloze'));
}

export function readingQuestion(q: Question, id: string, rnd: () => number = Math.random): Exercise {
  const options = shuffle(q.opts, rnd);
  return { kind: 'mcq', itemId: id, cats: ['reading'], prompt: q.q, promptIsTarget: false, options, optionsAreTarget: false, answer: options.indexOf(q.opts[0]), instruction: 'Answer from the text' };
}

export function checkReorder(given: string[], answer: string[], lang: LangId): boolean {
  return normalize(given.join(' '), lang) === normalize(answer.join(' '), lang);
}
