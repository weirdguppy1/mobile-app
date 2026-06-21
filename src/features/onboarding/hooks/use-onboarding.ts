import { useEffect } from 'react';

import { STEPS } from '@/features/onboarding/config/steps';
import { firstIncompleteIndex } from '@/features/onboarding/lib/onboarding-progress';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';

/** Drives wizard navigation and resume. Data persistence happens inside each
 *  step via mutations; this hook only advances the index. */
export function useOnboarding() {
  const index = useOnboardingStore((s) => s.index);
  const setIndex = useOnboardingStore((s) => s.setIndex);
  const query = useOnboardingData();

  // On first successful load, jump to the first incomplete step.
  useEffect(() => {
    if (query.data) setIndex(firstIncompleteIndex(STEPS, query.data));
    // run once per fresh data load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.profile.id]);

  const total = STEPS.length;
  const step = STEPS[Math.min(Math.max(index, 0), STEPS.length - 1)];

  const goNext = () => {
    if (index < total - 1) setIndex(index + 1);
  };
  const goBack = () => {
    if (index > 0) setIndex(index - 1);
  };
  const skip = goNext;

  return {
    index, step, total, setIndex,
    data: query.data, isLoading: query.isLoading, isError: query.isError,
    goNext, goBack, skip, canGoBack: index > 0,
  };
}
