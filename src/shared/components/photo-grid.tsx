import { Image } from 'expo-image';
import { useState } from 'react';
import { type LayoutChangeEvent, Text, View } from 'react-native';
import {
  calculateGridPosition,
  GridOrientation,
  SortableGrid,
  SortableGridItem,
  type SortableGridRenderItemProps,
} from 'react-native-reanimated-dnd';

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

const COLUMNS = 3;
const GAP = 8; // px between cells, both axes
const ACTIVATION_DELAY = 220; // ms touch-and-hold before a drag begins

// Non-reorderable cells that trail the saved photos (in-flight upload, a failed
// upload, and the add button). They share the same grid so the whole thing
// reads as one 4-up layout, but they are not draggable.
type TrailingTile =
  | { key: string; kind: 'add' }
  | { key: string; kind: 'uploading' | 'error'; item: PhotoItem };

/** Add / remove / reorder photo slots in a 4-up grid. Slot 0 is the primary
 *  photo. Saved photos reorder via touch-and-hold drag (SortableGrid); the
 *  upload/error/add tiles are static cells aligned to the same grid. */
export function PhotoGrid({ photos, onAdd, onRemove, onReorder, max = 6 }: PhotoGridProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const reorderable = photos.filter((p) => p.status === 'ready' || p.status === undefined);
  const transient = photos.filter((p) => p.status === 'uploading' || p.status === 'error');
  const canAdd = photos.length < max;

  const trailing: TrailingTile[] = [
    ...transient.map((p): TrailingTile => ({ key: p.id, kind: p.status === 'error' ? 'error' : 'uploading', item: p })),
    ...(canAdd ? [{ key: 'add', kind: 'add' } as const] : []),
  ];

  const itemWidth = width > 0 ? (width - GAP * (COLUMNS - 1)) / COLUMNS : 0;
  const itemHeight = itemWidth; // photo-slot is aspect-square
  const dimensions = { columns: COLUMNS, itemWidth, itemHeight, rowGap: GAP, columnGap: GAP };

  const rows = (count: number) => (count > 0 ? Math.ceil(count / COLUMNS) * (itemHeight + GAP) - GAP : 0);
  const containerHeight = rows(reorderable.length + trailing.length);
  const gridHeight = rows(reorderable.length);

  // SortableGrid seeds each item's position once at mount and never repositions
  // an item whose id was absent then (its reposition reaction skips the
  // undefined→defined transition), so a newly added photo stacks at (0,0) under
  // the primary instead of appearing. Remount the grid whenever the *set* of
  // photos changes — keyed on membership, not order, so drag-reorder is unaffected.
  const gridKey = reorderable.map((p) => p.id).sort().join(',');

  const renderPhoto = (p: SortableGridRenderItemProps<PhotoItem>) => (
    // SortableGrid builds its children via data.map() but doesn't assign a React
    // key to them (itemKeyExtractor only feeds internal position tracking), so the
    // key must live on the root element renderItem returns.
    <SortableGridItem
      key={p.item.id}
      id={p.id}
      data={p.item}
      positions={p.positions}
      scrollX={p.scrollX}
      scrollY={p.scrollY}
      autoScrollDirection={p.autoScrollDirection}
      itemsCount={p.itemsCount}
      dimensions={p.dimensions}
      orientation={p.orientation}
      strategy={p.strategy}
      activationDelay={ACTIVATION_DELAY}
      onDrop={(droppedId, position) => {
        const from = reorderable.findIndex((x) => x.id === droppedId);
        if (from !== -1 && from !== position) onReorder(from, position);
      }}>
      <View className="photo-slot relative" style={{ width: itemWidth, height: itemHeight }}>
        {/* expo-image is not a react-native component, so Uniwind doesn't apply
            className to it — size it with an explicit style or it renders 0x0. */}
        <Image source={{ uri: p.item.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {p.index === 0 ? (
          <View className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5">
            <Text className="prose-caption text-canvas">Primary</Text>
          </View>
        ) : null}
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          onPress={() => onRemove(p.item.id)}
          className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-canvas/90">
          <Text className="prose-caption text-pass">✕</Text>
        </PressScale>
      </View>
    </SortableGridItem>
  );

  const renderTrailing = (tile: TrailingTile) => {
    if (tile.kind === 'add') {
      return (
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={onAdd}
          className="photo-slot h-full w-full items-center justify-center">
          <Text className="prose-display text-fog">+</Text>
        </PressScale>
      );
    }
    return (
      <View className="photo-slot relative h-full w-full">
        <Image source={{ uri: tile.item.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {tile.kind === 'uploading' ? (
          <View className="absolute inset-0 items-center justify-center bg-[rgba(255,255,255,0.6)]">
            <Text className="prose-caption text-graphite">Uploading…</Text>
          </View>
        ) : (
          <PressScale
            accessibilityRole="button"
            onPress={tile.item.onRetry}
            className="absolute inset-0 items-center justify-center bg-[rgba(255,0,0,0.12)]">
            <Text className="prose-caption font-semibold text-pass">Failed — Retry</Text>
          </PressScale>
        )}
      </View>
    );
  };

  return (
    <View onLayout={onLayout}>
      {itemWidth > 0 ? (
        <View style={{ height: containerHeight }}>
          {reorderable.length > 0 ? (
            <SortableGrid
              key={gridKey}
              data={reorderable}
              dimensions={dimensions}
              renderItem={renderPhoto}
              scrollEnabled={false}
              style={{ height: gridHeight }}
            />
          ) : null}
          {trailing.map((tile, k) => {
            const pos = calculateGridPosition(reorderable.length + k, dimensions, GridOrientation.Vertical);
            return (
              <View
                key={tile.key}
                style={{ position: 'absolute', left: pos.x, top: pos.y, width: itemWidth, height: itemHeight }}>
                {renderTrailing(tile)}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
