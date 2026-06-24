import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { EditScreenShell } from '@/features/profile/components/EditScreenShell';
import { PHOTOS_LIMITS } from '@/features/profile/constants';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { PhotoGrid, type PhotoItem } from '@/shared/components';
import { arrayMove } from '@/shared/lib/array-move';

/** Edit photos: add / remove / reorder. Each operation self-persists (no Save). */
export default function EditPhotosScreen() {
  const { data } = useOnboardingData();
  const { uploadPhoto, removePhoto, reorderPhotos } = useProfileMutations();

  const saved = data?.photos ?? [];
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

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

  const items: PhotoItem[] = saved.map((ph) => ({ id: ph.id, uri: ph.signedUrl, status: 'ready' as const }));
  if (pendingUri) items.push({ id: 'pending', uri: pendingUri, status: 'uploading' });
  if (failedUri) items.push({ id: 'failed', uri: failedUri, status: 'error', onRetry: () => doUpload(failedUri) });

  const onAdd = async () => {
    if (pendingUri) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    await doUpload(res.assets[0].uri);
  };

  const onReorder = async (from: number, to: number) => {
    if (from < 0 || to < 0 || from >= saved.length || to >= saved.length) return;
    const reordered = arrayMove(saved, from, to);
    await reorderPhotos.mutateAsync(reordered.map((ph, i) => ({ id: ph.id, position: i })));
  };

  const onRemove = (id: string) => {
    if (id === 'pending') return;
    if (id === 'failed') { setFailedUri(null); return; }
    removePhoto.mutate(id);
  };

  return (
    <EditScreenShell title="Photos">
      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-6 pt-2" showsVerticalScrollIndicator={false}>
        <PhotoGrid photos={items} onAdd={onAdd} onRemove={onRemove} onReorder={onReorder} max={PHOTOS_LIMITS.max} />
        <Text className="prose-caption text-ash">The first photo is your primary. Touch and hold a photo to drag and reorder.</Text>
      </ScrollView>
    </EditScreenShell>
  );
}
