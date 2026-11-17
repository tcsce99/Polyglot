#!/usr/bin/env node
/**
 * Polyglot content pipeline.
 *
 *   npm run data:build            # all four languages
 *   npm run data:build -- mlt     # one language
 *
 * Downloads (once, into .cache/data/) and compiles openly licensed data into
 * public/content/<lang>/{words,sentences}.json and public/content/credits.json.
 *
 * Sources (see docs/RESOURCES.md):
 *   - Tatoeba per-language exports ............ CC-BY 2.0 FR  (sentences + English translations)
 *   - Wiktionary via Kaikki.org ............... CC-BY-SA 4.0  (lemmas, glosses, romanisation, IPA, form->lemma)
 *   - hermitdave/FrequencyWords (OpenSubtitles) CC-BY-SA 4.0  (frequency ranking; no Maltese list exists)
 *
 * Nothing is scraped at runtime; the app only reads the generated JSON.
 * Requires `curl` on PATH for the download step.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import bz2 from 'unbzip2-stream';
import { LANGS, LEVELS, bandForRank, levelForSentence, normalizeToken, tokenize, cleanGloss, joinGlosses, learnerRoman, tagSentence } from './lib.mjs';

const OVERRIDES = JSON.parse(fs.readFileSync(new URL('./overrides.json', import.meta.url), 'utf8'));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = path.join(ROOT, '.cache/data');
const OUT = path.join(ROOT, 'public/content');
fs.mkdirSync(CACHE, { recursive: true });

function download(url, file) {
  const dest = path.join(CACHE, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  console.log(`  downloading ${url}`);
  execFileSync('curl', ['-fsSL', '--retry', '3', '-o', dest + '.part', url], { stdio: 'inherit' });
  fs.renameSync(dest + '.part', dest);
  return dest;
}

function lines(file) {
  let input = fs.createReadStream(file);
  if (file.endsWith('.bz2')) input = input.pipe(bz2());
  return readline.createInterface({ input, crlfDelay: Infinity });
}

/** word -> rank (0 = most frequent) from a "word count" list. */
async function loadFreq(file, lang) {
  const rank = new Map();
  if (!file) return rank;
  for await (const line of lines(file)) {
    const w = normalizeToken(line.split(' ')[0], lang);
    if (w && !rank.has(w)) rank.set(w, rank.size);
  }
  return rank;
}

const SKIP_POS = new Set(['character', 'name', 'suffix', 'prefix', 'symbol', 'punct', 'interfix', 'combining_form', 'abbrev', 'infix', 'circumfix']);
const BAD_SENSE = new Set(['form-of', 'alt-of', 'no-gloss', 'obsolete', 'archaic', 'misspelling', 'rare', 'dated', 'abbreviation', 'vulgar', 'slur', 'offensive', 'derogatory']);
const BAD_GLOSS = /^(alternative|obsolete|misspelling|nonstandard|archaic|dated|rare|eye dialect|initialism|abbreviation|clipping|synonym of|romanization|plural of|feminine|masculine|diminutive of|augmentative of|superlative|comparative of|the name of the|letter)\b|letter of the/i;

