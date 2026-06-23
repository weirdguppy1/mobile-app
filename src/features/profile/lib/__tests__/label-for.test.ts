import { labelFor } from '@/features/profile/lib/label-for';

const OPTS = [
  { value: 'night_owl', label: 'Night owl' },
  { value: 'early_bird', label: 'Early bird' },
];

describe('labelFor', () => {
  it('returns the matching label', () => {
    expect(labelFor(OPTS, 'night_owl')).toBe('Night owl');
  });
  it('returns "" for null/undefined/empty', () => {
    expect(labelFor(OPTS, null)).toBe('');
    expect(labelFor(OPTS, undefined)).toBe('');
    expect(labelFor(OPTS, '')).toBe('');
  });
  it('falls back to the raw value when unmatched', () => {
    expect(labelFor(OPTS, 'mystery')).toBe('mystery');
  });
});
