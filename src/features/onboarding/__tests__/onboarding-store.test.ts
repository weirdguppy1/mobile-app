import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';

describe('onboarding store', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ index: 0, celebrating: false });
  });

  it('defaults celebrating to false', () => {
    expect(useOnboardingStore.getState().celebrating).toBe(false);
  });

  it('setCelebrating toggles the flag', () => {
    useOnboardingStore.getState().setCelebrating(true);
    expect(useOnboardingStore.getState().celebrating).toBe(true);
  });
});
