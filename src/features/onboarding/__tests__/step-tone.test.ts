import { toneFor } from '@/features/onboarding/config/step-tone';

describe('toneFor', () => {
  it('maps each step to its current background tone', () => {
    expect(toneFor('compatibility')).toBe('horizon');
    expect(toneFor('interests')).toBe('expression');
    expect(toneFor('prompts')).toBe('energy');
    expect(toneFor('review')).toBe('warm');
  });

  it('falls back to the neutral wash for the remaining steps', () => {
    expect(toneFor('basics')).toBe('neutral');
    expect(toneFor('lifestyle')).toBe('neutral');
    expect(toneFor('dealBreakers')).toBe('neutral');
    expect(toneFor('photos')).toBe('neutral');
    expect(toneFor('extras')).toBe('neutral');
  });
});
