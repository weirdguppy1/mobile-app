import { Image } from 'expo-image';
import { ImagePlus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  calculateGridPosition,
  GridOrientation,
  SortableGrid,
  SortableGridItem,
  type SortableGridRenderItemProps,
} from 'react-native-reanimated-dnd';
import { scheduleOnRN } from 'react-native-worklets';
import { useResolveClassNames } from 'uniwind';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components/press-scale';

export interface PhotoItem {
  id: string;
  /** null when a saved photo's signed URL could not be generated. The tile
   *  still renders (as a placeholder) so it stays removable. */
  uri: string | null;
  status?: 'uploading' | 'error' | 'ready';
  onRetry?: () => void;
}

/** A square image, or a neutral "Unavailable" placeholder when there is no uri
 *  (e.g. a saved photo whose signed URL failed to generate). */
function PhotoImage({ uri }: { uri: string | null }) {
  if (!uri) {
    return (
      <View className="h-full w-full items-center justify-center bg-hairline">
        <Text className="prose-caption text-graphite">Unavailable</Text>
      </View>
    );
  }
  // expo-image is not a react-native component, so Uniwind doesn't apply
  // className to it — size it with an explicit style or it renders 0x0.
  return <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />;
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
// How long the grid stays stacked above the trailing tiles after a drop, so the
// released tile finishes settling into its slot (the library uses a ~300ms
// timing) before the add/upload cells return to the top of the stack.
const SETTLE_MS = 350;
// Tile pop-out: shrink + fade, then the row is actually removed.
const EXIT_DURATION = 220; // ms
const EXIT_SCALE = 0.8; // how far the tile shrinks as it fades to nothing

// Non-reorderable cells that trail the saved photos (in-flight upload, a failed
// upload, and the add button). They share the same grid so the whole thing
// reads as one 4-up layout, but they are not draggable.
type TrailingTile =
  | { key: string; kind: 'add' }
  | { key: string; kind: 'uploading' | 'error'; item: PhotoItem };

interface PhotoTileProps {
  p: SortableGridRenderItemProps<PhotoItem>;
  itemWidth: number;
  itemHeight: number;
  onRemove: (id: string) => void;
  onDragStart: () => void;
  onDrop: (droppedId: string, position: number) => void;
}

/** A single draggable saved-photo tile. Owns its own exit animation: tapping ✕
 *  shrinks + fades the tile via a shared value we drive directly — not the grid's
 *  opaque, prop-driven internal style — and only when that finishes does it ask
 *  the parent to delete the row. So the tile holds its slot while it pops, then
 *  the remaining tiles spring up to fill the gap. The exit style lives on the
 *  inner content view so it never fights the grid's outer drag/position transform. */
function PhotoTile({ p, itemWidth, itemHeight, onRemove, onDragStart, onDrop }: PhotoTileProps) {
  const exit = useSharedValue(0); // 0 = present, 1 = fully popped out
  const removing = useRef(false);

  const exitStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: 1 - exit.value * (1 - EXIT_SCALE) }],
  }));

  const slot = useResolveClassNames('photo-slot relative');

  const remove = () => {
    if (removing.current) return; // already popping out
    removing.current = true;
    exit.value = withTiming(1, { duration: EXIT_DURATION }, (finished) => {
      if (finished) scheduleOnRN(onRemove, p.item.id);
    });
  };

  return (
    <SortableGridItem
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
      onDragStart={onDragStart}
      onDrop={onDrop}>
      <Animated.View style={[slot, { width: itemWidth, height: itemHeight }, exitStyle]}>
        <PhotoImage uri={p.item.uri} />
        {p.index === 0 ? (
          <View className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5">
            <Text className="prose-caption text-canvas">Primary</Text>
          </View>
        ) : null}
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          onPress={remove}
          className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-canvas/90">
          <Text className="prose-caption text-pass">✕</Text>
        </PressScale>
      </Animated.View>
    </SortableGridItem>
  );
}

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

  // SortableGrid can't seed an item that wasn't present when the grid mounted
  // (its reposition reaction skips the undefined→defined transition), so a newly
  // *added* photo would stack at (0,0) under the primary. We remount to re-seed
  // it. Removals must NOT remount, or the spring-repositioning of the remaining
  // tiles gets destroyed — so this key only advances when a genuinely new id
  // appears, never when one leaves. (Reorder keeps the same members, so it never
  // remounts either.)
  const idsKey = reorderable.map((p) => p.id).sort().join(',');
  const [seenKey, setSeenKey] = useState('');
  const [gridEpoch, setGridEpoch] = useState(0);
  if (idsKey !== seenKey) {
    const prev = new Set(seenKey ? seenKey.split(',') : []);
    if (reorderable.some((p) => !prev.has(p.id))) setGridEpoch((e) => e + 1);
    setSeenKey(idsKey);
  }
  const gridKey = String(gridEpoch);

  // While a tile is being dragged (and briefly after release, while it settles
  // into its slot) the grid must paint above the trailing tiles, or their
  // photo-slot backgrounds cover the floating photo. At rest the order flips
  // back, because the trailing tiles have to sit above the grid's ScrollView —
  // a ScrollView consumes touches even with scrolling disabled, so an add
  // button underneath it would be untappable.
  const [dragging, setDragging] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(settleTimer.current ?? undefined), []);

  const handleDragStart = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setDragging(true);
  };

  const handleDrop = (droppedId: string, position: number) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setDragging(false), SETTLE_MS);
    const from = reorderable.findIndex((x) => x.id === droppedId);
    if (from !== -1 && from !== position) onReorder(from, position);
  };

  // SortableGrid builds its children via data.map() but doesn't assign them a
  // React key, so the key must live on the root element renderItem returns.
  const renderPhoto = (p: SortableGridRenderItemProps<PhotoItem>) => (
    <PhotoTile
      key={p.item.id}
      p={p}
      itemWidth={itemWidth}
      itemHeight={itemHeight}
      onRemove={onRemove}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
    />
  );

  const renderTrailing = (tile: TrailingTile) => {
    if (tile.kind === 'add') {
      return (
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={onAdd}
          className="photo-slot h-full w-full items-center justify-center">
          <ImagePlus size={28} color={Brand.ash} strokeWidth={2} />
        </PressScale>
      );
    }
    return (
      <View className="photo-slot relative h-full w-full">
        <PhotoImage uri={tile.item.uri} />
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
            // SortableGrid renders into a ScrollView, which clips children to
            // its bounds — so it must cover every row a dragged tile can visit
            // (the full grid, trailing row included), not just the saved rows.
            // zIndex lives on this wrapper because the grid's own root element
            // isn't styleable from here.
            <View style={{ height: containerHeight, zIndex: dragging ? 1 : 0 }}>
              <SortableGrid
                key={gridKey}
                data={reorderable}
                dimensions={dimensions}
                renderItem={renderPhoto}
                scrollEnabled={false}
                style={{ height: containerHeight }}
              />
            </View>
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
