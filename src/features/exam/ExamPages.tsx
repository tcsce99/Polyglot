import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { buildExam, type AiTask, type ExamSection } from '../../core/exam/build';
import { PASS_FLOOR, PASS_OVERALL, scoreExam, SECTION_LABEL, type SectionResult } from '../../core/exam/exam';
import { LANGS } from '../../core/langs';
import { placeAt, recordResults, recordTutorErrors, saveExam } from '../../core/progress';
import { sttMode } from '../../core/speech/speech';
import { useStore } from '../../core/store';
import { gradeAnswer, tutorReady } from '../../core/tutor/client';
import type { Grade } from '../../core/tutor/contract';
import { LEVELS, type Level, type Result } from '../../core/types';
import { useContent, useExerciseOpts, useLang, useOnline, useSnapshot } from '../../shared/hooks';
import { Bar, Loading, Notice, Page, QuietToggle, T, Tabs } from '../../shared/ui';
import { Runner } from '../lessons/Runner';
import { MicButton } from '../pronunciation/SpeakCheck';
import { catLabel } from '../../../content/categories';

export function ExamHub() {
  const lang = useLang();
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  if (!c || !snap) return <Loading />;
  return (
    <Page title="Exams" back="/" right={<QuietToggle />}>
      <div className="card space-y-2">
        <h2 className="font-bold">Check your level against the CEFR scale</h2>
        <p className="text-sm text-muted">The international standard is the <b>CEFR</b> (Common European Framework of Reference): A1, A2, B1, B2, C1, C2. These mock exams follow its format — vocabulary, grammar, reading, writing, listening and speaking — with a 70% pass mark and a 50% floor per skill. Passing a level also skips its lessons.</p>
        <p className="text-sm text-muted"><b>Official {LANGS[lang].name} certification:</b> {LANGS[lang].officialExams} The result here is a practice estimate, not a certificate.</p>
      </div>
      <Link to={`/${lang}/placement`} className="card flex items-center gap-3 hover:border-brand"><span className="text-2xl">🧭</span><span className="flex-1"><span className="block font-semibold">Placement test</span><span className="block text-sm text-muted">Adaptive, about 5 minutes, silent. Finds where you belong.</span></span>{snap.placed !== undefined && <span className="chip">Placed {snap.placed > 4 ? 'C1+' : LEVELS[snap.placed]}</span>}</Link>
      <div className="space-y-2">
        {LEVELS.map((lv, i) => {
          const tries = snap.exams.filter((e) => e.kind === 'exam' && e.level === lv);
          const best = tries.length ? Math.max(...tries.map((e) => e.score)) : null;
          const passed = tries.some((e) => e.passed);
          return (
            <Link key={lv} to={`/${lang}/exam/${lv}`} className="card !p-3 flex items-center gap-3 hover:border-brand">
              <span className={`w-11 h-11 rounded-full grid place-items-center font-bold ${passed ? 'bg-ok-soft text-ok' : 'bg-brand-soft text-brand'}`}>{lv}</span>
              <span className="flex-1"><span className="block font-semibold">{lv} exam</span><span className="block text-xs text-muted">{['Breakthrough', 'Waystage', 'Threshold', 'Vantage', 'Advanced', 'Mastery'][i]}{lv === 'C2' ? ' · vocabulary and tasks at C2; grammar drawn from C1' : ''}</span></span>
              <span className="text-sm text-muted">{passed ? 'Passed' : best !== null ? `Best ${Math.round(best * 100)}%` : 'Not taken'}</span>
            </Link>
          );
        })}
      </div>
      {snap.exams.length > 0 && (
        <div className="card"><h2 className="font-bold mb-2">History</h2>
          {snap.exams.slice(0, 8).map((e) => <div key={e.id} className="flex justify-between text-sm py-1 border-b border-line last:border-0"><span>{e.kind === 'placement' ? `Placement → ${e.level}` : `${e.level} exam`}</span><span className="text-muted">{new Date(e.ts).toLocaleDateString()} · {Math.round(e.score * 100)}%{e.kind === 'exam' ? (e.passed ? ' · passed' : ' · not passed') : ''}</span></div>)}
        </div>
      )}
      <Tabs lang={lang} active="exam" />
    </Page>
  );
}

