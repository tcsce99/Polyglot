import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS module shared with the Node pipeline
import { bandForRank, cleanGloss, joinGlosses, learnerRoman, levelForSentence, normalizeToken, tagSentence, tokenize } from '../scripts/data/lib.mjs';

describe('content pipeline helpers', () => {
  it('maps frequency rank to CEFR bands', () => {
    expect([0, 599, 600, 1199, 2199, 3499, 4999, 5000].map(bandForRank)).toEqual([0, 0, 1, 1, 2, 3, 4, 5]);
  });
  it('normalises tokens across scripts', () => {
    expect(normalizeToken('¿Cómo', 'spa')).toBe('cómo');
    expect(normalizeToken('كِتاب', 'pes')).toBe('کتاب');
    expect(normalizeToken('ه', 'urd')).toBe('ہ');
  });
  it('tokenises Maltese articles and apostrophes apart from their nouns', () => {
    expect(tokenize("Il-kelb m'għandux ikel.", 'mlt')).toEqual(['il', 'kelb', 'm', 'għandux', 'ikel']);
    expect(tokenize('من کتاب را خواندم.', 'pes')).toEqual(['من', 'کتاب', 'را', 'خواندم']);
  });
  it('levels sentences by their hardest common words and by length', () => {
    expect(levelForSentence([1, 5, 20], 3)).toBe(0);
    expect(levelForSentence([1, 5, 4000], 3)).toBe(4);
    expect(levelForSentence([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 12)).toBe(2);
    expect(levelForSentence([undefined, undefined, 3], 3)).toBe(0); // too few known words → by length
  });
  it('cleans glosses and rejects grammatical descriptions', () => {
    expect(cleanGloss('house (a building for living in, typically for a family)')).toBe('house');
    expect(cleanGloss('marks the genitive case: of, belonging to')).toBe('of, belonging to');
    expect(cleanGloss('Used to express indifference or sarcasm')).toBe('');
    expect(joinGlosses(['and', 'And', 'plus'])).toBe('and; plus');
  });
  it('converts scholarly romanisation to the learner scheme', () => {
    expect(learnerRoman('nižād / nežâd', 'pes')).toBe('nezhâd');
    expect(learnerRoman('xod-koši kardan', 'pes')).toBe('khod-koshi kardan');
    expect(learnerRoman('taśkīl', 'urd')).toBe('tashkīl');
  });
  it('tags sentences with grammatical categories, falling back to reading', () => {
    expect(tagSentence('¿Dónde vives?', 'spa')).toContain('questions');
    expect(tagSentence('No tengo nada.', 'spa')).toContain('negation');
    expect(tagSentence('میں نے کتاب پڑھی۔', 'urd')).toContain('ergative-ne');
    expect(tagSentence('Ma nafx.', 'mlt')).toContain('negation');
    expect(tagSentence('Hola.', 'spa')).toEqual(['reading']);
  });
});
