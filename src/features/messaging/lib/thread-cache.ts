import { Message, MessageReaction, MessageWithReactions } from '@/features/messaging/types';

/** Insert a message (chronological) or merge fields into an existing one (e.g. a
 *  read_at update), preserving its reactions. Dedupes by id. */
export function upsertMessage(list: MessageWithReactions[], row: Message): MessageWithReactions[] {
  const idx = list.findIndex((m) => m.id === row.id);
  if (idx === -1) {
    const next = [...list, { ...row, reactions: [] }];
    next.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return next;
  }
  const next = [...list];
  next[idx] = { ...next[idx], ...row };
  return next;
}

export function removeMessage(list: MessageWithReactions[], id: string): MessageWithReactions[] {
  return list.filter((m) => m.id !== id);
}

/** Add or replace a user's reaction on its message (one reaction per user per message). */
export function applyReaction(list: MessageWithReactions[], r: MessageReaction): MessageWithReactions[] {
  return list.map((m) =>
    m.id !== r.message_id
      ? m
      : { ...m, reactions: [...m.reactions.filter((x) => x.user_id !== r.user_id), r] },
  );
}

export function removeReaction(
  list: MessageWithReactions[],
  messageId: string,
  userId: string,
): MessageWithReactions[] {
  return list.map((m) =>
    m.id !== messageId ? m : { ...m, reactions: m.reactions.filter((x) => x.user_id !== userId) },
  );
}
