import { Stack } from 'expo-router';

import { useOnboardingData } from '@/features/profile/hooks/use-profile';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';

export default function AppLayout() {
  const { data, isLoading } = useOnboardingData();
  const celebrating = useOnboardingStore((s) => s.celebrating);

  // Hold while we learn whether onboarding is complete. Rendering the protected
  // branches before this resolves can bounce between unavailable routes.
  if (isLoading && !data) return null;

  // Stay in onboarding while the completion celebration plays, so its confetti
  // overlay (rendered inside the onboarding screen) isn't torn down early.
  const complete = (data?.profile.onboarding_complete ?? false) && !celebrating;

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
