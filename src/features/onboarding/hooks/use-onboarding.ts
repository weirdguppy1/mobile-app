import { STEPS } from '@/features/onboarding/config/steps';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';

/** Drives wizard navigation. Data persistence happens inside each step via
 *  mutations; this hook only reads/advances the index. The one-time resume to
 *  the first incomplete step lives in OnboardingScreen (the single component
 *  that owns the flow), NOT here — every step component and StepShell consume
 *  this hook and remount on each navigation, so a resume effect here would
 *  re-fire on every mount and bounce the user forward, breaking the Back button. */
export function useOnboarding() {
  const index = useOnboardingStore((s) => s.index);
  const setIndex = useOnboardingStore((s) => s.setIndex);
  const query = useOnboardingData();

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
