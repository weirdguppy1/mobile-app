import { Stack } from 'expo-router';

import { useOnboardingData } from '@/features/profile/hooks/use-profile';

export default function AppLayout() {
  const { data, isLoading } = useOnboardingData();

  // Hold while we learn whether onboarding is complete (splash already cleared).
  if (isLoading) return null;

  const complete = data?.profile.onboarding_complete ?? false;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!complete}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={complete}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
    </Stack>
  );
}
