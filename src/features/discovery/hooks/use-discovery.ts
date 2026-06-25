import { useQuery } from '@tanstack/react-query';

import { fetchDiscoveryFeed } from '@/features/discovery/api';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export const discoveryKeys = {
  feed: (userId: string) => ['discovery-feed', userId] as const,
};

/** The browse-feed batch. The screen iterates a snapshot of `data` locally and
 *  calls `refetch()` when it runs low, so a long staleTime is fine here. */
export function useDiscoveryFeed() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: discoveryKeys.feed(userId ?? 'anonymous'),
    queryFn: () => fetchDiscoveryFeed(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
