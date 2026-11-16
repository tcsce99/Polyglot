// Category mastery model (SPEC §6).
//
// One score in [0,1] per (language, category), updated with an ELO-style exponential step:
//     score' = score + k · (outcome − score)
// with k = max(K_MIN, 1/(attempts+2)). Early answers move the score quickly (it behaves like a
// running average while there is little evidence); later it becomes an exponential moving average
// that follows recent performance, so a category can both rise with practice and decay when the
// learner starts making mistakes again. A fresh category starts at 0 — mastery must be demonstrated.

export interface Mastery { lang: string; cat: string; score: number; attempts: number; updated: number }

export const K_MIN = 0.12;
export const MASTERY_THRESHOLD = 0.8;

export function updateScore(score: number, attempts: number, outcome: number, weight = 1): number {
  const k = Math.min(1, Math.max(K_MIN, 1 / (attempts + 2)) * weight);
  return Math.min(1, Math.max(0, score + k * (outcome - score)));
}

export function applyOutcome(m: Mastery | undefined, lang: string, cat: string, correct: boolean, now = Date.now(), weight = 1): Mastery {
  const prev = m ?? { lang, cat, score: 0, attempts: 0, updated: now };
  return { lang, cat, score: updateScore(prev.score, prev.attempts, correct ? 1 : 0, weight), attempts: prev.attempts + 1, updated: now };
}

/** Lowest-scoring categories among those the learner has met (ties: fewer attempts first). */
export function weakest(all: Mastery[], n: number, minAttempts = 1): string[] {
  return all.filter((m) => m.attempts >= minAttempts)
    .sort((a, b) => a.score - b.score || a.attempts - b.attempts)
    .slice(0, n).map((m) => m.cat);
}

/** Unit score: blends the previous score with the accuracy of the latest lesson run. */
export function updateUnitScore(prev: number | undefined, accuracy: number): number {
  return prev === undefined ? accuracy : Math.max(accuracy, 0.5 * prev + 0.5 * accuracy);
}

export interface UnitState { score: number; testedOut?: boolean }

export function unitMastered(s: UnitState | undefined): boolean {
  return !!s && (s.testedOut === true || s.score >= MASTERY_THRESHOLD);
}

/** A unit unlocks only when every prerequisite is mastered (≥ 0.8) — never by time or lesson count. */
export function unitUnlocked(prereqs: string[], states: Record<string, UnitState | undefined>): boolean {
  return prereqs.every((p) => unitMastered(states[p]));
}
