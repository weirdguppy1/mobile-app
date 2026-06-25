import { collectExcludeIds, otherUserId } from '@/features/discovery/lib/exclude-ids';

describe('otherUserId', () => {
  it('returns the non-me participant regardless of canonical order', () => {
    expect(otherUserId({ user_a: 'me', user_b: 'them' }, 'me')).toBe('them');
    expect(otherUserId({ user_a: 'them', user_b: 'me' }, 'me')).toBe('them');
  });
});

describe('collectExcludeIds', () => {
  it('always excludes self', () => {
    const ids = collectExcludeIds({ me: 'me', sent: [], received: [], passed: [], matches: [] });
    expect(ids.has('me')).toBe(true);
    expect(ids.size).toBe(1);
  });

  it('unions sent, received, passed, and match partners', () => {
    const ids = collectExcludeIds({
      me: 'me',
      sent: ['a'],
      received: ['b'],
      passed: ['c'],
      matches: [{ user_a: 'me', user_b: 'd' }, { user_a: 'e', user_b: 'me' }],
    });
    expect([...ids].sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'me']);
  });

  it('dedupes ids that appear in multiple buckets', () => {
    const ids = collectExcludeIds({
      me: 'me',
      sent: ['a'],
      received: ['a'],
      passed: ['a'],
      matches: [{ user_a: 'me', user_b: 'a' }],
    });
    expect([...ids].sort()).toEqual(['a', 'me']);
  });
});
