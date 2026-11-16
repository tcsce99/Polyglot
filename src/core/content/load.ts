import type { Course, LangId } from '../types';
import { buildContent, type Content } from './build';

const courses = import.meta.glob<{ default: Course }>('../../../content/*/index.ts');
const cache = new Map<LangId, Promise<Content>>();

async function getJson<T>(url: string): Promise<T | undefined> {
  try { const r = await fetch(url); return r.ok ? ((await r.json()) as T) : undefined; } catch { return undefined; }
}

/** Loads one language (course chunk + word/sentence decks). Everything is precached by the service worker, so this works offline. */
export function loadContent(lang: LangId): Promise<Content> {
  let p = cache.get(lang);
  if (!p) {
    p = (async () => {
      const base = import.meta.env.BASE_URL;
      const [mod, words, sentences] = await Promise.all([
        courses[`../../../content/${lang}/index.ts`](),
        getJson(`${base}content/${lang}/words.json`),
        getJson(`${base}content/${lang}/sentences.json`),
      ]);
      return buildContent(lang, mod.default, words as never, sentences as never);
    })();
    cache.set(lang, p);
    p.catch(() => cache.delete(lang));
  }
  return p;
}
