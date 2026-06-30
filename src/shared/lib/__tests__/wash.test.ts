import { DiscoverWashes } from '@/constants/theme';
import { randomWash } from '@/shared/lib/wash';

describe('randomWash', () => {
  it('always returns an entry from the pool', () => {
    for (let i = 0; i < 50; i++) {
      expect(DiscoverWashes).toContain(randomWash());
    }
  });

  it('produces more than one distinct wash over many calls', () => {
    const keys = new Set(Array.from({ length: 50 }, () => randomWash().key));
    expect(keys.size).toBeGreaterThan(1);
  });
});
