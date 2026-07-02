# Learning Science the App Must Implement

Each method below maps to a concrete feature. Don't add gimmicks that don't map to one of these.

## 1. Spaced Repetition (FSRS)
- Evidence: spacing effect is the most replicated finding in memory research.
- Implementation: ts-fsrs schedules every item forever. Review is the backbone of every session (~60%).

## 2. Active Recall / Retrieval Practice
- Testing beats re-reading. All exercises require production or recognition under uncertainty — no passive "mark as read" lessons.
- Prefer production (type/speak the answer) over recognition (multiple choice) as mastery grows.

## 3. Comprehensible Input (i+1)
- Tutor conversations and reading passages stay just above current level: session generator passes the learner's known-word list to the AI so ~90–95% of tutor output is known vocabulary.

## 4. Sentence Mining / Chunking
- Vocabulary is always taught inside sentences (Tatoeba), never as isolated word pairs after A0. Collocations and chunks are first-class items.

## 5. Shadowing & Output Practice
- Listen → repeat → get scored. Pronunciation exercises are built on this loop. Speaking early and often (output hypothesis).

## 6. Interleaving
- Review sessions deliberately mix categories and item types rather than blocking one topic — harder in the moment, better retention.

## 7. Immediate, Specific Feedback
- Every error gets a category-tagged explanation (AI grammar JSON). Recasts in conversation (tutor repeats the corrected form naturally) plus explicit correction on request.

## 8. Desirable Difficulty & Adaptive Challenge
- Session accuracy target band: 75–85%. Below → easier/remedial items; above → introduce new material sooner.

## 9. Deliberate Practice on Weaknesses
- 25% of every session targets the learner's lowest-mastery categories specifically.

## 10. Cloze Deletion
- Core exercise type for grammar-in-context; proven for L2 grammar acquisition.

## 11. Dual Coding
- Pair audio + text (+ script-specific aids: furigana, pinyin, jyutping, harakat, stress marks) on new items; fade the aids as mastery grows.

## 12. Habit Loop / Consistency
- Streaks, daily goal, review forecast — small daily sessions beat cramming. (No dark patterns: no punishment mechanics, no fake urgency.)
