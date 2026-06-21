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
