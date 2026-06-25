import { signPhotoRows } from '@/features/profile/api';
import { ProfilePrompt, SignedProfilePhoto } from '@/features/profile/types';
import { collectExcludeIds } from '@/features/discovery/lib/exclude-ids';
import { DiscoveryProfile, RequestTarget } from '@/features/discovery/types';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

const UNIQUE_VIOLATION = '23505';

/** Browse-feed batch size. A returned batch smaller than this means the pool is
 *  exhausted (used by the screen to switch from auto-top-up to the empty state). */
export const DISCOVERY_PAGE_SIZE = 20;

function groupByProfile<T extends { profile_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const arr = map.get(row.profile_id);
    if (arr) arr.push(row);
    else map.set(row.profile_id, [row]);
  }
  return map;
}

/**
 * Browse-feed batch: same-school candidates (RLS-scoped via can_view_profile)
 * minus everyone I've already touched, with their photos + prompts attached and
 * photo URLs signed best-effort. No ordering/compat-scoring in v1 (DB default order).
 */
export async function fetchDiscoveryFeed(userId: string, limit = DISCOVERY_PAGE_SIZE): Promise<DiscoveryProfile[]> {
  const [sentRes, receivedRes, passedRes, matchesRes] = await Promise.all([
    supabase.from('likes').select('likee_id').eq('liker_id', userId),
    supabase.from('likes').select('liker_id').eq('likee_id', userId),
    supabase.from('passes').select('passee_id').eq('passer_id', userId),
    supabase.from('matches').select('user_a, user_b').or(`user_a.eq.${userId},user_b.eq.${userId}`),
  ]);
  if (sentRes.error) throw sentRes.error;
  if (receivedRes.error) throw receivedRes.error;
  if (passedRes.error) throw passedRes.error;
  if (matchesRes.error) throw matchesRes.error;

  const excludeIds = collectExcludeIds({
    me: userId,
    sent: sentRes.data.map((r) => r.likee_id),
    received: receivedRes.data.map((r) => r.liker_id),
    passed: passedRes.data.map((r) => r.passee_id),
    matches: matchesRes.data,
  });

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_complete', true)
    .neq('id', userId)
    .limit(limit);
  if (excludeIds.size) {
    query = query.not('id', 'in', `(${[...excludeIds].join(',')})`);
  }
  const profilesRes = await query;
  if (profilesRes.error) throw profilesRes.error;
  const profiles = profilesRes.data;
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const [photosRes, promptsRes] = await Promise.all([
    supabase.from('profile_photos').select('*').in('profile_id', ids).order('position', { ascending: true }),
    supabase.from('profile_prompts').select('*').in('profile_id', ids).order('position', { ascending: true }),
  ]);
  if (photosRes.error) throw photosRes.error;
  if (promptsRes.error) throw promptsRes.error;

  // Sign the batch's photos up front so they display instantly. A session-length
  // TTL keeps them valid as the user works through the batch; ProfilePhoto re-signs
  // on error as a backstop for any URL that outlives the session.
  const photosByProfile = groupByProfile<SignedProfilePhoto>(await signPhotoRows(photosRes.data));
  const promptsByProfile = groupByProfile<ProfilePrompt>(promptsRes.data);

  return profiles.map((profile) => ({
    profile,
    photos: photosByProfile.get(profile.id) ?? [],
    prompts: promptsByProfile.get(profile.id) ?? [],
  }));
}

/** Send a connection request: a likes row targeting one photo or prompt + the note.
 *  A re-request (unique PK conflict) is treated as success — idempotent. */
export async function sendConnectionRequest(input: {
  likerId: string;
  likeeId: string;
  target: RequestTarget;
  note: string;
}): Promise<void> {
  const { likerId, likeeId, target, note } = input;
  const row: Database['public']['Tables']['likes']['Insert'] = {
    liker_id: likerId,
    likee_id: likeeId,
    comment: note,
    liked_photo_id: target.kind === 'photo' ? target.photoId : null,
    liked_prompt_id: target.kind === 'prompt' ? target.promptId : null,
  };
  const { error } = await supabase.from('likes').insert(row);
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

/** Skip a person (private pass, prevents resurfacing). Idempotent. */
export async function skipProfile(passerId: string, passeeId: string): Promise<void> {
  const { error } = await supabase.from('passes').insert({ passer_id: passerId, passee_id: passeeId });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}
