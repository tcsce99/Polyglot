// Grammatical category taxonomy (SPEC §5): shared core + language-specific extensions.
// Every exercise result and every AI-detected error maps to one or more of these ids.
import type { LangId } from '../src/core/types';

export const SHARED: Record<string, string> = {
  greetings: 'Greetings & set phrases',
  vocabulary: 'Vocabulary',
  'vocab-nouns': 'Vocabulary: nouns',
  'vocab-verbs': 'Vocabulary: verbs',
  'vocab-adj': 'Vocabulary: adjectives & adverbs',
  'vocab-function': 'Vocabulary: function words',
  pronunciation: 'Pronunciation',
  spelling: 'Spelling & script',
  reading: 'Reading comprehension',
  listening: 'Listening',
  'word-order': 'Word order',
  negation: 'Negation',
  questions: 'Questions',
  pronouns: 'Pronouns',
  'articles-gender': 'Articles, gender & agreement',
  plurals: 'Plurals',
  adjectives: 'Adjectives',
  'numbers-time': 'Numbers, dates & time',
  present: 'Present tense',
  past: 'Past tenses',
  future: 'Future',
  aspect: 'Aspect: progressive & habitual',
  imperative: 'Commands & requests',
  modals: 'Ability, obligation & wanting',
  comparatives: 'Comparison',
  possession: 'Possession',
  prepositions: 'Prepositions & location',
  conditionals: 'Conditionals',
  'relative-clauses': 'Relative clauses',
  subordination: 'Connectors & subordinate clauses',
  passive: 'Passive & impersonal',
  'reported-speech': 'Reported speech',
  register: 'Register & politeness',
  idioms: 'Idioms & collocations',
  discourse: 'Discourse & argumentation',
};

export const EXTRA: Record<LangId, Record<string, string>> = {
  spa: {
    'ser-estar': 'Ser vs. estar', 'gustar-verbs': 'Gustar-type verbs', reflexives: 'Reflexive verbs',
    'preterite-imperfect': 'Preterite vs. imperfect', 'por-para': 'Por vs. para',
    'object-pronouns': 'Object pronouns', subjunctive: 'Subjunctive',
  },
  urd: {
    postpositions: 'Postpositions & oblique case', 'ergative-ne': 'Ergative نے', 'compound-verbs': 'Compound verbs',
    izafat: 'Izafat & Perso-Arabic vocabulary', subjunctive: 'Subjunctive',
  },
  pes: {
    ezafe: 'Ezâfe', 'ra-marker': 'Object marker را', 'verb-prefix-mi': 'می‌ present & imperfect',
    'compound-verbs': 'Compound verbs', enclitics: 'Pronoun endings', colloquial: 'Spoken vs. written Persian', subjunctive: 'Subjunctive',
  },
  mlt: {
    'article-assimilation': 'The article & sun letters', 'verb-forms': 'Derived verb forms',
    'pronominal-suffixes': 'Attached pronouns', 'loan-verbs': 'Romance & English verbs',
  },
};

export function categoriesFor(lang: LangId): Record<string, string> {
  return { ...SHARED, ...EXTRA[lang] };
}
export function catLabel(lang: LangId, id: string): string {
  return categoriesFor(lang)[id] ?? id;
}
