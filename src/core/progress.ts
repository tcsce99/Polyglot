// Reads and writes learner progress: FSRS cards, category mastery, unit scores, streaks.
import { db, dayKey, type ExamRow, type UnitRow } from './db/db';
import { forecast, knownCard, newCard, review, ratingFor, type CardRow } from './fsrs/scheduler';
import { applyOutcome, unitMastered, unitUnlocked, updateUnitScore, weakest, type Mastery, type UnitState } from './mastery/mastery';
import { planSession, type Planned } from './session/plan';
import type { Content } from './content/build';
import { LEVELS, type Item, type LangId, type Result, type Unit } from './types';
import { shuffle } from './text';

export interface SaveOpts { kind: string; unitId?: string; seconds?: number; schedule?: boolean }

/** Persist a finished run: every result updates its FSRS card and its categories' mastery. */
export async function recordResults(lang: LangId, results: Result[], opts: SaveOpts): Promise<void> {
  if (!results.length) return;
  const now = Date.now();
  await db.transaction('rw', [db.cards, db.mastery, db.units, db.sessions, db.kv], async () => {
    if (opts.schedule !== false) {
      for (const r of results) {
        if (r.itemId.includes(':r') && r.cats[0] === 'reading') continue; // reading questions are not flashcards
        const row = await db.cards.get(r.itemId);
        const card = review(row?.card ?? newCard(new Date(now)), r.rating ?? ratingFor(r.correct), new Date(now));
        await db.cards.put({ id: r.itemId, lang, due: card.due.getTime(), card, cats: r.cats });
      }
    }
    const byCat = new Map<string, boolean[]>();
    for (const r of results) for (const c of r.cats) byCat.set(c, [...(byCat.get(c) ?? []), r.correct]);
    for (const [cat, outcomes] of byCat) {
      let m: Mastery | undefined = await db.mastery.get([lang, cat]);
      for (const ok of outcomes) m = applyOutcome(m, lang, cat, ok, now);
      await db.mastery.put(m!);
    }
    const correct = results.filter((r) => r.correct).length;
    const accuracy = correct / results.length;
    if (opts.unitId) {
      const prev = await db.units.get([lang, opts.unitId]);
      await db.units.put({ lang, unitId: opts.unitId, score: updateUnitScore(prev?.score, accuracy), attempts: (prev?.attempts ?? 0) + 1, testedOut: prev?.testedOut, updated: now });
    }
    await db.sessions.add({ lang, day: dayKey(now), ts: now, kind: opts.kind, correct, total: results.length, seconds: opts.seconds ?? 0 });
    await db.kv.put({ key: `${lang}:lastAccuracy`, value: accuracy });
  });
}

/** AI-tutor corrections feed the same mastery model (SPEC §4.2). A clean message counts as a success for the weak areas it exercised. */
export async function recordTutorErrors(lang: LangId, errorCats: string[], cleanCats: string[] = []): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.mastery, async () => {
    for (const cat of errorCats) await db.mastery.put(applyOutcome(await db.mastery.get([lang, cat]), lang, cat, false, now));
    for (const cat of cleanCats) await db.mastery.put(applyOutcome(await db.mastery.get([lang, cat]), lang, cat, true, now, 0.5));
  });
}

/** Give proven-known items a review card (first check staggered over `spreadDays`) so they are never forgotten. */
export async function markKnown(lang: LangId, items: Item[], spreadDays = 30): Promise<void> {
  const now = new Date();
  const existing = new Set(await db.cards.where('lang').equals(lang).primaryKeys());
  const rows: CardRow[] = [];
  items.forEach((it, i) => {
    if (existing.has(it.id)) return;
    const card = knownCard(now, 2 + ((i * 7) % spreadDays));
    rows.push({ id: it.id, lang, due: card.due.getTime(), card, cats: it.cats });
  });
  await db.cards.bulkPut(rows);
}

export async function testOutUnits(lang: LangId, units: Unit[], c: Content): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', [db.units, db.cards], async () => {
    for (const u of units) {
      const prev = await db.units.get([lang, u.id]);
      await db.units.put({ lang, unitId: u.id, score: Math.max(prev?.score ?? 0, 0.85), attempts: prev?.attempts ?? 0, testedOut: true, updated: now });
    }
    await markKnown(lang, units.flatMap((u) => c.unitItems.get(u.id) ?? []));
  });
}

/** Apply a placement or a passed level exam: everything below `level` is treated as known. */
export async function placeAt(lang: LangId, level: number, c: Content): Promise<void> {
  const below = c.course.units.filter((u) => LEVELS.indexOf(u.level) < level);
  await testOutUnits(lang, below, c);
  await markKnown(lang, c.words.filter((w) => w.level < level), 45);
  await db.kv.put({ key: `${lang}:placed`, value: level });
}

export async function saveExam(row: Omit<ExamRow, 'id'>): Promise<void> {
  await db.exams.add(row);
}

export interface Snapshot {
  units: Record<string, UnitRow>;
  mastery: Mastery[];
  cards: CardRow[];
  dueCount: number;
  workingLevel: number;   // first level with unmastered units
  certified: number;      // highest level with a passed exam (-1 if none)
  placed?: number;
  lastAccuracy?: number;
  streak: number;
  studiedToday: number;
  exams: ExamRow[];
  started: boolean;
}

