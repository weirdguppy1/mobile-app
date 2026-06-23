import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import { OnboardingData, ProfilePhoto, SignedProfilePhoto } from '@/features/profile/types';
import { Database } from '@/types/database';

const PHOTO_BUCKET = 'profile-photos';
const SIGNED_PHOTO_URL_TTL_SECONDS = 300;

export async function fetchOnboardingData(userId: string): Promise<OnboardingData> {
  const [profileRes, photosRes, promptsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_photos').select('*').eq('profile_id', userId).order('position', { ascending: true }),
    supabase.from('profile_prompts').select('*').eq('profile_id', userId).order('position', { ascending: true }),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (photosRes.error) throw photosRes.error;
  if (promptsRes.error) throw promptsRes.error;
  // Signing is best-effort and MUST NOT fail the load: this same query gates
  // app routing (see (app)/_layout.tsx and (app)/index.tsx, which only read
  // profile.onboarding_complete). A missing object or Storage timeout degrades
  // that one photo to signedUrl: null, never the whole profile response.
  const photos: SignedProfilePhoto[] = await Promise.all(
    photosRes.data.map(async (photo) => ({
      ...photo,
      signedUrl: await createPhotoSignedUrl(photo.url).catch(() => null),
    })),
  );
  return { profile: profileRes.data, photos, prompts: promptsRes.data };
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
