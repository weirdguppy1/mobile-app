import { toneFor } from '@/features/onboarding/config/step-tone';

describe('toneFor', () => {
  it('maps sleep/living-habits to cool', () => {
    expect(toneFor('compatibility')).toBe('cool');
  });

  it('maps lifestyle, prompts and review to warm', () => {
    expect(toneFor('lifestyle')).toBe('warm');
    expect(toneFor('prompts')).toBe('warm');
    expect(toneFor('review')).toBe('warm');
  });

  it('maps the remaining steps to neutral', () => {
    expect(toneFor('basics')).toBe('neutral');
    expect(toneFor('interests')).toBe('neutral');
    expect(toneFor('dealBreakers')).toBe('neutral');
    expect(toneFor('photos')).toBe('neutral');
    expect(toneFor('extras')).toBe('neutral');
  });
});
