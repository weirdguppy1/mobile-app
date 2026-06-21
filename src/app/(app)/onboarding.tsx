import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { STEP_COMPONENTS } from '@/features/onboarding/config/step-components';
import { STEPS } from '@/features/onboarding/config/steps';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { firstIncompleteIndex } from '@/features/onboarding/lib/onboarding-progress';

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, data, isLoading, isError, setIndex } = useOnboarding();

  // Resume to the first incomplete step once per fresh data load. This lives
  // on the screen (mounted once for the whole flow) rather than in
  // useOnboarding — the per-step consumers of that hook remount on every
  // navigation, so a resume effect there would override Back/Next.
  useEffect(() => {
    if (data) setIndex(firstIncompleteIndex(STEPS, data));
    // run once per fresh data load (keyed on profile id), not on every refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.profile.id]);

  // When the profile flips to complete, leave onboarding for the app.
  useEffect(() => {
    if (data?.profile.onboarding_complete) router.replace('/discover');
  }, [data?.profile.onboarding_complete, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#000000" />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-12">
        <Text className="prose-subtitle text-center">Couldn't load your profile. Pull to retry or restart the app.</Text>
      </View>
    );
  }

  const StepComponent = STEP_COMPONENTS[step.id];
  return <StepComponent />;
}
