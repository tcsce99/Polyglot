import { useRef, useState } from 'react';
import type { Exercise, LangId, Result } from '../../core/types';
import { Bar } from '../../shared/ui';
import { ExerciseView } from './ExerciseView';

interface Props { lang: LangId; exercises: Exercise[]; exam?: boolean; onFinish: (results: Result[], seconds: number) => void; onQuit?: () => void }

/** Steps through a list of exercises. Missed items come back once at the end (remediation); only first attempts are scored. */
export function Runner({ lang, exercises, exam, onFinish, onQuit }: Props) {
  const [queue, setQueue] = useState<{ ex: Exercise; retry: boolean }[]>(() => exercises.map((ex) => ({ ex, retry: false })));
  const [i, setI] = useState(0);
  const results = useRef<Result[]>([]);
  const start = useRef(Date.now());
  const cur = queue[i];
  if (!cur) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {onQuit && <button className="btn-ghost !p-2" aria-label="Quit" onClick={onQuit}>✕</button>}
        <div className="flex-1"><Bar value={i / queue.length} /></div>
        <span className="text-sm text-muted tabular-nums">{i + 1}/{queue.length}</span>
      </div>
      <ExerciseView key={i} ex={cur.ex} lang={lang} exam={exam} onDone={(o) => {
        let q = queue;
        if (!o.skipped && !cur.retry) results.current.push({ itemId: cur.ex.itemId, cats: cur.ex.cats, correct: o.correct, rating: o.rating, kind: cur.ex.kind });
        if (!o.correct && !o.skipped && !cur.retry && !exam && cur.ex.kind !== 'card') { q = [...queue, { ex: cur.ex, retry: true }]; setQueue(q); }
        if (i + 1 >= q.length) onFinish(results.current, Math.round((Date.now() - start.current) / 1000));
        else setI(i + 1);
      }} />
    </div>
  );
}
