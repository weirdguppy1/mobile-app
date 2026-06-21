import { Database } from '@/types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfilePhoto = Database['public']['Tables']['profile_photos']['Row'];
export type ProfilePrompt = Database['public']['Tables']['profile_prompts']['Row'];

export interface OnboardingData {
  profile: Profile;
  photos: ProfilePhoto[];
  prompts: ProfilePrompt[];
}
