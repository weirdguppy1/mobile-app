import { SECTIONS, sectionById, type SectionId } from '@/features/onboarding/config/sections';

const EXPECTED_ORDER: SectionId[] = [
  'basics', 'living', 'lifestyle', 'interests', 'dealBreakers', 'prompts', 'photos', 'extras', 'review',
];

describe('SECTIONS', () => {
  it('lists the nine sections in order', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(EXPECTED_ORDER);
  });
  it('every section has a title, non-empty interstitial copy, and a tone', () => {
    for (const s of SECTIONS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.interstitial.headline.length).toBeGreaterThan(0);
      expect(s.interstitial.body.length).toBeGreaterThan(0);
      expect(typeof s.tone).toBe('string');
    }
  });
  it('sectionById resolves a known id', () => {
    expect(sectionById('living').id).toBe('living');
  });
});
