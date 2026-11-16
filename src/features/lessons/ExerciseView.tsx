import { useEffect, useRef, useState } from 'react';
import type { Exercise, LangId } from '../../core/types';
import { checkAnswer, type Verdict } from '../../core/text';
import { checkReorder } from '../../core/exercises';
import { speak } from '../../core/speech/speech';
import { useStore } from '../../core/store';
import { LANGS } from '../../core/langs';
import { SpeakBtn, T } from '../../shared/ui';
import { SpeakCheck, SPEAK_PASS } from '../pronunciation/SpeakCheck';

export interface Outcome { correct: boolean; rating?: 1 | 2 | 3 | 4; skipped?: boolean }
interface Props { ex: Exercise; lang: LangId; exam?: boolean; onDone: (o: Outcome) => void }

/** Renders one exercise, gives immediate specific feedback (unless in exam mode), then reports the outcome. */
export function ExerciseView({ ex, lang, exam, onDone: report }: Props) {
  // An exercise reports exactly once, even if a button is double-tapped before the next one renders.
  const sent = useRef(false);
  const onDone = (o: Outcome) => { if (sent.current) return; sent.current = true; report(o); };
  const quiet = useStore((s) => s.quiet);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [order, setOrder] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [verdict, setVerdict] = useState<{ correct: boolean; note?: string } | null>(null);
  const [spoken, setSpoken] = useState<number | null>(null);

  useEffect(() => { if (ex.kind === 'listen' && !quiet) speak(ex.text, lang); }, [ex, lang, quiet]);

  const finish = (correct: boolean, note?: string) => { if (exam) onDone({ correct }); else setVerdict({ correct, note }); };
  const answerText = ex.kind === 'cloze' || ex.kind === 'reorder' ? ex.full : ex.kind === 'speak' || ex.kind === 'listen' ? ex.text : '';
  const answered = verdict !== null;

  const submitTyped = () => {
    if (ex.kind !== 'cloze') return;
    const v: Verdict = checkAnswer(typed, ex.answer, lang);
    finish(v !== 'wrong', v === 'accent' ? `Watch the accents: ${ex.answer}` : v === 'typo' ? `Small typo — it is “${ex.answer}”` : undefined);
  };

  let body;
  if (ex.kind === 'mcq' || ex.kind === 'listen') {
    const options = ex.options;
    const optTarget = ex.kind === 'mcq' && ex.optionsAreTarget;
    body = (
      <>
        {ex.kind === 'mcq' ? (
          <>
            {ex.passage && <div className="card max-h-64 overflow-auto"><div className="font-semibold mb-1">{ex.passage.title}</div><T lang={lang} block className="whitespace-pre-line">{ex.passage.text}</T></div>}
            <p className="text-sm text-muted">{ex.instruction}</p>
            <div className="flex items-center gap-2">
              {ex.promptIsTarget ? <T lang={lang} block className="text-2xl font-semibold flex-1">{ex.prompt}</T> : <div className="text-xl font-semibold flex-1">{ex.prompt}</div>}
              {ex.speakText && !exam && <SpeakBtn lang={lang} text={ex.speakText} />}
            </div>
            {ex.sub && <div className="text-muted italic">{ex.sub}</div>}
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Listen and choose the meaning</p>
            <button type="button" className="btn text-2xl !py-6 w-full" onClick={() => speak(ex.text, lang)} aria-label="Play audio">🔊 Play again</button>
          </>
        )}
        <div className="space-y-2" role="radiogroup">
          {options.map((o, i) => {
            const state = !answered ? (picked === i ? 'opt-sel' : '') : i === ex.answer ? 'opt-ok' : picked === i ? 'opt-bad' : '';
            return (
              <button key={i} type="button" role="radio" aria-checked={picked === i} disabled={answered} className={`opt ${state}`}
                onClick={() => { setPicked(i); finish(i === ex.answer); }}>
                {optTarget ? <T lang={lang}>{o}</T> : o}
              </button>
            );
          })}
        </div>
      </>
    );
  } else if (ex.kind === 'cloze') {
    const whole = !ex.before && !ex.after;
    body = (
      <>
        <p className="text-sm text-muted">{whole ? 'Type this in ' + LANGS[lang].name : ex.options ? 'Choose the missing word' : 'Type the missing word'}</p>
        <div className="text-lg font-medium">{ex.en}</div>
        {!whole && (
          <T lang={lang} block className="text-2xl">
            {ex.before}<span className="inline-block min-w-[3.5rem] border-b-2 border-brand text-center text-brand mx-1">{answered ? ex.answer : picked !== null && ex.options ? ex.options[picked] : typed || ' '}</span>{ex.after}
          </T>
        )}
        {ex.options ? (
          <div className="grid grid-cols-2 gap-2">
            {ex.options.map((o, i) => {
              const right = o === ex.answer;
              const state = !answered ? '' : right ? 'opt-ok' : picked === i ? 'opt-bad' : '';
              return <button key={i} type="button" disabled={answered} className={`opt text-center ${state}`} onClick={() => { setPicked(i); finish(right); }}><T lang={lang}>{o}</T></button>;
            })}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (!answered && typed.trim()) submitTyped(); }} className="flex gap-2">
            <input className={`input tl-${lang}`} dir="auto" lang={lang} autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} value={typed} disabled={answered}
              onChange={(e) => setTyped(e.target.value)} aria-label="Your answer" />
            {!answered && <button className="btn-primary" disabled={!typed.trim()}>Check</button>}
          </form>
        )}
      </>
    );
  } else if (ex.kind === 'reorder') {
    const chosen = order.map((i) => ex.tokens[i]);
    body = (
      <>
        <p className="text-sm text-muted">Put the words in order</p>
        <div className="text-lg font-medium">{ex.en}</div>
        <T lang={lang} block className="card min-h-[4rem] flex flex-wrap gap-2 items-start">
          {order.map((i, k) => <button key={k} type="button" disabled={answered} className="btn !py-1.5 !px-3" onClick={() => setOrder(order.filter((_, j) => j !== k))}>{ex.tokens[i]}</button>)}
        </T>
        <T lang={lang} block className="flex flex-wrap gap-2">
          {ex.tokens.map((t, i) => <button key={i} type="button" disabled={answered || order.includes(i)} className="btn !py-1.5 !px-3 disabled:opacity-25" onClick={() => setOrder([...order, i])}>{t}</button>)}
        </T>
        {!answered && <button type="button" className="btn-primary w-full" disabled={order.length !== ex.tokens.length} onClick={() => finish(checkReorder(chosen, ex.answer, lang))}>Check</button>}
      </>
    );
  } else if (ex.kind === 'speak') {
    body = (
      <>
        <p className="text-sm text-muted">Say it aloud</p>
        <div className="flex items-center gap-2"><T lang={lang} block className="text-2xl font-semibold flex-1">{ex.text}</T><SpeakBtn lang={lang} text={ex.text} /></div>
        {ex.r && <div className="text-muted italic">{ex.r}</div>}
        <div className="text-muted">{ex.en}</div>
        {!answered && <SpeakCheck lang={lang} text={ex.text} onScore={(s) => setSpoken(s.score)} />}
        {!answered && (
          <div className="flex gap-2">
            {spoken !== null && <button type="button" className="btn-primary flex-1" onClick={() => finish(spoken >= SPEAK_PASS, `Pronunciation ${Math.round(spoken * 100)}%`)}>Continue</button>}
            <button type="button" className="btn flex-1" onClick={() => onDone({ correct: false, skipped: true })}>Can’t speak now</button>
          </div>
        )}
      </>
    );
  } else {
    body = (
      <>
        <p className="text-sm text-muted">Recall the meaning, then check yourself</p>
        <div className="card text-center py-8 space-y-2">
          <div className="flex items-center justify-center gap-2">{ex.frontIsTarget ? <T lang={lang} className="text-2xl font-semibold">{ex.front}</T> : <span className="text-2xl font-semibold">{ex.front}</span>}<SpeakBtn lang={lang} text={ex.speakText} /></div>
          {ex.sub && <div className="text-muted italic">{ex.sub}</div>}
          {revealed && <div className="pt-3 border-t border-line text-lg">{ex.back}</div>}
        </div>
        {!revealed ? <button type="button" className="btn-primary w-full" onClick={() => setRevealed(true)}>Show answer</button> : (
          <div className="grid grid-cols-4 gap-2">
            {([[1, 'Again', 'text-bad'], [2, 'Hard', 'text-warn'], [3, 'Good', 'text-ok'], [4, 'Easy', 'text-brand']] as const).map(([r, label, cls]) => (
              <button key={r} type="button" className={`btn ${cls}`} onClick={() => onDone({ correct: r > 1, rating: r })}>{label}</button>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {body}
      {verdict && (
        <div className={`rounded-2xl p-4 space-y-2 ${verdict.correct ? 'bg-ok-soft' : 'bg-bad-soft'}`} role="status" aria-live="polite">
          <div className={`font-bold ${verdict.correct ? 'text-ok' : 'text-bad'}`}>{verdict.correct ? 'Correct' : 'Not quite'}</div>
          {verdict.note && <div className="text-sm">{verdict.note}</div>}
          {answerText && (!verdict.correct || ex.kind === 'listen') && <div className="flex items-center gap-2"><T lang={lang} className="font-semibold">{answerText}</T><SpeakBtn lang={lang} text={answerText} /></div>}
          {'en' in ex && !verdict.correct && <div className="text-sm text-muted">{ex.en}</div>}
          <button type="button" autoFocus className="btn-primary w-full" onClick={() => onDone({ correct: verdict.correct })}>Continue</button>
        </div>
      )}
    </div>
  );
}