export function unitStates(units: Record<string, UnitRow>): Record<string, UnitState | undefined> {
  return units;
}

export async function snapshot(lang: LangId, c: Content): Promise<Snapshot> {
  const [unitRows, mastery, cards, sessions, exams, placed, lastAcc] = await Promise.all([
    db.units.where('lang').equals(lang).toArray(), db.mastery.where('lang').equals(lang).toArray(),
    db.cards.where('lang').equals(lang).toArray(), db.sessions.where('lang').equals(lang).toArray(),
    db.exams.where('lang').equals(lang).toArray(), db.kv.get(`${lang}:placed`), db.kv.get(`${lang}:lastAccuracy`),
  ]);
  const units = Object.fromEntries(unitRows.map((u) => [u.unitId, u]));
  const now = Date.now();
  let workingLevel = LEVELS.indexOf(c.course.units[c.course.units.length - 1]?.level ?? 'A1');
  for (const u of c.course.units) if (!unitMastered(units[u.id])) { workingLevel = LEVELS.indexOf(u.level); break; }
  const days = new Set(sessions.map((s) => s.day));
  let streak = 0;
  for (let t = now; ; t -= 86400000) { if (days.has(dayKey(t))) streak++; else if (t !== now) break; else if (!days.has(dayKey(t - 86400000))) break; }
  const certified = Math.max(-1, ...exams.filter((e) => e.kind === 'exam' && e.passed).map((e) => LEVELS.indexOf(e.level as never)));
  return {
    units, mastery, cards, dueCount: cards.filter((x) => x.due <= now).length, workingLevel, certified,
    placed: placed?.value as number | undefined, lastAccuracy: lastAcc?.value as number | undefined, streak,
    studiedToday: sessions.filter((s) => s.day === dayKey(now)).reduce((a, s) => a + s.total, 0),
    exams: exams.sort((a, b) => b.ts - a.ts), started: placed !== undefined || unitRows.length > 0 || cards.length > 0,
  };
}

export function isUnlocked(u: Unit, snap: Snapshot): boolean {
  return unitUnlocked(u.prereqs, snap.units);
}

/** Items the learner may be introduced to next, in teaching order. */
export function freshItems(c: Content, snap: Snapshot, limit = 40): Item[] {
  const have = new Set(snap.cards.map((x) => x.id));
  const out: Item[] = [];
  const push = (list: Item[], max: number) => { let n = 0; for (const it of list) { if (out.length >= limit || n >= max) break; if (!have.has(it.id)) { out.push(it); n++; } } };
  for (const u of c.course.units) if (isUnlocked(u, snap) && !unitMastered(snap.units[u.id])) push(c.unitItems.get(u.id) ?? [], 8);
  push(c.words.filter((w) => w.level <= snap.workingLevel), 14);
  push(c.sentences.filter((s) => s.level <= snap.workingLevel), 14);
  // interleave unit items, words and sentences
  return out;
}

export interface SessionPlan { planned: Planned[]; items: Item[]; weakCats: string[] }

/** The adaptive mixed session: 60% due · 25% weak categories · 15% new (SPEC §3). */
export function planFor(c: Content, snap: Snapshot, size = 20, now = Date.now()): SessionPlan {
  const due = snap.cards.filter((x) => x.due <= now && c.items.has(x.id)).sort((a, b) => a.due - b.due).map((x) => x.id);
  const weakCats = weakest(snap.mastery, 3);
  const weakSet = new Set(weakCats);
  const weak = shuffle(snap.cards.filter((x) => c.items.has(x.id) && x.cats.some((cat) => weakSet.has(cat)))).sort((a, b) => b.card.lapses - a.card.lapses).map((x) => x.id);
  const fresh = interleaveKinds(freshItems(c, snap)).map((x) => x.id);
  const planned = planSession({ due, weak, fresh, size, lastAccuracy: snap.lastAccuracy });
  return { planned, items: planned.map((p) => c.items.get(p.id)!), weakCats };
}

function interleaveKinds(items: Item[]): Item[] {
  const groups = [items.filter((i) => i.unitId), items.filter((i) => i.kind === 'word'), items.filter((i) => i.kind === 'sentence')];
  const out: Item[] = [];
  for (let i = 0; out.length < items.length; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

export function reviewForecast(snap: Snapshot, days = 7): number[] {
  return forecast(snap.cards, days);
}

/** Words the learner knows best — passed to the tutor for comprehensible input (METHODS §3). */
export function knownWords(c: Content, snap: Snapshot, n = 150): string[] {
  return snap.cards.filter((x) => x.card.reps >= 2).map((x) => c.items.get(x.id)).filter((it): it is Item => !!it && (it.kind === 'word' || it.kind === 'vocab')).slice(-n).map((it) => it.t);
}

export async function resetLanguage(lang: LangId): Promise<void> {
  await db.transaction('rw', [db.cards, db.mastery, db.units, db.sessions, db.exams, db.kv], async () => {
    await Promise.all([db.cards, db.mastery, db.units, db.sessions, db.exams].map((t) => t.where('lang').equals(lang).delete()));
    await db.kv.bulkDelete([`${lang}:placed`, `${lang}:lastAccuracy`]);
  });
}
