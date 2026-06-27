import { buildSocialLinks } from '@/features/profile/lib/social-links';

describe('buildSocialLinks', () => {
  it('returns nothing when no socials are set', () => {
    expect(buildSocialLinks({ instagram: null, linkedin: null, snapchat: null })).toEqual([]);
  });

  it('strips a leading @ from instagram and snapchat handles', () => {
    const links = buildSocialLinks({ instagram: '@mia', linkedin: null, snapchat: '@mia.snap' });
    expect(links).toEqual([
      { key: 'instagram', url: 'https://instagram.com/mia' },
      { key: 'snapchat', url: 'https://snapchat.com/add/mia.snap' },
    ]);
  });

  it('prefixes a bare linkedin path with https and drops leading slashes', () => {
    const links = buildSocialLinks({ instagram: null, linkedin: 'linkedin.com/in/mia', snapchat: null });
    expect(links).toEqual([{ key: 'linkedin', url: 'https://linkedin.com/in/mia' }]);
  });

  it('keeps a linkedin url that already has a scheme', () => {
    const links = buildSocialLinks({ instagram: null, linkedin: 'https://www.linkedin.com/in/mia', snapchat: null });
    expect(links).toEqual([{ key: 'linkedin', url: 'https://www.linkedin.com/in/mia' }]);
  });

  it('preserves display order: instagram, linkedin, snapchat', () => {
    const links = buildSocialLinks({ snapchat: '@s', instagram: '@i', linkedin: 'linkedin.com/in/l' });
    expect(links.map((l) => l.key)).toEqual(['instagram', 'linkedin', 'snapchat']);
  });

  it('ignores blank/whitespace-only handles', () => {
    expect(buildSocialLinks({ instagram: '   ', linkedin: '', snapchat: null })).toEqual([]);
  });
});
