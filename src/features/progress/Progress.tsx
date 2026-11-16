import { Bar as RBar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MASTERY_THRESHOLD } from '../../core/mastery/mastery';
import { reviewForecast } from '../../core/progress';
import { LEVELS } from '../../core/types';
import { useContent, useLang, useSnapshot } from '../../shared/hooks';
import { Bar, Loading, Page, QuietToggle, Stat, Tabs } from '../../shared/ui';
import { catLabel } from '../../../content/categories';

export function Progress() {
  const lang = useLang();
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  if (!c || !snap) return <Loading />;
  const cats = snap.mastery.filter((m) => m.attempts >= 2).sort((a, b) => a.score - b.score);
  const weak = cats.filter((m) => m.score < MASTERY_THRESHOLD).slice(0, 6);
  const strong = cats.filter((m) => m.score >= MASTERY_THRESHOLD).slice(-6).reverse();
  const fc = reviewForecast(snap, 7).map((n, i) => ({ day: i === 0 ? 'Today' : new Date(Date.now() + i * 86400000).toLocaleDateString(undefined, { weekday: 'short' }), n }));
  const mature = snap.cards.filter((x) => x.card.stability >= 21).length;
  const words = snap.cards.filter((x) => { const k = c.items.get(x.id)?.kind; return k === 'word' || k === 'vocab'; }).length;
  const chart = cats.map((m) => ({ name: catLabel(lang, m.cat), pct: Math.round(m.score * 100) }));
  return (
    <Page title="Progress" back="/" right={<QuietToggle />}>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Working level" value={LEVELS[snap.workingLevel]} />
        <Stat label="Exam passed" value={snap.certified >= 0 ? LEVELS[snap.certified] : '—'} />
        <Stat label="Day streak" value={`🔥 ${snap.streak}`} />
        <Stat label="Words known" value={words} />
        <Stat label="Items in memory" value={snap.cards.length} />
        <Stat label="Long-term (21d+)" value={mature} />
      </div>

      <section className="card space-y-3">
        <h2 className="font-bold">Needs work</h2>
        {!weak.length && <p className="text-sm text-muted">{cats.length ? 'Nothing below 80% — keep reviewing.' : 'Do a lesson or a session and your grammar categories will appear here.'}</p>}
        {weak.map((m) => <div key={m.cat}><div className="flex justify-between text-sm mb-1"><span className="font-medium">{catLabel(lang, m.cat)}</span><span className="text-muted">{Math.round(m.score * 100)}% · {m.attempts} answers</span></div><Bar value={m.score} tone={m.score < 0.5 ? 'bad' : 'warn'} /></div>)}
        {weak.length > 0 && <p className="text-xs text-muted">A quarter of every session targets these categories, and the tutor steers conversation toward them.</p>}
      </section>

      {strong.length > 0 && <section className="card space-y-3"><h2 className="font-bold">Strengths</h2>{strong.map((m) => <div key={m.cat}><div className="flex justify-between text-sm mb-1"><span className="font-medium">{catLabel(lang, m.cat)}</span><span className="text-muted">{Math.round(m.score * 100)}%</span></div><Bar value={m.score} tone="ok" /></div>)}</section>}

      {chart.length > 0 && (
        <section className="card">
          <h2 className="font-bold mb-2">All categories</h2>
          <div style={{ height: Math.max(160, chart.length * 26) }} role="img" aria-label="Mastery by grammatical category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--line)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" width={150} tick={{ fill: 'var(--ink)', fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'var(--brand-soft)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} />
                <RBar dataKey="pct" name="Mastery" radius={[0, 4, 4, 0]} isAnimationActive={false}>{chart.map((d, i) => <Cell key={i} fill={d.pct >= 80 ? 'var(--ok)' : d.pct >= 50 ? 'var(--warn)' : 'var(--bad)'} />)}</RBar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="font-bold mb-2">Review forecast</h2>
        <div className="h-36" role="img" aria-label="Cards due over the next seven days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fc} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'var(--brand-soft)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} />
              <RBar dataKey="n" name="Due" fill="var(--brand)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted mt-1">Every item stays in rotation for good — intervals just grow as memory strengthens.</p>
      </section>
      <Tabs lang={lang} active="progress" />
    </Page>
  );
}
