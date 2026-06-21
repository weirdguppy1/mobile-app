export interface Option {
  value: string;
  label: string;
}

export const SLEEP_SCHEDULE: Option[] = [
  { value: "early_bird", label: "Early bird" },
  { value: "night_owl", label: "Night owl" },
  { value: "in_between", label: "Somewhere in between" },
];

export const BEDTIME: Option[] = [
  { value: "before_10pm", label: "Before 10pm" },
  { value: "10_to_11pm", label: "10–11pm" },
  { value: "11pm_to_12am", label: "11pm–12am" },
  { value: "after_midnight", label: "After midnight" },
];

export const WAKEUP_TIME: Option[] = [
  { value: "before_7am", label: "Before 7am" },
  { value: "7_to_8am", label: "7–8am" },
  { value: "8_to_9am", label: "8–9am" },
  { value: "after_9am", label: "After 9am" },
];

export const NOISE_PREFERENCE: Option[] = [
  { value: "need_quiet", label: "Need quiet" },
  { value: "moderate_ok", label: "Moderate is OK" },
  { value: "doesnt_matter", label: "Doesn't matter" },
];

export const STUDY_STYLE: Option[] = [
  { value: "mostly_room", label: "Mostly in my room" },
  { value: "mostly_library", label: "Mostly at the library" },
  { value: "mix", label: "A mix" },
];

export const GUESTS_FREQUENCY: Option[] = [
  { value: "rarely", label: "Rarely" },
  { value: "occasionally", label: "Occasionally" },
  { value: "frequently", label: "Frequently" },
];

export const ROMANTIC_GUESTS_FREQUENCY: Option[] = [
  { value: "rarely", label: "Rarely" },
  { value: "occasionally", label: "Occasionally" },
  { value: "frequently", label: "Frequently" },
];

export const ROOM_TEMPERATURE: Option[] = [
  { value: "cold", label: "Cold" },
  { value: "moderate", label: "Moderate" },
  { value: "warm", label: "Warm" },
];

export const ALCOHOL: Option[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "frequently", label: "Frequently" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const SMOKING: Option[] = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "frequently", label: "Frequently" },
];

export const PARTIES: Option[] = [
  { value: "not_my_thing", label: "Not my thing" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
];

export const FITNESS: Option[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
];

export const SEX_ASSIGNED_AT_BIRTH: Option[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "intersex", label: "Intersex" },
];

export const SEXUAL_ORIENTATION: Option[] = [
  { value: "straight", label: "Straight" },
  { value: "gay", label: "Gay" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "asexual", label: "Asexual" },
  { value: "queer", label: "Queer" },
  { value: "questioning", label: "Questioning" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const INTERESTS: Option[] = [
  { value: "basketball", label: "Basketball" },
  { value: "gym", label: "Gym" },
  { value: "running", label: "Running" },
  { value: "gaming", label: "Gaming" },
  { value: "music", label: "Music" },
  { value: "reading", label: "Reading" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "coding", label: "Coding" },
  { value: "movies", label: "Movies" },
  { value: "hiking", label: "Hiking" },
  { value: "fashion", label: "Fashion" },
  { value: "cooking", label: "Cooking" },
  { value: "content_creation", label: "Content creation" },
  { value: "greek_life", label: "Greek life" },
  { value: "esports", label: "Esports" },
  { value: "volunteering", label: "Volunteering" },
];

export const DEAL_BREAKERS: Option[] = [
  { value: "smoking", label: "Smoking" },
  { value: "heavy_partying", label: "Heavy partying" },
  { value: "overnight_guests", label: "Overnight guests" },
  { value: "different_sleep_schedules", label: "Different sleep schedules" },
  { value: "cleanliness_mismatch", label: "Cleanliness mismatch" },
  { value: "noise_levels", label: "Noise levels" },
];

export const PROMPTS: string[] = [
  "My ideal Friday night is...",
  "One thing I can't live without...",
  "You should room with me if...",
  "My biggest dorm pet peeve is...",
  "A fun fact about me...",
  "My morning routine...",
  "The cleanest part of my room is...",
  "The messiest part of my room is...",
  "My sleep schedule is",
  "On weekends you'll find me",
  "The cleanest part of my room is",
  "The messiest part of my room is",
  "After midnight I'm usually",
  "We would be a good roommate match if",
  "One thing I need in a roommate is",
  "Not my roommate if you don't listen to",
  "My biggest freshman-year goal is",
  "A shower thought I recently had",
  "I bet you can't",
  "My most irrational fear is",
  "We'll get along if",
  "The dorkiest thing about me is",
  "My most controversial opinion is",
  "I know the best spot for",
  "The award I should be nominated for",
  "I'm looking for",
  "I get along best with people who",
  "One thing I want to know about you is",
  "A life goal of mine",
  "The key to my heart is",
  "What I value most in a friendship is",
  "Let's make sure we're on the same page about",
  "I'll never forget the time",
  "The craziest thing I've ever done",
  "A random skill I have",
  "My most memorable travel story",
  "My biggest flex",
  "A fact about me that surprises people",
  "The best advice I've ever received",
  "A challenge I've overcome",
  "My claim to fame is",
  "The most spontaneous thing I've done",
  "Let's",
  "My ideal Sunday",
  "My perfect weekend",
  "Teach me something about",
  "The next place I want to visit",
  "You should leave a comment if",
  "We're the same type of weird if",
  "The quickest way to get me excited is",
  "Let's debate",
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

const values = (opts: Option[]) =>
  opts.map((o) => o.value) as [string, ...string[]];

export const INTEREST_VALUES = values(INTERESTS);
export const DEAL_BREAKER_VALUES = values(DEAL_BREAKERS);
