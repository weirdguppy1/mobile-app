import { tabDirection } from '@/features/navigation/lib/tab-direction';

describe('tabDirection', () => {
  it('moves forward to a later tab', () => {
    expect(tabDirection(0, 1)).toBe('forward');
    expect(tabDirection(0, 2)).toBe('forward');
  });

  it('moves back to an earlier tab', () => {
    expect(tabDirection(2, 0)).toBe('back');
    expect(tabDirection(1, 0)).toBe('back');
  });

  it('treats the same tab as forward (no-op default)', () => {
    expect(tabDirection(1, 1)).toBe('forward');
  });
});