/** Parse a Kaikki JSONL dump into lemmas + a form->lemma map. */
async function loadKaikki(file, lang) {
  const overrides = OVERRIDES[lang] || {};
  const lemmas = new Map(); // word -> {w,pos,g,r,ipa,senses,examples[]}
  const formOf = new Map(); // form -> lemma
  const examples = [];
  for await (const line of lines(file)) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (!e.word || SKIP_POS.has(e.pos)) continue;
    const word = e.word.normalize('NFC');
    if (word !== word.toLowerCase() || /^-|-$/.test(word)) continue; // proper nouns, letters, affixes
    const key = normalizeToken(word, lang);
    if (!key) continue;
    const good = [];
    for (const s of e.senses || []) {
      const tags = s.tags || [];
      if (s.form_of?.length || s.alt_of?.length) {
        const target = (s.form_of || s.alt_of)[0].word;
        if (target && !formOf.has(key)) formOf.set(key, normalizeToken(target, lang));
        continue;
      }
      if (!s.glosses?.length || tags.some((t) => BAD_SENSE.has(t))) continue;
      const g = cleanGloss(s.glosses[s.glosses.length - 1]);
      if (!g || BAD_GLOSS.test(g)) continue;
      good.push(g);
      for (const ex of s.examples || []) {
        const en = ex.translation || ex.english;
        if (ex.text && en && lang !== 'spa') examples.push({ t: ex.text.normalize('NFC'), e: en, r: ex.roman, w: word });
      }
    }
    if (!good.length) {
      // Maltese conjugated forms are often gloss-less with a head line "… of <lemma>".
      const head = e.head_templates?.[0]?.expansion || '';
      const m = head.match(/ of ([^\s#]+)\s*$/);
      if (m && !formOf.has(key)) formOf.set(key, normalizeToken(m[1], lang));
      continue;
    }
    // inflected forms listed on the lemma entry
    for (const f of e.forms || []) {
      const tags = f.tags || [];
      if (!f.form || tags.some((t) => ['romanization', 'Hindi', 'Tajik', 'Cyrillic', 'table-tags', 'inflection-template', 'canonical'].includes(t))) continue;
      const fk = normalizeToken(f.form, lang);
      if (fk && fk !== key && !fk.includes(' ') && !formOf.has(fk)) formOf.set(fk, key);
    }
    const romans = (e.forms || []).filter((f) => (f.tags || []).includes('romanization')).map((f) => f.form);
    const roman = romans.length ? learnerRoman(lang === 'pes' ? romans[Math.min(1, romans.length - 1)] : romans[0], lang) : undefined;
    const ipa = (e.sounds || []).find((s) => s.ipa)?.ipa;
    if (key in overrides) { if (overrides[key] && !lemmas.has(key)) lemmas.set(key, { w: word, pos: e.pos, g: overrides[key], r: roman, ipa, senses: 9 }); continue; }
    const prev = lemmas.get(key);
    if (prev) {
      if (prev.pos !== e.pos && prev.g.length < 40 && !prev.g.includes(good[0])) prev.g += '; ' + good[0];
      prev.senses += good.length;
      continue;
    }
    lemmas.set(key, { w: word, pos: e.pos, g: joinGlosses(good), r: roman, ipa, senses: good.length });
  }
  return { lemmas, formOf, examples };
}

const FUNCTION_POS = new Set(['pron', 'prep', 'conj', 'det', 'article', 'num', 'particle', 'postp', 'adv', 'intj']);

/** Order lemmas by frequency. Maltese has no open frequency list, so it is ranked by the
 *  English frequency of the gloss headword, boosted by how often the word occurs in Tatoeba. */
function rankLemmas(lang, kaikki, freq, engFreq, corpusCount) {
  const { lemmas, formOf } = kaikki;
  const order = [];
  const seen = new Set();
  const resolve = (form) => (lemmas.has(form) ? form : lemmas.has(formOf.get(form)) ? formOf.get(form) : null);
  for (const form of freq.keys()) {
    const lemma = resolve(form);
    if (lemma && !seen.has(lemma)) { seen.add(lemma); order.push(lemma); }
  }
  // Top up (or, for Maltese, build entirely) from dictionary lemmas ranked by English gloss frequency.
  {
    const scored = [];
    const perHead = new Map();
    for (const [key, l] of lemmas) {
      if (key.includes(' ') || seen.has(key)) continue;
      const head = l.g.toLowerCase().replace(/\(.*?\)/g, '').replace(/^(to|a|an|the) /, '').split(/[;,]/)[0].trim();
      const first = head.split(' ')[0];
      // multi-word glosses ("be lost", "have lunch") are ranked by their rarest word
      const parts = head.split(' ').filter(Boolean);
      if (!parts.length || parts.length > 3 || parts.some((p) => !engFreq.has(p))) continue;
      let r = Math.max(...parts.map((p) => engFreq.get(p))) * (parts.length > 1 ? 1.5 : 1);
      if (FUNCTION_POS.has(l.pos)) r = r / 3;
      const c = corpusCount.get(key) || 0;
      if (c) r = r / (1 + Math.log2(1 + c));
      scored.push({ key, r, head: first, tie: -(c * 10 + l.senses + (l.ipa ? 1 : 0)) });
    }
    scored.sort((a, b) => a.r - b.r || a.tie - b.tie);
    for (const s of scored) {
      const n = perHead.get(s.head) || 0;
      if (n >= 2) continue; // at most two Maltese lemmas per English headword
      perHead.set(s.head, n + 1);
      order.push(s.key);
    }
  }
  return order;
}

async function buildLang(lang, engFreq) {
  const cfg = LANGS[lang];
  console.log(`\n[${lang}] ${cfg.name}`);
  const T = 'https://downloads.tatoeba.org/exports/per_language';
  const fSent = download(`${T}/${lang}/${lang}_sentences_detailed.tsv.bz2`, `${lang}_sentences_detailed.tsv.bz2`);
  const fLinks = download(`${T}/${lang}/${lang}-eng_links.tsv.bz2`, `${lang}-eng_links.tsv.bz2`);
  const fEng = download(`${T}/eng/eng_sentences.tsv.bz2`, 'eng_sentences.tsv.bz2');
  const fKaikki = download(`https://kaikki.org/dictionary/${cfg.kaikki}/kaikki.org-dictionary-${cfg.kaikki}.jsonl`, `kaikki_${cfg.kaikki}.jsonl`);
  const fFreq = cfg.freq ? download(`https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/${cfg.freq}`, `freq_${lang}.txt`) : null;

  const kaikki = await loadKaikki(fKaikki, lang);
  console.log(`  kaikki: ${kaikki.lemmas.size} lemmas, ${kaikki.formOf.size} forms`);

  // --- sentences (Tatoeba) ---
  const linkTo = new Map();
  for await (const l of lines(fLinks)) { const [a, b] = l.split('\t'); if (!linkTo.has(a)) linkTo.set(a, b); }
  const needEng = new Set(linkTo.values());
  const eng = new Map();
  for await (const l of lines(fEng)) { const i = l.indexOf('\t'); const id = l.slice(0, i); if (needEng.has(id)) eng.set(id, l.slice(l.indexOf('\t', i + 1) + 1)); }
  const raw = [];
  const corpusCount = new Map();
  for await (const l of lines(fSent)) {
    const [id, , text, user] = l.split('\t');
    if (!text) continue;
    for (const tok of tokenize(text, lang)) corpusCount.set(tok, (corpusCount.get(tok) || 0) + 1);
    const en = eng.get(linkTo.get(id));
    if (en) raw.push({ i: +id, t: text.normalize('NFC').trim(), e: en.trim(), b: user && user !== '\\N' ? user : 'unknown' });
  }

  // --- words ---
  const freq = await loadFreq(fFreq, lang);
  const order = rankLemmas(lang, kaikki, freq, engFreq, corpusCount).slice(0, cfg.maxWords);
  const lemmaRank = new Map(order.map((k, i) => [k, i]));
  const words = order.map((k, i) => {
    const l = kaikki.lemmas.get(k);
    const o = { w: l.w, g: l.g, p: l.pos, l: bandForRank(i) };
    if (l.r) o.r = l.r;
    if (l.ipa) o.ipa = l.ipa;
    return o;
  });
  const rankOf = (tok) => lemmaRank.get(tok) ?? lemmaRank.get(kaikki.formOf.get(tok));

  // --- level + tag sentences ---
  const seen = new Set();
  const byLevel = LEVELS.map(() => []);
  const consider = (s, src) => {
    const toks = tokenize(s.t, lang);
    if (toks.length < 2 || toks.length > 18 || s.t.length > 130 || s.e.length > 160 || /https?:/.test(s.t)) return;
    const key = toks.join(' ');
    if (seen.has(key)) return;
    seen.add(key);
    const lv = levelForSentence(toks.map(rankOf), toks.length);
    const o = { i: s.i, t: s.t, e: s.e, l: lv, c: tagSentence(s.t, lang) };
    if (src === 'tatoeba') o.b = s.b; else { o.x = 1; if (s.r) o.r = learnerRoman(s.r, lang); }
    byLevel[lv].push(o);
  };
  raw.sort((a, b) => a.i - b.i);
  for (const s of raw) consider(s, 'tatoeba');
  let exId = 0;
  for (const ex of kaikki.examples) consider({ i: `x${exId++}`, t: ex.t, e: ex.e, r: ex.r }, 'wiktionary');
  const perLevel = Math.ceil(cfg.maxSentences / LEVELS.length);
  // Deterministic thinning (keeps every k-th) so reruns produce stable output.
  let sentences = byLevel.flatMap((arr) => {
    if (arr.length <= perLevel) return arr;
    const step = arr.length / perLevel;
    return Array.from({ length: perLevel }, (_, k) => arr[Math.floor(k * step)]);
  });
  // If some levels were short, top up from the leftovers (lowest levels first).
  if (sentences.length < cfg.maxSentences) {
    const have = new Set(sentences.map((s) => s.i));
    for (const arr of byLevel) for (const s of arr) { if (sentences.length >= cfg.maxSentences) break; if (!have.has(s.i)) sentences.push(s); }
  }
  sentences.sort((a, b) => a.l - b.l || String(a.i).localeCompare(String(b.i), 'en', { numeric: true }));

  const contributors = {};
  for (const s of sentences) if (s.b) contributors[s.b] = (contributors[s.b] || 0) + 1;

  const dir = path.join(OUT, lang);
  fs.mkdirSync(dir, { recursive: true });
  const built = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(dir, 'words.json'), JSON.stringify({
    meta: { lang, built, source: 'Wiktionary via Kaikki.org', license: 'CC-BY-SA 4.0', url: `https://kaikki.org/dictionary/${cfg.kaikki}/`,
      ranking: cfg.freq ? 'hermitdave/FrequencyWords (OpenSubtitles 2018), CC-BY-SA 4.0, topped up by English gloss frequency' : 'English gloss frequency + Tatoeba corpus counts (no open Maltese frequency list)',
      note: 'CEFR bands are estimated from frequency rank; they are a guide, not an official word list.',
      itemUrl: 'https://en.wiktionary.org/wiki/{w}' },
    words,
  }));
  fs.writeFileSync(path.join(dir, 'sentences.json'), JSON.stringify({
    meta: { lang, built, source: 'Tatoeba', license: 'CC-BY 2.0 FR', url: 'https://tatoeba.org', itemUrl: 'https://tatoeba.org/sentences/show/{i}',
      extra: 'Items with x:1 are usage examples from Wiktionary via Kaikki.org (CC-BY-SA 4.0).' },
    sentences,
  }));
  const perLv = (arr) => LEVELS.map((L, i) => `${L}:${arr.filter((x) => x.l === i).length}`).join(' ');
  console.log(`  words: ${words.length} (${perLv(words)})`);
  console.log(`  sentences: ${sentences.length} of ${byLevel.flat().length} usable (${perLv(sentences)})`);
  return {
    lang, name: cfg.name, words: words.length, sentences: sentences.length,
    tatoebaSentences: sentences.filter((s) => s.b).length, wiktionaryExamples: sentences.filter((s) => s.x).length,
    contributors: Object.entries(contributors).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n })),
  };
}

