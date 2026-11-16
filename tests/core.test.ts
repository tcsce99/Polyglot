import { describe, expect, it } from 'vitest';
import { forecast, isDue, knownCard, newCard, ratingFor, retrievability, review, State } from '../src/core/fsrs/scheduler';
import { applyOutcome, unitMastered, unitUnlocked, updateScore, updateUnitScore, weakest, type Mastery } from '../src/core/mastery/mastery';
import { newItemBudget, planSession } from '../src/core/session/plan';
import { answerPlacement, BLOCK_SIZE, startPlacement, type PlacementState } from '../src/core/exam/placement';
import { scoreExam } from '../src/core/exam/exam';
import { parseGrade, parseTutorTurn } from '../src/core/tutor/contract';
import { checkAnswer, levenshtein, normalize, scorePronunciation } from '../src/core/text';

const DAY = 86400000;
const t0 = new Date('2026-01-01T09:00:00Z');

describe('FSRS scheduler', () => {
  it('a new card is due immediately', () => {
    const c = newCard(t0);
    expect(c.state).toBe(State.New);
    expect(isDue({ due: c.due.getTime() }, t0.getTime())).toBe(true);
  });
  it('successful reviews push the due date further and further out', () => {
    let c = newCard(t0), now = t0;
    const intervals: number[] = [];
    for (let i = 0; i < 6; i++) { c = review(c, 3, now); intervals.push(c.due.getTime() - now.getTime()); now = c.due; }
    expect(c.state).toBe(State.Review);
    const tail = intervals.slice(-3);
    expect(tail[1]).toBeGreaterThan(tail[0]);
    expect(tail[2]).toBeGreaterThan(tail[1]);
    expect(tail[2]).toBeGreaterThan(7 * DAY);
  });
  it('Easy schedules later than Good, which schedules later than Hard', () => {
    let c = newCard(t0);
    c = review(c, 3, t0); c = review(c, 3, c.due); c = review(c, 3, c.due);
    const at = c.due;
    const [hard, good, easy] = [2, 3, 4].map((r) => review(c, r as 2 | 3 | 4, at).due.getTime());
    expect(good).toBeGreaterThan(hard);
    expect(easy).toBeGreaterThan(good);
  });
  it('a lapse counts, shortens the interval, and the card is never retired', () => {
    let c = newCard(t0), now = t0;
    for (let i = 0; i < 5; i++) { c = review(c, 3, now); now = c.due; }
    const before = c.scheduled_days;
    const lapsed = review(c, 1, now);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.due.getTime() - now.getTime()).toBeLessThan(before * DAY);
    // keep reviewing for "years": there is always a next due date
    let k = lapsed, t = lapsed.due;
    for (let i = 0; i < 40; i++) { k = review(k, 3, t); t = k.due; }
    expect(Number.isFinite(k.due.getTime())).toBe(true);
    expect(k.due.getTime()).toBeGreaterThan(t0.getTime() + 365 * DAY);
  });
  it('auto-graded exercises map to Again / Good', () => {
    expect(ratingFor(false)).toBe(1);
    expect(ratingFor(true)).toBe(3);
  });
  it('known (tested-out) cards enter review with a staggered first check', () => {
    const c = knownCard(t0, 12);
    expect(c.state).toBe(State.Review);
    expect(Math.round((c.due.getTime() - t0.getTime()) / DAY)).toBe(12);
    expect(review(c, 3, c.due).due.getTime()).toBeGreaterThan(c.due.getTime() + 12 * DAY);
  });
  it('retrievability decays over time', () => {
    let c = newCard(t0); c = review(c, 3, t0); c = review(c, 3, c.due);
    const soon = retrievability(c, new Date(c.last_review!.getTime() + DAY));
    const late = retrievability(c, new Date(c.last_review!.getTime() + 60 * DAY));
    expect(soon).toBeGreaterThan(late);
  });
  it('forecast buckets cards by day, with overdue counted today', () => {
    const now = new Date(2026, 0, 10, 12).getTime();
    expect(forecast([{ due: now - 3 * DAY }, { due: now }, { due: now + DAY }, { due: now + 30 * DAY }], 7, now).slice(0, 2)).toEqual([2, 1]);
  });
});

