import { type StepId } from '@/features/onboarding/config/steps';

/** Emotional background tone per onboarding category (TASK.md §5). */
export type Tone = 'warm' | 'cool' | 'neutral';

const TONE_BY_STEP: Record<StepId, Tone> = {
  basics: 'neutral',
  compatibility: 'cool', // sleep / living habits
  lifestyle: 'warm',
  interests: 'neutral',
  dealBreakers: 'neutral',
  prompts: 'warm', // expressive / personality
  photos: 'neutral',
  extras: 'neutral',
  review: 'warm', // celebratory lead-in to completion
};

export function toneFor(stepId: StepId): Tone {
  return TONE_BY_STEP[stepId];
}
