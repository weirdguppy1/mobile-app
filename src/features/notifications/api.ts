import { signPhotoRows } from '@/features/profile/api';
import { NotificationItem } from '@/features/notifications/types';
import { supabase } from '@/lib/supabase';

/** The user's notifications (newest first), each with the actor's name + avatar. */
export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const notifsRes = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (notifsRes.error) throw notifsRes.error;
  const notifs = notifsRes.data;
  if (notifs.length === 0) return [];

  const actorIds = [...new Set(notifs.map((n) => n.actor_id))];
  const [profilesRes, photosRes] = await Promise.all([
    supabase.from('profiles').select('id, first_name').in('id', actorIds),
    supabase.from('profile_photos').select('*').in('profile_id', actorIds).eq('position', 0),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (photosRes.error) throw photosRes.error;

  const signed = await signPhotoRows(photosRes.data);
  const avatarByProfile = new Map(signed.map((p) => [p.profile_id, p.signedUrl]));
  const nameByProfile = new Map(profilesRes.data.map((p) => [p.id, p.first_name]));

  return notifs.map((n) => ({
    ...n,
    actor: {
      id: n.actor_id,
      firstName: nameByProfile.get(n.actor_id) ?? null,
      avatarUrl: avatarByProfile.get(n.actor_id) ?? null,
    },
  }));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

/** Accept a request: like the requester back (→ handle_like creates the match),
 *  then return the new match id to open the chat. The pending request notif is
 *  cleared server-side by notify_on_match. */
export async function acceptRequest(meId: string, requesterId: string): Promise<{ matchId: string }> {
  const likeRes = await supabase.from('likes').insert({ liker_id: meId, likee_id: requesterId });
  if (likeRes.error && likeRes.error.code !== '23505') throw likeRes.error;

  const [lo, hi] = meId < requesterId ? [meId, requesterId] : [requesterId, meId];
  const matchRes = await supabase.from('matches').select('id').eq('user_a', lo).eq('user_b', hi).maybeSingle();
  if (matchRes.error) throw matchRes.error;
  if (!matchRes.data) throw new Error('Match was not created');
  return { matchId: matchRes.data.id };
}

/** Decline a request: pass on the requester (prevents resurfacing) + remove the notification. */
export async function declineRequest(meId: string, requesterId: string, notificationId: string): Promise<void> {
  const passRes = await supabase.from('passes').insert({ passer_id: meId, passee_id: requesterId });
  if (passRes.error && passRes.error.code !== '23505') throw passRes.error;
  const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
  if (error) throw error;
}
