import { useQuery } from '@tanstack/react-query';

import { fetchConversations } from '@/features/messaging/api';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export const messagingKeys = {
  conversations: (userId: string) => ['conversations', userId] as const,
  thread: (matchId: string) => ['thread', matchId] as const,
};

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
