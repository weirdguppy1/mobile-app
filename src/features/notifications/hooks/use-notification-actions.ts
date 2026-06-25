import { useMutation, useQueryClient } from '@tanstack/react-query';

import { acceptRequest, declineRequest, markAllNotificationsRead } from '@/features/notifications/api';
import { notificationKeys } from '@/features/notifications/hooks/use-notifications';
import { messagingKeys } from '@/features/messaging/hooks/use-conversations';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export function useNotificationActions() {
  const userId = useCurrentUserId() as string;
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: notificationKeys.list(userId) });
    // Accepting a request creates a match → it appears in the conversations list.
    qc.invalidateQueries({ queryKey: messagingKeys.conversations(userId) });
  };

  const markRead = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.list(userId) }),
  });

  const accept = useMutation({
    mutationFn: (requesterId: string) => acceptRequest(userId, requesterId),
    onSuccess: invalidate,
  });

  const decline = useMutation({
    mutationFn: ({ requesterId, notificationId }: { requesterId: string; notificationId: string }) =>
      declineRequest(userId, requesterId, notificationId),
    onSuccess: invalidate,
  });

  return { markRead, accept, decline };
}
