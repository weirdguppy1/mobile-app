import { firstIncompleteIndex } from '@/features/onboarding/lib/onboarding-progress';
import { OnboardingData } from '@/features/profile/types';

const blankProfile = {
  id: 'u1', email: 'a@x.edu', school_domain: 'x.edu', first_name: null, pronouns: null,
  university: 'X', graduation_year: null, majors: null, gender_identity: null,
  sex_assigned_at_birth: null, sexual_orientation: null, sleep_schedule: null,
  bedtime: null, wakeup_time: null,
  cleanliness: null, noise_preference: null, study_style: null, guests_frequency: null,
  romantic_guests_frequency: null, social_level: null, room_temperature: null,
  alcohol: null, smoking: null, parties: null,
  fitness: null, interests: null, deal_breakers: null, dorm_preference: null,
  living_program: null, clubs: null, instagram: null, linkedin: null,
  onboarding_complete: false, created_at: '', updated_at: '',
} as const;
const data = (overrides: Record<string, unknown> = {}): OnboardingData => ({
  profile: { ...blankProfile, ...overrides } as unknown as typeof blankProfile, photos: [], prompts: [],
});

const steps = [
  { isComplete: (d: OnboardingData) => !!d.profile.first_name },
  { isComplete: (d: OnboardingData) => !!d.profile.cleanliness },
  { isComplete: () => false },
];

describe('firstIncompleteIndex', () => {
  it('returns 0 for a blank profile', () => {
    expect(firstIncompleteIndex(steps, data())).toBe(0);
  });
  it('skips completed leading steps', () => {
    expect(firstIncompleteIndex(steps, data({ first_name: 'Mia' }))).toBe(1);
  });
  it('returns the last index when all but the final are complete', () => {
    expect(firstIncompleteIndex(steps, data({ first_name: 'Mia', cleanliness: 3 }))).toBe(2);
  });
});
