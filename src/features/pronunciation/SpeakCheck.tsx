import { useRef, useState } from 'react';
import { listen, sttMode, type Listening } from '../../core/speech/speech';
import { scorePronunciation, type PronScore } from '../../core/text';
import { useStore } from '../../core/store';
import type { LangId } from '../../core/types';
import { T } from '../../shared/ui';

/** Mic button → transcript. Used for pronunciation checks and for speaking to the tutor. */
export function MicButton({ lang, onText, onError, label = 'Speak' }: { lang: LangId; onText: (t: string) => void; onError?: (m: string) => void; label?: string }) {
  const { proxyUrl, proxyToken } = useStore();
  const [state, setState] = useState<'idle' | 'listening' | 'working'>('idle');
  const session = useRef<Listening | null>(null);
  const mode = sttMode(lang, !!proxyUrl);
  if (mode === 'none') return null;
  const toggle = async () => {
    if (state === 'listening') { setState('working'); session.current?.stop(); return; }
    if (state !== 'idle') return;
    setState('listening');
    try {
      session.current = listen(lang, mode, { url: proxyUrl, token: proxyToken });
      const text = await session.current.result;
      if (text) onText(text); else onError?.('Nothing was heard. Try again a little louder.');
    } catch (e) { onError?.((e as Error).message); }
    setState('idle');
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={state === 'listening'}
      className={`btn ${state === 'listening' ? 'bg-bad-soft border-bad text-bad animate-pulse' : 'btn-primary'}`}>
      {state === 'listening' ? '■ Stop' : state === 'working' ? '…' : `🎤 ${label}`}
    </button>
  );
}

export const SPEAK_PASS = 0.7;

/** Shadowing loop (METHODS §5): read the phrase aloud, get a word-by-word score. */
export function SpeakCheck({ lang, text, onScore }: { lang: LangId; text: string; onScore: (s: PronScore, heard: string) => void }) {
  const [res, setRes] = useState<{ score: PronScore; heard: string } | null>(null);
  const [err, setErr] = useState('');
  return (
    <div className="space-y-3">
      {res && (
        <div className="card space-y-2" aria-live="polite">
          <div className="text-sm text-muted">Word by word — {Math.round(res.score.score * 100)}%</div>
          <T lang={lang} block className="text-lg">
            {res.score.words.map((w, i) => <span key={i} className={w.ok ? 'text-ok' : 'text-bad underline decoration-dotted'}>{w.word} </span>)}
          </T>
          <div className="text-sm text-muted">Heard: <T lang={lang}>{res.heard}</T></div>
        </div>
      )}
      {err && <div className="text-sm text-bad" role="alert">{err}</div>}
      <MicButton lang={lang} label={res ? 'Try again' : 'Speak'} onError={setErr}
        onText={(heard) => { setErr(''); const score = scorePronunciation(text, heard, lang); setRes({ score, heard }); onScore(score, heard); }} />
    </div>
  );
}
