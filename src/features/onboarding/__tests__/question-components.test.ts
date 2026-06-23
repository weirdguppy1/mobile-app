// Mock the component primitives that pull in native modules (reanimated, skia, etc.)
// The coverage test only needs to verify that QUESTION_COMPONENTS keys match QUESTIONS ids
// and that every value is a function — it does not render anything.
jest.mock('@/features/onboarding/lib/make-field-question', () => ({
  makeFieldQuestion: () => function StubQuestion() { return null; },
}));
jest.mock('@/features/onboarding/questions/PromptsQuestion', () => ({
  PromptsQuestion: function StubPrompts() { return null; },
}));
jest.mock('@/features/onboarding/questions/PhotosQuestion', () => ({
  PhotosQuestion: function StubPhotos() { return null; },
}));
jest.mock('@/features/onboarding/questions/ReviewQuestion', () => ({
  ReviewQuestion: function StubReview() { return null; },
}));
// Prevent the schema/constants imports from pulling in native modules transitively
jest.mock('@/features/profile/constants', () => ({
  ALCOHOL: [], BEDTIME: [], CLUBS_MAX: 10, DEAL_BREAKERS: [], FITNESS: [],
  GRADUATION_YEARS: [], GUESTS_FREQUENCY: [], INTERESTS: [], INTERESTS_LIMITS: { min: 5, max: 10 },
  NOISE_PREFERENCE: [], PARTIES: [], ROMANTIC_GUESTS_FREQUENCY: [], ROOM_TEMPERATURE: [],
  SEX_ASSIGNED_AT_BIRTH: [], SEXUAL_ORIENTATION: [], SLEEP_SCHEDULE: [], SMOKING: [],
  STUDY_STYLE: [], WAKEUP_TIME: [],
}));
jest.mock('@/features/profile/schema', () => ({
  basicsSchema: { shape: { first_name: { safeParse: () => ({ success: true }) }, graduation_year: { safeParse: () => ({ success: true }) }, majors: { safeParse: () => ({ success: true }) }, sex_assigned_at_birth: { safeParse: () => ({ success: true }) }, sexual_orientation: { safeParse: () => ({ success: true }) } } },
  compatibilitySchema: { shape: { sleep_schedule: { safeParse: () => ({ success: true }) }, bedtime: { safeParse: () => ({ success: true }) }, wakeup_time: { safeParse: () => ({ success: true }) }, cleanliness: { safeParse: () => ({ success: true }) }, noise_preference: { safeParse: () => ({ success: true }) }, study_style: { safeParse: () => ({ success: true }) }, guests_frequency: { safeParse: () => ({ success: true }) }, romantic_guests_frequency: { safeParse: () => ({ success: true }) }, social_level: { safeParse: () => ({ success: true }) }, room_temperature: { safeParse: () => ({ success: true }) } } },
  lifestyleSchema: { shape: { alcohol: { safeParse: () => ({ success: true }) }, smoking: { safeParse: () => ({ success: true }) }, parties: { safeParse: () => ({ success: true }) }, fitness: { safeParse: () => ({ success: true }) } } },
  interestsSchema: { safeParse: () => ({ success: true }) },
}));
jest.mock('@/shared/components', () => ({
  Field: function StubField() { return null; },
  OptionGroup: function StubOptionGroup() { return null; },
  ScaleInput: function StubScaleInput() { return null; },
  TagInput: function StubTagInput() { return null; },
  TextField: function StubTextField() { return null; },
}));

import { QUESTION_COMPONENTS } from '@/features/onboarding/config/question-components';
import { QUESTIONS } from '@/features/onboarding/config/questions';

describe('QUESTION_COMPONENTS', () => {
  it('has exactly one component per question id', () => {
    expect(Object.keys(QUESTION_COMPONENTS).sort()).toEqual(QUESTIONS.map((q) => q.id).sort());
  });
  it('every entry is a component', () => {
    for (const id of QUESTIONS.map((q) => q.id)) {
      expect(typeof QUESTION_COMPONENTS[id]).toBe('function');
    }
  });
});
