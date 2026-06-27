import { useQuery } from '@tanstack/react-query';

import { fetchPrivateContact, fetchRelationship, fetchUserProfile } from '@/features/profile/api';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export const userProfileKeys = {
  profile: (userId: string) => ['user-profile', userId] as const,
  relationship: (meId: string, userId: string) => ['relationship', meId, userId] as const,
  contact: (userId: string) => ['user-contact', userId] as const,
};

/** Another user's read-only profile (photos + prompts), keyed by their id. */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: userProfileKeys.profile(userId),
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
  });
}

/** My relationship to another user (drives the action bar). */
export function useRelationship(userId: string) {
  const meId = useCurrentUserId();
  return useQuery({
    queryKey: userProfileKeys.relationship(meId ?? 'anonymous', userId),
    queryFn: () => fetchRelationship(meId as string, userId),
    enabled: !!meId && !!userId,
  });
}

/** Another user's phone — only readable once matched (RLS-gated). Enable when matched. */
export function useUserContact(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: userProfileKeys.contact(userId),
    queryFn: () => fetchPrivateContact(userId),
    enabled: enabled && !!userId,
  });
}
