import { Redirect } from 'expo-router';

import { useOnboardingData } from '@/features/profile/hooks/use-profile';

/**
 * (app) entry route. The group's gated screens (onboarding / (main)) are mounted
 * conditionally via Stack.Protected, which leaves expo-router with no default
 * screen to render at the group path — so a bare sign-in lands on a blank screen.
 * This index is the concrete default: it redirects to the right place based on
 * onboarding completeness. The Stack.Protected guards in _layout still enforce
 * which screens are reachable; this only resolves where to land.
 */
export default function AppIndex() {
  const { data } = useOnboardingData();

  return <Redirect href={data?.profile.onboarding_complete ? '/discover' : '/onboarding'} />;
}
