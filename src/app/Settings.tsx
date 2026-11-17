import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportBackup, importBackup } from '../core/db/db';
import { LANGS, LANG_IDS } from '../core/langs';
import { resetLanguage } from '../core/progress';
import { typingEnabled, useStore } from '../core/store';
import { ping } from '../core/tutor/client';
import { useAsync } from '../shared/hooks';
import { Notice, Page } from '../shared/ui';

function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer">
      <span className="flex-1"><span className="block font-medium">{label}</span>{hint && <span className="block text-sm text-muted">{hint}</span>}</span>
      <input type="checkbox" className="w-5 h-5 accent-[var(--brand)]" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Settings() {
  const s = useStore();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  return (
    <Page title="Settings" back="/">
      <section className="card">
        <h2 className="font-bold">Study mode</h2>
        <Toggle label="Quiet mode" hint="No sound and no microphone anywhere in the app. Listening and speaking exercises are replaced by reading, vocabulary and typing." on={s.quiet} onChange={(quiet) => s.set({ quiet })} />
        <Toggle label="Show romanisation" hint="Latin-letter reading help for Urdu and Persian (A1–A2 lessons and dictionary words)." on={s.showRoman} onChange={(showRoman) => s.set({ showRoman })} />
        {LANG_IDS.map((l) => <Toggle key={l} label={`Type answers in ${LANGS[l].name}`} hint={LANGS[l].rtl ? 'Needs an Urdu/Persian keyboard. Off = multiple choice and word tiles.' : undefined} on={typingEnabled(l, s.typing)} onChange={(v) => s.set({ typing: { ...s.typing, [l]: v } })} />)}
        <label className="flex items-center gap-3 py-2"><span className="flex-1 font-medium">Session length</span>
          <select className="input !w-auto" value={s.sessionSize} onChange={(e) => s.set({ sessionSize: Number(e.target.value) })}>{[10, 20, 30].map((n) => <option key={n} value={n}>{n} items</option>)}</select></label>
        <label className="flex items-center gap-3 py-2"><span className="flex-1 font-medium">Text size</span>
          <select className="input !w-auto" value={s.fontScale} onChange={(e) => s.set({ fontScale: Number(e.target.value) })}>{[[0.9, 'Small'], [1, 'Normal'], [1.15, 'Large'], [1.3, 'Extra large']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">AI tutor</h2>
        <p className="text-sm text-muted">The tutor (conversation, corrections, exam marking, generated readings, and speech recognition for Maltese) runs through your own small proxy so that no API key is ever stored in this app. Deploy it once with the steps in <code>server/README.md</code>, then paste its URL here.</p>
        <input className="input" inputMode="url" placeholder="https://polyglot-tutor.you.workers.dev" value={s.proxyUrl} onChange={(e) => { s.set({ proxyUrl: e.target.value.trim() }); setStatus(null); }} aria-label="Proxy URL" />
        <input className="input" placeholder="Tutor access code (if you set one)" value={s.proxyToken} onChange={(e) => s.set({ proxyToken: e.target.value })} aria-label="Tutor access code" />
        <button className="btn" disabled={!s.proxyUrl} onClick={async () => setStatus(await ping({ url: s.proxyUrl, token: s.proxyToken }))}>Test connection</button>
        {status && <Notice tone={status.ok ? 'ok' : 'bad'}>{status.message}</Notice>}
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">Your data</h2>
        <p className="text-sm text-muted">Progress is stored only on this device. Export a backup to move it to another device.</p>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={async () => { const blob = new Blob([await exportBackup()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `polyglot-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href); }}>Export backup</button>
          <button className="btn" onClick={() => file.current?.click()}>Import backup</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; if (!confirm('Importing replaces all progress on this device. Continue?')) return; try { await importBackup(await f.text()); s.bump(); setMsg('Backup imported.'); } catch (er) { setMsg((er as Error).message); } }} />
        </div>
        <div className="flex gap-2 flex-wrap pt-2">
          {LANG_IDS.map((l) => <button key={l} className="btn text-bad" onClick={async () => { if (confirm(`Erase all ${LANGS[l].name} progress on this device? This cannot be undone.`)) { await resetLanguage(l); s.bump(); setMsg(`${LANGS[l].name} progress erased.`); } }}>Reset {LANGS[l].name}</button>)}
        </div>
        {msg && <Notice tone="brand">{msg}</Notice>}
      </section>
      <Link to="/credits" className="card block hover:border-brand font-semibold">Credits & licences →</Link>
    </Page>
  );
}

interface Credits { built: string; sources: { name: string; what: string; license: string; url: string }[]; languages: Record<string, { name: string; words: number; sentences: number; tatoebaSentences: number; wiktionaryExamples: number; contributors: { name: string; n: number }[] }> }

export function CreditsPage() {
  const { data } = useAsync<Credits | null>(async () => { try { return await (await fetch(`${import.meta.env.BASE_URL}content/credits.json`)).json(); } catch { return null; } }, []);
  return (
    <Page title="Credits & licences" back="/settings">
      {!data ? <p className="text-muted">Loading…</p> : (
        <>
          <p className="text-sm text-muted">Generated by the content pipeline on {data.built}. All linguistic data is openly licensed; thank you to everyone who contributed it.</p>
          {data.sources.map((s) => <div key={s.name} className="card !p-3"><div className="font-semibold">{s.name}</div><div className="text-sm text-muted">{s.what}</div><div className="text-sm">{s.license}{s.url && <> · <a className="text-brand underline" href={s.url} target="_blank" rel="noreferrer">{s.url.replace('https://', '')}</a></>}</div></div>)}
          {Object.values(data.languages).map((l) => (
            <details key={l.name} className="card !p-3">
              <summary className="font-semibold cursor-pointer">{l.name}: {l.words.toLocaleString()} words · {l.sentences.toLocaleString()} sentences</summary>
              <p className="text-sm text-muted mt-2">{l.tatoebaSentences.toLocaleString()} sentences from Tatoeba (CC-BY 2.0 FR){l.wiktionaryExamples ? `, ${l.wiktionaryExamples.toLocaleString()} usage examples from Wiktionary (CC-BY-SA 4.0)` : ''}. Tatoeba sentence authors:</p>
              <p className="text-xs text-muted mt-1 break-words">{l.contributors.map((c) => `${c.name} (${c.n})`).join(', ')}</p>
            </details>
          ))}
        </>
      )}
    </Page>
  );
}