const only = process.argv.slice(2).filter((a) => LANGS[a]);
const targets = only.length ? only : Object.keys(LANGS);
const engFreqFile = download('https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt', 'freq_eng.txt');
const engFreq = await loadFreq(engFreqFile, 'eng');
const creditsFile = path.join(OUT, 'credits.json');
const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')) : { languages: {} };
for (const lang of targets) credits.languages[lang] = await buildLang(lang, engFreq);
credits.built = new Date().toISOString().slice(0, 10);
credits.sources = [
  { name: 'Tatoeba', what: 'Example sentences and English translations', license: 'CC-BY 2.0 FR', url: 'https://tatoeba.org' },
  { name: 'Wiktionary (via Kaikki.org machine-readable extracts)', what: 'Words, glosses, romanisation, IPA, usage examples', license: 'CC-BY-SA 4.0', url: 'https://kaikki.org' },
  { name: 'FrequencyWords by Hermit Dave (OpenSubtitles 2018)', what: 'Word-frequency ranking for Spanish, Persian, Urdu', license: 'CC-BY-SA 4.0', url: 'https://github.com/hermitdave/FrequencyWords' },
  { name: 'Noto Nastaliq Urdu, Noto Naskh Arabic', what: 'Bundled fonts', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/noto' },
  { name: 'Polyglot course units', what: 'Grammar notes, examples, dialogues, readings, exam tasks', license: 'Original content written for this project (MIT)', url: '' },
];
fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 1));
console.log('\nwrote public/content/credits.json');
