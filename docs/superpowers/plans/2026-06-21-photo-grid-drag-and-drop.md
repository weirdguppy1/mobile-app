# PhotoGrid Drag-and-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `PhotoGrid`'s `←`/`→` reorder arrows with touch-and-hold drag-and-drop, and lay every tile (photos, in-flight uploads, and the add `+` tile) out in one uniform 3-column grid.

**Architecture:** Extract the grid geometry (cell size, per-index offset, total height) into a pure, unit-tested helper module. Rewrite `PhotoGrid` to position tiles by absolute coordinates from that helper: reorderable photos are driven by `react-native-reanimated-dnd`'s grid-sortable hooks (`useGridSortableList` + `<SortableGridItem>`), while the upload/error/add tiles are plain absolutely-positioned cells in the same grid. Drag/drop providers are scoped inside the component (no global change).

**Tech Stack:** React Native + Expo, TypeScript, `react-native-reanimated-dnd@^2.0.0`, `react-native-gesture-handler@~2.31.2`, Uniwind (Tailwind utility classes), Jest (jest-expo).

## Global Constraints

- TypeScript only. **Never `any`, never `@ts-ignore`** (CLAUDE.md).
- Grid: `COLUMNS = 3`, `GAP = 8` (px). Cells are square (`photo-slot` is `aspect-square`).
- Reorder strategy: **Insert / shift** (`GridStrategy.Insert`).
- Drag activation: **touch-and-hold ~200ms** (`activationDelay={200}`).
- Both `GestureHandlerRootView` and `<DropProvider>` live **inside `src/shared/components/photo-grid.tsx`** — no root-layout / global change. The local `GestureHandlerRootView` must **not** carry `flex: 1`.
- `PhotoGridProps` is **unchanged**: `onReorder(from: number, to: number)` stays, so consumers need no signature changes.
- Prefer Tailwind utility classes over new shared components (memory: design-system-utility-classes).
- Verification gate: `npx tsc --noEmit` (lint infra is known-broken — memory: lint-infra-broken) plus `npx jest`.
- Library facts already verified (do not re-derive): `useGridSortableList` does **not** throw on `itemWidth: 0` (only the high-level `<SortableGrid>` component validates); `<SortableGridItem>` positions itself `position:absolute` and requires a `<DropProvider>` ancestor; `onDrop(id, position, allPositions)` fires once on finalize with `position` = the dragged item's **final index**; the library's cell offset is `column*(itemWidth+columnGap)`, `row*(itemHeight+rowGap)` — matches this plan's helper exactly.

---

### Task 1: Grid geometry helper

Pure functions that compute cell size, per-index offset, and total grid height. No React, no library imports — fully unit-testable. These are the single source of truth for both the sortable `dimensions` and the absolutely-positioned overlay tiles in Task 2.

**Files:**
- Create: `src/shared/lib/photo-grid-layout.ts`
- Test: `src/shared/lib/__tests__/photo-grid-layout.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `PHOTO_GRID_COLUMNS: number` (= 3)
  - `PHOTO_GRID_GAP: number` (= 8)
  - `photoCellSize(containerWidth: number, columns?: number, gap?: number): number`
  - `photoCellOffset(index: number, cellSize: number, columns?: number, gap?: number): { x: number; y: number }`
  - `photoGridHeight(count: number, cellSize: number, columns?: number, gap?: number): number`

- [ ] **Step 1: Write the failing test**

Create `src/shared/lib/__tests__/photo-grid-layout.test.ts`:

```ts
import {
  PHOTO_GRID_COLUMNS,
  PHOTO_GRID_GAP,
  photoCellOffset,
  photoCellSize,
  photoGridHeight,
} from '@/shared/lib/photo-grid-layout';

describe('photo-grid-layout constants', () => {
  it('uses a 3-column grid with an 8px gap', () => {
    expect(PHOTO_GRID_COLUMNS).toBe(3);
    expect(PHOTO_GRID_GAP).toBe(8);
  });
});

describe('photoCellSize', () => {
  it('divides the width into 3 columns minus the gutters, floored', () => {
    // (320 - 8 * 2) / 3 = 101.33 -> 101
    expect(photoCellSize(320)).toBe(101);
  });

  it('handles an exact division', () => {
    // (324 - 16) / 3 = 102.67 -> 102 ; pick a clean case:
    // (340 - 16) / 3 = 108
    expect(photoCellSize(340)).toBe(108);
  });
});

