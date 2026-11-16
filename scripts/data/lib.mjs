// Pure helpers for the content pipeline (unit-tested in tests/pipeline.test.ts).

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LANGS = {
  spa: { name: 'Spanish', kaikki: 'Spanish', freq: 'es/es_50k.txt', maxWords: 6500, maxSentences: 6000 },
  pes: { name: 'Persian', kaikki: 'Persian', freq: 'fa/fa_50k.txt', maxWords: 6500, maxSentences: 6000 },
  urd: { name: 'Urdu', kaikki: 'Urdu', freq: 'ur/ur_full.txt', maxWords: 6500, maxSentences: 6000 },
  mlt: { name: 'Maltese', kaikki: 'Maltese', freq: null, maxWords: 5000, maxSentences: 6000 },
};

/** Frequency-rank upper bounds for each CEFR band (rank is 0-based among dictionary lemmas). */
export const BAND_LIMITS = [600, 1200, 2200, 3500, 5000, Infinity];

export function bandForRank(rank) {
  return BAND_LIMITS.findIndex((lim) => rank < lim);
}

const ARABIC_MARKS = /[ً-ٰٟۖ-ۭـ]/g; // harakat, dagger alif, Quranic marks, tatweel

export function normalizeToken(w, lang) {
  if (!w) return '';
  let s = w.normalize('NFC').toLowerCase().trim();
  if (lang === 'urd' || lang === 'pes') {
    s = s.replace(ARABIC_MARKS, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک');
    if (lang === 'urd') s = s.replace(/ه/g, 'ہ').replace(/ۂ/g, 'ہ');
    if (lang === 'pes') s = s.replace(/[ۀة]/g, 'ه');
  }
  return s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

export function tokenize(text, lang) {
  // Maltese keeps "il-", "ta'" and "m'" attached in writing; split on the hyphen so "il-kelb" -> il, kelb.
  const src = lang === 'mlt' ? text.replace(/[-’']/g, ' ') : text.replace(/‌/g, lang === 'pes' ? '‌' : ' ');
  return src.split(/[\s،؛؟۔.,;:!?¿¡"«»()\[\]…—–]+/u).map((t) => normalizeToken(t, lang)).filter((t) => t && !/^\d+$/.test(t));
}

/** A sentence's level: the band of its ~85th-percentile hardest word, nudged up for long sentences. */
export function levelForSentence(ranks, length) {
  const known = ranks.filter((r) => r !== undefined).sort((a, b) => a - b);
  const unknownShare = 1 - known.length / Math.max(1, ranks.length);
  let lv;
  if (unknownShare > 0.4 || !known.length) {
    // Too few dictionary hits to judge by vocabulary: fall back to length alone.
    lv = length <= 4 ? 0 : length <= 7 ? 1 : length <= 10 ? 2 : 3;
  } else {
    lv = bandForRank(known[Math.min(known.length - 1, Math.floor(known.length * 0.85))]);
    if (unknownShare > 0.2) lv += 1;
  }
  if (length > 14) lv = Math.max(lv, 3);
  else if (length > 10) lv = Math.max(lv, 2);
  else if (length > 7) lv = Math.max(lv, 1);
  return Math.min(lv, 5);
}

const DESCRIPTIVE = /^(used |marks |expresses |indicates |denotes |introduces |forms |a (reflexive|pronoun|particle)|an? .*(pronoun|particle|marker)|.*\b(pronoun|particle|case marker|definite article|indefinite article|interjection|prefix|suffix|clitic|auxiliary)\b)/i;

export function cleanGloss(g) {
  if (!g) return '';
  let s = g.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*\([^)]{25,}\)/g, ''); // drop long parentheticals
  // "marks the genitive case: of, belonging to" -> "of, belonging to"
  if (/: /.test(s) && s.split(': ')[0].length > 12) s = s.split(': ').pop();
  if (s.length > 70) s = s.split(';')[0];
  if (s.length > 70) s = s.split(',').slice(0, 2).join(',');
  s = s.replace(/[.;,!]+$/, '').trim();
  if (s.length > 80 || s.length < 1 || DESCRIPTIVE.test(s)) return '';
  return s;
}

/** Join up to `n` distinct glosses. */
export function joinGlosses(list, n = 2) {
  const out = [];
  for (const g of list) if (!out.some((o) => o.toLowerCase() === g.toLowerCase())) out.push(g);
  return out.slice(0, n).join('; ').slice(0, 80);
}

/** Wiktionary's scholarly romanisation -> the learner-friendly scheme used in the authored units. */
export function learnerRoman(r, lang) {
  if (!r) return r;
  let s = r.split(' / ').pop().trim();
  if (lang === 'pes') s = s.replace(/š/g, 'sh').replace(/č/g, 'ch').replace(/ž/g, 'zh').replace(/x/g, 'kh').replace(/[ğġq]/g, 'gh').replace(/Š/g, 'Sh').replace(/Č/g, 'Ch');
  if (lang === 'urd') s = s.replace(/ś/g, 'sh').replace(/c(?!h)/g, 'ch').replace(/x/g, 'kh').replace(/ġ/g, 'gh').replace(/[ṉṁ]/g, 'ñ');
  return s;
}

const TAGGERS = {
  spa: [
    ['questions', /[¿?]/],
    ['negation', /(^|\s)(no|nunca|nadie|nada|ning[úu]n\w*|tampoco|jamás)\b/i],
    ['future', /\b(voy|vas|va|vamos|vais|van) a \w+r\b|\w+(aré|arás|ará|aremos|arán|eré|erás|eremos|erán|iré|irás|irá|iremos|irán)\b/i],
    ['past', /\b(he|has|ha|hemos|han|hab[ií]a\w*) \w+(ado|ido|to|cho)\b|\w+(aron|ieron|aba|aban|ía|ían)\b/i],
    ['subjunctive', /\b(ojalá|para que|aunque|sin que|antes de que|(quiero|espero|dudo|quiere|esperamos) que|es (importante|necesario|posible) que)\b/i],
    ['conditionals', /\bsi\b.*\b\w+(ría|rías|ríamos|rían)\b|\b\w+(ría|rías|ríamos|rían)\b.*\bsi\b/i],
    ['ser-estar', /\b(soy|eres|somos|son|estoy|estás|está|estamos|están|era|estaba)\b/i],
    ['por-para', /\b(por|para)\b/i],
    ['comparatives', /\b(más|menos) \w+ que\b|\b(mejor|peor|mayor|menor) que\b|\btan \w+ como\b/i],
    ['reflexives', /\b(me|te|se|nos) (llam|levant|acuest|duch|sient|qued|v[ao]y|fui|pon)\w*/i],
    ['relative-clauses', /\w (que|quien|donde|cuyo|cuya) \w/i],
  ],
  pes: [
    ['questions', /؟|(^|\s)(آیا|چه|چی|کجا|چرا|کی|چطور|چند)(\s|$)/],
    ['negation', /(^|\s)(نمی|نیست|ندار|نبود|نه\s|نکن|نخواه|هیچ)/],
    ['ra-marker', /\sرا(\s|$|[.؟!])|\S+(رو|و)\s/],
    ['verb-prefix-mi', /(^|\s)ن?می[‌ ]?\S/],
    ['future', /(^|\s)ن?خواه(م|ی|د|یم|ید|ند)\s/],
    ['past', /(بود|بودم|بودی|بودند|بودیم)(\s|$|[.؟!])/],
    ['ezafe', /\S(ه‌ی|ۀ|ِ)\s/],
    ['modals', /(^|\s)(باید|می[‌ ]?توان|ن?می[‌ ]?خواه|شاید)/],
    ['conditionals', /(^|\s)اگر\s/],
    ['relative-clauses', /\S(ی|ای) که\s/],
  ],
  urd: [
    ['questions', /؟|(^|\s)(کیا|کہاں|کیوں|کون|کب|کیسے|کتن[اےی])(\s|$)/],
    ['negation', /(^|\s)(نہیں|نہ|مت)(\s|$)/],
    ['ergative-ne', /\sنے\s/],
    ['future', /(گا|گی|گے)(\s|$|[۔؟!])/],
    ['past', /(تھا|تھی|تھے|تھیں)(\s|$|[۔؟!])/],
    ['aspect', /(رہا|رہی|رہے)\s(ہے|ہیں|ہوں|ہو|تھا|تھی|تھے)/],
    ['modals', /(سکتا|سکتی|سکتے|چاہیے|چاہئے|پڑے گا|پڑتا)/],
    ['postpositions', /\s(میں|پر|سے|کو|تک|کے لیے|کے ساتھ)\s/],
    ['possession', /\s(کا|کی|کے)\s|(^|\s)(میرا|میری|میرے|تمہارا|آپ کا|اس کا)\s/],
    ['conditionals', /(^|\s)اگر\s/],
    ['relative-clauses', /(^|\s)(جو|جس|جن|جہاں|جب)\s/],
  ],
  mlt: [
    ['questions', /\?/],
    ['negation', /\bma\b.*\w+x\b|\b(mhux|mhix|mhumiex|m'|mhijiex|qatt|xejn|ħadd)\b/i],
    ['future', /\b(se|ser|sa|ħa|sejjer|sejra|sejrin)\s+[jntJNT]\w+/],
    ['past', /\b(kien|kienet|kienu|kont|konna|kontu)\b/i],
    ['aspect', /\b(qed|qiegħed|qiegħda|qegħdin)\b/i],
    ['possession', /\b(tiegħ\w*|tagħ\w*|ta'|tal-|tar-|tas-|tad-|tan-|tat-|tax-|taż-|taċ-)|\bgħand\w*/i],
    ['article-assimilation', /\b(il|l|id|in|ir|is|it|ix|iż|iċ|iz)-\w/i],
    ['modals', /\b(nista'?|tista'?|jista'?|nistgħu|jistgħu|irrid|trid|jrid|irridu|għandi bżonn|jeħtieġ)\b/i],
    ['conditionals', /\b(jekk|kieku)\b/i],
    ['relative-clauses', /\w li \w/i],
    ['comparatives', /\b(aktar|iktar|iżjed|inqas) \w+ minn\b|\b\w+ minn\b/i],
  ],
};

/** Regex-based category tags; every sentence gets at least 'reading'. */
export function tagSentence(text, lang) {
  const cats = [];
  for (const [cat, re] of TAGGERS[lang] || []) if (re.test(text)) cats.push(cat);
  return cats.length ? cats.slice(0, 3) : ['reading'];
}
