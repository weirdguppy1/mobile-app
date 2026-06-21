import {
  basicsSchema,
  compatibilitySchema,
  interestsSchema,
  onboardingCompletionSchema,
  promptsSchema,
} from '@/features/profile/schema';

describe('basicsSchema', () => {
  it('requires first name, grad year, 1–3 majors', () => {
    expect(basicsSchema.safeParse({ first_name: '', graduation_year: 2027, majors: ['CS'] }).success).toBe(false);
    expect(basicsSchema.safeParse({ first_name: 'Mia', graduation_year: 2027, majors: [] }).success).toBe(false);
    expect(basicsSchema.safeParse({ first_name: 'Mia', graduation_year: 2027, majors: ['A', 'B', 'C', 'D'] }).success).toBe(false);
    expect(basicsSchema.safeParse({ first_name: 'Mia', graduation_year: 2027, majors: ['CS'] }).success).toBe(true);
  });
});

describe('compatibilitySchema', () => {
  it('requires all nine fields', () => {
    const full = {
      sleep_schedule: 'night_owl', bedtime: 'after_midnight', wakeup_time: 'after_9am',
      cleanliness: 4, noise_preference: 'moderate_ok', study_style: 'mix',
      guests_frequency: 'occasionally', social_level: 3, room_temperature: 'cold',
    };
    expect(compatibilitySchema.safeParse(full).success).toBe(true);
    const { cleanliness, ...missing } = full;
    expect(compatibilitySchema.safeParse(missing).success).toBe(false);
    expect(compatibilitySchema.safeParse({ ...full, room_temperature: 'tropical' }).success).toBe(false);
  });
});

describe('interestsSchema', () => {
  it('enforces 5–10 from the vocabulary', () => {
    expect(interestsSchema.safeParse({ interests: ['gym', 'music', 'coding'] }).success).toBe(false);
    expect(interestsSchema.safeParse({ interests: ['gym', 'music', 'coding', 'reading', 'movies'] }).success).toBe(true);
    expect(interestsSchema.safeParse({ interests: ['gym', 'music', 'coding', 'reading', 'not_real'] }).success).toBe(false);
  });
});

describe('promptsSchema', () => {
  it('requires 1–3 prompts each with a non-empty answer', () => {
    expect(promptsSchema.safeParse({ prompts: [] }).success).toBe(false);
    expect(promptsSchema.safeParse({ prompts: [{ prompt: 'A fun fact about me...', answer: '  ' }] }).success).toBe(false);
    expect(promptsSchema.safeParse({ prompts: [{ prompt: 'A fun fact about me...', answer: 'I juggle' }] }).success).toBe(true);
  });
});

describe('onboardingCompletionSchema', () => {
  const complete = {
    first_name: 'Mia', graduation_year: 2027, majors: ['CS'],
    sleep_schedule: 'night_owl', bedtime: 'after_midnight', wakeup_time: 'after_9am',
    cleanliness: 4, noise_preference: 'moderate_ok', study_style: 'mix',
    guests_frequency: 'occasionally', social_level: 3, room_temperature: 'cold',
    interests: ['gym', 'music', 'coding', 'reading', 'movies'],
    promptCount: 1, photoCount: 1,
  };
  it('passes when all required data present', () => {
    expect(onboardingCompletionSchema.safeParse(complete).success).toBe(true);
  });
  it('fails with zero photos or zero prompts', () => {
    expect(onboardingCompletionSchema.safeParse({ ...complete, photoCount: 0 }).success).toBe(false);
    expect(onboardingCompletionSchema.safeParse({ ...complete, promptCount: 0 }).success).toBe(false);
  });
});