describe('photoCellOffset', () => {
  it('places index 0 at the origin', () => {
    expect(photoCellOffset(0, 100)).toEqual({ x: 0, y: 0 });
  });

  it('advances across a row by cell + gap', () => {
    expect(photoCellOffset(1, 100)).toEqual({ x: 108, y: 0 });
    expect(photoCellOffset(2, 100)).toEqual({ x: 216, y: 0 });
  });

  it('wraps to the next row after the last column', () => {
    expect(photoCellOffset(3, 100)).toEqual({ x: 0, y: 108 });
    expect(photoCellOffset(4, 100)).toEqual({ x: 108, y: 108 });
  });
});

describe('photoGridHeight', () => {
  it('is zero when there are no tiles', () => {
    expect(photoGridHeight(0, 100)).toBe(0);
  });

  it('is one cell tall for a single tile', () => {
    expect(photoGridHeight(1, 100)).toBe(100);
  });

  it('counts rows with gaps between them', () => {
    // 4 tiles -> 2 rows -> 2*100 + 1*8 = 208
    expect(photoGridHeight(4, 100)).toBe(208);
  });

  it('rounds a partial last row up', () => {
    // 7 tiles -> 3 rows -> 3*100 + 2*8 = 316
    expect(photoGridHeight(7, 100)).toBe(316);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/shared/lib/__tests__/photo-grid-layout.test.ts`
Expected: FAIL — `Cannot find module '@/shared/lib/photo-grid-layout'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/shared/lib/photo-grid-layout.ts`:

```ts
/** Geometry for the 3-column photo grid. Pure math shared by the sortable
 *  photo tiles and the non-draggable upload / error / add tiles, so both sit
 *  on the same pixel grid. Mirrors react-native-reanimated-dnd's grid offset
 *  formula (column*(itemWidth+columnGap), row*(itemHeight+rowGap)). */

export const PHOTO_GRID_COLUMNS = 3;
export const PHOTO_GRID_GAP = 8;

/** Square cell edge that fits `columns` cells plus gutters into `containerWidth`. */
export function photoCellSize(
  containerWidth: number,
  columns = PHOTO_GRID_COLUMNS,
  gap = PHOTO_GRID_GAP,
) {
  return Math.floor((containerWidth - gap * (columns - 1)) / columns);
}

/** Top-left corner of the cell at `index` (row-major), in grid-local pixels. */
export function photoCellOffset(
  index: number,
  cellSize: number,
  columns = PHOTO_GRID_COLUMNS,
  gap = PHOTO_GRID_GAP,
) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return { x: column * (cellSize + gap), y: row * (cellSize + gap) };
}

/** Total grid height for `count` tiles, including inter-row gaps. */
export function photoGridHeight(
  count: number,
  cellSize: number,
  columns = PHOTO_GRID_COLUMNS,
  gap = PHOTO_GRID_GAP,
) {
  if (count <= 0) return 0;
  const rows = Math.ceil(count / columns);
  return rows * cellSize + (rows - 1) * gap;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/shared/lib/__tests__/photo-grid-layout.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/photo-grid-layout.ts src/shared/lib/__tests__/photo-grid-layout.test.ts
git commit -m "feat(photo-grid): pure grid geometry helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Rewrite PhotoGrid as a drag-and-drop grid

Replace the flex-wrap + arrow-button implementation with the absolute-positioned DnD grid. Reorderable photos use the grid-sortable hooks; upload/error/add tiles are absolutely-positioned non-draggable cells. Gesture/drop providers are scoped inside the component.

Drag interactions and absolute layout are not unit-testable with the current Jest setup (no react-native-testing-library; gestures need a device), so this task is verified by `npx tsc --noEmit` plus a manual smoke test in the dev playground.

**Files:**
- Modify (full rewrite): `src/shared/components/photo-grid.tsx`

**Interfaces:**
- Consumes (from Task 1): `PHOTO_GRID_COLUMNS`, `PHOTO_GRID_GAP`, `photoCellSize`, `photoCellOffset`, `photoGridHeight` from `@/shared/lib/photo-grid-layout`.
- Consumes (from library): `DropProvider`, `GridOrientation`, `GridStrategy`, `SortableGridItem`, `useGridSortableList` from `react-native-reanimated-dnd`; `GestureHandlerRootView` from `react-native-gesture-handler`.
- Produces (unchanged public API): `export interface PhotoItem { id: string; uri: string; status?: 'uploading' | 'error' | 'ready'; onRetry?: () => void }` and `export function PhotoGrid(props: { photos: PhotoItem[]; onAdd: () => void; onRemove: (id: string) => void; onReorder: (from: number, to: number) => void; max?: number })`.

- [ ] **Step 1: Replace the file contents**

Overwrite `src/shared/components/photo-grid.tsx` with:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS — no errors in `photo-grid.tsx`. (If the library's exported member names differ, fix the import to match `node_modules/react-native-reanimated-dnd/lib/index.d.ts`; all five named exports above are confirmed present there.)

- [ ] **Step 3: Manual smoke test in the dev playground**

Start the app (`npx expo start`), open the dev route → components → "Primitives — PhotoGrid" (`src/app/dev/components.tsx`). Verify:
- All tiles (the seeded photos and the `+` tile) render in one uniform 3-column grid with even square cells and no ragged rows.
- No `←`/`→` arrows appear.
- Touch-and-hold a photo (~200ms) lifts it; dragging it onto another slot reorders by shifting the others; releasing settles it into the grid.
- The `+` tile cannot be dragged and photos cannot displace it.

- [ ] **Step 4: Commit**

```bash
git add src/shared/components/photo-grid.tsx
git commit -m "feat(photo-grid): drag-and-drop reordering in a unified grid

Replace the per-tile arrow controls with touch-and-hold drag reordering
(react-native-reanimated-dnd, insert strategy). All tiles, including the
add tile, now share one uniform 3-column grid. Gesture/drop providers are
scoped inside the component.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Update the Photos step copy and verify end-to-end

The component API is unchanged, so the only consumer change is the helper text that referenced the now-removed arrows. This task also runs the full verification pass.

**Files:**
- Modify: `src/features/onboarding/steps/PhotosStep.tsx:64`

**Interfaces:**
- Consumes: `PhotoGrid` from `@/shared/components` (unchanged API). No code changes beyond copy.

- [ ] **Step 1: Update the helper text**

In `src/features/onboarding/steps/PhotosStep.tsx`, change the reorder hint line:

```tsx
<Text className="prose-caption text-ash">The first photo is your primary. Touch and hold a photo to reorder.</Text>
```

(Was: "...Use the arrows to reorder.")

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npx jest`
Expected: PASS — including the new `photo-grid-layout` tests and the existing `onboarding-progress` / `schema` tests (unaffected).

- [ ] **Step 4: Manual smoke test in onboarding**

In the running app, go through onboarding to the Photos step. Verify: add at least one photo, the grid stays uniform with the `+` tile inline, touch-and-hold drag reorders the saved photos, the new order persists (the primary badge follows the first slot), and the updated hint text reads "Touch and hold a photo to reorder."

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/steps/PhotosStep.tsx
git commit -m "chore(onboarding): update Photos step reorder hint for drag-and-drop

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- Unified grid incl. add tile → Tasks 1 + 2 (geometry + absolute layout of all tile kinds). ✓
- Drag-and-drop via react-native-reanimated-dnd, arrows removed → Task 2. ✓
- Insert strategy + 200ms activation → Task 2 (`GridStrategy.Insert`, `activationDelay={200}`). ✓
- Providers scoped inside `photo-grid.tsx`, no global change → Task 2. ✓
- High-level `<SortableGrid>` avoided (nested-scroll) → Task 2 uses hooks + plain container. ✓
- `onReorder(from,to)` contract unchanged; consumers untouched except copy → Tasks 2 + 3. ✓
- JSDoc updated → Task 2 (new docstring, no `←`/`→`). ✓
- Copy change in PhotosStep → Task 3. ✓
- Edge cases (0 photos, max reached, async re-sync) → handled by `canAdd`/`photoGridHeight`/`useGridSortableList` re-sync. ✓
- Dev-playground registration → already present; no add/remove needed (noted, no task required). ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to". All code blocks complete. ✓

**3. Type consistency:** Helper signatures in Task 1 (`photoCellSize`, `photoCellOffset`, `photoGridHeight`, `PHOTO_GRID_COLUMNS`, `PHOTO_GRID_GAP`) match their imports and call sites in Task 2. `PhotoItem`/`PhotoGridProps`/`onReorder(from,to)` identical to the current file and consumers. `onDrop(id, position)` matches the verified library signature. ✓
