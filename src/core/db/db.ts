// Local-first storage (IndexedDB via Dexie). Nothing leaves the device.
import Dexie, { type Table } from 'dexie';
import type { CardRow } from '../fsrs/scheduler';
import type { Mastery } from '../mastery/mastery';
import type { SectionResult } from '../exam/exam';

export interface UnitRow { lang: string; unitId: string; score: number; attempts: number; testedOut?: boolean; updated: number }
export interface SessionRow { id?: number; lang: string; day: string; ts: number; kind: string; correct: number; total: number; seconds: number }
export interface ExamRow { id?: number; lang: string; ts: number; kind: 'placement' | 'exam'; level: string; score: number; passed: boolean; sections?: SectionResult[] }
export interface KvRow { key: string; value: unknown }

export class PolyglotDB extends Dexie {
  cards!: Table<CardRow, string>;
  mastery!: Table<Mastery, [string, string]>;
  units!: Table<UnitRow, [string, string]>;
  sessions!: Table<SessionRow, number>;
  exams!: Table<ExamRow, number>;
  kv!: Table<KvRow, string>;
  constructor(name = 'polyglot') {
    super(name);
    this.version(1).stores({
      cards: 'id, lang, [lang+due]',
      mastery: '[lang+cat], lang',
      units: '[lang+unitId], lang',
      sessions: '++id, lang, day',
      exams: '++id, lang',
      kv: 'key',
    });
  }
}

export const db = new PolyglotDB();
export const TABLES = ['cards', 'mastery', 'units', 'sessions', 'exams', 'kv'] as const;

export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function exportBackup(): Promise<string> {
  const out: Record<string, unknown> = { app: 'polyglot', version: 1, exported: new Date().toISOString() };
  for (const t of TABLES) out[t] = await db.table(t).toArray();
  return JSON.stringify(out);
}

export async function importBackup(text: string): Promise<void> {
  const data = JSON.parse(text);
  if (data?.app !== 'polyglot') throw new Error('Not a Polyglot backup file');
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      const rows = (data[t] ?? []).map((r: Record<string, unknown>) => (t === 'cards' ? reviveCard(r) : r));
      await db.table(t).bulkPut(rows);
    }
  });
}

function reviveCard(r: Record<string, unknown>) {
  const card = { ...(r.card as Record<string, unknown>) };
  for (const k of ['due', 'last_review']) if (typeof card[k] === 'string') card[k] = new Date(card[k] as string);
  return { ...r, card };
}
