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

export interface PromptCategory {
  /** Section header shown in the prompt picker. */
  label: string;
  prompts: string[];
}

// Prompts grouped by category for the picker. Edit copy/grouping here — this is the
// single source of truth. `PROMPTS` is derived below for any flat consumer.
export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    label: "About me",
    prompts: [
      "A fun fact about me...",
      "One thing I can't live without...",
      "The dorkiest thing about me is",
      "My most irrational fear is",
      "A random skill I have",
      "My biggest flex",
      "A fact about me that surprises people",
      "My claim to fame is",
      "My most controversial opinion is",
      "A shower thought I recently had",
      "My biggest freshman-year goal is",
      "A life goal of mine",
    ],
  },
  {
    label: "My ideal weekend",
    prompts: [
      "My ideal Friday night is...",
      "My ideal Sunday",
      "My perfect weekend",
      "On weekends you'll find me",
      "After midnight I'm usually",
      "My morning routine...",
      "My sleep schedule is",
    ],
  },
  {
    label: "Living together",
    prompts: [
      "You should room with me if...",
      "My biggest dorm pet peeve is...",
      "The cleanest part of my room is",
      "The messiest part of my room is",
      "We would be a good roommate match if",
      "One thing I need in a roommate is",
      "We'll get along if",
      "Let's make sure we're on the same page about",
      "I get along best with people who",
    ],
  },
  {
    label: "What I'm looking for",
    prompts: [
      "I'm looking for",
      "What I value most in a friendship is",
      "The key to my heart is",
      "One thing I want to know about you is",
      "We're the same type of weird if",
      "Not my roommate if you don't listen to",
    ],
  },
  {
    label: "Stories & flexes",
    prompts: [
      "The craziest thing I've ever done",
      "I'll never forget the time",
      "My most memorable travel story",
      "The best advice I've ever received",
      "A challenge I've overcome",
      "The most spontaneous thing I've done",
      "The award I should be nominated for",
    ],
  },
  {
    label: "Let's connect",
    prompts: [
      "Let's",
      "Let's debate",
      "I bet you can't",
      "Teach me something about",
      "I know the best spot for",
      "The next place I want to visit",
      "The quickest way to get me excited is",
      "You should leave a comment if",
    ],
  },
];

/** Flat list of every prompt, derived from the categories. */
export const PROMPTS: string[] = PROMPT_CATEGORIES.flatMap((c) => c.prompts);

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
export const ABOUT_ME_LIMITS = { minWords: 1, maxWords: 50 } as const;
export const CLUBS_MAX = 10;

const values = (opts: Option[]) =>
  opts.map((o) => o.value) as [string, ...string[]];

export const INTEREST_VALUES = values(INTERESTS);
export const DEAL_BREAKER_VALUES = values(DEAL_BREAKERS);
