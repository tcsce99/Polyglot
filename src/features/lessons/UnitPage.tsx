import { Link, useParams } from 'react-router-dom';
import { unitMastered } from '../../core/mastery/mastery';
import { isUnlocked } from '../../core/progress';
import { useStore } from '../../core/store';
import { useContent, useLang, useSnapshot } from '../../shared/hooks';
import { Bar, Loading, Notice, Page, QuietToggle, SpeakBtn, T } from '../../shared/ui';
import { catLabel } from '../../../content/categories';

export function UnitPage() {
  const lang = useLang();
  const { unitId = '' } = useParams();
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  const showRoman = useStore((s) => s.showRoman);
  if (!c || !snap) return <Loading />;
  const u = c.units.get(unitId);
  if (!u) return <Page title="Not found" back={`/${lang}`}>This lesson does not exist.</Page>;
  const st = snap.units[u.id];
  const open = isUnlocked(u, snap);
  return (
    <Page title={u.title} back={`/${lang}`} right={<QuietToggle />}>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="chip">{u.level}</span>
        {u.cats.map((x) => <span key={x} className="chip !bg-surface !text-muted border border-line">{catLabel(lang, x)}</span>)}
      </div>
      {st && <div><div className="flex justify-between text-sm text-muted mb-1"><span>{st.testedOut ? 'Skipped by test' : 'Lesson mastery'}</span><span>{Math.round(st.score * 100)}% · unlocks next at 80%</span></div><Bar value={st.score} tone={unitMastered(st) ? 'ok' : 'brand'} /></div>}
      {!open && <Notice>This lesson is locked until the previous one reaches 80%. You can still read the notes.</Notice>}

      <section className="card space-y-2"><h2 className="font-bold">How it works</h2><p className="leading-relaxed whitespace-pre-line">{u.note}</p></section>

      <section className="card space-y-3">
        <h2 className="font-bold">Examples</h2>
        {u.examples.map((e) => (
          <div key={e.id} className="flex items-start gap-2 border-b border-line last:border-0 pb-2 last:pb-0">
            <div className="flex-1"><T lang={lang} block className="text-lg font-medium">{e.t}</T>{showRoman && e.r && <div className="text-sm text-muted italic">{e.r}</div>}<div className="text-sm text-muted">{e.en}</div></div>
            <SpeakBtn lang={lang} text={e.t} />
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Words</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {u.vocab.map((v) => <div key={v.id} className="flex items-baseline gap-2"><T lang={lang} className="font-semibold">{v.t}</T>{showRoman && v.r && <span className="text-xs text-muted italic">{v.r}</span>}<span className="text-sm text-muted ms-auto text-end">{v.en}</span></div>)}
        </div>
      </section>

      {u.dialogue && (
        <section className="card space-y-2">
          <h2 className="font-bold">Dialogue</h2>
          {u.dialogue.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="chip mt-1">{l.who}</span>
              <div className="flex-1"><T lang={lang} block>{l.t}</T>{showRoman && l.r && <div className="text-sm text-muted italic">{l.r}</div>}<div className="text-sm text-muted">{l.en}</div></div>
              <SpeakBtn lang={lang} text={l.t} />
            </div>
          ))}
        </section>
      )}
      {u.reading && <Link to={`/${lang}/read/${u.id}`} className="card block hover:border-brand"><div className="text-sm text-muted">Reading for this lesson</div><div className="font-semibold">{u.reading.title} →</div></Link>}

      {open && (
        <div className="sticky bottom-3 grid grid-cols-2 gap-2">
          <Link to={`/${lang}/run/unit:${u.id}`} className="btn-primary shadow-lg">{st?.attempts ? 'Practise again' : 'Start lesson'}</Link>
          {!unitMastered(st) ? <Link to={`/${lang}/run/test:${u.id}`} className="btn shadow-lg" title="Score 80% on 10 questions to skip this lesson">Test out (skip)</Link> : <Link to={`/${lang}`} className="btn shadow-lg">Back to path</Link>}
        </div>
      )}
    </Page>
  );
}
