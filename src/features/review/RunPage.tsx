import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { makeExercise, unitLesson, unitTest, type ExerciseOpts } from '../../core/exercises';
import { MASTERY_THRESHOLD } from '../../core/mastery/mastery';
import { freshItems, planFor, recordResults, testOutUnits, type Snapshot } from '../../core/progress';
import type { Content } from '../../core/content/build';
import { useStore } from '../../core/store';
import type { Exercise, Result } from '../../core/types';
import { useContent, useExerciseOpts, useLang, useSnapshot } from '../../shared/hooks';
import { Loading, Notice, Page, QuietToggle } from '../../shared/ui';
import { Runner } from '../lessons/Runner';
import { catLabel } from '../../../content/categories';

interface Built { title: string; exercises: Exercise[]; note?: string; unitId?: string; test?: boolean; kind: string }

function build(mode: string, c: Content, snap: Snapshot, o: ExerciseOpts, size: number): Built {
  const reps = new Map(snap.cards.map((x) => [x.id, x.card.reps]));
  const ex = (ids: string[]) => ids.flatMap((id) => { const it = c.items.get(id); return it ? [makeExercise(it, c, { ...o, reps: reps.get(id) ?? 0 })] : []; });
  const [kind, arg] = mode.split(':');
  if (kind === 'unit' || kind === 'test') {
    const u = c.units.get(arg);
    if (!u) return { title: 'Lesson', exercises: [], kind };
    return kind === 'unit' ? { title: u.title, exercises: unitLesson(u, c, o), unitId: u.id, kind: 'lesson' }
      : { title: `Test out: ${u.title}`, exercises: unitTest(u, c, o), unitId: u.id, test: true, kind: 'test-out', note: 'Ten questions, no hints. Score 80% to skip this lesson.' };
  }
  if (kind === 'review') {
    const now = Date.now();
    return { title: 'Review', kind: 'review', exercises: ex(snap.cards.filter((x) => x.due <= now).sort((a, b) => a.due - b.due).slice(0, 30).map((x) => x.id)) };
  }
  if (kind === 'sentences') { // quiet-friendly reading practice: new sentences at the learner's level as recall cards
    const items = freshItems(c, snap, 200).filter((i) => i.kind === 'sentence').slice(0, 12);
    return { title: 'Sentence reading', kind: 'reading', exercises: items.map((it) => makeExercise(it, c, { ...o, quiet: true, reps: 2 }, 'card')) };
  }
  if (kind === 'speak') { // pronunciation drill on material already learned (works without the AI tutor)
    const pool = snap.cards.map((x) => c.items.get(x.id)).filter((it) => it && it.kind !== 'word' && it.t.split(' ').length <= 10).slice(-40);
    const pick = pool.sort(() => Math.random() - 0.5).slice(0, 8);
    return { title: 'Pronunciation drill', kind: 'pronunciation', exercises: pick.map((it) => ({ kind: 'speak' as const, itemId: it!.id, cats: ['pronunciation'], text: it!.t, r: it!.r, en: it!.en })) };
  }
  const plan = planFor(c, snap, size);
  const counts = { due: 0, weak: 0, new: 0 };
  plan.planned.forEach((p) => counts[p.source]++);
  return { title: 'Today’s session', kind: 'session', exercises: ex(plan.planned.map((p) => p.id)), note: `${counts.due} review · ${counts.weak} weak-spot · ${counts.new} new${plan.weakCats.length ? ' — focus: ' + plan.weakCats.map((x) => catLabel(c.lang, x)).join(', ') : ''}` };
}

export function RunPage() {
  const lang = useLang();
  const { mode = 'session' } = useParams();
  const nav = useNavigate();
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  const opts = useExerciseOpts(lang);
  const { sessionSize, bump } = useStore();
  const [done, setDone] = useState<{ results: Result[]; passed?: boolean } | null>(null);
  // Build once per visit: the snapshot changes when results are saved, and the run must not reshuffle mid-way.
  const ready = !!c && !!snap;
  const built = useMemo(() => (ready ? build(mode, c!, snap!, opts, sessionSize) : null), [ready, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c || !snap || !built) return <Loading />;

  const finish = async (results: Result[], seconds: number) => {
    const acc = results.length ? results.filter((r) => r.correct).length / results.length : 0;
    const passed = built.test ? acc >= MASTERY_THRESHOLD : undefined;
    // A test-out only schedules cards when passed; a failed one still informs category mastery.
    await recordResults(lang, results, { kind: built.kind, unitId: built.test ? undefined : built.unitId, seconds, schedule: !built.test });
    if (built.test && passed) await testOutUnits(lang, [c.units.get(built.unitId!)!], c);
    bump();
    setDone({ results, passed });
  };

  if (done) {
    const right = done.results.filter((r) => r.correct).length, total = done.results.length;
    const acc = total ? right / total : 0;
    const missed = [...new Set(done.results.filter((r) => !r.correct).flatMap((r) => r.cats))];
    const nextUnit = built.unitId ? c.course.units[c.course.units.findIndex((u) => u.id === built.unitId) + 1] : undefined;
    return (
      <Page title={built.title} back={`/${lang}`}>
        <div className="card text-center space-y-2 py-8">
          <div className="text-5xl font-bold">{Math.round(acc * 100)}%</div>
          <div className="text-muted">{right} of {total} right on the first try</div>
          {built.test && <Notice tone={done.passed ? 'ok' : 'warn'}>{done.passed ? 'Passed — lesson skipped. Its material moves to long-term review so you never lose it.' : 'Not this time. You need 80% to skip — try the lesson, it is short.'}</Notice>}
          {!built.test && built.unitId && <Notice tone={acc >= 0.8 ? 'ok' : 'brand'}>{acc >= 0.8 ? 'Lesson mastered — the next one is unlocked.' : 'Reach 80% to unlock the next lesson. Practise again when you are ready.'}</Notice>}
        </div>
        {missed.length > 0 && <div className="card"><div className="font-semibold mb-1">To work on</div><div className="flex flex-wrap gap-2">{missed.map((x) => <span key={x} className="chip !bg-bad-soft !text-bad">{catLabel(lang, x)}</span>)}</div><p className="text-sm text-muted mt-2">These categories will come up more often in your next sessions.</p></div>}
        <div className="grid gap-2">
          {built.unitId && nextUnit && (done.passed || acc >= 0.8) && <Link className="btn-primary" to={`/${lang}/unit/${nextUnit.id}`}>Next lesson: {nextUnit.title}</Link>}
          {built.unitId && !done.passed && acc < 0.8 && <Link className="btn-primary" to={`/${lang}/unit/${built.unitId}`}>Back to the lesson</Link>}
          <Link className="btn" to={`/${lang}`}>Done</Link>
        </div>
      </Page>
    );
  }

  if (!built.exercises.length) {
    return (
      <Page title={built.title} back={`/${lang}`}>
        <div className="card text-center space-y-3 py-8"><div className="text-4xl">✓</div><p>{mode === 'review' ? 'Nothing is due right now. Come back later — your queue never disappears.' : mode === 'speak' ? 'Learn a few sentences first, then come back to drill them aloud.' : 'Nothing to practise here yet.'}</p><Link className="btn-primary" to={`/${lang}`}>Back</Link></div>
      </Page>
    );
  }
  return (
    <Page title={built.title} right={<QuietToggle />}>
      {built.note && <p className="text-sm text-muted">{built.note}</p>}
      <Runner lang={lang} exercises={built.exercises} exam={built.test} onFinish={finish} onQuit={() => nav(`/${lang}`)} />
    </Page>
  );
}
