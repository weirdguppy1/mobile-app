import { computeCompatibility } from '@/features/discovery/lib/compatibility';
import { Profile } from '@/features/profile/types';

const base: Profile = {
  id: 'x', email: 'x@rice.edu', school_domain: 'rice.edu', first_name: 'X', pronouns: null,
  university: 'Rice', graduation_year: 2028, majors: ['Biology'], gender_identity: null,
  sex_assigned_at_birth: null, sexual_orientation: null, sleep_schedule: 'night_owl',
  bedtime: 'after_midnight', wakeup_time: 'after_9am', cleanliness: 4, noise_preference: 'need_quiet',
  study_style: 'mostly_library', guests_frequency: 'rarely', romantic_guests_frequency: 'rarely',
  social_level: 4, room_temperature: 'cold', alcohol: 'never', smoking: 'no', parties: 'sometimes',
  fitness: 'regularly', interests: ['gym', 'coding', 'music'], deal_breakers: ['smoking'],
  dorm_preference: null, living_program: null, clubs: null, instagram: null, linkedin: null, snapchat: null,
  about_me: null, hidden_fields: [], onboarding_complete: true, created_at: '', updated_at: '',
};

const make = (overrides: Partial<Profile>): Profile => ({ ...base, ...overrides });

describe('computeCompatibility', () => {
  it('identical profiles score high with concrete reasons', () => {
    const c = computeCompatibility(base, make({ id: 'y' }));
    expect(c.score).toBeGreaterThanOrEqual(90);
    expect(c.reasons).toContain('Similar sleep schedules');
    expect(c.reasons.length).toBeLessThanOrEqual(3);
    expect(c.emoji).toBe('🔥');
  });

  it('clamps to at most 99', () => {
    const c = computeCompatibility(base, make({ id: 'y' }));
    expect(c.score).toBeLessThanOrEqual(99);
  });

  it('quiet noise preference yields the study-environment reason', () => {
    const c = computeCompatibility(base, make({ id: 'y' }));
    expect(c.reasons).toContain('Both prefer quiet study environments');
  });

  it('opposite profile scores lower but still surfaces ≥2 reasons', () => {
    const opposite = make({
      id: 'z', sleep_schedule: 'early_bird', bedtime: 'before_10pm', wakeup_time: 'before_7am',
      cleanliness: 1, noise_preference: 'doesnt_matter', study_style: 'mostly_room',
      guests_frequency: 'frequently', social_level: 1, room_temperature: 'warm', smoking: 'frequently',
      fitness: 'never', interests: ['fashion', 'cooking'], majors: ['History'],
    });
    const c = computeCompatibility(base, opposite);
    expect(c.score).toBeLessThan(60);
    expect(c.reasons.length).toBeGreaterThanOrEqual(2);
    expect(typeof c.emoji).toBe('string');
  });

  it('surfaces shared interests when they are the strongest signal', () => {
    // Differs on every high-weight dimension, so the interest overlap reaches the top reasons.
    const c = computeCompatibility(
      base,
      make({
        id: 'y', sleep_schedule: 'early_bird', bedtime: 'before_10pm', cleanliness: 1,
        noise_preference: 'doesnt_matter', study_style: 'mostly_room', guests_frequency: 'frequently',
        social_level: 1, room_temperature: 'warm', smoking: 'frequently', fitness: 'never',
        majors: ['History'], interests: ['gym', 'coding', 'hiking'],
      }),
    );
    expect(c.reasons).toContain('2 shared interests');
  });

  it('handles null fields without matching them', () => {
    const sparse = make({ id: 'n', sleep_schedule: null, cleanliness: null, noise_preference: null });
    const c = computeCompatibility(sparse, make({ id: 'm', sleep_schedule: null, cleanliness: null }));
    expect(c.reasons).not.toContain('Similar sleep schedules');
    expect(c.reasons.length).toBeGreaterThanOrEqual(2);
  });
});
