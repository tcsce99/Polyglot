# Free & Open Data Sources

All content must come from openly licensed sources. The content pipeline (`scripts/data/`) must record source + license per item and generate a CREDITS page. Verify each license at build time — licenses listed below should be re-checked before shipping.

## Cross-Language (all 12)

| Source | What | License / Notes |
|--------|------|-----------------|
| **Tatoeba** (tatoeba.org exports) | Millions of example sentences + translations, some with audio | CC-BY 2.0 FR (per-sentence attribution) |
| **Wiktionary via Kaikki.org** | Dictionary entries, definitions, IPA, inflection tables — machine-readable JSON dumps | CC-BY-SA |
| **Mozilla Common Voice** | Crowd-recorded native speech clips | CC0 — best source for listening items |
| **Lingua Libre** (lingualibre.org) | Word-level pronunciation recordings | CC-BY-SA |
| **Universal Dependencies** treebanks | Grammatically annotated sentences — gold data for auto-tagging sentences with categories | mostly CC-BY-SA |
| **Wikipedia/Wikibooks language courses** | Grammar explanations to adapt into micro-lessons | CC-BY-SA |
| **CC-licensed frequency lists** (OpenSubtitles-derived, e.g. hermitdave/FrequencyWords) | Word frequency ranking for ordering vocab | CC-BY-SA |
| **AnkiWeb shared decks** | Check license per deck — many are not redistributable; use only clearly CC/public-domain decks | varies — verify each |
| **LibreLingo** (github.com/LibreLingo) | Open-source course data + exercise format ideas | AGPL code / CC content |

## Per-Language

| Lang | Key extra sources |
|------|-------------------|
| **Urdu (urd)** | Urdu Lughat (reference only), Rekhta (reference only — check ToS), UD Urdu treebank, Wiktionary Urdu entries, CC frequency lists. Nastaliq font: Noto Nastaliq Urdu (OFL) |
| **Egyptian Arabic (arz)** | Egyptian Arabic Wikipedia (arz.wikipedia.org, CC-BY-SA) — one of the few large written dialect corpora; Kaikki Egyptian Arabic entries; Tatoeba has a dedicated `arz` sentence set; Lisaan Masry (reference only — check ToS before ingesting); MADAR corpus (research license — verify) |
| **Mandarin (cmn)** | **CC-CEDICT** dictionary (CC-BY-SA), pinyin via pinyin libraries, HSK vocab lists (check license; recreate from frequency data if unclear), Tatoeba cmn audio |
| **Cantonese (yue)** | **CC-Canto** (CC-BY-SA, CEDICT-format Cantonese dict with jyutping), words.hk (CC-BY 4.0 non-commercial variant — verify), HKCanCor corpus |
| **Spanish / French / German (spa/fra/deu)** | Richest Tatoeba + Common Voice coverage; UD treebanks; Wikibooks grammar |
| **Malay (zsm)** | Kaikki Malay, Tatoeba zsm, UD Malay data is thin — lean on Wiktionary inflection data (Malay morphology is affix-regular, generate drills programmatically) |
| **Russian (rus)** | **OpenRussian** (openrussian.org dumps, CC-BY-SA) — stressed forms, declension tables; UD Russian SynTagRus |
| **Turkish (tur)** | UD Turkish treebanks, Kaikki Turkish (suffix chains), Common Voice Turkish is large |
| **Japanese (jpn)** | **JMdict/JMnedict** (EDRDG license, free with attribution), **KanjiDic2**, Tatoeba jpn (huge, many audio), furigana via kuromoji/kuroshiro |
| **Korean (kor)** | **KEngDic** / kaikki Korean, National Institute of Korean Language open data (check terms), Tatoeba kor |

## AI / Speech

| Need | Free option |
|------|-------------|
| STT | Web Speech API (free, on-device on Android/Chrome; supports all 12 locales to varying quality) |
| STT fallback | OpenAI Whisper (open weights) self-hosted on the serverless tier, or whisper.cpp WASM in-browser for short clips |
| TTS fallback | Web Speech synthesis; Piper TTS (MIT, open voices) for pre-generating audio at build time |
| Grammar/conversation | Claude API (paid per token — the only non-free runtime dependency; keep prompts tight, cache system prompts) |
| Tone analysis | Implement pitch tracking directly (autocorrelation/YIN) — no external service needed |

## Rules for the Pipeline

1. Never ingest a source without confirming its license permits redistribution.
2. "Reference only" sources above can inform lesson writing but must not be copied.
3. Store `{source, license, url}` metadata on every content item.
4. Prefer CC0 > CC-BY > CC-BY-SA; avoid NC-licensed data (blocks future monetization).
