import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LANGS } from '../../core/langs';
import { weakest } from '../../core/mastery/mastery';
import { knownWords, recordTutorErrors } from '../../core/progress';
import { canListen, speak, sttMode, stopSpeaking } from '../../core/speech/speech';
import { useStore } from '../../core/store';
import { chatTurn, tutorReady, type ChatMsg } from '../../core/tutor/client';
import type { TutorTurn } from '../../core/tutor/contract';
import { LEVELS } from '../../core/types';
import { useContent, useLang, useOnline, useSnapshot } from '../../shared/hooks';
import { Loading, Notice, Page, QuietToggle, SpeakBtn, T, Tabs } from '../../shared/ui';
import { MicButton } from '../pronunciation/SpeakCheck';
import { catLabel } from '../../../content/categories';
import { SCENARIOS, type Scenario } from '../../../content/scenarios';

interface Bubble { role: 'learner' | 'tutor'; text: string; turn?: TutorTurn; spoken?: boolean }

export function Tutor() {
  const lang = useLang();
  const c = useContent(lang);
  const snap = useSnapshot(lang, c);
  const online = useOnline();
  const { quiet, proxyUrl, proxyToken, bump } = useStore();
  const [scenario, setScenario] = useState<Scenario | null | undefined>(undefined); // undefined = picker, null = free chat
  const [msgs, setMsgs] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);
  useEffect(() => () => stopSpeaking(), []);
  if (!c || !snap) return <Loading />;
  const proxy = { url: proxyUrl, token: proxyToken };
  const ready = online && tutorReady(proxy);
  const level = snap.workingLevel;
  const micOk = !quiet && sttMode(lang, !!proxyUrl) !== 'none';

  const send = async (text: string, spoken = false, history: Bubble[] = msgs, sc: Scenario | null | undefined = scenario) => {
    const message = text.trim();
    const next = message ? [...history, { role: 'learner' as const, text: message, spoken }] : history;
    setMsgs(next); setInput(''); setBusy(true); setErr('');
    try {
      const weak = weakest(snap.mastery, 3, 3);
      const turn = await chatTurn(proxy, { lang, level, message, history: history.map((m): ChatMsg => ({ role: m.role, text: m.text })), scenario: sc ? `${sc.brief} Learner's goal: ${sc.goal}` : undefined, weak: weak.map((x) => catLabel(lang, x)), known: knownWords(c, snap) });
      const withCorr = message ? next.map((m, i) => (i === next.length - 1 ? { ...m, turn } : m)) : next;
      setMsgs([...withCorr, { role: 'tutor', text: turn.reply, turn }]);
      if (message) { await recordTutorErrors(lang, turn.errors.map((e) => e.category_id), turn.errors.length ? [] : weak); bump(); }
      if (!quiet && canListen(lang)) speak(turn.reply, lang);
    } catch (e) { setErr((e as Error).message); setMsgs(history); setInput(message); }
    setBusy(false);
  };

  if (scenario === undefined) {
    return (
      <Page title="AI tutor" back="/" right={<QuietToggle />}>
        {!ready && <Notice>{!online ? 'You are offline. The AI tutor needs a connection — lessons, review, reading and the pronunciation drill below still work.' : <>The AI tutor is not connected yet. Add your tutor proxy URL in <Link className="underline font-semibold" to="/settings">Settings</Link> (a five-minute, one-time setup).</>}</Notice>}
        {quiet && <Notice tone="brand">Quiet mode: the tutor works by text only — it will not speak or listen.</Notice>}
        {!quiet && !LANGS[lang].browserStt && <Notice tone="brand">Browsers cannot recognise spoken {LANGS[lang].name}, so your speech is transcribed by the tutor service instead.{canListen(lang) ? '' : ` This device also has no ${LANGS[lang].name} voice, so replies are shown as text.`}</Notice>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" disabled={!ready} onClick={() => { setScenario(null); setMsgs([]); void send('', false, [], null); }}>💬 Free conversation</button>
          <Link className={`btn ${quiet || sttMode(lang, !!proxyUrl) === 'none' ? 'opacity-50 pointer-events-none' : ''}`} to={`/${lang}/run/speak`}>🎤 Pronunciation drill</Link>
        </div>
        <p className="text-sm text-muted">Speak or type. The tutor answers at {LEVELS[level]}, corrects every message with a plain-English explanation, and steers the talk toward your weak spots. Corrections feed your progress chart.</p>
        <h2 className="font-bold pt-2">Role-plays</h2>
        <div className="space-y-2">
          {SCENARIOS.map((s) => {
            const open = s.level <= level + 1;
            return <button key={s.id} disabled={!ready || !open} className="card !p-3 w-full text-start flex items-center gap-3 disabled:opacity-50" onClick={() => { setScenario(s); setMsgs([]); void send('', false, [], s); }}>
              <span className="chip">{LEVELS[s.level]}</span><span className="flex-1"><span className="block font-semibold">{s.title}</span><span className="block text-xs text-muted">{s.goal}</span></span>{!open && <span aria-label="Locked">🔒</span>}</button>;
          })}
        </div>
        <Tabs lang={lang} active="tutor" />
      </Page>
    );
  }

  return (
    <Page title={scenario ? scenario.title : 'Free conversation'} right={<><QuietToggle /><button className="btn" onClick={() => { stopSpeaking(); setScenario(undefined); }}>End</button></>}>
      {scenario && <p className="text-sm text-muted">Goal: {scenario.goal}</p>}
      <div className="space-y-3" aria-live="polite">
        {msgs.map((m, i) => m.role === 'tutor' ? (
          <div key={i} className="card !p-3 me-8">
            <div className="flex items-start gap-2"><T lang={lang} block className="flex-1 text-lg">{m.text}</T><SpeakBtn lang={lang} text={m.text} /></div>
            {m.turn?.reply_translation && <button className="text-xs text-brand font-semibold" onClick={() => setShown({ ...shown, [i]: !shown[i] })}>{shown[i] ? m.turn.reply_translation : 'Show translation'}</button>}
          </div>
        ) : (
          <div key={i} className="ms-8 space-y-1">
            <div className="rounded-2xl bg-brand-soft p-3"><T lang={lang} block className="text-lg">{m.text}</T>{m.spoken && <div className="text-xs text-muted">🎤 as heard</div>}</div>
            {m.turn && (m.turn.errors.length === 0 ? <div className="text-xs text-ok font-semibold px-1">✓ No mistakes</div> : (
              <div className="card !p-3 space-y-2 border-warn">
                {m.turn.corrected_text && <div><div className="text-xs text-muted">Corrected</div><T lang={lang} block className="font-semibold">{m.turn.corrected_text}</T></div>}
                {m.turn.errors.map((e, k) => <div key={k} className="text-sm"><T lang={lang} className="text-bad line-through">{e.span}</T> → <T lang={lang} className="text-ok font-semibold">{e.correction}</T> <span className="chip ms-1">{catLabel(lang, e.category_id)}</span><div className="text-muted">{e.explanation}</div></div>)}
              </div>
            ))}
          </div>
        ))}
        {busy && <div className="text-muted text-sm">Tutor is thinking…</div>}
        {err && <Notice tone="bad">{err}</Notice>}
        <div ref={end} />
      </div>
      <form className="fixed bottom-0 inset-x-0 bg-surface border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); if (input.trim() && !busy) void send(input); }}>
        <div className="mx-auto max-w-2xl flex gap-2">
          {micOk && <MicButton lang={lang} label="" onText={(t) => void send(t, true)} onError={setErr} />}
          <input className={`input tl-${lang}`} dir="auto" lang={lang} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Write in ${LANGS[lang].name}…`} aria-label="Message" />
          <button className="btn-primary" disabled={busy || !input.trim()}>Send</button>
        </div>
      </form>
    </Page>
  );
}
