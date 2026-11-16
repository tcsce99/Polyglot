// Assembles placement questions and CEFR-style level exams from the course and the decks.
import type { Content } from '../content/build';
import { makeExercise, readingQuestion, type ExerciseOpts } from '../exercises';
import { shuffle } from '../text';
import { LEVELS, type Exercise, type Item } from '../types';
import type { SectionId } from './exam';

const hard = (o: ExerciseOpts): ExerciseOpts => ({ ...o, exam: true, showRoman: false });

/** Highest level ≤ `level` that actually has items (some decks stop before C2). */
function atLevel(items: Item[], level: number): Item[] {
  for (let l = level; l >= 0; l--) { const hit = items.filter((i) => i.level === l); if (hit.length >= 8) return hit; }
  return items;
}
const unitExamples = (c: Content, level: number) => atLevel([...c.items.values()].filter((i) => i.kind === 'example' && i.cloze), level);
const unitVocab = (c: Content, level: number) => atLevel([...c.items.values()].filter((i) => i.kind === 'vocab'), level);

/** One placement question for a level: mostly grammar in context, plus vocabulary. Silent — no audio needed. */
export function placementQuestion(c: Content, level: number, index: number, o: ExerciseOpts, used: Set<string>): Exercise {
  const rnd = o.rnd ?? Math.random;
  const pools: [Item[], 'cloze' | 'mcq-rev' | 'mcq'][] = [[unitExamples(c, level), 'cloze'], [unitVocab(c, level), 'mcq-rev'], [atLevel(c.words, level), 'mcq']];
  const [pool, kind] = pools[[0, 0, 1, 0, 2, 0, 1, 0][index % 8]];
  const fresh = pool.filter((i) => !used.has(i.id));
  const item = shuffle(fresh.length ? fresh : pool, rnd)[0];
  used.add(item.id);
  // multiple choice keeps the placement fair for learners without a native-script keyboard
  return makeExercise(item, c, { ...hard(o), typing: false }, kind);
}

export interface AiTask { mode: 'writing' | 'speaking'; prompt: string; minWords: number }
export interface ExamSection { id: SectionId; exercises: Exercise[]; task?: AiTask; skipped?: string }

const WRITING: string[] = [
  'Introduce yourself: your name, where you are from, what you do, and one thing you like. (30–40 words)',
  'Write a message to a friend about what you did last weekend and what you plan to do next weekend. (50–70 words)',
  'Describe a place you know well and explain why you would or would not recommend living there. (90–120 words)',
  'Some people say remote work is better than office work. Give your opinion with arguments and one counter-argument. (140–180 words)',
  'Write a short essay: “Technology makes us more connected but less present.” Discuss, with nuance and examples. (200–250 words)',
  'Write a critical commentary on the claim that a language can never be fully translated. (250–300 words)',
];
const SPEAKING: string[] = [
  'Say three or four sentences about yourself and your family.',
  'Describe your typical day, from morning to evening.',
  'Tell a short story about a trip or an experience you remember well.',
  'Explain the advantages and disadvantages of living in a big city.',
  'Argue for or against this idea: “Success depends more on luck than on effort.”',
  'Speak for a minute about how your native language shapes the way you think.',
];

export interface ExamCaps { quiet: boolean; canListen: boolean; canSpeak: boolean; tutor: boolean }

export function buildExam(c: Content, level: number, o: ExerciseOpts, caps: ExamCaps): ExamSection[] {
  const rnd = o.rnd ?? Math.random;
  const h = hard(o);
  const pick = (items: Item[], n: number) => shuffle(items, rnd).slice(0, n);
  const words = atLevel(c.words, level), sents = atLevel(c.sentences, level);
  const grammarLevel = Math.min(level, 4);

  const vocabulary = [...pick(words, 8), ...pick(unitVocab(c, grammarLevel), 4)].map((it, i) => makeExercise(it, c, { ...h, typing: false }, i % 2 ? 'mcq-rev' : 'mcq'));
  const grammar = pick(unitExamples(c, grammarLevel), 12).map((it, i) => makeExercise(it, c, h, i % 4 === 3 ? 'reorder' : 'cloze'));

  const readings = shuffle(c.course.units.filter((u) => LEVELS.indexOf(u.level) === grammarLevel && u.reading), rnd).slice(0, 2);
  const reading: Exercise[] = readings.flatMap((u) => u.reading!.qs.map((q, i) => ({ ...readingQuestion(q, `${c.lang}/${u.id}:r${i}`, rnd), passage: { title: u.reading!.title, text: u.reading!.text } }) as Exercise));
  for (const it of pick(sents, Math.max(4, 8 - reading.length))) reading.push({ ...makeExercise(it, c, h, 'mcq'), cats: ['reading'] });

  const writing = pick(sents.filter((s) => { const n = s.t.split(/\s+/).length; return n >= 4 && n <= 9; }), 5).map((it) => makeExercise(it, c, h, 'reorder'));

  const listening = caps.quiet || !caps.canListen ? [] : pick(sents, 5).map((it): Exercise => ({ ...makeExercise(it, c, { ...h, exam: false, quiet: false, canListen: true }, 'listen'), cats: ['listening'] }));
  const speaking = caps.quiet || !caps.canSpeak ? [] : pick(sents.filter((s) => s.t.split(/\s+/).length <= 10), 3).map((it): Exercise => ({ kind: 'speak', itemId: it.id, cats: ['pronunciation'], text: it.t, r: undefined, en: it.en }));

  const why = caps.quiet ? 'Quiet mode is on' : 'Not available on this device';
  return [
    { id: 'vocabulary', exercises: vocabulary },
    { id: 'grammar', exercises: grammar },
    { id: 'reading', exercises: reading },
    { id: 'writing', exercises: writing, task: caps.tutor ? { mode: 'writing', prompt: WRITING[level], minWords: [20, 35, 60, 100, 140, 170][level] } : undefined },
    { id: 'listening', exercises: listening, skipped: listening.length ? undefined : why },
    { id: 'speaking', exercises: speaking, task: speaking.length && caps.tutor ? { mode: 'speaking', prompt: SPEAKING[level], minWords: 8 } : undefined, skipped: speaking.length ? undefined : why },
  ];
}
