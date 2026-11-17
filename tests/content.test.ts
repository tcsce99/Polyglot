// Content integrity: these checks run over every authored unit in every language.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { categoriesFor } from '../content/categories';
import { SCENARIOS } from '../content/scenarios';
import spa from '../content/spa';
import mlt from '../content/mlt';
import urd from '../content/urd';
import pes from '../content/pes';
import { buildContent, type Content } from '../src/core/content/build';
import { makeExercise, unitLesson, unitTest, type ExerciseOpts } from '../src/core/exercises';
import { buildExam, placementQuestion } from '../src/core/exam/build';
import { planFor, type Snapshot } from '../src/core/progress';
import { seeded } from '../src/core/text';
import { LEVELS, type Course, type LangId } from '../src/core/types';

const COURSES: Record<LangId, Course> = { spa, mlt, urd, pes };
const json = (lang: string, f: string) => { const p = `public/content/${lang}/${f}.json`; return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : undefined; };
const content = (lang: LangId): Content => buildContent(lang, COURSES[lang], json(lang, 'words'), json(lang, 'sentences'));
const opts = (o: Partial<ExerciseOpts> = {}): ExerciseOpts => ({ quiet: false, canSpeak: true, canListen: true, typing: true, rnd: seeded(7), ...o });
const ARABIC = /[؀-ۿ]/;

