import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  completeOnboarding, persistPhotoOrder, removePhoto, savePrivateContact,
  savePrompts, updateProfile, uploadPhoto,
} from '@/features/profile/api';
import { profileKeys, useCurrentUserId } from '@/features/profile/hooks/use-profile';
import { Database } from '@/types/database';

export function useProfileMutations() {
  const userId = useCurrentUserId() as string;
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: profileKeys.onboarding(userId) });

  const saveProfile = useMutation({
    mutationFn: (patch: Database['public']['Tables']['profiles']['Update']) => updateProfile(userId, patch),
    onSuccess: invalidate,
  });

  const upload = useMutation({
    mutationFn: ({ uri, position }: { uri: string; position: number }) => uploadPhoto(userId, uri, position),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (photoId: string) => removePhoto(photoId),
    onSuccess: invalidate,
  });

  const reorderPhotos = useMutation({
    mutationFn: (photos: { id: string; position: number }[]) => persistPhotoOrder(photos),
    onSuccess: invalidate,
  });

  const prompts = useMutation({
    mutationFn: (items: { prompt: string; answer: string }[]) => savePrompts(userId, items),
    onSuccess: invalidate,
  });

  const privateContact = useMutation({
    mutationFn: (phone: string) => savePrivateContact(userId, phone),
    onSuccess: invalidate,
  });

  const complete = useMutation({
    mutationFn: () => completeOnboarding(userId),
    onSuccess: invalidate,
  });

  return { saveProfile, uploadPhoto: upload, removePhoto: remove, reorderPhotos, savePrompts: prompts, savePrivateContact: privateContact, complete };
}
