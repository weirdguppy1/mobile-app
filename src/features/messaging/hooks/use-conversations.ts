import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchConversations } from '@/features/messaging/api';
import { useRealtimeChannel } from '@/features/messaging/hooks/use-realtime-channel';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export const messagingKeys = {
  conversations: (userId: string) => ['conversations', userId] as const,
  thread: (matchId: string) => ['thread', matchId] as const,
};

/** Keep the conversations list (previews + unread) live: any message change in one of
 *  my matches refreshes it (RLS scopes the stream to my own matches). Mount once where
 *  it should stay live — e.g. the tab bar, so the Messages badge updates from any tab. */
export function useConversationsRealtime() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  useRealtimeChannel(userId ? 'conversations' : null, (channel) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      if (userId) qc.invalidateQueries({ queryKey: messagingKeys.conversations(userId) });
    });
  });
}

export function useConversations() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: messagingKeys.conversations(userId ?? 'anonymous'),
    queryFn: () => fetchConversations(userId as string),
    enabled: !!userId,
  });
}

/** Total unread across all conversations — feeds the Messages tab badge. */
export function useUnreadCount(): number {
  const { data } = useConversations();
  return (data ?? []).reduce((sum, c) => sum + c.unread, 0);
}
