import { Database } from '@/types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfilePhoto = Database['public']['Tables']['profile_photos']['Row'];
// signedUrl is null when signing failed (missing object / Storage timeout).
// Signing must never fail the profile load — this type forces callers to
// handle the degraded photo rather than assume a URL is always present.
export type SignedProfilePhoto = ProfilePhoto & { signedUrl: string | null };
export type ProfilePrompt = Database['public']['Tables']['profile_prompts']['Row'];

export interface OnboardingData {
  profile: Profile;
  photos: SignedProfilePhoto[];
  prompts: ProfilePrompt[];
}
