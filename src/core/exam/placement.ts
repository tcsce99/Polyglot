// Adaptive placement test: a staircase over CEFR levels.
// The learner answers a block of questions at one level. Pass (≥ 75%) → try the level above;
// fail → try the level below, until a pass sits directly under a fail. Typically 2–3 blocks.
import { LEVELS } from '../types';

export const BLOCK_SIZE = 8;
export const PASS = 0.75;
export const TOP = 4; // C1 is the highest level with authored units

export interface PlacementState {
  level: number;            // level index being tested now
  results: (boolean | undefined)[]; // per level: passed / failed / untested
  asked: number;            // questions answered in the current block
  correct: number;
  done: boolean;
  placed?: number;          // level index the learner should start at
}

export function startPlacement(selfAssessed: number): PlacementState {
  return { level: Math.min(Math.max(selfAssessed, 0), TOP), results: [], asked: 0, correct: 0, done: false };
}

export function answerPlacement(s: PlacementState, correct: boolean): PlacementState {
  if (s.done) return s;
  const asked = s.asked + 1, right = s.correct + (correct ? 1 : 0);
  const remaining = BLOCK_SIZE - asked;
  const need = Math.ceil(BLOCK_SIZE * PASS);
  // Stop the block early once the outcome is decided.
  const decided = right >= need ? true : right + remaining < need ? false : undefined;
  if (decided === undefined) return { ...s, asked, correct: right };
  const results = s.results.slice();
  results[s.level] = decided;
  const next = decided ? s.level + 1 : s.level - 1;
  if (decided) {
    if (s.level === TOP || results[next] === false) return { ...s, results, asked, correct: right, done: true, placed: Math.min(s.level + 1, TOP + 1) };
  } else if (s.level === 0 || results[next] === true) {
    return { ...s, results, asked, correct: right, done: true, placed: s.level };
  }
  return { level: next, results, asked: 0, correct: 0, done: false };
}

/** Human-readable placement: index TOP+1 means "passed everything we can test". */
export function placementLabel(placed: number): string {
  return placed > TOP ? 'C1+' : LEVELS[placed];
}
