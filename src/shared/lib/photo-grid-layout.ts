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
