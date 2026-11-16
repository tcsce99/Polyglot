import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LangId } from './types';
import { LANGS } from './langs';

interface Settings {
  lang: LangId | null;
  /** Quiet mode: no audio out, no microphone — vocabulary, reading and typing only (for meetings, class, transit). */
  quiet: boolean;
  proxyUrl: string;
  proxyToken: string;
  fontScale: number;
  showRoman: boolean;
  typing: Partial<Record<LangId, boolean>>;
  sessionSize: number;
  version: number; // bumped after DB writes so screens re-query
  set: (p: Partial<Omit<Settings, 'set' | 'bump' | 'version'>>) => void;
  bump: () => void;
}

export const useStore = create<Settings>()(
  persist(
    (set) => ({
      lang: null, quiet: false, proxyUrl: '', proxyToken: '', fontScale: 1, showRoman: true, typing: {}, sessionSize: 20, version: 0,
      set: (p) => set(p),
      bump: () => set((s) => ({ version: s.version + 1 })),
    }),
    { name: 'polyglot-settings', partialize: ({ version: _v, set: _s, bump: _b, ...rest }) => rest },
  ),
);

export function typingEnabled(lang: LangId, typing: Partial<Record<LangId, boolean>>): boolean {
  return typing[lang] ?? LANGS[lang].typeByDefault;
}
