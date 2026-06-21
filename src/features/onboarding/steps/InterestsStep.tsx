import { useState } from 'react';
import { Text, View } from 'react-native';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { INTERESTS, INTERESTS_LIMITS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { interestsSchema } from '@/features/profile/schema';
import { OptionGroup } from '@/shared/components';

export function InterestsStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const [interests, setInterests] = useState<string[]>(data?.profile.interests ?? []);
  const result = interestsSchema.safeParse({ interests });

  const onNext = async () => {
    if (!result.success) return;
    await saveProfile.mutateAsync({ interests });
    goNext();
  };

  return (
    <StepShell canAdvance={result.success} onNext={onNext} saving={saveProfile.isPending}>
      <View className="flex-row justify-between">
        <Text className="prose-footnote text-slate">Pick {INTERESTS_LIMITS.min}–{INTERESTS_LIMITS.max}</Text>
        <Text className="prose-footnote font-semibold text-ink">{interests.length} selected</Text>
      </View>
      <OptionGroup multiple options={INTERESTS} value={interests} onChange={setInterests} min={INTERESTS_LIMITS.min} max={INTERESTS_LIMITS.max} />
    </StepShell>
  );
}
