import { QUESTIONS } from '@/features/onboarding/config/questions';
import { SECTIONS } from '@/features/onboarding/config/sections';
import { OnboardingData } from '@/features/profile/types';

const blankProfile = {
  id: 'u1', email: 'a@x.edu', school_domain: 'x.edu', first_name: null, pronouns: null,
  university: 'X', graduation_year: null, majors: null, gender_identity: null,
  sex_assigned_at_birth: null, sexual_orientation: null, sleep_schedule: null,
  bedtime: null, wakeup_time: null, cleanliness: null, noise_preference: null,
  study_style: null, guests_frequency: null, romantic_guests_frequency: null,
  social_level: null, room_temperature: null, alcohol: null, smoking: null,
  parties: null, fitness: null, interests: null, deal_breakers: null,
  dorm_preference: null, living_program: null, clubs: null, instagram: null,
  linkedin: null, about_me: null, onboarding_complete: false, created_at: '', updated_at: '',
} as const;
const data = (o: Record<string, unknown> = {}): OnboardingData =>
  ({ profile: { ...blankProfile, ...o } as unknown as typeof blankProfile, photos: [], prompts: [] });

describe('QUESTIONS', () => {
  it('has unique ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every question belongs to a known section and every section has questions', () => {
    const sectionIds = new Set(SECTIONS.map((s) => s.id));
    for (const q of QUESTIONS) expect(sectionIds.has(q.section)).toBe(true);
    for (const s of SECTIONS) expect(QUESTIONS.some((q) => q.section === s.id)).toBe(true);
  });
  it('every question has a non-empty hero title and an isComplete predicate', () => {
    for (const q of QUESTIONS) {
      expect(q.title.length).toBeGreaterThan(0);
      expect(typeof q.isComplete).toBe('function');
    }
  });
  it('marks the known optional questions optional and the required ones required', () => {
    const optional = new Set(['pronouns', 'gender_identity', 'deal_breakers',
      'dorm_preference', 'living_program', 'clubs', 'instagram', 'linkedin', 'phone']);
    for (const q of QUESTIONS) expect(!!q.optional).toBe(optional.has(q.id));
  });
  it('optional questions are complete even when blank', () => {
    for (const q of QUESTIONS.filter((q) => q.optional)) expect(q.isComplete(data())).toBe(true);
  });
  it('first_name is incomplete when blank and complete once set', () => {
    const fn = QUESTIONS.find((q) => q.id === 'first_name')!;
    expect(fn.isComplete(data())).toBe(false);
    expect(fn.isComplete(data({ first_name: 'Mia' }))).toBe(true);
  });
});
