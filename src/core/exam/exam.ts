// Level exam scoring, modelled on how CEFR exams (DELE, SIELE, MFL…) are structured:
// separate skills, each must reach a floor, and an overall pass mark.
export type SectionId = 'vocabulary' | 'grammar' | 'reading' | 'writing' | 'listening' | 'speaking';

export interface SectionResult { id: SectionId; score: number | null; note?: string } // null = not assessed

export const SECTION_WEIGHT: Record<SectionId, number> = { vocabulary: 1, grammar: 1.5, reading: 1.5, writing: 1.5, listening: 1, speaking: 1 };
export const SECTION_LABEL: Record<SectionId, string> = {
  vocabulary: 'Vocabulary', grammar: 'Grammar', reading: 'Reading', writing: 'Writing', listening: 'Listening', speaking: 'Speaking',
};
export const PASS_OVERALL = 0.7;
export const PASS_FLOOR = 0.5;

export interface ExamOutcome { overall: number; passed: boolean; complete: boolean; assessed: SectionId[]; skipped: SectionId[]; failedFloor: SectionId[] }

export function scoreExam(sections: SectionResult[]): ExamOutcome {
  const taken = sections.filter((s) => s.score !== null);
  const wsum = taken.reduce((a, s) => a + SECTION_WEIGHT[s.id], 0);
  const overall = wsum ? taken.reduce((a, s) => a + SECTION_WEIGHT[s.id] * (s.score as number), 0) / wsum : 0;
  const failedFloor = taken.filter((s) => (s.score as number) < PASS_FLOOR).map((s) => s.id);
  const skipped = sections.filter((s) => s.score === null).map((s) => s.id);
  return {
    overall, passed: taken.length > 0 && overall >= PASS_OVERALL && failedFloor.length === 0,
    complete: skipped.length === 0, assessed: taken.map((s) => s.id), skipped, failedFloor,
  };
}