describe.each(Object.keys(COURSES) as LangId[])('course: %s', (lang) => {
  const course = COURSES[lang];
  const c = content(lang);
  const cats = categoriesFor(lang);

  it('covers A1–C1 with at least 40 lessons', () => {
    expect(course.units.length).toBeGreaterThanOrEqual(40);
    for (const lv of ['A1', 'A2', 'B1', 'B2', 'C1']) expect(course.units.filter((u) => u.level === lv).length, lv).toBeGreaterThanOrEqual(5);
    const order = course.units.map((u) => LEVELS.indexOf(u.level));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('has unique ids and a valid prerequisite chain', () => {
    const ids = course.units.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    course.units.forEach((u, i) => {
      if (i === 0) expect(u.prereqs).toEqual([]);
      else expect(u.prereqs.length).toBeGreaterThan(0);
      for (const p of u.prereqs) expect(ids.indexOf(p), `${u.id} requires ${p}`).toBeLessThan(i);
      expect(ids.indexOf(u.prereqs[0] ?? ids[0])).toBeGreaterThanOrEqual(0);
    });
  });

  it('tags every lesson with known grammatical categories', () => {
    for (const u of course.units) { expect(u.cats.length, u.id).toBeGreaterThan(0); for (const cat of u.cats) expect(cats[cat], `${u.id}: unknown category "${cat}"`).toBeTruthy(); }
  });

  it('gives every lesson a note, examples with a cloze target, distractors and vocabulary', () => {
    for (const u of course.units) {
      expect(u.note.length, `${u.id} note`).toBeGreaterThan(120);
      expect(u.examples.length, `${u.id} examples`).toBeGreaterThanOrEqual(8);
      expect(u.vocab.length, `${u.id} vocab`).toBeGreaterThanOrEqual(8);
      expect(u.alts.length, `${u.id} alts`).toBeGreaterThanOrEqual(4);
      for (const e of u.examples) {
        expect(e.cloze, `${u.id}: example without *cloze*: ${e.t}`).toBeTruthy();
        expect(e.t.includes(e.cloze!), `${u.id}: cloze not in sentence`).toBe(true);
        expect(e.t.includes('*'), `${u.id}: stray asterisk in ${e.t}`).toBe(false);
        expect(e.en.length).toBeGreaterThan(1);
      }
      expect(!!u.dialogue || !!u.reading, `${u.id} needs a dialogue or a reading`).toBe(true);
    }
  });

  it('uses the right script, with romanisation for beginners in Arabic-script languages', () => {
    const rtl = lang === 'urd' || lang === 'pes';
    for (const u of course.units) {
      for (const x of [...u.examples, ...u.vocab]) {
        expect(ARABIC.test(x.t), `${u.id}: "${x.t}"`).toBe(rtl);
        expect(ARABIC.test(x.en), `${u.id}: English field contains Arabic script: ${x.en}`).toBe(false);
        if (rtl && (u.level === 'A1' || u.level === 'A2')) expect(x.r, `${u.id}: missing romanisation for ${x.t}`).toBeTruthy();
        if (x.r) expect(ARABIC.test(x.r), `${u.id}: romanisation contains Arabic script`).toBe(false);
      }
    }
  });

  it('has well-formed dialogues and readings', () => {
    for (const u of course.units) {
      for (const l of u.dialogue ?? []) { expect(l.who.length, u.id).toBeGreaterThan(0); expect(l.t.length).toBeGreaterThan(1); }
      if (u.reading) {
        expect(u.reading.text.split(/\s+/).length, `${u.id} reading length`).toBeGreaterThan(50);
        expect(u.reading.qs.length, `${u.id} questions`).toBeGreaterThanOrEqual(3);
        for (const q of u.reading.qs) { expect(q.opts.length, `${u.id}: ${q.q}`).toBe(4); expect(new Set(q.opts).size).toBe(4); }
      }
    }
    expect(course.units.filter((u) => u.reading).length).toBeGreaterThanOrEqual(15);
  });

  it('generates a valid exercise of every kind for every lesson', () => {
    for (const u of course.units) {
      const lesson = unitLesson(u, c, opts());
      expect(lesson.length).toBeGreaterThanOrEqual(16);
      for (const ex of [...lesson, ...unitTest(u, c, opts())]) {
        if (ex.kind === 'mcq' || ex.kind === 'listen') { expect(ex.options.length, `${u.id} ${ex.itemId}`).toBeGreaterThanOrEqual(3); expect(ex.answer).toBeGreaterThanOrEqual(0); expect(new Set(ex.options).size).toBe(ex.options.length); }
        if (ex.kind === 'cloze' && ex.options) { expect(ex.options, `${u.id} ${ex.itemId}`).toContain(ex.answer); expect(ex.options.length).toBeGreaterThanOrEqual(3); }
        if (ex.kind === 'cloze') expect(ex.before + ex.answer + ex.after).toBe(ex.full);
        if (ex.kind === 'reorder') expect([...ex.tokens].sort()).toEqual([...ex.answer].sort());
      }
      expect(unitTest(u, c, opts())).toHaveLength(10);
    }
  });

  it('quiet mode never produces listening or speaking exercises', () => {
    const quiet = opts({ quiet: true });
    for (const u of course.units) for (const ex of unitLesson(u, c, quiet)) expect(['listen', 'speak']).not.toContain(ex.kind);
    for (const it of [...c.words.slice(0, 200), ...c.sentences.slice(0, 200)]) for (let i = 0; i < 4; i++) expect(['listen', 'speak']).not.toContain(makeExercise(it, c, { ...quiet, reps: i }).kind);
  });

  it('ships pipeline decks with licence metadata', () => {
    const w = json(lang, 'words'), s = json(lang, 'sentences');
    expect(w.words.length).toBeGreaterThanOrEqual(1500);
    expect(w.meta.license).toMatch(/CC-BY-SA/);
    expect(s.meta.license).toMatch(/CC-BY/);
    expect(s.sentences.length).toBeGreaterThan(1000);
    for (const x of s.sentences.slice(0, 300)) { expect(x.t && x.e).toBeTruthy(); expect(x.c.length).toBeGreaterThan(0); expect(x.b || x.x, 'attribution').toBeTruthy(); for (const cat of x.c) expect(cats[cat], cat).toBeTruthy(); }
  });

  it('builds placement questions and complete exams at every level', () => {
    for (let lv = 0; lv < 5; lv++) {
      const used = new Set<string>();
      for (let i = 0; i < 8; i++) { const q = placementQuestion(c, lv, i, opts(), used); expect(['mcq', 'cloze']).toContain(q.kind); if (q.kind === 'cloze') expect(q.options).toBeTruthy(); }
    }
    for (let lv = 0; lv < 6; lv++) {
      const full = buildExam(c, lv, opts(), { quiet: false, canListen: true, canSpeak: true, tutor: true });
      expect(full.map((s) => s.id)).toEqual(['vocabulary', 'grammar', 'reading', 'writing', 'listening', 'speaking']);
      for (const s of full) expect(s.exercises.length, `${LEVELS[lv]} ${s.id}`).toBeGreaterThanOrEqual(3);
      expect(full[3].task?.mode).toBe('writing');
      const quiet = buildExam(c, lv, opts(), { quiet: true, canListen: true, canSpeak: true, tutor: false });
      expect(quiet[4].exercises).toHaveLength(0);
      expect(quiet[5].exercises).toHaveLength(0);
      expect(quiet.flatMap((s) => s.exercises).some((e) => e.kind === 'listen' || e.kind === 'speak')).toBe(false);
    }
  });

  it('plans a first session for a brand-new learner from unlocked material only', () => {
    const snap: Snapshot = { units: {}, mastery: [], cards: [], dueCount: 0, workingLevel: 0, certified: -1, streak: 0, studiedToday: 0, exams: [], started: true };
    const plan = planFor(c, snap, 20);
    expect(plan.items).toHaveLength(20);
    const first = course.units[0].id;
    for (const it of plan.items) { expect(it.level).toBe(0); if (it.unitId) expect(it.unitId).toBe(first); }
  });
});

describe('scenarios and taxonomy', () => {
  it('has at least 20 conversation scenarios spread over the levels', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(20);
    for (let lv = 0; lv < 5; lv++) expect(SCENARIOS.filter((s) => s.level === lv).length).toBeGreaterThanOrEqual(4);
  });
  it('uses proxy-safe category ids', () => {
    for (const lang of Object.keys(COURSES) as LangId[]) for (const id of Object.keys(categoriesFor(lang))) expect(id).toMatch(/^[a-z0-9-]{2,40}$/);
  });
});
