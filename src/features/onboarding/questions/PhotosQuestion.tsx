// src/features/onboarding/questions/PhotosQuestion.tsx
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { PHOTOS_LIMITS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { arrayMove } from '@/shared/lib/array-move';
import { PhotoGrid, type PhotoItem } from '@/shared/components';

export function PhotosQuestion() {
  const { data, question, goNext, goBack, canGoBack } = useQuestionFlow();
  const { uploadPhoto, removePhoto, reorderPhotos } = useProfileMutations();

  const saved = data?.photos ?? [];
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const items: PhotoItem[] = saved.map((ph) => ({ id: ph.id, uri: ph.signedUrl, status: 'ready' as const }));
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

  const canAdvance = saved.length >= PHOTOS_LIMITS.min;

  if (!question) return null;
  return (
    <QuestionShell
      title={question.title}
      subtitle={question.subtitle}
      canGoBack={canGoBack}
      onBack={goBack}
      canAdvance={canAdvance}
      onNext={goNext}>
      <View className="gap-3">
        <PhotoGrid photos={items} onAdd={onAdd} onRemove={onRemove} onReorder={onReorder} max={PHOTOS_LIMITS.max} />
        {!canAdvance ? <Text className="prose-footnote text-slate">Add at least one photo to continue.</Text> : null}
        <Text className="prose-caption text-ash">The first photo is your primary. Touch and hold a photo to drag and reorder.</Text>
      </View>
    </QuestionShell>
  );
}
