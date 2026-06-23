import { firstIncompleteQuestion, sectionProgress } from '@/features/onboarding/lib/onboarding-progress';
import { QUESTIONS } from '@/features/onboarding/config/questions';
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
  about_me: null, hidden_fields: [] as string[], onboarding_complete: false, created_at: '', updated_at: '',
} as const;
const data = (overrides: Record<string, unknown> = {}): OnboardingData => ({
  profile: { ...blankProfile, ...overrides } as unknown as typeof blankProfile, photos: [], prompts: [],
});

describe('firstIncompleteQuestion', () => {
  it('returns 0 for a blank profile (first_name)', () => {
    expect(firstIncompleteQuestion(QUESTIONS, data())).toBe(0);
  });
  it('returns the last question (review) when everything is complete', () => {
    const complete = QUESTIONS.map((q) => ({ ...q, isComplete: () => true }));
    expect(firstIncompleteQuestion(complete, data())).toBe(complete.length - 1);
  });
});

describe('sectionProgress', () => {
  it('reports position within the question\'s section, 1-based', () => {
    expect(sectionProgress(QUESTIONS, 'first_name')).toEqual({ current: 1, total: 7 });
    expect(sectionProgress(QUESTIONS, 'sexual_orientation')).toEqual({ current: 7, total: 7 });
  });
  it('single-question sections report 1 of 1', () => {
    expect(sectionProgress(QUESTIONS, 'interests')).toEqual({ current: 1, total: 1 });
  });
});
