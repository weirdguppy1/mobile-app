import { type QuestionMeta } from '@/features/onboarding/config/questions';
import { type SectionDef, type SectionId } from '@/features/onboarding/config/sections';

export type FlowItem =
  | { kind: 'interstitial'; section: SectionId; key: string }
  | { kind: 'question'; questionId: string; key: string };

/** One interstitial per section, followed by that section's questions, in order. */
export function buildFlow(sections: SectionDef[], questions: QuestionMeta[]): FlowItem[] {
  const flow: FlowItem[] = [];
  for (const section of sections) {
    flow.push({ kind: 'interstitial', section: section.id, key: `section:${section.id}` });
    for (const q of questions.filter((q) => q.section === section.id)) {
      flow.push({ kind: 'question', questionId: q.id, key: `q:${q.id}` });
    }
  }
  return flow;
}

/** Forward one step (interstitials included), clamped to the last item. */
export function nextFlowIndex(flow: FlowItem[], index: number): number {
  return Math.min(index + 1, flow.length - 1);
}

/** Index of the nearest previous QUESTION (interstitials are forward-only), or null. */
export function prevQuestionIndex(flow: FlowItem[], index: number): number | null {
  for (let i = index - 1; i >= 0; i--) {
    if (flow[i].kind === 'question') return i;
  }
  return null;
}

/** Flow index of a question by id, or -1. */
export function flowIndexOfQuestion(flow: FlowItem[], id: string): number {
  return flow.findIndex((f) => f.kind === 'question' && f.questionId === id);
}
