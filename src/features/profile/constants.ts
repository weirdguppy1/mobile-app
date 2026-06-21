export interface Option {
  value: string;
  label: string;
}

export const SLEEP_SCHEDULE: Option[] = [
  { value: 'early_bird', label: 'Early bird' },
  { value: 'night_owl', label: 'Night owl' },
  { value: 'in_between', label: 'Somewhere in between' },
];

export const BEDTIME: Option[] = [
  { value: 'before_10pm', label: 'Before 10pm' },
  { value: '10_to_11pm', label: '10–11pm' },
  { value: '11pm_to_12am', label: '11pm–12am' },
  { value: 'after_midnight', label: 'After midnight' },
];

export const WAKEUP_TIME: Option[] = [
  { value: 'before_7am', label: 'Before 7am' },
  { value: '7_to_8am', label: '7–8am' },
  { value: '8_to_9am', label: '8–9am' },
  { value: 'after_9am', label: 'After 9am' },
];

export const NOISE_PREFERENCE: Option[] = [
  { value: 'need_quiet', label: 'Need quiet' },
  { value: 'moderate_ok', label: 'Moderate is OK' },
  { value: 'doesnt_matter', label: "Doesn't matter" },
];

export const STUDY_STYLE: Option[] = [
  { value: 'mostly_room', label: 'Mostly in my room' },
  { value: 'mostly_library', label: 'Mostly at the library' },
  { value: 'mix', label: 'A mix' },
];

export const GUESTS_FREQUENCY: Option[] = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'frequently', label: 'Frequently' },
];

export const ROOM_TEMPERATURE: Option[] = [
  { value: 'cold', label: 'Cold' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'warm', label: 'Warm' },
];

export const ALCOHOL: Option[] = [
  { value: 'never', label: 'Never' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'frequently', label: 'Frequently' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const SMOKING: Option[] = [
  { value: 'no', label: 'No' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'frequently', label: 'Frequently' },
];

export const PARTIES: Option[] = [
  { value: 'not_my_thing', label: 'Not my thing' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
];

export const FITNESS: Option[] = [
  { value: 'never', label: 'Never' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'regularly', label: 'Regularly' },
];

export const SEX_ASSIGNED_AT_BIRTH: Option[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'intersex', label: 'Intersex' },
];

export const INTERESTS: Option[] = [
  { value: 'basketball', label: 'Basketball' },
  { value: 'gym', label: 'Gym' },
  { value: 'running', label: 'Running' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'reading', label: 'Reading' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'coding', label: 'Coding' },
  { value: 'movies', label: 'Movies' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'content_creation', label: 'Content creation' },
  { value: 'greek_life', label: 'Greek life' },
  { value: 'esports', label: 'Esports' },
  { value: 'volunteering', label: 'Volunteering' },
];

export const DEAL_BREAKERS: Option[] = [
  { value: 'smoking', label: 'Smoking' },
  { value: 'heavy_partying', label: 'Heavy partying' },
  { value: 'overnight_guests', label: 'Overnight guests' },
  { value: 'different_sleep_schedules', label: 'Different sleep schedules' },
  { value: 'cleanliness_mismatch', label: 'Cleanliness mismatch' },
  { value: 'noise_levels', label: 'Noise levels' },
];

export const PROMPTS: string[] = [
  'My ideal Friday night is...',
  "One thing I can't live without...",
  'You should room with me if...',
  'My biggest dorm pet peeve is...',
  'A fun fact about me...',
  'My morning routine...',
  'The cleanest part of my room is...',
  'The messiest part of my room is...',
];

export const GRADUATION_YEARS: number[] = Array.from(
  { length: 2035 - 2024 + 1 },
  (_, i) => 2024 + i,
);

export const CLEANLINESS_RANGE = { min: 1, max: 5 } as const;
export const SOCIAL_LEVEL_RANGE = { min: 1, max: 5 } as const;
export const INTERESTS_LIMITS = { min: 5, max: 10 } as const;
export const MAJORS_LIMITS = { min: 1, max: 3 } as const;
export const PROMPTS_LIMITS = { min: 1, max: 3 } as const;
export const PHOTOS_LIMITS = { min: 1, max: 6 } as const;
export const CLUBS_MAX = 10;

const values = (opts: Option[]) => opts.map((o) => o.value) as [string, ...string[]];

export const INTEREST_VALUES = values(INTERESTS);
export const DEAL_BREAKER_VALUES = values(DEAL_BREAKERS);
