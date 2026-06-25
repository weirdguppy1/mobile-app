import { peerId } from '@/features/messaging/lib/peer';

describe('peerId', () => {
  it('returns the other participant regardless of canonical order', () => {
    expect(peerId({ user_a: 'me', user_b: 'them' }, 'me')).toBe('them');
    expect(peerId({ user_a: 'them', user_b: 'me' }, 'me')).toBe('them');
  });
});
