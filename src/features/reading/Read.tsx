import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { readingQuestion } from '../../core/exercises';
import { unitMastered } from '../../core/mastery/mastery';
import { isUnlocked, recordResults } from '../../core/progress';
import { useStore } from '../../core/store';
import { generateReading, tutorReady, type GeneratedReading } from '../../core/tutor/client';
import { LEVELS, type Question, type Result } from '../../core/types';
import { useContent, useLang, useOnline, useSnapshot } from '../../shared/hooks';
import { Loading, Notice, Page, QuietToggle, SpeakBtn, T, Tabs } from '../../shared/ui';
import { Runner } from '../lessons/Runner';

/** Reading hub — everything here works silently, so it is the home of quiet mode. */
export function ReadHub() {
  const lang = useLang();
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  const online = useOnline();
  const { proxyUrl, proxyToken } = useStore();
  const [topic, setTopic] = useState('');
  const [gen, setGen] = useState<GeneratedReading | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!c || !snap) return <Loading />;
  if (gen) return <Passage lang={lang} title={gen.title} text={gen.text} en={gen.translation} glossary={gen.glossary} qs={gen.questions} id={`gen${gen.title.length}`} onBack={() => setGen(null)} />;
  const texts = c.course.units.filter((u) => (u.reading || u.dialogue) && (isUnlocked(u, snap) || unitMastered(snap.units[u.id])));
  const ready = online && tutorReady({ url: proxyUrl, token: proxyToken });
  return (
    <Page title="Read" back="/" right={<QuietToggle />}>
      <Notice tone="brand">Everything on this tab is silent — reading and vocabulary only. Good for meetings, class and transit.</Notice>
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/${lang}/run/sentences`} className="card hover:border-brand"><div className="text-2xl">📝</div><div className="font-semibold">Sentence reading</div><div className="text-sm text-muted">New real sentences at {LEVELS[snap.workingLevel]}; read, recall, rate.</div></Link>
        <Link to={`/${lang}/run/review`} className="card hover:border-brand"><div className="text-2xl">🗂️</div><div className="font-semibold">Vocabulary review</div><div className="text-sm text-muted">{snap.dueCount} cards due now.</div></Link>
      </div>
      <div className="card space-y-2">
        <h2 className="font-bold">A fresh text at your level</h2>
        <p className="text-sm text-muted">The AI tutor writes a short {LEVELS[snap.workingLevel]} text with a glossary and questions.</p>
        <div className="flex gap-2"><input className="input" placeholder="Topic (optional): food, football, history…" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={!ready || busy} onClick={async () => { setBusy(true); setErr(''); try { setGen(await generateReading({ url: proxyUrl, token: proxyToken }, { lang, level: snap.workingLevel, topic })); } catch (e) { setErr((e as Error).message); } setBusy(false); }}>{busy ? 'Writing…' : 'Write it'}</button></div>
        {!ready && <p className="text-sm text-muted">{online ? 'Set up the AI tutor in Settings to use this.' : 'Offline — the built-in texts below still work.'}</p>}
        {err && <Notice tone="bad">{err}</Notice>}
      </div>
      <section className="space-y-2">
        <h2 className="font-bold">Course texts</h2>
        {!texts.length && <p className="text-sm text-muted">Texts appear here as you unlock lessons.</p>}
        {texts.map((u) => <Link key={u.id} to={`/${lang}/read/${u.id}`} className="card !p-3 flex items-center gap-3 hover:border-brand"><span className="chip">{u.level}</span><span className="flex-1 font-medium truncate">{u.reading?.title ?? `Dialogue: ${u.title}`}</span><span className="text-xs text-muted">{u.reading ? 'Reading' : 'Dialogue'}</span></Link>)}
      </section>
      <Tabs lang={lang} active="read" />
    </Page>
  );
}

export function ReadUnit() {
  const lang = useLang();
  const { unitId = '' } = useParams();
  const c = useContent(lang);
  if (!c) return <Loading />;
  const u = c.units.get(unitId);
  if (!u) return <Page title="Not found" back={`/${lang}/read`}>No such text.</Page>;
  if (u.reading) return <Passage lang={lang} title={u.reading.title} text={u.reading.text} en={u.reading.en} qs={u.reading.qs} id={u.id} />;
  return (
    <Page title={u.title} back={`/${lang}/read`} right={<QuietToggle />}>
      <div className="card space-y-3">{(u.dialogue ?? []).map((l, i) => <Reveal key={i} lang={lang} who={l.who} t={l.t} r={l.r} en={l.en} />)}</div>
      <p className="text-sm text-muted">Tap a line to show or hide its translation.</p>
    </Page>
  );
}

function Reveal({ lang, who, t, r, en }: { lang: ReturnType<typeof useLang>; who?: string; t: string; r?: string; en: string }) {
  const [open, setOpen] = useState(false);
  const showRoman = useStore((s) => s.showRoman);
  return (
    <div className="flex items-start gap-2">
      {who && <span className="chip mt-1">{who}</span>}
      <button type="button" className="flex-1 text-start" onClick={() => setOpen(!open)} aria-expanded={open}>
        <T lang={lang} block className="text-lg">{t}</T>
        {open && showRoman && r && <div className="text-sm text-muted italic">{r}</div>}
        {open && <div className="text-sm text-muted">{en}</div>}
      </button>
      <SpeakBtn lang={lang} text={t} />
    </div>
  );
}

function Passage({ lang, title, text, en, glossary, qs, id, onBack }: { lang: ReturnType<typeof useLang>; title: string; text: string; en?: string; glossary?: { word: string; meaning: string }[]; qs: Question[]; id: string; onBack?: () => void }) {
  const bump = useStore((s) => s.bump);
  const [showEn, setShowEn] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [score, setScore] = useState<string | null>(null);
  const exercises = useMemo(() => qs.map((q, i) => readingQuestion(q, `${lang}/${id}:r${i}`)), [qs, lang, id]);
  return (
    <Page title={title} back={onBack ? undefined : `/${lang}/read`} right={onBack ? <button className="btn" onClick={onBack}>Close</button> : <QuietToggle />}>
      {!quiz ? (
        <>
          <div className="card"><div className="flex justify-end"><SpeakBtn lang={lang} text={text} /></div><T lang={lang} block className="text-lg whitespace-pre-line leading-loose">{text}</T></div>
          {glossary && glossary.length > 0 && <div className="card"><h2 className="font-bold mb-1">Glossary</h2>{glossary.map((g, i) => <div key={i} className="flex gap-3 text-sm py-0.5"><T lang={lang} className="font-semibold">{g.word}</T><span className="text-muted">{g.meaning}</span></div>)}</div>}
          {en && <button className="btn w-full" onClick={() => setShowEn(!showEn)}>{showEn ? 'Hide' : 'Show'} English translation</button>}
          {en && showEn && <div className="card text-muted whitespace-pre-line">{en}</div>}
          {score && <Notice tone="ok">Comprehension: {score}</Notice>}
          {exercises.length > 0 && <button className="btn-primary w-full" onClick={() => { setQuiz(true); setShowEn(false); }}>Answer {exercises.length} questions</button>}
        </>
      ) : (
        <Runner lang={lang} exercises={exercises.map((e) => (e.kind === 'mcq' ? { ...e, passage: { title, text } } : e))} onQuit={() => setQuiz(false)} onFinish={async (results: Result[], seconds) => {
          await recordResults(lang, results, { kind: 'reading', seconds, schedule: false });
          bump(); setScore(`${results.filter((r) => r.correct).length}/${results.length}`); setQuiz(false);
        }} />
      )}
    </Page>
  );
}
