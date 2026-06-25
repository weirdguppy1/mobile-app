import { useQueryClient, useQuery } from '@tanstack/react-query';

import { fetchNotifications } from '@/features/notifications/api';
import { useRealtimeChannel } from '@/features/messaging/hooks/use-realtime-channel';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export const notificationKeys = {
  list: (userId: string) => ['notifications', userId] as const,
};

export function useNotifications() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: notificationKeys.list(userId ?? 'anonymous'),
    queryFn: () => fetchNotifications(userId as string),
    enabled: !!userId,
  });
}

/** Total unread — feeds the bell badge. */
export function useUnreadNotificationCount(): number {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.read).length;
}

/** Keep notifications live: any change to my rows refreshes the list + badge.
 *  RLS scopes the stream to the current user's notifications. */
export function useNotificationsRealtime() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  useRealtimeChannel(userId ? `notifications:${userId}` : null, (channel) => {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => {
        if (userId) qc.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      },
    );
  });
}
