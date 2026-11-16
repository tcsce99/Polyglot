// Thin wrapper over ts-fsrs (FSRS). Every learned item gets a card and is scheduled forever —
// nothing ever "graduates" out of review (SPEC §7).
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';

export type { Card };
export { Rating, State };

const engine = fsrs(generatorParameters({ enable_fuzz: false, request_retention: 0.9 }));

export interface CardRow { id: string; lang: string; due: number; card: Card; cats: string[] }

export function newCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

/** Apply a review. rating: 1 Again · 2 Hard · 3 Good · 4 Easy. */
export function review(card: Card, rating: 1 | 2 | 3 | 4, now: Date = new Date()): Card {
  return engine.next(card, now, rating as Grade).card;
}

/** Rating for an auto-graded exercise: a miss is a lapse, a hit is "Good". */
export function ratingFor(correct: boolean): 1 | 3 {
  return correct ? 3 : 1;
}

/**
 * Card for an item the learner proved they already know (placement / test-out).
 * It enters the review state immediately, with its first check spread over the next few weeks
 * so that skipped material is still verified and never forgotten.
 */
export function knownCard(now: Date, spreadDays: number): Card {
  let c = review(newCard(now), 4, now);
  if (c.state !== State.Review) c = review(c, 4, c.due);
  const days = Math.max(1, Math.round(spreadDays));
  return { ...c, due: new Date(now.getTime() + days * 86400000), scheduled_days: days, stability: Math.max(c.stability, days), last_review: now };
}

export function isDue(row: Pick<CardRow, 'due'>, now: number = Date.now()): boolean {
  return row.due <= now;
}

/** Probability the item can be recalled right now. */
export function retrievability(card: Card, now: Date = new Date()): number {
  if (card.state === State.New) return 0;
  return engine.get_retrievability(card, now, false);
}

/** Number of cards coming due on each of the next `days` days (index 0 = today, including overdue). */
export function forecast(rows: Pick<CardRow, 'due'>[], days: number, now: number = Date.now()): number[] {
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const out = new Array<number>(days).fill(0);
  for (const r of rows) {
    const d = Math.max(0, Math.floor((r.due - startOfToday.getTime()) / 86400000));
    if (d < days) out[d]++;
  }
  return out;
}
