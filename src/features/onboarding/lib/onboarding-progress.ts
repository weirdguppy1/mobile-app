import { OnboardingData } from '@/features/profile/types';

/** Index of the first step whose data is incomplete (the resume point). Returns
 *  the last index if every preceding step is complete. */
export function firstIncompleteIndex(
  steps: { isComplete: (data: OnboardingData) => boolean }[],
  data: OnboardingData,
): number {
  const idx = steps.findIndex((s) => !s.isComplete(data));
  return idx === -1 ? steps.length - 1 : idx;
}
