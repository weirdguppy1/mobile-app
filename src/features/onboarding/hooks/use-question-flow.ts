// src/features/onboarding/hooks/use-question-flow.ts
import { QUESTIONS, type QuestionMeta } from '@/features/onboarding/config/questions';
import { SECTIONS, sectionById, type SectionDef } from '@/features/onboarding/config/sections';
import {
  buildFlow, flowIndexOfQuestion, nextFlowIndex, prevQuestionIndex, type FlowItem,
} from '@/features/onboarding/lib/flow';
import { sectionProgress } from '@/features/onboarding/lib/onboarding-progress';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';

// Built once — the manifest is static.
const FLOW: FlowItem[] = buildFlow(SECTIONS, QUESTIONS);

export interface QuestionFlow {
  data: ReturnType<typeof useOnboardingData>['data'];
  isLoading: boolean;
  isError: boolean;
  index: number;
  item: FlowItem;
  question: QuestionMeta | null;
  section: SectionDef;
  progress: { current: number; total: number } | null;
  goToIndex: (i: number) => void;
  goNext: () => void;
  goBack: () => void;
  canGoBack: boolean;
  goToQuestion: (id: string) => void;
}

/** Drives the immersive onboarding flow over the static FLOW list. Mirrors the old
 *  useOnboarding contract but walks interstitials + questions instead of steps. */
export function useQuestionFlow(): QuestionFlow {
  const index = useOnboardingStore((s) => s.index);
  const setIndex = useOnboardingStore((s) => s.setIndex);
  const query = useOnboardingData();

  const clamped = Math.min(Math.max(index, 0), FLOW.length - 1);
  const item = FLOW[clamped];
  const question = item.kind === 'question'
    ? QUESTIONS.find((q) => q.id === item.questionId) ?? null
    : null;
  const sectionIdOfItem = item.kind === 'interstitial' ? item.section : (question?.section ?? SECTIONS[0].id);
  const section = sectionById(sectionIdOfItem);
  const progress = question ? sectionProgress(QUESTIONS, question.id) : null;
  const prev = prevQuestionIndex(FLOW, clamped);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    index: clamped,
    item,
    question,
    section,
    progress,
    goToIndex: setIndex,
    goNext: () => setIndex(nextFlowIndex(FLOW, clamped)),
    goBack: () => { if (prev !== null) setIndex(prev); },
    canGoBack: prev !== null,
    goToQuestion: (id) => { const i = flowIndexOfQuestion(FLOW, id); if (i >= 0) setIndex(i); },
  };
}
