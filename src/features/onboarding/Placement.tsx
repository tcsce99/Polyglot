import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { placementQuestion } from '../../core/exam/build';
import { answerPlacement, BLOCK_SIZE, placementLabel, startPlacement, TOP, type PlacementState } from '../../core/exam/placement';
import { placeAt, recordResults, saveExam } from '../../core/progress';
import { useStore } from '../../core/store';
import { LEVELS, type Result } from '../../core/types';
import { useContent, useExerciseOpts, useLang } from '../../shared/hooks';
import { Bar, Loading, Notice, Page } from '../../shared/ui';
import { ExerciseView } from '../lessons/ExerciseView';

const SELF = [['I’m new to it', 0], ['I know the basics', 1], ['I can hold a conversation', 2], ['I’m fairly fluent', 3]] as const;

export function Placement() {
  const lang = useLang();
  const c = useContent(lang);
  const opts = useExerciseOpts(lang);
  const bump = useStore((s) => s.bump);
  const [st, setSt] = useState<PlacementState | null>(null);
  const [n, setN] = useState(0);
  const used = useRef(new Set<string>());
  const results = useRef<Result[]>([]);
  const ex = useMemo(() => (c && st && !st.done ? placementQuestion(c, st.level, st.asked, opts, used.current) : null), [c, st?.level, st?.asked, st?.done]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c) return <Loading />;
  if (!c.course.units.length) return <Page title="Placement test" back={`/${lang}`}><Notice>This course has no lessons yet.</Notice></Page>;

  if (!st) {
    return (
      <Page title="Placement test" back={`/${lang}`}>
        <div className="card space-y-3">
          <p>How would you describe your level? This only decides where the test starts — it adapts up or down from there.</p>
          {SELF.map(([label, lv]) => <button key={lv} className="btn w-full" onClick={() => setSt(startPlacement(lv))}>{label}</button>)}
          <p className="text-sm text-muted">Multiple choice only: no speaking, listening or special keyboard needed. About {BLOCK_SIZE * 2}–{BLOCK_SIZE * 3} questions.</p>
        </div>
      </Page>
    );
  }

  if (st.done && st.placed !== undefined) {
    const placed = st.placed;
    return (
      <Page title="Your level" back={`/${lang}`}>
        <div className="card text-center space-y-2 py-8">
          <div className="text-sm text-muted">You place at</div>
          <div className="text-6xl font-bold">{placementLabel(placed)}</div>
          <p className="text-muted">{placed === 0 ? 'You will start from the first lesson.' : placed > TOP ? 'You tested out of every lesson. Your path is now review, reading, the tutor and the C1/C2 exams.' : `Lessons below ${LEVELS[placed]} are marked as known and moved into long-term review.`}</p>
        </div>
        <Notice tone="brand">This is an estimate from a short test. If a lesson feels too easy you can still test out of it; if it feels too hard, the lessons below stay open.</Notice>
        <Link className="btn-primary w-full" to={`/${lang}`}>Start learning</Link>
      </Page>
    );
  }

  return (
    <Page title={`Placement · testing ${LEVELS[st.level]}`} back={`/${lang}`}>
      <Bar value={st.asked / BLOCK_SIZE} />
      {ex && <ExerciseView key={n} ex={ex} lang={lang} exam onDone={async (o) => {
        results.current.push({ itemId: ex.itemId, cats: ex.cats, correct: o.correct, kind: ex.kind });
        const next = answerPlacement(st, o.correct);
        if (next.done && next.placed !== undefined) {
          await recordResults(lang, results.current, { kind: 'placement', schedule: false });
          await placeAt(lang, Math.min(next.placed, TOP + 1), c);
          const right = results.current.filter((r) => r.correct).length;
          await saveExam({ lang, ts: Date.now(), kind: 'placement', level: placementLabel(next.placed), score: right / results.current.length, passed: true });
          bump();
        }
        setN(n + 1); setSt(next);
      }} />}
    </Page>
  );
}
