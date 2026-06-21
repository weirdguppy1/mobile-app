import { useState } from 'react';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { DEAL_BREAKERS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { OptionGroup } from '@/shared/components';

export function DealBreakersStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const [dealBreakers, setDealBreakers] = useState<string[]>(data?.profile.deal_breakers ?? []);

  const onNext = async () => {
    await saveProfile.mutateAsync({ deal_breakers: dealBreakers });
    goNext();
  };

  return (
    <StepShell canAdvance onNext={onNext} saving={saveProfile.isPending}>
      <OptionGroup multiple options={DEAL_BREAKERS} value={dealBreakers} onChange={setDealBreakers} />
    </StepShell>
  );
}
