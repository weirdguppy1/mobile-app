import { supabase } from '@/lib/supabase';
import { OnboardingData, ProfilePhoto } from '@/features/profile/types';
import { Database } from '@/types/database';

const PHOTO_BUCKET = 'profile-photos';

export async function fetchOnboardingData(userId: string): Promise<OnboardingData> {
  const [profileRes, photosRes, promptsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profile_photos').select('*').eq('profile_id', userId).order('position', { ascending: true }),
    supabase.from('profile_prompts').select('*').eq('profile_id', userId).order('position', { ascending: true }),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (photosRes.error) throw photosRes.error;
  if (promptsRes.error) throw promptsRes.error;
  return { profile: profileRes.data, photos: photosRes.data, prompts: promptsRes.data };
}

export async function updateProfile(
  userId: string,
  patch: Database['public']['Tables']['profiles']['Update'],
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function uploadPhoto(userId: string, localUri: string, position: number): Promise<ProfilePhoto> {
  const ext = localUri.split('.').pop()?.split('?')[0] || 'jpg';
  const path = `${userId}/${position}-${Date.now()}.${ext}`;
  const res = await fetch(localUri);
  const bytes = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') ?? `image/${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('profile_photos')
    .insert({ profile_id: userId, url: path, position })
    .select('*')
    .single();
  if (error) {
    // Best-effort: remove the just-uploaded object so a failed row insert
    // doesn't leave an orphaned file in the bucket.
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
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
  const { error: delError } = await supabase.from('profile_prompts').delete().eq('profile_id', userId);
  if (delError) throw delError;
  if (prompts.length === 0) return;
  const rows = prompts.map((p, i) => ({ profile_id: userId, prompt: p.prompt, answer: p.answer.trim(), position: i }));
  const { error } = await supabase.from('profile_prompts').insert(rows);
  if (error) throw error;
}

export async function savePrivateContact(userId: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('private_contacts')
    .upsert({ profile_id: userId, phone: phone.trim() || null }, { onConflict: 'profile_id' });
  if (error) throw error;
}

export async function completeOnboarding(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', userId);
  if (error) throw error;
}

export function photoPublicUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
