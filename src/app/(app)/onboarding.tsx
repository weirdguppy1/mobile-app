import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, data, isLoading, isError } = useOnboarding();

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
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="prose-subtitle text-center">Couldn't load your profile. Pull to retry or restart the app.</Text>
      </View>
    );
  }

  const StepComponent = step.Component;
  return <StepComponent />;
}