describe('mastery model', () => {
  it('starts at zero and rises with correct answers, staying in [0,1]', () => {
    let m: Mastery | undefined;
    const scores: number[] = [];
    for (let i = 0; i < 30; i++) { m = applyOutcome(m, 'spa', 'past', true, 0); scores.push(m.score); }
    expect(scores[0]).toBeGreaterThan(0);
    expect(scores.every((s, i) => i === 0 || s >= scores[i - 1])).toBe(true);
    expect(scores[29]).toBeLessThanOrEqual(1);
    expect(scores[29]).toBeGreaterThan(0.95);
  });
  it('needs several correct answers to cross the 0.8 threshold', () => {
    let m: Mastery | undefined, n = 0;
    while ((m?.score ?? 0) < 0.8) { m = applyOutcome(m, 'spa', 'x', true, 0); n++; }
    expect(n).toBeGreaterThanOrEqual(3);
  });
  it('mistakes pull a mastered category back down', () => {
    let m: Mastery | undefined;
    for (let i = 0; i < 20; i++) m = applyOutcome(m, 'spa', 'x', true, 0);
    const high = m!.score;
    for (let i = 0; i < 4; i++) m = applyOutcome(m, 'spa', 'x', false, 0);
    expect(m!.score).toBeLessThan(high);
    expect(m!.score).toBeLessThan(0.8);
  });
  it('a lighter weight moves the score less', () => {
    expect(updateScore(0.5, 10, 1, 0.5) - 0.5).toBeLessThan(updateScore(0.5, 10, 1, 1) - 0.5);
  });
  it('weakest() returns the lowest scores first', () => {
    const all = [['a', 0.9], ['b', 0.2], ['c', 0.5], ['d', 0.1]].map(([cat, score]) => ({ lang: 'spa', cat: cat as string, score: score as number, attempts: 5, updated: 0 }));
    expect(weakest(all, 2)).toEqual(['d', 'b']);
  });
  it('units unlock only when every prerequisite is mastered (≥0.8) or tested out', () => {
    expect(unitUnlocked([], {})).toBe(true);
    expect(unitUnlocked(['u1'], {})).toBe(false);
    expect(unitUnlocked(['u1'], { u1: { score: 0.79 } })).toBe(false);
    expect(unitUnlocked(['u1'], { u1: { score: 0.8 } })).toBe(true);
    expect(unitUnlocked(['u1', 'u2'], { u1: { score: 0.9 }, u2: { score: 0.3 } })).toBe(false);
    expect(unitMastered({ score: 0.1, testedOut: true })).toBe(true);
  });
  it('unit score never drops below the latest run and remembers earlier work', () => {
    expect(updateUnitScore(undefined, 0.6)).toBe(0.6);
    expect(updateUnitScore(0.6, 0.9)).toBe(0.9);
    expect(updateUnitScore(0.9, 0.5)).toBeCloseTo(0.7);
  });
});

