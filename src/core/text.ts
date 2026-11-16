// Text normalisation, answer checking and pronunciation scoring. Pure functions (tested).
import type { LangId } from './types';

const ARABIC_MARKS = /[ً-ٰٟۖ-ۭـ]/g;

/** Loose form used to compare a learner's answer or an STT transcript with the target. */
export function normalize(s: string, lang?: LangId | 'eng', opts: { stripAccents?: boolean } = {}): string {
  let out = s.normalize('NFC').toLowerCase();
  if (lang === 'urd' || lang === 'pes') {
    out = out.replace(ARABIC_MARKS, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[أإآٱ]/g, 'ا').replace(/ؤ/g, 'و').replace(/‌/g, ' ');
    out = lang === 'urd' ? out.replace(/[هۂ]/g, 'ہ').replace(/ئ/g, 'ی') : out.replace(/[ۀة]/g, 'ه');
  }
  if (lang === 'mlt') out = out.replace(/[’`]/g, "'");
  if (opts.stripAccents) out = out.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ħ/g, 'h').replace(/ı/g, 'i');
  return out.replace(/[^\p{L}\p{N}'\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function words(s: string, lang?: LangId | 'eng'): string[] {
  const n = normalize(s, lang);
  return n ? n.split(' ') : [];
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length];
}

export type Verdict = 'exact' | 'accent' | 'typo' | 'wrong';

/** Grade a typed answer. 'accent' = right letters, wrong diacritics; 'typo' = one slip in a longer answer. Both count as correct but are shown to the learner. */
export function checkAnswer(given: string, expected: string, lang: LangId): Verdict {
  const g = normalize(given, lang), e = normalize(expected, lang);
  if (!g) return 'wrong';
  if (g === e) return 'exact';
  if (normalize(given, lang, { stripAccents: true }) === normalize(expected, lang, { stripAccents: true })) return 'accent';
  if (e.length >= 5 && levenshtein(g, e) === 1) return 'typo';
  return 'wrong';
}

export interface WordScore { word: string; ok: boolean; heard?: string }
export interface PronScore { score: number; words: WordScore[] }

/** Pronunciation scoring v1 (SPEC §4.1): align the recogniser's transcript to the target word by word.
 *  A target word counts as said if the transcript contains it (or a near match) in order. */
export function scorePronunciation(target: string, heard: string, lang: LangId): PronScore {
  const t = words(target, lang), h = words(heard, lang);
  const strip = (w: string) => normalize(w, lang, { stripAccents: true });
  const close = (a: string, b: string) => {
    const x = strip(a), y = strip(b);
    return x === y || (Math.max(x.length, y.length) >= 4 && levenshtein(x, y) <= (Math.max(x.length, y.length) >= 8 ? 2 : 1));
  };
  // LCS alignment with fuzzy equality
  const m = t.length, n = h.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = close(t[i], h[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: WordScore[] = [];
  let i = 0, j = 0;
  const original = target.normalize('NFC').split(/\s+/).filter((w) => normalize(w, lang));
  while (i < m) {
    if (j < n && close(t[i], h[j])) { out.push({ word: original[i] ?? t[i], ok: true }); i++; j++; }
    else if (j < n && dp[i][j + 1] >= dp[i + 1][j]) j++;
    else { out.push({ word: original[i] ?? t[i], ok: false, heard: h[j] }); i++; }
  }
  return { score: m ? out.filter((w) => w.ok).length / m : 0, words: out };
}

export function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Small deterministic PRNG so sessions and exams can be reproduced in tests. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
