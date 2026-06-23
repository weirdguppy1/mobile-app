import { isFieldHidden, toggleHidden } from '@/features/profile/lib/field-visibility';

describe('field visibility', () => {
  it('isFieldHidden reflects membership', () => {
    expect(isFieldHidden(['pronouns'], 'pronouns')).toBe(true);
    expect(isFieldHidden(['pronouns'], 'smoking')).toBe(false);
    expect(isFieldHidden([], 'pronouns')).toBe(false);
  });

  it('toggleHidden adds when hiding, removes when showing, and dedupes', () => {
    expect(toggleHidden([], 'pronouns', false)).toEqual(['pronouns']);
    expect(toggleHidden(['pronouns'], 'pronouns', true)).toEqual([]);
    expect(toggleHidden(['pronouns'], 'pronouns', false)).toEqual(['pronouns']); // no dup
    expect(toggleHidden(['a', 'b'], 'c', false).sort()).toEqual(['a', 'b', 'c']);
  });
});