describe('session generator', () => {
  const ids = (p: string, n: number) => Array.from({ length: n }, (_, i) => `${p}${i}`);
  const count = (plan: { source: string }[]) => plan.reduce<Record<string, number>>((a, p) => ({ ...a, [p.source]: (a[p.source] ?? 0) + 1 }), {});
  it('mixes 60% due / 25% weak / 15% new', () => {
    const plan = planSession({ due: ids('d', 50), weak: ids('w', 50), fresh: ids('n', 50), size: 20 });
    expect(plan).toHaveLength(20);
    expect(count(plan)).toEqual({ due: 12, weak: 5, new: 3 });
  });
  it('pauses new material after a session under 60% and gives the slots to weak-spot practice', () => {
    const plan = planSession({ due: ids('d', 50), weak: ids('w', 50), fresh: ids('n', 50), size: 20, lastAccuracy: 0.5 });
    expect(count(plan)).toEqual({ due: 12, weak: 8 });
  });
  it('fills with new items when nothing is due (first day)', () => {
    const plan = planSession({ due: [], weak: [], fresh: ids('n', 50), size: 20 });
    expect(count(plan)).toEqual({ new: 20 });
  });
  it('never repeats an item and interleaves sources', () => {
    const plan = planSession({ due: ids('x', 30), weak: ids('x', 30), fresh: ids('n', 10), size: 20 });
    expect(new Set(plan.map((p) => p.id)).size).toBe(plan.length);
    const firstNew = plan.findIndex((p) => p.source === 'new');
    expect(firstNew).toBeGreaterThan(0);
    expect(firstNew).toBeLessThan(plan.length - 3);
  });
  it('weak categories are over-represented relative to their share of the deck', () => {
    const plan = planSession({ due: ids('d', 100), weak: ids('w', 5), fresh: [], size: 20 });
    expect(count(plan).weak).toBe(5);
  });
  it('adapts the amount of new material to the 75–85% target band', () => {
    expect(newItemBudget(3, 0.5)).toBe(0);
    expect(newItemBudget(4, 0.7)).toBe(2);
    expect(newItemBudget(3, 0.8)).toBe(3);
    expect(newItemBudget(3, 0.95)).toBe(5);
  });
});

describe('placement staircase', () => {
  const run = (start: number, ability: number): PlacementState => {
    let s = startPlacement(start);
    for (let guard = 0; !s.done && guard < 200; guard++) s = answerPlacement(s, s.level < ability);
    return s;
  };
  it('places a beginner at A1 from any starting point', () => {
    expect(run(0, 0).placed).toBe(0);
    expect(run(3, 0).placed).toBe(0);
  });
  it('finds the level just above what the learner can do', () => {
    expect(run(0, 2).placed).toBe(2);
    expect(run(1, 2).placed).toBe(2);
    expect(run(3, 2).placed).toBe(2);
  });
  it('tops out above C1 when everything is passed', () => {
    expect(run(2, 9).placed).toBe(5);
  });
  it('stops a block early once pass/fail is decided', () => {
    let s = startPlacement(1);
    for (let i = 0; i < 3; i++) s = answerPlacement(s, false); // 3 wrong of 8 → cannot reach 6 correct
    expect(s.level).toBe(0);
    expect(s.asked).toBe(0);
    expect(BLOCK_SIZE).toBe(8);
  });
});

describe('exam scoring', () => {
  it('passes at 70% overall with every section above the floor', () => {
    const out = scoreExam([{ id: 'vocabulary', score: 0.8 }, { id: 'grammar', score: 0.75 }, { id: 'reading', score: 0.7 }, { id: 'writing', score: 0.7 }, { id: 'listening', score: 0.9 }, { id: 'speaking', score: 0.6 }]);
    expect(out.passed).toBe(true);
    expect(out.complete).toBe(true);
  });
  it('fails when one skill is under 50% even if the average is high', () => {
    const out = scoreExam([{ id: 'vocabulary', score: 1 }, { id: 'grammar', score: 1 }, { id: 'reading', score: 1 }, { id: 'writing', score: 0.4 }]);
    expect(out.passed).toBe(false);
    expect(out.failedFloor).toEqual(['writing']);
  });
  it('reports skipped sections (quiet mode) as not assessed and re-weights the rest', () => {
    const out = scoreExam([{ id: 'vocabulary', score: 0.8 }, { id: 'grammar', score: 0.8 }, { id: 'reading', score: 0.8 }, { id: 'writing', score: 0.8 }, { id: 'listening', score: null }, { id: 'speaking', score: null }]);
    expect(out.overall).toBeCloseTo(0.8);
    expect(out.passed).toBe(true);
    expect(out.complete).toBe(false);
    expect(out.skipped).toEqual(['listening', 'speaking']);
  });
});

