import { Link } from 'react-router-dom';
import { LANGS, LANG_IDS } from '../../core/langs';
import { db } from '../../core/db/db';
import { useAsync } from '../../shared/hooks';
import { useStore } from '../../core/store';
import { Page, QuietToggle, T } from '../../shared/ui';

export function Home() {
  const version = useStore((s) => s.version);
  const due = useAsync(async () => {
    const now = Date.now();
    const out: Record<string, { due: number; learned: number }> = {};
    for (const l of LANG_IDS) {
      const learned = await db.cards.where('lang').equals(l).count();
      const d = await db.cards.where('[lang+due]').between([l, 0], [l, now]).count();
      out[l] = { due: d, learned };
    }
    return out;
  }, [version]).data;
  return (
    <Page title="Polyglot" right={<><QuietToggle /><Link to="/settings" className="btn-ghost !p-2" aria-label="Settings">⚙️</Link></>}>
      <p className="text-muted">Four languages, from first words to C1 — with placement tests, CEFR-style exams, an AI tutor that listens, and review that never lets you forget.</p>
      <div className="space-y-3">
        {LANG_IDS.map((id) => {
          const l = LANGS[id];
          const s = due?.[id];
          return (
            <Link key={id} to={`/${id}`} className="card flex items-center gap-4 hover:border-brand">
              <span className="text-4xl" aria-hidden>{l.flag}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-lg">{l.name} <T lang={id} className="text-muted font-normal ms-2">{l.native}</T></span>
                <span className="block text-sm text-muted">{l.blurb}</span>
              </span>
              <span className="text-end text-sm shrink-0">
                {s?.learned ? <><span className="block font-semibold">{s.learned} learned</span><span className={s.due ? 'text-brand font-semibold' : 'text-muted'}>{s.due} due</span></> : <span className="chip">Start</span>}
              </span>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-muted">Quiet mode turns off all sound and the microphone, so you can study by reading and vocabulary in a meeting or class. Lessons, review and reading work offline; the AI tutor needs a connection.</p>
    </Page>
  );
}
