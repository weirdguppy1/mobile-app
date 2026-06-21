import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DropProvider,
  GridOrientation,
  GridStrategy,
  SortableGridItem,
  useGridSortableList,
} from 'react-native-reanimated-dnd';

import {
  PHOTO_GRID_COLUMNS,
  PHOTO_GRID_GAP,
  photoCellOffset,
  photoCellSize,
  photoGridHeight,
} from '@/shared/lib/photo-grid-layout';
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

const ACTIVATION_DELAY_MS = 200;

/** Add / remove / reorder photo slots in one uniform 3-column grid. Slot 0 is
 *  the primary photo. Ready photos reorder by touch-and-hold drag (insert/shift
 *  via react-native-reanimated-dnd); the upload / error / add tiles are
 *  non-draggable cells laid out in the same grid. `onReorder` indices are
 *  positions within the ready photos, which the parent maps 1:1 onto its
 *  saved-photo order. */
export function PhotoGrid({ photos, onAdd, onRemove, onReorder, max = 6 }: PhotoGridProps) {
  const [width, setWidth] = useState(0);

  const reorderable = photos.filter((p) => p.status === 'ready' || p.status === undefined);
  const transient = photos.filter((p) => p.status === 'uploading' || p.status === 'error');
  const canAdd = photos.length < max;

  const cellSize = width > 0 ? photoCellSize(width) : 0;
  const dimensions = {
    columns: PHOTO_GRID_COLUMNS,
    itemWidth: cellSize,
    itemHeight: cellSize,
    columnGap: PHOTO_GRID_GAP,
    rowGap: PHOTO_GRID_GAP,
  };

  // Drives the reorderable photos. Safe to call with cellSize 0 before layout —
  // positions re-sync once the real dimensions arrive.
  const { dropProviderRef, getItemProps } = useGridSortableList({
    data: reorderable,
    dimensions,
    orientation: GridOrientation.Vertical,
    strategy: GridStrategy.Insert,
  });

  const totalTiles = reorderable.length + transient.length + (canAdd ? 1 : 0);
  const gridHeight = photoGridHeight(totalTiles, cellSize);

  // Non-draggable tiles follow the reorderable photos in row-major order.
  const trailing = [
    ...transient.map((item, i) => ({
      key: item.id,
      index: reorderable.length + i,
      item,
    })),
    ...(canAdd
      ? [{ key: '__add__', index: reorderable.length + transient.length, item: null }]
      : []),
  ];

  return (
    <GestureHandlerRootView onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {cellSize > 0 ? (
        <DropProvider ref={dropProviderRef}>
          <View style={{ height: gridHeight, position: 'relative' }}>
            {reorderable.map((item, index) => (
              <SortableGridItem
                key={item.id}
                data={item}
                {...getItemProps(item, index)}
                activationDelay={ACTIVATION_DELAY_MS}
                onDrop={(id, position) => {
                  const from = reorderable.findIndex((p) => p.id === id);
                  if (from !== -1 && from !== position) onReorder(from, position);
                }}>
                <View className="photo-slot relative h-full w-full">
                  <Image source={{ uri: item.uri }} className="h-full w-full" contentFit="cover" />
                  {index === 0 ? (
                    <View className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5">
                      <Text className="prose-caption text-canvas">Primary</Text>
                    </View>
                  ) : null}
                  <PressScale
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    onPress={() => onRemove(item.id)}
                    className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-canvas/90">
                    <Text className="prose-caption text-pass">✕</Text>
                  </PressScale>
                </View>
              </SortableGridItem>
            ))}

            {trailing.map(({ key, index, item }) => {
              const { x, y } = photoCellOffset(index, cellSize);
              return (
                <View
                  key={key}
                  style={{ position: 'absolute', left: x, top: y, width: cellSize, height: cellSize }}>
                  {item === null ? (
                    <PressScale
                      accessibilityRole="button"
                      accessibilityLabel="Add photo"
                      onPress={onAdd}
                      className="photo-slot h-full w-full items-center justify-center">
                      <Text className="prose-display text-fog">+</Text>
                    </PressScale>
                  ) : (
                    <View className="photo-slot relative h-full w-full">
                      <Image source={{ uri: item.uri }} className="h-full w-full" contentFit="cover" />
                      {item.status === 'uploading' ? (
                        <View className="absolute inset-0 items-center justify-center bg-[rgba(255,255,255,0.6)]">
                          <Text className="prose-caption text-graphite">Uploading…</Text>
                        </View>
                      ) : (
                        <PressScale
                          accessibilityRole="button"
                          onPress={item.onRetry}
                          className="absolute inset-0 items-center justify-center bg-[rgba(255,0,0,0.12)]">
                          <Text className="prose-caption font-semibold text-pass">Failed — Retry</Text>
                        </PressScale>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </DropProvider>
      ) : null}
    </GestureHandlerRootView>
  );
}
