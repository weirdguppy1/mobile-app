import { useMutation } from '@tanstack/react-query';

import { sendConnectionRequest, skipProfile } from '@/features/discovery/api';
import { RequestTarget } from '@/features/discovery/types';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

/**
 * Send-request and skip mutations for the browse feed. These intentionally do NOT
 * invalidate the feed query: the screen iterates a local snapshot and advances
 * itself, then refetches when low — invalidating here would reset the profile the
 * user is mid-browse on. Persisted likes/passes are excluded on the next refetch.
 */
export function useDiscoveryActions() {
  const userId = useCurrentUserId() as string;

  const sendRequest = useMutation({
    mutationFn: ({ likeeId, target, note }: { likeeId: string; target: RequestTarget; note: string }) =>
      sendConnectionRequest({ likerId: userId, likeeId, target, note }),
  });

  const skip = useMutation({
    mutationFn: (passeeId: string) => skipProfile(userId, passeeId),
  });

  return { sendRequest, skip };
}
