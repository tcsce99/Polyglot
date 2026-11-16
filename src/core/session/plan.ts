// Session generator (SPEC §3): ~60% due reviews, ~25% weak-category practice, ~15% new material.
// If the learner is struggling (last session < 60%), new material pauses and its share goes to remediation.

export type Source = 'due' | 'weak' | 'new';
export interface Planned { id: string; source: Source }

export interface PlanInput {
  due: string[];   // item ids due for review, most overdue first
  weak: string[];  // learned items in the learner's weakest categories, best candidates first
  fresh: string[]; // unlocked items never seen, in teaching order
  size?: number;
  lastAccuracy?: number; // accuracy of the previous session (0..1)
}

export const MIX = { due: 0.6, weak: 0.25, new: 0.15 };
export const STRUGGLE = 0.6;

export function planSession({ due, weak, fresh, size = 20, lastAccuracy }: PlanInput): Planned[] {
  const pauseNew = lastAccuracy !== undefined && lastAccuracy < STRUGGLE;
  const used = new Set<string>();
  const out: Planned[] = [];
  const take = (pool: string[], n: number, source: Source) => {
    let k = 0;
    for (const id of pool) {
      if (k >= n) break;
      if (used.has(id)) continue;
      used.add(id); out.push({ id, source }); k++;
    }
    return k;
  };
  let nNew = pauseNew ? 0 : Math.round(size * MIX.new);
  let nWeak = Math.round(size * MIX.weak) + (pauseNew ? Math.round(size * MIX.new) : 0);
  let nDue = size - nNew - nWeak;

  let short = nDue - take(due, nDue, 'due');
  short += nWeak - take(weak, nWeak, 'weak');
  if (!pauseNew) short += nNew - take(fresh, nNew, 'new');
  // Redistribute unfilled slots: more reviews first, then weak practice, then (unless paused) new material.
  if (short > 0) short -= take(due, short, 'due');
  if (short > 0) short -= take(weak, short, 'weak');
  if (short > 0 && !pauseNew) short -= take(fresh, short, 'new');
  return interleave(out);
}

/** Interleave sources so the session does not run in blocks (METHODS §6). */
function interleave(items: Planned[]): Planned[] {
  const buckets: Record<Source, Planned[]> = { due: [], weak: [], new: [] };
  for (const it of items) buckets[it.source].push(it);
  const out: Planned[] = [];
  const order: Source[] = ['due', 'due', 'weak', 'due', 'new', 'due', 'weak'];
  let i = 0;
  while (out.length < items.length) {
    const src = order[i++ % order.length];
    const next = buckets[src].shift() ?? buckets.due.shift() ?? buckets.weak.shift() ?? buckets.new.shift();
    if (next) out.push(next);
  }
  return out;
}

/** Target accuracy band 75–85% (METHODS §8): how many new items to introduce per session. */
export function newItemBudget(base: number, lastAccuracy: number | undefined): number {
  if (lastAccuracy === undefined) return base;
  if (lastAccuracy < STRUGGLE) return 0;
  if (lastAccuracy < 0.75) return Math.max(1, Math.floor(base / 2));
  if (lastAccuracy > 0.85) return base + 2;
  return base;
}
