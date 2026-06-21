import { useQuery } from '@tanstack/react-query';

import { fetchOnboardingData } from '@/features/profile/api';
import { useAuthStore } from '@/store/auth-store';

export const profileKeys = {
  onboarding: (userId: string) => ['onboarding', userId] as const,
};

export function useCurrentUserId(): string | undefined {
  return useAuthStore((s) => s.session?.user.id);
}

export function useOnboardingData() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: profileKeys.onboarding(userId ?? 'anonymous'),
    queryFn: () => fetchOnboardingData(userId as string),
    enabled: !!userId,
  });
}
