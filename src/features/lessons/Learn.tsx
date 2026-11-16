import { Link, useNavigate } from 'react-router-dom';
import { LANGS } from '../../core/langs';
import { LEVELS } from '../../core/types';
import { unitMastered } from '../../core/mastery/mastery';
import { isUnlocked, placeAt } from '../../core/progress';
import { useStore } from '../../core/store';
import { useContent, useLang, useSnapshot } from '../../shared/hooks';
import { Bar, Loading, Notice, Page, QuietToggle, Tabs } from '../../shared/ui';
import { catLabel } from '../../../content/categories';

export function Learn() {
  const lang = useLang();
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  const nav = useNavigate();
  const bump = useStore((s) => s.bump);
  if (!c || !snap) return <Loading />;
  const meta = LANGS[lang];

  if (!snap.started) {
    return (
      <Page title={<>{meta.flag} {meta.name}</>} back="/" right={<QuietToggle />}>
        <div className="card space-y-3">
          <h2 className="text-xl font-bold">Where should you start?</h2>
          <p className="text-muted">Take a short adaptive placement test (about 5 minutes, no speaking needed). Everything below your level is marked as known and moved into long-term review, so you skip straight to what is new.</p>
          <Link to={`/${lang}/placement`} className="btn-primary w-full">Take the placement test</Link>
          <button className="btn w-full" onClick={async () => { await placeAt(lang, 0, c); bump(); }}>I’m a complete beginner — start at A1</button>
        </div>
        <Tabs lang={lang} active="" />
      </Page>
    );
  }

  const next = c.course.units.find((u) => isUnlocked(u, snap) && !unitMastered(snap.units[u.id]));
  return (
    <Page title={<>{meta.flag} {meta.name}</>} back="/" right={<QuietToggle />}>
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div><div className="text-sm text-muted">Working at</div><div className="text-2xl font-bold">{LEVELS[snap.workingLevel]}</div></div>
          <div className="text-end text-sm text-muted"><div>🔥 {snap.streak}-day streak</div><div>{snap.cards.length} items in memory</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => nav(`/${lang}/run/session`)}>Today’s session</button>
          <button className="btn" disabled={!snap.dueCount} onClick={() => nav(`/${lang}/run/review`)}>Review · {snap.dueCount} due</button>
        </div>
        {next && <Link to={`/${lang}/unit/${next.id}`} className="block text-sm text-brand font-semibold">Next lesson: {next.title} →</Link>}
        {snap.lastAccuracy !== undefined && snap.lastAccuracy < 0.6 && <Notice>Your last session was tough, so new material is paused and the next session focuses on review and weak spots.</Notice>}
      </div>

      {LEVELS.slice(0, 5).map((lv, li) => {
        const units = c.course.units.filter((u) => u.level === lv);
        if (!units.length) return null;
        const done = units.filter((u) => unitMastered(snap.units[u.id])).length;
        return (
          <section key={lv} className="space-y-2">
            <div className="flex items-center gap-3 pt-2">
              <h2 className="text-lg font-bold">{lv}</h2>
              <div className="flex-1"><Bar value={done / units.length} tone={done === units.length ? 'ok' : 'brand'} /></div>
              <span className="text-sm text-muted">{done}/{units.length}</span>
              {done < units.length && <Link to={`/${lang}/exam/${lv}`} className="chip" title={`Pass the ${lv} exam to skip this level`}>Skip with exam</Link>}
              {snap.certified >= li && <span className="chip !bg-ok-soft !text-ok">Exam passed</span>}
            </div>
            {units.map((u) => {
              const st = snap.units[u.id];
              const mastered = unitMastered(st), open = isUnlocked(u, snap);
              return (
                <Link key={u.id} data-unit={u.id} to={open ? `/${lang}/unit/${u.id}` : '#'} aria-disabled={!open}
                  className={`card !p-3 flex items-center gap-3 ${open ? 'hover:border-brand' : 'opacity-55 pointer-events-none'}`}>
                  <span className={`w-9 h-9 shrink-0 rounded-full grid place-items-center text-sm font-bold ${mastered ? 'bg-ok-soft text-ok' : open ? 'bg-brand-soft text-brand' : 'bg-line text-muted'}`} aria-hidden>{mastered ? '✓' : open ? '▶' : '🔒'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{u.title}</span>
                    <span className="block text-xs text-muted truncate">{u.cats.map((x) => catLabel(lang, x)).join(' · ')}</span>
                  </span>
                  <span className="text-xs text-muted shrink-0">{st?.testedOut ? 'Skipped' : st ? `${Math.round(st.score * 100)}%` : open ? 'New' : 'Locked'}</span>
                </Link>
              );
            })}
          </section>
        );
      })}
      <p className="text-xs text-muted">A lesson unlocks when the one before it reaches 80% mastery — or skip ahead any time by testing out of a lesson or passing a level exam.</p>
      <Tabs lang={lang} active="" />
    </Page>
  );
}
