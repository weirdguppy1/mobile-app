import { DiscoverWashes } from '@/constants/theme';
import { washForId, washIndexForId } from '@/shared/lib/wash';

describe('wash picker', () => {
  it('is deterministic for the same id', () => {
    expect(washIndexForId('abc-123')).toBe(washIndexForId('abc-123'));
    expect(washForId('abc-123').key).toBe(washForId('abc-123').key);
  });

  it('always returns an index within the pool', () => {
    for (const id of ['', 'a', 'a-very-long-profile-uuid-0000', '99']) {
      const i = washIndexForId(id);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(DiscoverWashes.length);
    }
  });

  it('spreads across more than one wash for distinct ids', () => {
    const ids = Array.from({ length: 50 }, (_, n) => `id-${n}`);
    const keys = new Set(ids.map((id) => washForId(id).key));
    expect(keys.size).toBeGreaterThan(1);
  });
});
