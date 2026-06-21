import { arrayMove } from '@/shared/lib/array-move';

describe('arrayMove', () => {
  it('moves an item left', () => {
    expect(arrayMove(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('moves an item right', () => {
    expect(arrayMove(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });
  it('is a no-op for out-of-range indices', () => {
    expect(arrayMove(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    expect(arrayMove(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
  });
  it('does not mutate the input', () => {
    const input = ['a', 'b', 'c'];
    arrayMove(input, 0, 1);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});
