import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { photoPublicUrl } from '@/features/profile/api';
import { PHOTOS_LIMITS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { arrayMove } from '@/shared/lib/array-move';
import { PhotoGrid, type PhotoItem } from '@/shared/components';

export function PhotosStep() {
  const { data, goNext } = useOnboarding();
  const { uploadPhoto, removePhoto, reorderPhotos } = useProfileMutations();

  const saved = data?.photos ?? [];
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const items: PhotoItem[] = saved.map((ph) => ({ id: ph.id, uri: photoPublicUrl(ph.url), status: 'ready' as const }));
  if (pendingUri) items.push({ id: 'pending', uri: pendingUri, status: 'uploading' });
  if (failedUri) items.push({ id: 'failed', uri: failedUri, status: 'error', onRetry: () => doUpload(failedUri) });

  const doUpload = async (uri: string) => {
    setFailedUri(null);
    setPendingUri(uri);
    try {
      await uploadPhoto.mutateAsync({ uri, position: saved.length });
      setPendingUri(null);
    } catch {
      setPendingUri(null);
      setFailedUri(uri);
    }
  };

  const onAdd = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    await doUpload(res.assets[0].uri);
  };

  const onReorder = async (from: number, to: number) => {
    const reordered = arrayMove(saved, from, to);
    await reorderPhotos.mutateAsync(reordered.map((ph, i) => ({ id: ph.id, position: i })));
  };

  const canAdvance = saved.length >= PHOTOS_LIMITS.min;

  return (
    <StepShell canAdvance={canAdvance} onNext={goNext}>
      <PhotoGrid photos={items} onAdd={onAdd} onRemove={(id) => removePhoto.mutate(id)} onReorder={onReorder} max={PHOTOS_LIMITS.max} />
      {!canAdvance ? <Text className="prose-footnote text-slate">Add at least one photo to continue.</Text> : null}
      <Text className="prose-caption text-ash">The first photo is your primary. Use ← → to reorder.</Text>
    </StepShell>
  );
}
