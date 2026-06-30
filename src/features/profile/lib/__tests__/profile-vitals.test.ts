import { buildHeaderVitals, buildProfileFeed, buildVitals } from '@/features/profile/lib/profile-vitals';
import { Profile, ProfilePrompt, SignedProfilePhoto } from '@/features/profile/types';

const profile = (o: Partial<Profile>): Profile =>
  ({ graduation_year: null, majors: null, dorm_preference: null, sleep_schedule: null, hidden_fields: [], ...o } as unknown as Profile);

describe('buildVitals', () => {
  it('orders year · major · dorm · sleep, skipping empties', () => {
    expect(buildVitals(profile({ graduation_year: 2027, majors: ['CS', 'Math'], dorm_preference: 'North', sleep_schedule: 'night_owl' })))
      .toEqual(['2027', 'CS', 'North', 'Night owl']);
  });
  it('omits hidden dorm/sleep', () => {
    expect(buildVitals(profile({ graduation_year: 2027, majors: ['CS'], dorm_preference: 'North', sleep_schedule: 'night_owl', hidden_fields: ['dorm_preference', 'sleep_schedule'] })))
      .toEqual(['2027', 'CS']);
  });
  it('is empty when nothing is set', () => {
    expect(buildVitals(profile({}))).toEqual([]);
  });
});

describe('buildHeaderVitals', () => {
  it('returns only year and major, never dorm/sleep', () => {
    expect(buildHeaderVitals(profile({ graduation_year: 2029, majors: ['Undeclared'], dorm_preference: 'East', sleep_schedule: 'early_bird' })))
      .toEqual(['2029', 'Undeclared']);
  });
  it('skips missing values', () => {
    expect(buildHeaderVitals(profile({ graduation_year: 2029 }))).toEqual(['2029']);
  });
});

describe('buildProfileFeed', () => {
  const photo = (id: string) => ({ id } as unknown as SignedProfilePhoto);
  const prompt = (id: string) => ({ id } as unknown as ProfilePrompt);

  it('alternates photo/prompt with the remainder trailing', () => {
    const feed = buildProfileFeed([photo('p0'), photo('p1')], [prompt('q0')]);
    expect(feed.map((f) => f.type)).toEqual(['photo', 'prompt', 'photo']);
    expect(feed[0]).toEqual({ type: 'photo', photo: photo('p0') });
  });
  it('handles prompt-only and empty', () => {
    expect(buildProfileFeed([], [prompt('q0'), prompt('q1')]).map((f) => f.type)).toEqual(['prompt', 'prompt']);
    expect(buildProfileFeed([], [])).toEqual([]);
  });
});
