import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LANGS } from '../core/langs';
import type { LangId } from '../core/types';
import { useStore } from '../core/store';
import { canListen, speak } from '../core/speech/speech';

/** Target-language text: sets lang, direction and script font (Nastaliq for Urdu, Naskh for Persian). */
export function T({ lang, children, className = '', block }: { lang: LangId; children: ReactNode; className?: string; block?: boolean }) {
  const Tag = block ? 'div' : 'span';
  return <Tag lang={LANGS[lang].bcp47} dir={LANGS[lang].rtl ? 'rtl' : 'ltr'} className={`tl-${lang} ${block ? 'block' : 'inline-block'} ${className}`}>{children}</Tag>;
}

export function SpeakBtn({ lang, text, className = '' }: { lang: LangId; text: string; className?: string }) {
  const quiet = useStore((s) => s.quiet);
  if (quiet || !canListen(lang)) return null;
  return <button type="button" aria-label="Listen" title="Listen" className={`btn-ghost !p-2 text-brand ${className}`} onClick={(e) => { e.stopPropagation(); speak(text, lang); }}>🔊</button>;
}

export function QuietToggle() {
  const { quiet, set } = useStore();
  return (
    <button type="button" role="switch" aria-checked={quiet} onClick={() => set({ quiet: !quiet })}
      title="Quiet mode: no sound, no microphone — reading, vocabulary and typing only"
      className={`rounded-full px-3 py-1.5 text-sm font-semibold border ${quiet ? 'bg-warn-soft text-warn border-warn' : 'bg-surface text-muted border-line'}`}>
      {quiet ? '🔇 Quiet on' : '🔈 Quiet off'}
    </button>
  );
}

export function Page({ title, back, right, children }: { title: ReactNode; back?: string | true; right?: ReactNode; children: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-2xl min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur flex items-center gap-2 px-4 py-3">
        {back && <button aria-label="Back" className="btn-ghost !p-2" onClick={() => (back === true ? nav(-1) : nav(back))}>←</button>}
        <h1 className="text-lg font-bold flex-1 truncate">{title}</h1>
        {right}
      </header>
      <main className="flex-1 px-4 pb-28 space-y-4">{children}</main>
    </div>
  );
}

export function Bar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'ok' | 'warn' | 'bad' }) {
  const color = { brand: 'bg-brand', ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad' }[tone];
  return <div className="h-2 rounded-full bg-line overflow-hidden" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}><div className={`h-full ${color} transition-all`} style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} /></div>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <div className="card !p-3 text-center"><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted">{label}</div></div>;
}

export function Notice({ tone = 'warn', children }: { tone?: 'warn' | 'ok' | 'bad' | 'brand'; children: ReactNode }) {
  const cls = { warn: 'bg-warn-soft text-warn', ok: 'bg-ok-soft text-ok', bad: 'bg-bad-soft text-bad', brand: 'bg-brand-soft text-brand' }[tone];
  return <div className={`rounded-xl px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function Loading() {
  return <div className="p-10 text-center text-muted">Loading…</div>;
}

const TABS = [['', 'Learn', '📘'], ['read', 'Read', '📖'], ['tutor', 'Tutor', '💬'], ['exam', 'Exams', '🎓'], ['progress', 'Progress', '📊']] as const;

export function Tabs({ lang, active }: { lang: LangId; active: string }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="Sections">
      <div className="mx-auto max-w-2xl grid grid-cols-5">
        {TABS.map(([path, label, icon]) => (
          <Link key={path} to={`/${lang}${path ? '/' + path : ''}`} aria-current={active === path ? 'page' : undefined}
            className={`flex flex-col items-center py-2 text-xs font-semibold ${active === path ? 'text-brand' : 'text-muted'}`}>
            <span className="text-lg" aria-hidden>{icon}</span>{label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
