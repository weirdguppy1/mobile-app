# PhotoGrid — drag-and-drop reordering in a unified grid

**Date:** 2026-06-21
**Branch:** `feature/user-setup`
**Status:** Approved design — ready for implementation plan
**Component:** `src/shared/components/photo-grid.tsx`

## Problem

`PhotoGrid` reorders photos with `←`/`→` controls rendered in a row beneath each
ready photo. That control row makes ready-photo cells taller than the
upload / error / add cells, so in the `flex-wrap` layout the tiles do not line up
into a clean grid — rows are ragged.

We want:

1. **One uniform grid** — every tile (ready photos, in-flight upload, error,
   and the "add new" `+` tile) is the same size and sits in the same 3-column grid.
2. **Drag-and-drop reordering** via `react-native-reanimated-dnd` (already a
   dependency, `^2.0.0`) instead of the arrow buttons. Removing the arrow row is
   what makes all cells uniform.

## Decisions (confirmed with user)

- **Reorder strategy: Insert / shift.** Dragging a photo into a slot pushes the
  other photos over to make room; the rest stay in order. Matches the old
  "move one position" feel and standard photo-reorder UX.
- **Drag activation: touch-and-hold ~200ms.** A short press lifts the tile before
  dragging, so scrolling the form doesn't trigger accidental reorders.

## Why not the high-level `<SortableGrid>`

`react-native-reanimated-dnd`'s `<SortableGrid>` renders its **own
`flex: 1` `ScrollView` wrapped in a `GestureHandlerRootView`**. `PhotoGrid` is
rendered inline inside `StepShell`'s existing vertical `ScrollView`
(`src/features/onboarding/components/StepShell.tsx`). Nesting a second
`flex: 1` ScrollView there causes height-collapse and nested-scroll gesture
conflicts.

Instead we use the **lower-level hooks** — `useGridSortableList` (positions +
per-item props) and `<SortableGridItem>` — and render the items into a plain,
fixed-size `position: relative` container. No nested scroll; the parent
`StepShell` ScrollView keeps owning vertical scrolling.

## Architecture

### Layout model

The grid moves from `flex-wrap` + percentage widths to **measured absolute
positioning**, because the library's grid math requires fixed pixel cell sizes.

- `COLUMNS = 3`, `GAP = 8` (preserves the current `p-1` gutter feel).
- Capture container width `W` via `onLayout`. Before `W` is known, render an
  empty measuring `View` (one frame).
- `cellSize = Math.floor((W - GAP * (COLUMNS - 1)) / COLUMNS)`. Tiles are square
  (`photo-slot` is `aspect-square`), so `itemWidth = itemHeight = cellSize`.
- `rows = Math.ceil(totalTiles / COLUMNS)`.
- Grid container is `position: relative` with explicit
  `height = rows * cellSize + (rows - 1) * GAP`.

`dimensions` passed to the library:
`{ columns: COLUMNS, itemWidth: cellSize, itemHeight: cellSize, columnGap: GAP, rowGap: GAP }`.

### Three tile kinds, one grid

`totalTiles = readyPhotos + transientTiles + (canAdd ? 1 : 0)`, laid out in a
single 3-column grid (row-major).

1. **Ready photos** (`status === 'ready' | undefined`) — the sortable set.
   - `useGridSortableList({ data: readyPhotos, dimensions, strategy: GridStrategy.Insert })`
     provides `positions` and `getItemProps(item, index)`.
   - Each renders via `<SortableGridItem {...getItemProps(item, index)} activationDelay={200} onDrop={...}>`.
   - Tile UI is unchanged: `expo-image`, "Primary" badge on index 0, `✕` remove
     button. **The `←`/`→` control row is deleted.**
   - `data` items satisfy the library's `SortableData` shape (`{ id: string }`);
     `PhotoItem` already has `id`.

2. **Transient tiles** (`status === 'uploading' | 'error'`) and **the `+` tile** —
   plain `<View>`s, **absolutely positioned** at their computed `(row, col)` cell,
   immediately after the ready photos in row-major order. Not draggable and not
   part of the sortable set, so photos cannot be dropped into their slots.
   - Cell position helper:
     `x = col * (cellSize + GAP)`, `y = row * (cellSize + GAP)`,
     where `index` runs across the full tile sequence,
     `col = index % COLUMNS`, `row = Math.floor(index / COLUMNS)`.

### Reorder callback

- On drag end, `<SortableGridItem onDrop={(id, position) => ...}>` gives the
  dropped item's final index.
- Compute `from = readyPhotos.findIndex(p => p.id === id)`, `to = position`, and
  call the existing `onReorder(from, to)`.
- The parent (`PhotosStep`) persists the new order via its `reorderPhotos`
  mutation, which updates `saved` → re-derives `items` → `useGridSortableList`'s
  internal `useEffect` re-syncs `positions` to the new data. Order settles
  cleanly after the mutation resolves.

### Provider wiring

Both providers live **inside `photo-grid.tsx`**, scoped to the component — no
global / root-layout change.

- **`GestureHandlerRootView`** (from `react-native-gesture-handler`) is the
  outermost element returned by `PhotoGrid`, wrapping the grid subtree. RNGH
  supports nested local roots for an isolated subtree. It must **not** carry
  `flex: 1` (which would collapse inside `StepShell`'s ScrollView content); it
  simply wraps the fixed-height grid container and sizes to it.
- **`<DropProvider>`** (from `react-native-reanimated-dnd`) sits just inside the
  `GestureHandlerRootView` — `<SortableGridItem>` requires it via context.

## Public API & blast radius

- **`PhotoGridProps` is unchanged.** `onReorder(from: number, to: number)` stays,
  so consumers keep working without edits:
  - `src/features/onboarding/steps/PhotosStep.tsx` — passes `onReorder` as-is.
  - `src/app/dev/components.tsx` — passes `onReorder={() => {}}`.
- **Copy change** in `PhotosStep.tsx`: helper text
  "Use the arrows to reorder." → "Touch and hold a photo to reorder."
- **JSDoc** on `PhotoGrid` updated to describe drag reordering (drop the `←`/`→`
  description).
- **Dev playground**: `PhotoGrid` is already registered in
  `src/app/dev/components.tsx`; no add/remove needed (per CLAUDE.md dev-route rule).

## Edge cases

- **0 ready photos** → grid contains only the `+` tile (1 row).
- **`max` reached** → `canAdd` is false, no `+` tile (existing logic).
- **Async reorder in flight** → positions re-sync from `data` on resolve; a brief
  reflow is acceptable.
- **One upload at a time** → at most one transient tile (existing `PhotosStep`
  invariant: `pendingUri` XOR a saved photo; `failedUri` for retry).

## Out of scope (YAGNI)

- Auto-scroll-while-dragging — the ≤6-tile grid fits on screen and the parent
  owns scrolling.
- Making the `+` / transient tiles draggable.
- Any change to the persistence layer or the `onReorder` contract.

## Testing

- `tsc --noEmit` is the gate (lint infra is known-broken).
- Existing `src/features/onboarding/__tests__/onboarding-progress.test.ts` and
  `src/features/profile/__tests__/schema.test.ts` must still pass.
- Manual smoke in the dev playground (`/dev` → components → PhotoGrid) and the
  onboarding Photos step: add, remove, and drag-reorder photos; confirm the `+`
  and uploading tiles stay put and the grid stays uniform.
