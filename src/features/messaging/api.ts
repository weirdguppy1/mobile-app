import { createPhotoSignedUrl, signPhotoRows } from '@/features/profile/api';
import { peerId } from '@/features/messaging/lib/peer';
import {
  Conversation, Message, MessageReaction, MessageWithReactions, PeerSummary,
} from '@/features/messaging/types';
import { supabase } from '@/lib/supabase';

const activityTime = (c: Conversation): number =>
  new Date(c.lastMessage?.created_at ?? c.match.created_at).getTime();

/** Conversations list: my matches with the peer's name/avatar, last message, and unread count. */
export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const matchesRes = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  if (matchesRes.error) throw matchesRes.error;
  const matches = matchesRes.data;
  if (matches.length === 0) return [];

  const matchIds = matches.map((m) => m.id);
  const peerIds = matches.map((m) => peerId(m, userId));

  const [profilesRes, photosRes, messagesRes] = await Promise.all([
    supabase.from('profiles').select('id, first_name').in('id', peerIds),
    supabase.from('profile_photos').select('*').in('profile_id', peerIds).eq('position', 0),
    supabase.from('messages').select('*').in('match_id', matchIds).order('created_at', { ascending: false }),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (photosRes.error) throw photosRes.error;
  if (messagesRes.error) throw messagesRes.error;

  const signed = await signPhotoRows(photosRes.data);
  const avatarByProfile = new Map(signed.map((p) => [p.profile_id, p.signedUrl]));
  const nameByProfile = new Map(profilesRes.data.map((p) => [p.id, p.first_name]));

  // messagesRes is newest-first, so the first seen per match is its last message.
  const lastByMatch = new Map<string, Message>();
  const unreadByMatch = new Map<string, number>();
  for (const msg of messagesRes.data) {
    if (!lastByMatch.has(msg.match_id)) lastByMatch.set(msg.match_id, msg);
    if (msg.sender_id !== userId && msg.read_at === null) {
      unreadByMatch.set(msg.match_id, (unreadByMatch.get(msg.match_id) ?? 0) + 1);
    }
  }

  const conversations: Conversation[] = matches.map((match) => {
    const pid = peerId(match, userId);
    return {
      match,
      peer: { id: pid, firstName: nameByProfile.get(pid) ?? null, avatarUrl: avatarByProfile.get(pid) ?? null },
      lastMessage: lastByMatch.get(match.id) ?? null,
      unread: unreadByMatch.get(match.id) ?? 0,
    };
  });
  conversations.sort((a, b) => activityTime(b) - activityTime(a));
  return conversations;
}

/** All messages in a match (chronological), each with its reactions attached. */
export async function fetchThread(matchId: string): Promise<MessageWithReactions[]> {
  const [messagesRes, reactionsRes] = await Promise.all([
    supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true }),
    supabase.from('message_reactions').select('*').eq('match_id', matchId),
  ]);
  if (messagesRes.error) throw messagesRes.error;
  if (reactionsRes.error) throw reactionsRes.error;

  const byMessage = new Map<string, MessageReaction[]>();
  for (const r of reactionsRes.data) {
    const arr = byMessage.get(r.message_id);
    if (arr) arr.push(r);
    else byMessage.set(r.message_id, [r]);
  }
  return messagesRes.data.map((m) => ({ ...m, reactions: byMessage.get(m.id) ?? [] }));
}

export async function sendMessage(matchId: string, senderId: string, body: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, body: body.trim() })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Mark all of the peer's unread messages in this match as read (content stays locked). */
export async function markRead(matchId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('sender_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

/** Peer summary (name + primary avatar) for the thread header. */
export async function fetchMatchPeer(matchId: string, userId: string): Promise<PeerSummary> {
  const matchRes = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (matchRes.error) throw matchRes.error;
  const pid = peerId(matchRes.data, userId);

  const [profileRes, photoRes] = await Promise.all([
    supabase.from('profiles').select('id, first_name').eq('id', pid).maybeSingle(),
    supabase.from('profile_photos').select('*').eq('profile_id', pid).eq('position', 0).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (photoRes.error) throw photoRes.error;

  const avatarUrl = photoRes.data ? await createPhotoSignedUrl(photoRes.data.url).catch(() => null) : null;
  return { id: pid, firstName: profileRes.data?.first_name ?? null, avatarUrl };
}

/** Set (or change) the current user's reaction on a message. One per user per message. */
export async function setReaction(messageId: string, matchId: string, userId: string, emoji: string): Promise<void> {
  const { error } = await supabase
    .from('message_reactions')
    .upsert({ message_id: messageId, match_id: matchId, user_id: userId, emoji }, { onConflict: 'message_id,user_id' });
  if (error) throw error;
}

/** Remove the current user's reaction from a message. */
export async function clearReaction(messageId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId);
  if (error) throw error;
}
