import { type QuestionMeta } from '@/features/onboarding/config/questions';
import { OnboardingData } from '@/features/profile/types';

/** Index in `questions` of the first one whose data is incomplete; the last index
 *  if all are complete (the review question, which never auto-completes). */
export function firstIncompleteQuestion(questions: QuestionMeta[], data: OnboardingData): number {
  const idx = questions.findIndex((q) => !q.isComplete(data));
  return idx === -1 ? questions.length - 1 : idx;
}

/** Section-local position of a question: 1-based `current` of `total` in its section. */
export function sectionProgress(questions: QuestionMeta[], questionId: string): { current: number; total: number } {
  const q = questions.find((q) => q.id === questionId);
  if (!q) return { current: 0, total: 0 };
  const inSection = questions.filter((other) => other.section === q.section);
  return { current: inSection.findIndex((other) => other.id === questionId) + 1, total: inSection.length };
}