function TaskView({ task, level, onDone }: { task: AiTask; level: number; onDone: (g: Grade | null) => void }) {
  const lang = useLang();
  const { proxyUrl, proxyToken } = useStore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  const submit = async () => {
    setBusy(true); setErr('');
    try { setGrade(await gradeAnswer({ url: proxyUrl, token: proxyToken }, { lang, level, mode: task.mode, task: task.prompt, answer: text })); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  if (grade) {
    return (
      <div className="space-y-3">
        <div className="card space-y-2">
          <div className="flex justify-between"><span className="font-bold">Examiner’s mark</span><span className="font-bold">{Math.round(grade.score * 100)}% · shows {grade.cefr || '—'}</span></div>
          <p>{grade.feedback}</p>
          {grade.corrected_text && <><div className="text-sm text-muted">Corrected version</div><T lang={lang} block>{grade.corrected_text}</T></>}
          {grade.errors.map((e, i) => <div key={i} className="text-sm border-t border-line pt-2"><T lang={lang} className="text-bad line-through">{e.span}</T> → <T lang={lang} className="text-ok font-semibold">{e.correction}</T> <span className="chip ms-1">{catLabel(lang, e.category_id)}</span><div className="text-muted">{e.explanation}</div></div>)}
        </div>
        <button className="btn-primary w-full" onClick={() => onDone(grade)}>Continue</button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="card"><div className="text-sm text-muted">{task.mode === 'writing' ? 'Writing task' : 'Speaking task — answer aloud, then check the transcript'}</div><p className="font-medium">{task.prompt}</p></div>
      {task.mode === 'speaking' && <MicButton lang={lang} label="Record answer" onText={(t) => setText((p) => (p ? p + ' ' : '') + t)} onError={setErr} />}
      <textarea className={`input min-h-[9rem] tl-${lang}`} dir="auto" lang={lang} value={text} onChange={(e) => setText(e.target.value)} placeholder={task.mode === 'writing' ? `Write in ${LANGS[lang].name}…` : 'Your spoken answer appears here'} aria-label="Your answer" />
      {err && <Notice tone="bad">{err}</Notice>}
      <div className="flex gap-2 items-center"><span className="text-sm text-muted flex-1">{count} words{count < task.minWords ? ` · aim for at least ${task.minWords}` : ''}</span>
        <button className="btn" onClick={() => onDone(null)}>Skip task</button>
        <button className="btn-primary" disabled={busy || count < 3} onClick={submit}>{busy ? 'Marking…' : 'Submit'}</button></div>
    </div>
  );
}

export function ExamRun() {
  const lang = useLang();
  const { level = 'A1' } = useParams();
  const li = Math.max(0, LEVELS.indexOf(level as Level));
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  const opts = useExerciseOpts(lang);
  const online = useOnline();
  const { quiet, proxyUrl, proxyToken, bump } = useStore();
  const [started, setStarted] = useState(false);
  const [si, setSi] = useState(0);
  const [phase, setPhase] = useState<'items' | 'task'>('items');
  const [final, setFinal] = useState<SectionResult[] | null>(null);
  const scores = useRef<SectionResult[]>([]);
  const all = useRef<Result[]>([]);
  const partial = useRef<number | null>(null);
  const caps = { quiet, canListen: opts.canListen, canSpeak: sttMode(lang, !!proxyUrl) !== 'none', tutor: online && tutorReady({ url: proxyUrl, token: proxyToken }) };
  const sections = useMemo<ExamSection[] | null>(() => (c && started ? buildExam(c, li, opts, caps) : null), [c, started]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c || !snap) return <Loading />;

  if (!started) {
    return (
      <Page title={`${level} exam`} back={`/${lang}/exam`} right={<QuietToggle />}>
        <div className="card space-y-3">
          <p>Six sections, about 20–30 minutes. No feedback until the end, like the real thing. Pass mark {PASS_OVERALL * 100}% overall with at least {PASS_FLOOR * 100}% in each section taken.</p>
          <ul className="text-sm space-y-1">
            <li>✓ Vocabulary, grammar, reading — always included</li>
            <li>{caps.tutor ? '✓' : '○'} Writing essay and open speaking task, marked by the AI examiner{caps.tutor ? '' : ' — unavailable (offline or tutor not set up); writing is tested with sentence building only'}</li>
            <li>{!quiet && caps.canListen ? '✓' : '○'} Listening{quiet ? ' — skipped: quiet mode is on' : caps.canListen ? '' : ' — skipped: this device has no ' + LANGS[lang].name + ' voice'}</li>
            <li>{!quiet && caps.canSpeak ? '✓' : '○'} Speaking{quiet ? ' — skipped: quiet mode is on' : caps.canSpeak ? '' : ' — skipped: speech recognition unavailable'}</li>
          </ul>
          {(quiet || !caps.canListen || !caps.canSpeak || !caps.tutor) && <Notice>Skipped sections are reported as “not assessed”. For a full six-skill result, take the exam online with quiet mode off.</Notice>}
          <button className="btn-primary w-full" onClick={() => setStarted(true)}>Begin exam</button>
        </div>
      </Page>
    );
  }
  if (!sections) return <Loading />;

  // Sections with nothing to run (quiet mode, no voice, no microphone) are reported as "not assessed".
  const runnable = sections.filter((s) => s.exercises.length || s.task);
  const conclude = async (taken: SectionResult[]) => {
    const res = sections.map((s): SectionResult => taken.find((t) => t.id === s.id) ?? { id: s.id, score: null, note: s.skipped });
    const out = scoreExam(res);
    await recordResults(lang, all.current, { kind: 'exam', schedule: false });
    await saveExam({ lang, ts: Date.now(), kind: 'exam', level, score: out.overall, passed: out.passed, sections: res });
    if (out.passed) await placeAt(lang, Math.min(li + 1, 5), c);
    bump();
    setFinal(res);
  };
  const closeSection = (score: number | null, note?: string) => {
    scores.current = [...scores.current, { id: runnable[si].id, score, note }];
    partial.current = null;
    if (si + 1 >= runnable.length) void conclude(scores.current); else { setSi(si + 1); setPhase('items'); }
  };

  if (final) {
    const out = scoreExam(final);
    return (
      <Page title={`${level} exam result`} back={`/${lang}/exam`}>
        <div className="card text-center space-y-2 py-8">
          <div className="text-5xl font-bold">{Math.round(out.overall * 100)}%</div>
          <div className={`text-lg font-bold ${out.passed ? 'text-ok' : 'text-bad'}`}>{out.passed ? `Passed ${level}` : 'Not passed yet'}</div>
          {out.passed && <p className="text-muted">All lessons up to {level} are now marked as known and move to long-term review.</p>}
          {!out.complete && <p className="text-sm text-warn">Partial result: {out.skipped.map((s) => SECTION_LABEL[s]).join(', ')} not assessed.</p>}
        </div>
        <div className="card space-y-3">
          {final.map((s) => <div key={s.id}><div className="flex justify-between gap-3 text-sm mb-1"><span className="font-semibold">{SECTION_LABEL[s.id]}</span><span className="text-muted">{s.score === null ? `not assessed${s.note ? ' — ' + s.note : ''}` : Math.round(s.score * 100) + '%'}</span></div>{s.score !== null && <Bar value={s.score} tone={s.score >= PASS_OVERALL ? 'ok' : s.score >= PASS_FLOOR ? 'warn' : 'bad'} />}</div>)}
        </div>
        <Link className="btn-primary w-full" to={`/${lang}`}>Back to learning</Link>
      </Page>
    );
  }

  const sec = runnable[si];
  return (
    <Page title={`${level} exam · ${SECTION_LABEL[sec.id]} (${si + 1}/${runnable.length})`}>
      {phase === 'items' && sec.exercises.length > 0 ? (
        <Runner key={si} lang={lang} exercises={sec.exercises} exam={sec.id !== 'speaking'} onFinish={(results) => {
          all.current.push(...results);
          const score = results.length ? results.filter((r) => r.correct).length / results.length : null;
          if (sec.task) { partial.current = score; setPhase('task'); } else closeSection(score);
        }} />
      ) : (
        <TaskView key={`t${si}`} task={sec.task!} level={li} onDone={(g) => {
          if (g) void recordTutorErrors(lang, g.errors.map((e) => e.category_id));
          const p = partial.current;
          closeSection(g ? (p === null ? g.score : 0.4 * p + 0.6 * g.score) : p, g ? undefined : 'open task skipped');
        }} />
      )}
    </Page>
  );
}
