import { type ComponentType } from 'react';

import { type StepId } from '@/features/onboarding/config/steps';
import { BasicsStep } from '@/features/onboarding/steps/BasicsStep';
import { CompatibilityStep } from '@/features/onboarding/steps/CompatibilityStep';
import { DealBreakersStep } from '@/features/onboarding/steps/DealBreakersStep';
import { ExtrasStep } from '@/features/onboarding/steps/ExtrasStep';
import { InterestsStep } from '@/features/onboarding/steps/InterestsStep';
import { LifestyleStep } from '@/features/onboarding/steps/LifestyleStep';
import { PhotosStep } from '@/features/onboarding/steps/PhotosStep';
import { PromptsStep } from '@/features/onboarding/steps/PromptsStep';
import { ReviewStep } from '@/features/onboarding/steps/ReviewStep';

/** Maps each step to its screen. Kept separate from ./steps (the data manifest)
 *  so the step files can import useOnboarding without forming a require cycle.
 *  Only the onboarding route renderer imports this — it is a graph leaf. */
export const STEP_COMPONENTS: Record<StepId, ComponentType> = {
  basics: BasicsStep,
  compatibility: CompatibilityStep,
  lifestyle: LifestyleStep,
  interests: InterestsStep,
  dealBreakers: DealBreakersStep,
  prompts: PromptsStep,
  photos: PhotosStep,
  extras: ExtrasStep,
  review: ReviewStep,
};
