import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import { relationshipState, type Relationship } from '@/features/profile/lib/relationship';
import { OnboardingData, ProfilePhoto, SignedProfilePhoto } from '@/features/profile/types';
import { Database } from '@/types/database';

const PHOTO_BUCKET = 'profile-photos';
// Session-length: a discovery batch is signed once at fetch, so the URLs must stay
// valid for as long as the user browses that batch. 12h covers any realistic
// session; ProfilePhoto re-signs on error as a backstop for anything longer.
// Trade-off: a signed URL is a bearer link, so a longer TTL widens the window if one
// ever leaks — generous, not infinite. (Supabase takes a fixed expiry, not a true
// session binding, so a long TTL + re-sign-on-expiry is the practical equivalent.)
const SIGNED_PHOTO_URL_TTL_SECONDS = 43200; // 12 hours

export async function fetchOnboardingData(userId: string): Promise<OnboardingData> {
  const [profileRes, photosRes, promptsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_photos').select('*').eq('profile_id', userId).order('position', { ascending: true }),
    supabase.from('profile_prompts').select('*').eq('profile_id', userId).order('position', { ascending: true }),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (photosRes.error) throw photosRes.error;
  if (promptsRes.error) throw promptsRes.error;
  return { profile: profileRes.data, photos: await signPhotoRows(photosRes.data), prompts: promptsRes.data };
}

/**
 * Attach a signed URL to each photo row. Signing is best-effort and MUST NOT
 * fail the caller: a missing object or Storage timeout degrades that one photo
 * to signedUrl: null, never the whole response. Used by both the profile load
 * (which gates app routing on profile.onboarding_complete) and the discovery feed.
 */
export async function signPhotoRows(rows: ProfilePhoto[]): Promise<SignedProfilePhoto[]> {
  return Promise.all(
    rows.map(async (photo) => ({
      ...photo,
      signedUrl: await createPhotoSignedUrl(photo.url).catch(() => null),
    })),
  );
}

export async function updateProfile(
  userId: string,
  patch: Database['public']['Tables']['profiles']['Update'],
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function uploadPhoto(userId: string, localUri: string, position: number): Promise<ProfilePhoto> {
  const pathWithoutQuery = localUri.split(/[?#]/)[0] ?? '';
  const ext = /\.([a-z0-9]+)$/i.exec(pathWithoutQuery)?.[1]?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${position}-${Date.now()}.${ext}`;
  // Read the picked file's bytes natively. fetch(localUri).arrayBuffer() hangs on
  // React Native for file:// URIs, which left uploads stuck on "uploading…".
  const bytes = await new File(localUri).bytes();
  if (bytes.byteLength === 0) {
    throw new Error('Selected photo is empty and cannot be uploaded.');
  }
  const fileBody = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, fileBody, { cacheControl: '3600', contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('profile_photos')
    .insert({ profile_id: userId, url: path, position })
    .select('*')
    .single();
  if (error) {
    // Best-effort: remove the just-uploaded object so a failed row insert
    // doesn't leave an orphaned file in the bucket.
    const { error: cleanupError } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    if (cleanupError) {
      throw new Error(
        `Failed to insert profile photo row: ${error.message}; cleanup of uploaded object also failed: ${cleanupError.message}`,
      );
    }
    throw error;
  }
  return data;
}

export async function removePhoto(photoId: string): Promise<void> {
  // Look up the storage path before deleting the row.
  const { data: row, error: selError } = await supabase
    .from('profile_photos')
    .select('url')
    .eq('id', photoId)
    .single();
  if (selError) throw selError;

  const { error } = await supabase.from('profile_photos').delete().eq('id', photoId);
  if (error) throw error;

  // Clean up the underlying object via the Storage API. Direct SQL deletes from
  // storage.objects are blocked by Supabase's protect_delete trigger, so this
  // can't be done in a DB trigger. Best-effort: an orphaned file is harmless and
  // the row (the user-visible photo) is already gone.
  if (row?.url) {
    await supabase.storage.from(PHOTO_BUCKET).remove([row.url]);
  }
}

export async function persistPhotoOrder(photos: { id: string; position: number }[]): Promise<void> {
  for (const p of photos) {
    const { error } = await supabase.from('profile_photos').update({ position: p.position }).eq('id', p.id);
    if (error) throw error;
  }
}

export async function savePrompts(
  userId: string,
  prompts: { prompt: string; answer: string }[],
): Promise<void> {
  const rows = prompts.map((p) => ({ prompt: p.prompt, answer: p.answer.trim() }));
  const { error } = await supabase.rpc('replace_prompts', { p_profile_id: userId, p_prompts: rows });
  if (error) throw error;
}

export async function savePrivateContact(userId: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('private_contacts')
    .upsert({ profile_id: userId, phone: phone.trim() || null }, { onConflict: 'profile_id' });
  if (error) throw error;
}

export async function fetchPrivateContact(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('private_contacts')
    .select('phone')
    .eq('profile_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.phone ?? null;
}

export async function completeOnboarding(userId: string): Promise<void> {
  const { error } = await supabase.rpc('complete_onboarding', { target_profile_id: userId });
  if (error) throw error;
}

export async function createPhotoSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_PHOTO_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

/** Any user's read-only profile (RLS via can_view_profile gates access — a row that
 *  isn't viewable simply won't return). Mirrors fetchOnboardingData but by id. */
export async function fetchUserProfile(userId: string): Promise<OnboardingData> {
  return fetchOnboardingData(userId);
}

/** Derive my relationship to another user from matches / likes / blocks. RLS lets me
 *  read my own matches, likes I sent or received, and blocks I created; a block by the
 *  other party is unobservable but also hides their profile, so it never reaches here. */
export async function fetchRelationship(meId: string, userId: string): Promise<Relationship> {
  if (meId === userId) return { state: 'self' };

  const [lo, hi] = meId < userId ? [meId, userId] : [userId, meId];
  const [matchRes, myLikeRes, theirLikeRes, blockRes] = await Promise.all([
    supabase.from('matches').select('id, created_at').eq('user_a', lo).eq('user_b', hi).maybeSingle(),
    supabase.from('likes').select('liker_id').eq('liker_id', meId).eq('likee_id', userId).maybeSingle(),
    supabase.from('likes').select('liker_id').eq('liker_id', userId).eq('likee_id', meId).maybeSingle(),
    supabase.from('blocks').select('blocked_id').eq('blocker_id', meId).eq('blocked_id', userId).maybeSingle(),
  ]);
  if (matchRes.error) throw matchRes.error;
  if (myLikeRes.error) throw myLikeRes.error;
  if (theirLikeRes.error) throw theirLikeRes.error;
  if (blockRes.error) throw blockRes.error;

  return relationshipState({
    meId,
    userId,
    match: matchRes.data ?? null,
    iLiked: !!myLikeRes.data,
    theyLiked: !!theirLikeRes.data,
    iBlocked: !!blockRes.data,
    theyBlocked: false,
  });
}

/** Block a user: record the block, drop any match between you, and pass so they never
 *  resurface in discovery. can_view_profile then hides you both from each other. */
export async function blockUser(meId: string, userId: string): Promise<void> {
  const blockRes = await supabase.from('blocks').insert({ blocker_id: meId, blocked_id: userId });
  if (blockRes.error && blockRes.error.code !== '23505') throw blockRes.error;

  const [lo, hi] = meId < userId ? [meId, userId] : [userId, meId];
  const matchRes = await supabase.from('matches').delete().eq('user_a', lo).eq('user_b', hi);
  if (matchRes.error) throw matchRes.error;

  const passRes = await supabase.from('passes').insert({ passer_id: meId, passee_id: userId });
  if (passRes.error && passRes.error.code !== '23505') throw passRes.error;
}

/** Decline an incoming request straight from a profile (no notification id in hand):
 *  pass on them (prevents resurfacing) and clear any pending 'request' notification. */
export async function declineRequestFrom(meId: string, requesterId: string): Promise<void> {
  const passRes = await supabase.from('passes').insert({ passer_id: meId, passee_id: requesterId });
  if (passRes.error && passRes.error.code !== '23505') throw passRes.error;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', meId)
    .eq('actor_id', requesterId)
    .eq('type', 'request');
  if (error) throw error;
}

/** Record a report (no moderation backend this pass — record-only). */
export async function reportUser(meId: string, userId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: meId, reported_id: userId, reason });
  if (error) throw error;
}

/** Unmatch: delete the match row (RLS allows either participant). */
export async function unmatchUser(matchId: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) throw error;
}
