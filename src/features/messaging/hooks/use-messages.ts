import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearReaction, fetchThread, markRead, sendMessage, setReaction } from '@/features/messaging/api';
import { messagingKeys } from '@/features/messaging/hooks/use-conversations';
import { applyReaction, removeMessage, removeReaction, upsertMessage } from '@/features/messaging/lib/thread-cache';
import { MessageReaction, MessageWithReactions } from '@/features/messaging/types';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export function useThread(matchId: string) {
  return useQuery({
    queryKey: messagingKeys.thread(matchId),
    queryFn: () => fetchThread(matchId),
    enabled: !!matchId,
  });
}

/** Send a message with an optimistic temp bubble; reconciled with the real row on
 *  success (and deduped against the realtime echo by id). */
export function useSendMessage(matchId: string) {
  const userId = useCurrentUserId() as string;
  const qc = useQueryClient();
  const key = messagingKeys.thread(matchId);

  return useMutation({
    mutationFn: (body: string) => sendMessage(matchId, userId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key });
      const tempId = `temp-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const temp: MessageWithReactions = {
        id: tempId, match_id: matchId, sender_id: userId, body: body.trim(),
        created_at: new Date().toISOString(), read_at: null, reactions: [],
      };
      qc.setQueryData<MessageWithReactions[]>(key, (old = []) => upsertMessage(old, temp));
      return { tempId };
    },
    onError: (_e, _body, ctx) => {
      if (ctx?.tempId) qc.setQueryData<MessageWithReactions[]>(key, (old = []) => removeMessage(old, ctx.tempId));
    },
    onSuccess: (real, _body, ctx) => {
      qc.setQueryData<MessageWithReactions[]>(key, (old = []) =>
        upsertMessage(ctx?.tempId ? removeMessage(old, ctx.tempId) : old, real));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: messagingKeys.conversations(userId) }),
  });
}

export function useMarkRead(matchId: string) {
  const userId = useCurrentUserId() as string;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markRead(matchId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagingKeys.conversations(userId) }),
  });
}

/** Set/clear my reaction on a message (optimistic; realtime confirms idempotently). */
export function useReactionMutations(matchId: string) {
  const userId = useCurrentUserId() as string;
  const qc = useQueryClient();
  const key = messagingKeys.thread(matchId);

  const set = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      setReaction(messageId, matchId, userId, emoji),
    onMutate: ({ messageId, emoji }) => {
      const optimistic: MessageReaction = {
        message_id: messageId, match_id: matchId, user_id: userId, emoji,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<MessageWithReactions[]>(key, (old = []) => applyReaction(old, optimistic));
    },
  });

  const clear = useMutation({
    mutationFn: ({ messageId }: { messageId: string }) => clearReaction(messageId, userId),
    onMutate: ({ messageId }) => {
      qc.setQueryData<MessageWithReactions[]>(key, (old = []) => removeReaction(old, messageId, userId));
    },
  });

  return { set, clear };
}
