import { ABOUT_ME_LIMITS } from '@/features/profile/constants';
import { aboutSchema } from '@/features/profile/schema';

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

describe('aboutSchema.about_me', () => {
  it('rejects an empty / whitespace-only bio (required)', () => {
    expect(aboutSchema.safeParse({ about_me: '' }).success).toBe(false);
    expect(aboutSchema.safeParse({ about_me: '   ' }).success).toBe(false);
  });

  it('accepts a bio at the word limit', () => {
    expect(aboutSchema.safeParse({ about_me: words(ABOUT_ME_LIMITS.maxWords) }).success).toBe(true);
  });

  it('rejects a bio over the word limit', () => {
    expect(aboutSchema.safeParse({ about_me: words(ABOUT_ME_LIMITS.maxWords + 1) }).success).toBe(false);
  });
});
