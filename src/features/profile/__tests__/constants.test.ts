import {
  ALCOHOL,
  BEDTIME,
  DEAL_BREAKERS,
  GRADUATION_YEARS,
  INTERESTS,
  PROMPT_CATEGORIES,
  PROMPTS,
  ROOM_TEMPERATURE,
  SEX_ASSIGNED_AT_BIRTH,
} from '@/features/profile/constants';

describe('profile constants ↔ DB CHECK sets', () => {
  it('interests vocabulary matches the DB (16 values)', () => {
    expect(INTERESTS.map((o) => o.value)).toEqual([
      'basketball', 'gym', 'running', 'gaming', 'music', 'reading',
      'entrepreneurship', 'coding', 'movies', 'hiking', 'fashion',
      'cooking', 'content_creation', 'greek_life', 'esports', 'volunteering',
    ]);
  });

  it('deal-breakers vocabulary matches the DB (6 values)', () => {
    expect(DEAL_BREAKERS.map((o) => o.value)).toEqual([
      'smoking', 'heavy_partying', 'overnight_guests',
      'different_sleep_schedules', 'cleanliness_mismatch', 'noise_levels',
    ]);
  });

  it('bedtime / room temp / alcohol / sex values match the DB', () => {
    expect(BEDTIME.map((o) => o.value)).toEqual(['before_10pm', '10_to_11pm', '11pm_to_12am', 'after_midnight']);
    expect(ROOM_TEMPERATURE.map((o) => o.value)).toEqual(['cold', 'moderate', 'warm']);
    expect(ALCOHOL.map((o) => o.value)).toEqual(['never', 'occasionally', 'frequently', 'prefer_not_to_say']);
    expect(SEX_ASSIGNED_AT_BIRTH.map((o) => o.value)).toEqual(['female', 'male', 'intersex']);
  });

  it('graduation years cover 2024–2035', () => {
    expect(GRADUATION_YEARS[0]).toBe(2024);
    expect(GRADUATION_YEARS[GRADUATION_YEARS.length - 1]).toBe(2035);
  });

  it('every option has a non-empty human label', () => {
    for (const o of [...INTERESTS, ...DEAL_BREAKERS, ...ALCOHOL]) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });
});

describe('prompt categories', () => {
  it('PROMPTS is the flattened categories with no duplicates', () => {
    const flat = PROMPT_CATEGORIES.flatMap((c) => c.prompts);
    expect(PROMPTS).toEqual(flat);
    expect(new Set(PROMPTS).size).toBe(PROMPTS.length);
  });

  it('every category has a label and at least one prompt, all non-empty', () => {
    expect(PROMPT_CATEGORIES.length).toBeGreaterThan(0);
    for (const c of PROMPT_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.prompts.length).toBeGreaterThan(0);
      for (const p of c.prompts) expect(p.trim().length).toBeGreaterThan(0);
    }
  });
});
