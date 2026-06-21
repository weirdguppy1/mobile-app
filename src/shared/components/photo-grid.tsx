import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { PressScale } from '@/shared/components/press-scale';

export interface PhotoItem {
  id: string;
  uri: string;
  status?: 'uploading' | 'error' | 'ready';
  onRetry?: () => void;
}

interface PhotoGridProps {
  photos: PhotoItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  max?: number;
}

/** Add / remove / reorder photo slots. Slot 0 is the primary photo. */
export function PhotoGrid({ photos, onAdd, onRemove, onReorder, max = 6 }: PhotoGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {photos.map((p, i) => (
        <View key={p.id} className="w-[30%] gap-1">
          <View className="photo-slot">
            <Image source={{ uri: p.uri }} style={{ flex: 1 }} contentFit="cover" />
            {i === 0 ? (
              <View className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5">
                <Text className="prose-caption text-canvas">Primary</Text>
              </View>
            ) : null}
            {p.status === 'uploading' ? (
              <View className="absolute inset-0 items-center justify-center bg-[rgba(255,255,255,0.6)]">
                <Text className="prose-caption text-graphite">Uploading…</Text>
              </View>
            ) : null}
            {p.status === 'error' ? (
              <PressScale
                accessibilityRole="button"
                onPress={p.onRetry}
                className="absolute inset-0 items-center justify-center bg-[rgba(255,0,0,0.12)]">
                <Text className="prose-caption font-semibold text-pass">Failed — Retry</Text>
              </PressScale>
            ) : null}
          </View>
          <View className="flex-row justify-between">
            <PressScale accessibilityRole="button" accessibilityLabel="Move left" disabled={i === 0} onPress={() => onReorder(i, i - 1)}>
              <Text className={`prose-caption ${i === 0 ? 'text-fog' : 'text-graphite'}`}>←</Text>
            </PressScale>
            <PressScale accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => onRemove(p.id)}>
              <Text className="prose-caption text-pass">Remove</Text>
            </PressScale>
            <PressScale accessibilityRole="button" accessibilityLabel="Move right" disabled={i === photos.length - 1} onPress={() => onReorder(i, i + 1)}>
              <Text className={`prose-caption ${i === photos.length - 1 ? 'text-fog' : 'text-graphite'}`}>→</Text>
            </PressScale>
          </View>
        </View>
      ))}
      {photos.length < max ? (
        <PressScale accessibilityRole="button" accessibilityLabel="Add photo" onPress={onAdd} className="photo-slot w-[30%] items-center justify-center">
          <Text className="prose-display text-fog">+</Text>
        </PressScale>
      ) : null}
    </View>
  );
}
