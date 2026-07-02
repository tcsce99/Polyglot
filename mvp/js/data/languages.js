/* Polyglot — language registry + shared grammar-category taxonomy.
   Course content files register themselves on window.LISAN_COURSES. */
window.LISAN_COURSES = window.LISAN_COURSES || {};

window.LISAN_LANGS = [
  { id: "es",  name: "Spanish",         native: "Español",    flag: "🇪🇸", bcp47: "es-ES", rtl: false },
  { id: "fr",  name: "French",          native: "Français",   flag: "🇫🇷", bcp47: "fr-FR", rtl: false },
  { id: "de",  name: "German",          native: "Deutsch",    flag: "🇩🇪", bcp47: "de-DE", rtl: false },
  { id: "ru",  name: "Russian",         native: "Русский",    flag: "🇷🇺", bcp47: "ru-RU", rtl: false },
  { id: "tr",  name: "Turkish",         native: "Türkçe",     flag: "🇹🇷", bcp47: "tr-TR", rtl: false },
  { id: "ms",  name: "Malay",           native: "Bahasa Melayu", flag: "🇲🇾", bcp47: "ms-MY", rtl: false },
  { id: "ur",  name: "Urdu",            native: "اردو",        flag: "🇵🇰", bcp47: "ur-PK", rtl: true  },
  { id: "arz", name: "Egyptian Arabic", native: "مصري",        flag: "🇪🇬", bcp47: "ar-EG", rtl: true  },
  { id: "cmn", name: "Mandarin",        native: "普通话",       flag: "🇨🇳", bcp47: "zh-CN", rtl: false },
  { id: "yue", name: "Cantonese",       native: "廣東話",       flag: "🇭🇰", bcp47: "zh-HK", rtl: false },
  { id: "ja",  name: "Japanese",        native: "日本語",       flag: "🇯🇵", bcp47: "ja-JP", rtl: false },
  { id: "ko",  name: "Korean",          native: "한국어",       flag: "🇰🇷", bcp47: "ko-KR", rtl: false },
];

/* Shared grammatical-category taxonomy. Every vocab item, sentence and
   exercise is tagged with one or more of these; per-category accuracy
   drives the strengths/weaknesses view. */
window.LISAN_CATS = {
  greetings:     { label: "Greetings & phrases", icon: "👋" },
  pronunciation: { label: "Pronunciation",       icon: "🗣️" },
  vocabulary:    { label: "Vocabulary",          icon: "📚" },
  pronouns:      { label: "Pronouns",            icon: "🫵" },
  verbs:         { label: "Verbs & conjugation", icon: "⚙️" },
  nouns:         { label: "Nouns & gender",      icon: "🏷️" },
  wordorder:     { label: "Word order / syntax", icon: "🔀" },
  particles:     { label: "Particles & prepositions", icon: "🔗" },
  questions:     { label: "Questions",           icon: "❓" },
  numbers:       { label: "Numbers & time",      icon: "🔢" },
  politeness:    { label: "Politeness & register", icon: "🙏" },
  negation:      { label: "Negation",            icon: "🚫" },
  listening:     { label: "Listening",           icon: "👂" },
  speaking:      { label: "Speaking",            icon: "🎤" },
  script:        { label: "Script & reading",    icon: "✍️" },
};

/* Free external resources shown per course (all genuinely free). */
window.LISAN_RESOURCES = {
  all: [
    { name: "Tatoeba", url: "https://tatoeba.org", desc: "Millions of free example sentences with audio" },
    { name: "Wiktionary", url: "https://wiktionary.org", desc: "Free dictionary with pronunciation for every language" },
    { name: "Forvo", url: "https://forvo.com", desc: "Native-speaker pronunciations of any word" },
    { name: "Anki", url: "https://apps.ankiweb.net", desc: "Free spaced-repetition app with shared decks" },
    { name: "Language Transfer", url: "https://www.languagetransfer.org", desc: "Completely free audio courses (Spanish, French, German, Turkish, Arabic...)" },
    { name: "Wikibooks Languages", url: "https://en.wikibooks.org/wiki/Department:Languages", desc: "Free open textbooks" },
  ],
  es:  [{ name: "Language Transfer Spanish", url: "https://www.languagetransfer.org/complete-spanish", desc: "Free 90-lesson audio course" }, { name: "Destinos", url: "https://www.learner.org/series/destinos-an-introduction-to-spanish/", desc: "Free classic video course" }],
  fr:  [{ name: "Language Transfer French", url: "https://www.languagetransfer.org/introduction-to-french", desc: "Free audio introduction" }, { name: "Français Facile (RFI)", url: "https://francaisfacile.rfi.fr", desc: "Free news + lessons in easy French" }],
  de:  [{ name: "Nicos Weg (DW)", url: "https://learngerman.dw.com", desc: "Free full A1–B1 video course from Deutsche Welle" }, { name: "Language Transfer German", url: "https://www.languagetransfer.org/complete-german", desc: "Free audio course" }],
  ru:  [{ name: "Russian For Free", url: "https://www.russianforfree.com", desc: "Free lessons, texts and podcasts" }, { name: "Russian Grammar (Wikibooks)", url: "https://en.wikibooks.org/wiki/Russian", desc: "Free open textbook" }],
  tr:  [{ name: "Language Transfer Turkish", url: "https://www.languagetransfer.org/complete-turkish", desc: "Free 44-lesson audio course" }, { name: "Turkish Tea Time archive", url: "https://turkishteatime.com", desc: "Podcast lessons" }],
  ms:  [{ name: "Malay Wikibooks", url: "https://en.wikibooks.org/wiki/Malay", desc: "Free open textbook" }, { name: "maL — Learn Malay", url: "https://mylanguages.org/learn_malay.php", desc: "Free grammar & vocab reference" }],
  ur:  [{ name: "Urdu Seekhiye (Rekhta)", url: "https://www.rekhta.org/urdudictionary", desc: "Free Urdu dictionary + literature" }, { name: "Urdu Wikibooks", url: "https://en.wikibooks.org/wiki/Urdu", desc: "Free open textbook incl. script" }],
  arz: [{ name: "Egyptian Arabic (Wikibooks)", url: "https://en.wikibooks.org/wiki/Arabic/Egyptian_Arabic", desc: "Free open textbook" }, { name: "Language Transfer Arabic", url: "https://www.languagetransfer.org/introduction-to-arabic", desc: "Free audio course (Egyptian)" }],
  cmn: [{ name: "Hacking Chinese resources", url: "https://www.hackingchinese.com/resources/", desc: "Curated free-resource catalogue" }, { name: "MDBG dictionary", url: "https://www.mdbg.net", desc: "Free CC-CEDICT dictionary" }],
  yue: [{ name: "CantoDict / Cantonese.org", url: "https://cantonese.org", desc: "Free Cantonese dictionary with Jyutping" }, { name: "Cantonese (Wikibooks)", url: "https://en.wikibooks.org/wiki/Cantonese", desc: "Free open textbook" }],
  ja:  [{ name: "Tae Kim's Guide", url: "https://guidetojapanese.org/learn/", desc: "Famous free grammar guide" }, { name: "Jisho", url: "https://jisho.org", desc: "Free Japanese dictionary" }, { name: "Irodori (Japan Foundation)", url: "https://www.irodori.jpf.go.jp/en/", desc: "Free official courseware" }],
  ko:  [{ name: "How to Study Korean", url: "https://www.howtostudykorean.com", desc: "Free in-depth grammar lessons" }, { name: "TTMIK free lessons", url: "https://talktomeinkorean.com/curriculum/", desc: "Free podcast curriculum (core lessons free)" }],
};
