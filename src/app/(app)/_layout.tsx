import { Stack } from 'expo-router';

import { useOnboardingData } from '@/features/profile/hooks/use-profile';

export default function AppLayout() {
  const { data, isLoading } = useOnboardingData();

  // Hold while we learn whether onboarding is complete (splash already cleared).
  if (isLoading) return null;

  const complete = data?.profile.onboarding_complete ?? false;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Default landing route for the group. The Protected screens below are
          mounted conditionally, so without this expo-router has nothing to
          render at the group path after sign-in (blank screen). index redirects
          to the right screen by completeness. */}
      <Stack.Screen name="index" />
      <Stack.Protected guard={!complete}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={complete}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
    </Stack>
  );
}
