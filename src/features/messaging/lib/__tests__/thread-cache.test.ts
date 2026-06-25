import { applyReaction, removeMessage, removeReaction, upsertMessage } from '@/features/messaging/lib/thread-cache';
import { Message, MessageReaction, MessageWithReactions } from '@/features/messaging/types';

const msg = (id: string, created_at: string, over: Partial<Message> = {}): MessageWithReactions => ({
  id, match_id: 'm', sender_id: 's', body: 'hi', created_at, read_at: null, reactions: [], ...over,
});
const reaction = (messageId: string, userId: string, emoji: string): MessageReaction => ({
  message_id: messageId, match_id: 'm', user_id: userId, emoji, created_at: '2024-01-01T00:00:00Z',
});

describe('upsertMessage', () => {
  it('appends a new message in chronological order', () => {
    const list = [msg('a', '2024-01-01T00:00:01Z')];
    const out = upsertMessage(list, msg('b', '2024-01-01T00:00:00Z'));
    expect(out.map((m) => m.id)).toEqual(['b', 'a']);
  });

  it('dedupes by id and merges fields while preserving reactions', () => {
    const existing: MessageWithReactions = { ...msg('a', '2024-01-01T00:00:00Z'), reactions: [reaction('a', 'u', '❤️')] };
    // A realtime/DB row is a plain Message (no `reactions` key) — merging must keep them.
    const updateRow: Message = { id: 'a', match_id: 'm', sender_id: 's', body: 'hi', created_at: '2024-01-01T00:00:00Z', read_at: '2024-01-02T00:00:00Z' };
    const out = upsertMessage([existing], updateRow);
    expect(out).toHaveLength(1);
    expect(out[0].read_at).toBe('2024-01-02T00:00:00Z');
    expect(out[0].reactions).toHaveLength(1);
  });
});

describe('removeMessage', () => {
  it('drops the message with the id (used to clear an optimistic temp)', () => {
    expect(removeMessage([msg('temp', '2024-01-01T00:00:00Z')], 'temp')).toEqual([]);
  });
});

describe('reactions', () => {
  it('applyReaction adds, then replaces the same user\'s reaction', () => {
    let list = [msg('a', '2024-01-01T00:00:00Z')];
    list = applyReaction(list, reaction('a', 'u', '❤️'));
    expect(list[0].reactions).toHaveLength(1);
    list = applyReaction(list, reaction('a', 'u', '🔥'));
    expect(list[0].reactions).toHaveLength(1);
    expect(list[0].reactions[0].emoji).toBe('🔥');
  });

  it('keeps reactions from different users', () => {
    let list = [msg('a', '2024-01-01T00:00:00Z')];
    list = applyReaction(list, reaction('a', 'u1', '❤️'));
    list = applyReaction(list, reaction('a', 'u2', '😂'));
    expect(list[0].reactions).toHaveLength(2);
  });

  it('removeReaction drops only that user\'s reaction', () => {
    let list = applyReaction([msg('a', '2024-01-01T00:00:00Z')], reaction('a', 'u1', '❤️'));
    list = applyReaction(list, reaction('a', 'u2', '😂'));
    list = removeReaction(list, 'a', 'u1');
    expect(list[0].reactions.map((r) => r.user_id)).toEqual(['u2']);
  });
});