describe('tutor JSON contract', () => {
  const cats = ['past', 'ser-estar', 'word-order'];
  it('parses a well-formed turn', () => {
    const t = parseTutorTurn({ reply: '¿Y qué hiciste?', reply_translation: 'And what did you do?', corrected_text: 'Ayer fui al cine.', errors: [{ span: 'voy', correction: 'fui', category_id: 'past', explanation: 'Use the preterite for a finished action.', severity: 'major' }] }, cats);
    expect(t.errors).toHaveLength(1);
    expect(t.errors[0]).toMatchObject({ category_id: 'past', severity: 'major' });
  });
  it('parses JSON wrapped in a code fence or surrounded by prose', () => {
    expect(parseTutorTurn('```json\n{"reply":"Hola","errors":[]}\n```', cats).reply).toBe('Hola');
    expect(parseTutorTurn('Sure! {"reply":"Hola","errors":[]} hope that helps', cats).reply).toBe('Hola');
  });
  it('maps unknown categories to a valid one and drops junk entries', () => {
    const t = parseTutorTurn({ reply: 'x', errors: [{ span: 'a', explanation: 'b', category_id: 'made-up' }, null, 'nope', {}] }, cats);
    expect(t.errors).toHaveLength(1);
    expect(cats).toContain(t.errors[0].category_id);
    expect(t.errors[0].severity).toBe('minor');
  });
  it('degrades to plain text instead of throwing on non-JSON', () => {
    const t = parseTutorTurn('Hola, ¿qué tal?', cats);
    expect(t.reply).toBe('Hola, ¿qué tal?');
    expect(t.errors).toEqual([]);
  });
  it('clamps grades to 0..1 and accepts percentages', () => {
    expect(parseGrade({ score: 85, cefr: 'B1', feedback: 'ok', errors: [] }, cats).score).toBeCloseTo(0.85);
    expect(parseGrade({ score: -3 }, cats).score).toBe(0);
    expect(parseGrade('garbage', cats).score).toBe(0);
  });
});

describe('text and pronunciation scoring', () => {
  it('normalises punctuation, case, Arabic-script variants and diacritics', () => {
    expect(normalize('¿Cómo estás?', 'spa')).toBe('cómo estás');
    expect(normalize('كتابٌ', 'pes')).toBe(normalize('کتاب', 'pes'));
    expect(normalize('مَیں', 'urd')).toBe('میں');
    expect(normalize('می‌روم', 'pes')).toBe('می روم');
  });
  it('grades typed answers: exact, accent slip, typo, wrong', () => {
    expect(checkAnswer('Está', 'está', 'spa')).toBe('exact');
    expect(checkAnswer('esta', 'está', 'spa')).toBe('accent');
    expect(checkAnswer('gurnata', 'ġurnata', 'mlt')).toBe('accent');
    expect(checkAnswer('trabajmos', 'trabajamos', 'spa')).toBe('typo');
    expect(checkAnswer('soy', 'es', 'spa')).toBe('wrong');
    expect(checkAnswer('', 'es', 'spa')).toBe('wrong');
  });
  it('levenshtein distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
  it('scores pronunciation word by word against the transcript', () => {
    const full = scorePronunciation('Me llamo Ana y vivo en Madrid.', 'me llamo ana y vivo en madrid', 'spa');
    expect(full.score).toBe(1);
    const miss = scorePronunciation('Me llamo Ana y vivo en Madrid.', 'me llamo ana y bebo en madrid', 'spa');
    expect(miss.score).toBeCloseTo(6 / 7);
    expect(miss.words.find((w) => !w.ok)?.word).toBe('vivo');
    expect(scorePronunciation('Me llamo Ana', '', 'spa').score).toBe(0);
  });
  it('tolerates accent and near-miss differences from the recogniser, in any script', () => {
    expect(scorePronunciation('¿Dónde está el baño?', 'donde esta el bano', 'spa').score).toBe(1);
    expect(scorePronunciation('میرا نام علی ہے', 'ميرا نام علي ہے', 'urd').score).toBe(1);
    expect(scorePronunciation("Jien m'iniex minn hawn", 'jien miniex minn hawn', 'mlt').score).toBeGreaterThanOrEqual(0.75);
  });
});
