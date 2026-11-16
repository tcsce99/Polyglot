import type { LangId } from './types';

export interface LangMeta {
  id: LangId; name: string; native: string; flag: string; bcp47: string; rtl: boolean;
  /** Web Speech recognition is generally unavailable for Maltese; the tutor falls back to the server (Whisper). */
  browserStt: boolean;
  /** Typing answers in native script is opt-in for Arabic-script languages (many learners lack the keyboard). */
  typeByDefault: boolean;
  officialExams: string;
  blurb: string;
}

export const LANGS: Record<LangId, LangMeta> = {
  mlt: {
    id: 'mlt', name: 'Maltese', native: 'Malti', flag: '🇲🇹', bcp47: 'mt-MT', rtl: false, browserStt: false, typeByDefault: true,
    officialExams: 'Maltese as a Foreign Language (MFL) certificates, levels A1–B2, from the University of Malta / Ministry for Education; SEC and MATSEC Maltese for higher levels.',
    blurb: 'A Semitic language written in Latin script, with deep Sicilian, Italian and English layers.',
  },
  urd: {
    id: 'urd', name: 'Urdu', native: 'اردو', flag: '🇵🇰', bcp47: 'ur-PK', rtl: true, browserStt: true, typeByDefault: false,
    officialExams: 'No CEFR exam exists; the closest international measures are the ACTFL OPI/WPT (Urdu) and the ILR-based DLPT.',
    blurb: 'Written right-to-left in Nastaliq; verb-final, with postpositions and split ergativity.',
  },
  pes: {
    id: 'pes', name: 'Persian', native: 'فارسی', flag: '🇮🇷', bcp47: 'fa-IR', rtl: true, browserStt: true, typeByDefault: false,
    officialExams: 'SAMFA (the Iranian standard Persian proficiency test) and AMFA (Ferdowsi University); ACTFL OPI is offered for Persian.',
    blurb: 'Iranian Persian (Farsi): no grammatical gender, the ezâfe link, and a big gap between written and spoken forms.',
  },
  spa: {
    id: 'spa', name: 'Spanish', native: 'Español', flag: '🇪🇸', bcp47: 'es-ES', rtl: false, browserStt: true, typeByDefault: true,
    officialExams: 'DELE (Instituto Cervantes, A1–C2) and SIELE (online, points mapped to CEFR).',
    blurb: 'Two verbs for “to be”, two past tenses, and the subjunctive — all the way to C1.',
  },
};
export const LANG_IDS = Object.keys(LANGS) as LangId[];
