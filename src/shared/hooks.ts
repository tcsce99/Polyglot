import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadContent } from '../core/content/load';
import type { Content } from '../core/content/build';
import { snapshot, type Snapshot } from '../core/progress';
import { useStore, typingEnabled } from '../core/store';
import { LANGS } from '../core/langs';
import type { LangId } from '../core/types';
import { canListen, sttMode } from '../core/speech/speech';
import type { ExerciseOpts } from '../core/exercises';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data?: T; error?: Error; loading: boolean } {
  const [state, set] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });
  useEffect(() => {
    let live = true;
    fn().then((data) => live && set({ data, loading: false }), (error) => live && set({ error, loading: false }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useLang(): LangId {
  const { lang } = useParams();
  return (lang && lang in LANGS ? lang : 'spa') as LangId;
}

export function useContent(lang: LangId): Content | undefined {
  return useAsync(() => loadContent(lang), [lang]).data;
}

export function useSnapshot(lang: LangId, c: Content | undefined): Snapshot | undefined {
  const version = useStore((s) => s.version);
  return useAsync(async () => (c ? snapshot(lang, c) : undefined), [lang, c, version]).data;
}

/** What the device and settings allow right now. Quiet mode switches all audio off. */
export function useExerciseOpts(lang: LangId): ExerciseOpts {
  const { quiet, typing, showRoman, proxyUrl } = useStore();
  const [, setTick] = useState(0);
  useEffect(() => { // voices load asynchronously
    const h = () => setTick((t) => t + 1);
    globalThis.speechSynthesis?.addEventListener?.('voiceschanged', h);
    return () => globalThis.speechSynthesis?.removeEventListener?.('voiceschanged', h);
  }, []);
  return { quiet, canSpeak: sttMode(lang, !!proxyUrl) !== 'none', canListen: canListen(lang), typing: typingEnabled(lang, typing), showRoman };
}

export function useOnline(): boolean {
  const [on, set] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const up = () => set(true), down = () => set(false);
    addEventListener('online', up); addEventListener('offline', down);
    return () => { removeEventListener('online', up); removeEventListener('offline', down); };
  }, []);
  return on;
}
