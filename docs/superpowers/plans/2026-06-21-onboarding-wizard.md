# Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a resumable 9-step onboarding wizard that guides a signed-up-but-not-onboarded user through profile setup, persists each step to Supabase, and on completion sets `onboarding_complete = true` and redirects to `/discover`.

**Architecture:** Database is the source of truth — each step saves to Supabase via a typed mutation layer (`features/profile/api.ts` + TanStack Query hooks); resume = re-fetch the profile and compute the first incomplete step. The wizard UI (`features/onboarding/`) is presentation-only and calls hooks, never Supabase directly. Routing gates incomplete users into onboarding via declarative `Stack.Protected`.

**Tech Stack:** Expo Router, React Native, TypeScript (strict), Uniwind (Tailwind utility classes), Supabase, TanStack Query, React Hook Form + Zod, Zustand, expo-image-picker, jest-expo (pure-logic unit tests only).

## Global Constraints

- TypeScript strict. **Never `any`, never `@ts-ignore`.** (CLAUDE.md)
- Primitives & all UI styled with **Tailwind utility classes via `className`**; add named `@utility` entries to `src/global.css` for repeated patterns; no `StyleSheet.create` unless a 3rd-party lib requires a style object. (user instruction)
- All option **values must match the DB `CHECK` constraints** in `supabase/migrations/0001_profiles.sql` exactly.
- **Data access stays out of UI** — screens call hooks/mutations only, never `supabase` directly. (TASK.md)
- **Reuse** the shared primitives + `constants.ts`; no duplicated onboarding-specific controls or hardcoded option lists. (TASK.md)
- Imports ordered: React → React Native → third-party → `@/...` → relative, blank-line separated. Path aliases only (`@/*` → `src/*`). (CLAUDE.md)
- Package manager: **pnpm** (tracked `pnpm-lock.yaml`). Install with `pnpm add` / `pnpm add -D`; commit `pnpm-lock.yaml` (never `package-lock.json`). Run tests with `npx jest <path>`.
- Verification gate: **`npx tsc --noEmit`** must pass (project `npm run lint` is broken). Pure-logic tasks additionally gate on `npx jest`.
- Git: work on **`feature/user-setup`** (never main). Commit after each task with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- `onboarding_complete` stays `false` until the final Review step.

---

## File Structure

**Created**

```
src/types/database.ts                          typed Supabase Database (profiles, photos, prompts, contacts)
src/lib/query-client.ts                        QueryClient instance
src/shared/components/button.tsx               Button primitive
src/shared/components/field.tsx                 Field wrapper primitive
src/shared/components/option-group.tsx         OptionGroup primitive
src/shared/components/scale-input.tsx          ScaleInput primitive
src/shared/components/tag-input.tsx            TagInput primitive (free-text arrays)
src/shared/components/photo-grid.tsx           PhotoGrid primitive
src/shared/lib/array-move.ts                   pure reorder helper
src/features/profile/constants.ts              option lists ({value,label})
src/features/profile/types.ts                  Profile/Photo/Prompt domain types
src/features/profile/schema.ts                 Zod per-step + completion schemas
src/features/profile/api.ts                    raw typed Supabase calls
src/features/profile/hooks/use-profile.ts      useQuery profile+photos+prompts
src/features/profile/hooks/use-profile-mutations.ts  useMutation wrappers
src/features/onboarding/lib/onboarding-progress.ts   firstIncompleteStep (pure)
src/features/onboarding/store/onboarding-store.ts     Zustand current index
src/features/onboarding/config/steps.ts        STEPS config array
src/features/onboarding/components/StepShell.tsx     shared shell
src/features/onboarding/hooks/use-onboarding.ts      orchestration
src/features/onboarding/steps/BasicsStep.tsx
src/features/onboarding/steps/CompatibilityStep.tsx
src/features/onboarding/steps/LifestyleStep.tsx
src/features/onboarding/steps/InterestsStep.tsx
src/features/onboarding/steps/DealBreakersStep.tsx
src/features/onboarding/steps/PromptsStep.tsx
src/features/onboarding/steps/PhotosStep.tsx
src/features/onboarding/steps/ExtrasStep.tsx
src/features/onboarding/steps/ReviewStep.tsx
src/app/(app)/onboarding.tsx                    /onboarding host screen
src/app/(app)/(main)/_layout.tsx               main app stack (initial=discover)
src/app/(app)/(main)/discover.tsx              /discover placeholder
supabase/migrations/0002_profile_photos_storage.sql
__tests__/  (colocated *.test.ts for pure logic)
```

**Modified**

```
package.json                                   add deps + test script
src/lib/supabase.ts                            apply createClient<Database>
src/app/_layout.tsx                            wrap tree in QueryClientProvider
src/app/(app)/_layout.tsx                      onboarding vs main gate
src/global.css                                 new @utility entries
src/shared/components/index.ts                 export new primitives
src/app/dev/components.tsx                     register primitives
src/app/dev/screens.tsx                        onboarding links/previews
```

(`src/app/(app)/home.tsx` moves to `src/app/(app)/(main)/home.tsx`.)

---

## Task 1: Dependencies, QueryClient, and test harness

**Files:**

- Modify: `package.json`
- Create: `src/lib/query-client.ts`
- Modify: `src/app/_layout.tsx`
- Create: `jest.config.js`, `jest.setup.js`
- Test: `src/lib/__tests__/smoke.test.ts`

**Interfaces:**

- Produces: `queryClient` (a `QueryClient`) from `@/lib/query-client`.

- [ ] **Step 1: Install runtime deps** (repo uses **pnpm**)

Run:

```bash
npx expo install expo-image-picker
pnpm add @tanstack/react-query react-hook-form @hookform/resolvers
```

Expected: packages added to `package.json` dependencies; `pnpm-lock.yaml` updated.

- [ ] **Step 2: Install test deps + add script**

Run:

```bash
pnpm add -D jest jest-expo @types/jest
npm pkg set scripts.test="jest"   # only edits package.json; safe in a pnpm repo
```

Expected: devDependencies updated, `"test": "jest"` script present.

- [ ] **Step 3: Configure jest (pure-logic only)**

Create `jest.config.js`:

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|uniwind))",
  ],
};
```

Create `jest.setup.js`:

```js
// Reserved for global test setup (mocks added per-task as needed).
```

- [ ] **Step 4: Write a smoke test**

Create `src/lib/__tests__/smoke.test.ts`:

```ts
describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `npx jest src/lib/__tests__/smoke.test.ts`
Expected: 1 passing test.

- [ ] **Step 6: Create the QueryClient**

Create `src/lib/query-client.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});
```

- [ ] **Step 7: Provide it at the app root**

Modify `src/app/_layout.tsx` — add the import and wrap the returned tree:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
```

Wrap the existing `<SafeAreaProvider>...</SafeAreaProvider>` return value:

```tsx
return (
  <QueryClientProvider client={queryClient}>
    <SafeAreaProvider>
      {/* existing <Stack> ... </Stack> unchanged */}
    </SafeAreaProvider>
  </QueryClientProvider>
);
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml jest.config.js jest.setup.js src/lib/query-client.ts src/lib/__tests__/smoke.test.ts src/app/_layout.tsx
git commit -m "chore(onboarding): add query/forms/picker deps, jest harness, QueryClientProvider

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Typed Supabase Database

**Files:**

- Create: `src/types/database.ts`
- Modify: `src/lib/supabase.ts`

**Interfaces:**

- Produces: `Database` type; `supabase` becomes `SupabaseClient<Database>`. Row types reachable as `Database['public']['Tables']['profiles']['Row']` etc.

- [ ] **Step 1: Write the Database type**

Create `src/types/database.ts` (columns mirror `0001_profiles.sql`):

```ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          school_domain: string | null;
          first_name: string | null;
          pronouns: string | null;
          university: string | null;
          graduation_year: number | null;
          majors: string[] | null;
          gender_identity: string | null;
          sex_assigned_at_birth: string | null;
          sleep_schedule: string | null;
          bedtime: string | null;
          wakeup_time: string | null;
          cleanliness: number | null;
          noise_preference: string | null;
          study_style: string | null;
          guests_frequency: string | null;
          social_level: number | null;
          room_temperature: string | null;
          alcohol: string | null;
          smoking: string | null;
          parties: string | null;
          fitness: string | null;
          interests: string[] | null;
          deal_breakers: string[] | null;
          dorm_preference: string | null;
          living_program: string | null;
          clubs: string[] | null;
          instagram: string | null;
          linkedin: string | null;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      profile_photos: {
        Row: {
          id: string;
          profile_id: string;
          url: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          url: string;
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_photos"]["Row"]>;
        Relationships: [];
      };
      profile_prompts: {
        Row: {
          id: string;
          profile_id: string;
          prompt: string;
          answer: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          prompt: string;
          answer: string;
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profile_prompts"]["Row"]>;
        Relationships: [];
      };
      private_contacts: {
        Row: { profile_id: string; phone: string | null; updated_at: string };
        Insert: {
          profile_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["private_contacts"]["Row"]
        >;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
```

- [ ] **Step 2: Apply the generic**

Modify `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

import { Database } from "@/types/database";
```

Change `createClient(...)` to `createClient<Database>(...)` (keep all existing options).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (auth code uses `supabase.auth.*` only, unaffected).

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts src/lib/supabase.ts
git commit -m "feat(profile): type the Supabase client with a Database schema

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Profile constants (TDD against DB CHECK sets)

**Files:**

- Create: `src/features/profile/constants.ts`
- Test: `src/features/profile/__tests__/constants.test.ts`

**Interfaces:**

- Produces: `Option = { value: string; label: string }`; exported option arrays `SLEEP_SCHEDULE`, `BEDTIME`, `WAKEUP_TIME`, `NOISE_PREFERENCE`, `STUDY_STYLE`, `GUESTS_FREQUENCY`, `ROOM_TEMPERATURE`, `ALCOHOL`, `SMOKING`, `PARTIES`, `FITNESS`, `SEX_ASSIGNED_AT_BIRTH`, `INTERESTS`, `DEAL_BREAKERS`, `PROMPTS` (string[]); `GRADUATION_YEARS` (number[]); plus value-only sets `INTEREST_VALUES`, `DEAL_BREAKER_VALUES` etc. used by schema.

- [ ] **Step 1: Write the failing test**

Create `src/features/profile/__tests__/constants.test.ts`:

```ts
import {
  ALCOHOL,
  BEDTIME,
  DEAL_BREAKERS,
  GRADUATION_YEARS,
  INTERESTS,
  ROOM_TEMPERATURE,
  SEX_ASSIGNED_AT_BIRTH,
} from "@/features/profile/constants";

describe("profile constants ↔ DB CHECK sets", () => {
  it("interests vocabulary matches the DB (16 values)", () => {
    expect(INTERESTS.map((o) => o.value)).toEqual([
      "basketball",
      "gym",
      "running",
      "gaming",
      "music",
      "reading",
      "entrepreneurship",
      "coding",
      "movies",
      "hiking",
      "fashion",
      "cooking",
      "content_creation",
      "greek_life",
      "esports",
      "volunteering",
    ]);
  });

  it("deal-breakers vocabulary matches the DB (6 values)", () => {
    expect(DEAL_BREAKERS.map((o) => o.value)).toEqual([
      "smoking",
      "heavy_partying",
      "overnight_guests",
      "different_sleep_schedules",
      "cleanliness_mismatch",
      "noise_levels",
    ]);
  });

  it("bedtime / room temp / alcohol / sex values match the DB", () => {
    expect(BEDTIME.map((o) => o.value)).toEqual([
      "before_10pm",
      "10_to_11pm",
      "11pm_to_12am",
      "after_midnight",
    ]);
    expect(ROOM_TEMPERATURE.map((o) => o.value)).toEqual([
      "cold",
      "moderate",
      "warm",
    ]);
    expect(ALCOHOL.map((o) => o.value)).toEqual([
      "never",
      "occasionally",
      "frequently",
      "prefer_not_to_say",
    ]);
    expect(SEX_ASSIGNED_AT_BIRTH.map((o) => o.value)).toEqual([
      "female",
      "male",
      "intersex",
    ]);
  });

  it("graduation years cover 2024–2035", () => {
    expect(GRADUATION_YEARS[0]).toBe(2024);
    expect(GRADUATION_YEARS[GRADUATION_YEARS.length - 1]).toBe(2035);
  });

  it("every option has a non-empty human label", () => {
    for (const o of [...INTERESTS, ...DEAL_BREAKERS, ...ALCOHOL]) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/features/profile/__tests__/constants.test.ts`
Expected: FAIL — cannot find module `@/features/profile/constants`.

- [ ] **Step 3: Implement the constants**

Create `src/features/profile/constants.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/features/profile/__tests__/constants.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/profile/constants.ts src/features/profile/__tests__/constants.test.ts
git commit -m "feat(profile): option constants mirroring DB CHECK sets (tested)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Domain types + Zod schemas (TDD)

**Files:**

- Create: `src/features/profile/types.ts`
- Create: `src/features/profile/schema.ts`
- Test: `src/features/profile/__tests__/schema.test.ts`

**Interfaces:**

- Consumes: constants from Task 3.
- Produces:
  - `types.ts`: `Profile` (= `Database['public']['Tables']['profiles']['Row']`), `ProfilePhoto`, `ProfilePrompt`, and `OnboardingData = { profile: Profile; photos: ProfilePhoto[]; prompts: ProfilePrompt[] }`.
  - `schema.ts`: `basicsSchema`, `compatibilitySchema`, `lifestyleSchema`, `interestsSchema`, `dealBreakersSchema`, `promptsSchema` (`{ prompt, answer }[]`), `extrasSchema`, plus `onboardingCompletionSchema`. Each per-step schema's `.safeParse` is the Next gate; `onboardingCompletionSchema` gates Finish. Also `type BasicsValues = z.infer<typeof basicsSchema>` etc.

- [ ] **Step 1: Write the failing test**

Create `src/features/profile/__tests__/schema.test.ts`:

```ts
import {
  basicsSchema,
  compatibilitySchema,
  interestsSchema,
  onboardingCompletionSchema,
  promptsSchema,
} from "@/features/profile/schema";

describe("basicsSchema", () => {
  it("requires first name, grad year, 1–3 majors", () => {
    expect(
      basicsSchema.safeParse({
        first_name: "",
        graduation_year: 2027,
        majors: ["CS"],
      }).success,
    ).toBe(false);
    expect(
      basicsSchema.safeParse({
        first_name: "Mia",
        graduation_year: 2027,
        majors: [],
      }).success,
    ).toBe(false);
    expect(
      basicsSchema.safeParse({
        first_name: "Mia",
        graduation_year: 2027,
        majors: ["A", "B", "C", "D"],
      }).success,
    ).toBe(false);
    expect(
      basicsSchema.safeParse({
        first_name: "Mia",
        graduation_year: 2027,
        majors: ["CS"],
      }).success,
    ).toBe(true);
  });
});

describe("compatibilitySchema", () => {
  it("requires all nine fields", () => {
    const full = {
      sleep_schedule: "night_owl",
      bedtime: "after_midnight",
      wakeup_time: "after_9am",
      cleanliness: 4,
      noise_preference: "moderate_ok",
      study_style: "mix",
      guests_frequency: "occasionally",
      social_level: 3,
      room_temperature: "cold",
    };
    expect(compatibilitySchema.safeParse(full).success).toBe(true);
    const { cleanliness, ...missing } = full;
    expect(compatibilitySchema.safeParse(missing).success).toBe(false);
    expect(
      compatibilitySchema.safeParse({ ...full, room_temperature: "tropical" })
        .success,
    ).toBe(false);
  });
});

describe("interestsSchema", () => {
  it("enforces 5–10 from the vocabulary", () => {
    expect(
      interestsSchema.safeParse({ interests: ["gym", "music", "coding"] })
        .success,
    ).toBe(false);
    expect(
      interestsSchema.safeParse({
        interests: ["gym", "music", "coding", "reading", "movies"],
      }).success,
    ).toBe(true);
    expect(
      interestsSchema.safeParse({
        interests: ["gym", "music", "coding", "reading", "not_real"],
      }).success,
    ).toBe(false);
  });
});

describe("promptsSchema", () => {
  it("requires 1–3 prompts each with a non-empty answer", () => {
    expect(promptsSchema.safeParse({ prompts: [] }).success).toBe(false);
    expect(
      promptsSchema.safeParse({
        prompts: [{ prompt: "A fun fact about me...", answer: "  " }],
      }).success,
    ).toBe(false);
    expect(
      promptsSchema.safeParse({
        prompts: [{ prompt: "A fun fact about me...", answer: "I juggle" }],
      }).success,
    ).toBe(true);
  });
});

describe("onboardingCompletionSchema", () => {
  const complete = {
    first_name: "Mia",
    graduation_year: 2027,
    majors: ["CS"],
    sleep_schedule: "night_owl",
    bedtime: "after_midnight",
    wakeup_time: "after_9am",
    cleanliness: 4,
    noise_preference: "moderate_ok",
    study_style: "mix",
    guests_frequency: "occasionally",
    social_level: 3,
    room_temperature: "cold",
    interests: ["gym", "music", "coding", "reading", "movies"],
    promptCount: 1,
    photoCount: 1,
  };
  it("passes when all required data present", () => {
    expect(onboardingCompletionSchema.safeParse(complete).success).toBe(true);
  });
  it("fails with zero photos or zero prompts", () => {
    expect(
      onboardingCompletionSchema.safeParse({ ...complete, photoCount: 0 })
        .success,
    ).toBe(false);
    expect(
      onboardingCompletionSchema.safeParse({ ...complete, promptCount: 0 })
        .success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/features/profile/__tests__/schema.test.ts`
Expected: FAIL — cannot find module `@/features/profile/schema`.

- [ ] **Step 3: Implement types**

Create `src/features/profile/types.ts`:

```ts
import { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfilePhoto =
  Database["public"]["Tables"]["profile_photos"]["Row"];
export type ProfilePrompt =
  Database["public"]["Tables"]["profile_prompts"]["Row"];

export interface OnboardingData {
  profile: Profile;
  photos: ProfilePhoto[];
  prompts: ProfilePrompt[];
}
```

- [ ] **Step 4: Implement schemas**

Create `src/features/profile/schema.ts`:

```ts
import { z } from "zod";

import {
  ALCOHOL,
  BEDTIME,
  DEAL_BREAKER_VALUES,
  FITNESS,
  GUESTS_FREQUENCY,
  INTEREST_VALUES,
  INTERESTS_LIMITS,
  MAJORS_LIMITS,
  NOISE_PREFERENCE,
  PARTIES,
  PROMPTS_LIMITS,
  ROOM_TEMPERATURE,
  SEX_ASSIGNED_AT_BIRTH,
  SLEEP_SCHEDULE,
  SMOKING,
  STUDY_STYLE,
  WAKEUP_TIME,
} from "@/features/profile/constants";

const oneOf = (opts: { value: string }[]) =>
  z.enum(opts.map((o) => o.value) as [string, ...string[]]);

export const basicsSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  pronouns: z.string().trim().optional().or(z.literal("")),
  graduation_year: z.number().int().min(2024).max(2035),
  majors: z
    .array(z.string().trim().min(1))
    .min(MAJORS_LIMITS.min, "Add at least one major")
    .max(MAJORS_LIMITS.max, "Up to three majors"),
  gender_identity: z.string().trim().optional().or(z.literal("")),
  sex_assigned_at_birth: oneOf(SEX_ASSIGNED_AT_BIRTH).optional(),
});
export type BasicsValues = z.infer<typeof basicsSchema>;

export const compatibilitySchema = z.object({
  sleep_schedule: oneOf(SLEEP_SCHEDULE),
  bedtime: oneOf(BEDTIME),
  wakeup_time: oneOf(WAKEUP_TIME),
  cleanliness: z.number().int().min(1).max(5),
  noise_preference: oneOf(NOISE_PREFERENCE),
  study_style: oneOf(STUDY_STYLE),
  guests_frequency: oneOf(GUESTS_FREQUENCY),
  social_level: z.number().int().min(1).max(5),
  room_temperature: oneOf(ROOM_TEMPERATURE),
});
export type CompatibilityValues = z.infer<typeof compatibilitySchema>;

export const lifestyleSchema = z.object({
  alcohol: oneOf(ALCOHOL),
  smoking: oneOf(SMOKING),
  parties: oneOf(PARTIES),
  fitness: oneOf(FITNESS),
});
export type LifestyleValues = z.infer<typeof lifestyleSchema>;

export const interestsSchema = z.object({
  interests: z
    .array(z.enum(INTEREST_VALUES))
    .min(INTERESTS_LIMITS.min, `Pick at least ${INTERESTS_LIMITS.min}`)
    .max(INTERESTS_LIMITS.max, `Up to ${INTERESTS_LIMITS.max}`),
});
export type InterestsValues = z.infer<typeof interestsSchema>;

export const dealBreakersSchema = z.object({
  deal_breakers: z.array(z.enum(DEAL_BREAKER_VALUES)),
});
export type DealBreakersValues = z.infer<typeof dealBreakersSchema>;

export const promptsSchema = z.object({
  prompts: z
    .array(
      z.object({
        prompt: z.string().min(1),
        answer: z.string().trim().min(1, "Write an answer"),
      }),
    )
    .min(PROMPTS_LIMITS.min, "Answer at least one prompt")
    .max(PROMPTS_LIMITS.max, "Up to three prompts"),
});
export type PromptsValues = z.infer<typeof promptsSchema>;

export const extrasSchema = z.object({
  dorm_preference: z.string().trim().optional().or(z.literal("")),
  living_program: z.string().trim().optional().or(z.literal("")),
  clubs: z.array(z.string().trim().min(1)).max(10).optional(),
  instagram: z.string().trim().optional().or(z.literal("")),
  linkedin: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
});
export type ExtrasValues = z.infer<typeof extrasSchema>;

// Final gate. photoCount/promptCount are passed in from the photos/prompts tables.
export const onboardingCompletionSchema = z.object({
  first_name: z.string().trim().min(1),
  graduation_year: z.number().int().min(2024).max(2035),
  majors: z.array(z.string()).min(1),
  sleep_schedule: oneOf(SLEEP_SCHEDULE),
  bedtime: oneOf(BEDTIME),
  wakeup_time: oneOf(WAKEUP_TIME),
  cleanliness: z.number().int().min(1).max(5),
  noise_preference: oneOf(NOISE_PREFERENCE),
  study_style: oneOf(STUDY_STYLE),
  guests_frequency: oneOf(GUESTS_FREQUENCY),
  social_level: z.number().int().min(1).max(5),
  room_temperature: oneOf(ROOM_TEMPERATURE),
  interests: z.array(z.enum(INTEREST_VALUES)).min(5).max(10),
  promptCount: z.number().int().min(1),
  photoCount: z.number().int().min(1),
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/features/profile/__tests__/schema.test.ts`
Expected: all PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/profile/types.ts src/features/profile/schema.ts src/features/profile/__tests__/schema.test.ts
git commit -m "feat(profile): domain types + Zod step/completion schemas (tested)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Profile API layer

**Files:**

- Create: `src/features/profile/api.ts`

**Interfaces:**

- Consumes: `supabase`, `Profile`/`ProfilePhoto`/`ProfilePrompt`, `Database`.
- Produces (all throw on Supabase `error`):
  - `fetchOnboardingData(userId: string): Promise<OnboardingData>`
  - `updateProfile(userId: string, patch: Database['public']['Tables']['profiles']['Update']): Promise<void>`
  - `uploadPhoto(userId: string, localUri: string, position: number): Promise<ProfilePhoto>`
  - `removePhoto(photoId: string): Promise<void>`
  - `persistPhotoOrder(photos: { id: string; position: number }[]): Promise<void>`
  - `savePrompts(userId: string, prompts: { prompt: string; answer: string }[]): Promise<void>` (replace-all)
  - `savePrivateContact(userId: string, phone: string): Promise<void>`
  - `completeOnboarding(userId: string): Promise<void>`

- [ ] **Step 1: Implement the API**

Create `src/features/profile/api.ts`:

```ts
import { supabase } from "@/lib/supabase";
import { OnboardingData, ProfilePhoto } from "@/features/profile/types";
import { Database } from "@/types/database";

const PHOTO_BUCKET = "profile-photos";

export async function fetchOnboardingData(
  userId: string,
): Promise<OnboardingData> {
  const [profileRes, photosRes, promptsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("profile_photos")
      .select("*")
      .eq("profile_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("profile_prompts")
      .select("*")
      .eq("profile_id", userId)
      .order("position", { ascending: true }),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (photosRes.error) throw photosRes.error;
  if (promptsRes.error) throw promptsRes.error;
  return {
    profile: profileRes.data,
    photos: photosRes.data,
    prompts: promptsRes.data,
  };
}

export async function updateProfile(
  userId: string,
  patch: Database["public"]["Tables"]["profiles"]["Update"],
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  if (error) throw error;
}

export async function uploadPhoto(
  userId: string,
  localUri: string,
  position: number,
): Promise<ProfilePhoto> {
  const ext = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${userId}/${position}-${Date.now()}.${ext}`;
  const res = await fetch(localUri);
  const bytes = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? `image/${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("profile_photos")
    .insert({ profile_id: userId, url: path, position })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removePhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from("profile_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;
}

export async function persistPhotoOrder(
  photos: { id: string; position: number }[],
): Promise<void> {
  for (const p of photos) {
    const { error } = await supabase
      .from("profile_photos")
      .update({ position: p.position })
      .eq("id", p.id);
    if (error) throw error;
  }
}

export async function savePrompts(
  userId: string,
  prompts: { prompt: string; answer: string }[],
): Promise<void> {
  const { error: delError } = await supabase
    .from("profile_prompts")
    .delete()
    .eq("profile_id", userId);
  if (delError) throw delError;
  if (prompts.length === 0) return;
  const rows = prompts.map((p, i) => ({
    profile_id: userId,
    prompt: p.prompt,
    answer: p.answer.trim(),
    position: i,
  }));
  const { error } = await supabase.from("profile_prompts").insert(rows);
  if (error) throw error;
}

export async function savePrivateContact(
  userId: string,
  phone: string,
): Promise<void> {
  const { error } = await supabase
    .from("private_contacts")
    .upsert(
      { profile_id: userId, phone: phone.trim() || null },
      { onConflict: "profile_id" },
    );
  if (error) throw error;
}

export async function completeOnboarding(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", userId);
  if (error) throw error;
}

export function photoPublicUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/profile/api.ts
git commit -m "feat(profile): typed Supabase API for onboarding data + mutations

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Profile query + mutation hooks

**Files:**

- Create: `src/features/profile/hooks/use-profile.ts`
- Create: `src/features/profile/hooks/use-profile-mutations.ts`

**Interfaces:**

- Consumes: api functions (Task 5), `useAuthStore` (`s.session`), `queryClient`.
- Produces:
  - `profileKeys.onboarding(userId)` → `['onboarding', userId]`.
  - `useOnboardingData()` → `UseQueryResult<OnboardingData>` for the current user.
  - `useCurrentUserId()` → `string | undefined`.
  - `useProfileMutations()` → `{ saveProfile, uploadPhoto, removePhoto, reorderPhotos, savePrompts, savePrivateContact, complete }` — each a `UseMutationResult`; all invalidate `profileKeys.onboarding(userId)` on success.

- [ ] **Step 1: Implement use-profile**

Create `src/features/profile/hooks/use-profile.ts`:

```ts
import { useQuery } from "@tanstack/react-query";

import { fetchOnboardingData } from "@/features/profile/api";
import { useAuthStore } from "@/store/auth-store";

export const profileKeys = {
  onboarding: (userId: string) => ["onboarding", userId] as const,
};

export function useCurrentUserId(): string | undefined {
  return useAuthStore((s) => s.session?.user.id);
}

export function useOnboardingData() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: profileKeys.onboarding(userId ?? "anonymous"),
    queryFn: () => fetchOnboardingData(userId as string),
    enabled: !!userId,
  });
}
```

- [ ] **Step 2: Implement use-profile-mutations**

Create `src/features/profile/hooks/use-profile-mutations.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  completeOnboarding,
  persistPhotoOrder,
  removePhoto,
  savePrivateContact,
  savePrompts,
  updateProfile,
  uploadPhoto,
} from "@/features/profile/api";
import {
  profileKeys,
  useCurrentUserId,
} from "@/features/profile/hooks/use-profile";
import { Database } from "@/types/database";

export function useProfileMutations() {
  const userId = useCurrentUserId() as string;
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: profileKeys.onboarding(userId) });

  const saveProfile = useMutation({
    mutationFn: (patch: Database["public"]["Tables"]["profiles"]["Update"]) =>
      updateProfile(userId, patch),
    onSuccess: invalidate,
  });

  const upload = useMutation({
    mutationFn: ({ uri, position }: { uri: string; position: number }) =>
      uploadPhoto(userId, uri, position),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (photoId: string) => removePhoto(photoId),
    onSuccess: invalidate,
  });

  const reorderPhotos = useMutation({
    mutationFn: (photos: { id: string; position: number }[]) =>
      persistPhotoOrder(photos),
    onSuccess: invalidate,
  });

  const prompts = useMutation({
    mutationFn: (items: { prompt: string; answer: string }[]) =>
      savePrompts(userId, items),
    onSuccess: invalidate,
  });

  const privateContact = useMutation({
    mutationFn: (phone: string) => savePrivateContact(userId, phone),
    onSuccess: invalidate,
  });

  const complete = useMutation({
    mutationFn: () => completeOnboarding(userId),
    onSuccess: invalidate,
  });

  return {
    saveProfile,
    uploadPhoto: upload,
    removePhoto: remove,
    reorderPhotos,
    savePrompts: prompts,
    savePrivateContact: privateContact,
    complete,
  };
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/profile/hooks/use-profile.ts src/features/profile/hooks/use-profile-mutations.ts
git commit -m "feat(profile): TanStack Query hooks for onboarding data + mutations

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Button + Field primitives + base utilities

**Files:**

- Modify: `src/global.css`
- Create: `src/shared/components/button.tsx`
- Create: `src/shared/components/field.tsx`
- Modify: `src/shared/components/index.ts`
- Modify: `src/app/dev/components.tsx`

**Interfaces:**

- Produces:
  - `Button`: `{ children: ReactNode; variant?: 'primary' | 'ghost'; loading?: boolean; disabled?: boolean; onPress?: () => void; className?: string }`.
  - `Field`: `{ label?: string; optional?: boolean; error?: string; children: ReactNode }`.

- [ ] **Step 1: Add utilities to global.css**

Append to `src/global.css`:

```css
@utility button-disabled {
  @apply opacity-40;
}

@utility option-chip {
  @apply rounded-full border border-silver bg-canvas px-4 py-2.5;
}

@utility option-chip-selected {
  @apply border-ink bg-ink;
}
```

- [ ] **Step 2: Implement Button**

Create `src/shared/components/button.tsx`:

```tsx
import { type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { PressScale } from "@/shared/components/press-scale";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
}

/** Primary (filled ink) or ghost button built on the shared press animation. */
export function Button({
  children,
  variant = "primary",
  loading,
  disabled,
  onPress,
  className,
}: ButtonProps) {
  const inactive = disabled || loading;
  const base = variant === "primary" ? "button-primary" : "button-ghost";

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPress={onPress}
      className={`${base} ${inactive ? "button-disabled" : ""} ${className ?? ""}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : "#000000"}
        />
      ) : typeof children === "string" ? (
        <Text
          className={
            variant === "primary"
              ? "prose-button text-canvas"
              : "prose-button text-graphite"
          }
        >
          {children}
        </Text>
      ) : (
        <View>{children}</View>
      )}
    </PressScale>
  );
}
```

- [ ] **Step 3: Implement Field**

Create `src/shared/components/field.tsx`:

```tsx
import { type ReactNode } from "react";
import { Text, View } from "react-native";

interface FieldProps {
  label?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}

/** Generic labeled wrapper for any control: label row, body, error message. */
export function Field({ label, optional, error, children }: FieldProps) {
  return (
    <View className="gap-2">
      {label ? (
        <View className="flex-row items-center gap-2">
          <Text className="prose-label">{label}</Text>
          {optional ? (
            <Text className="prose-caption text-ash">Optional</Text>
          ) : null}
        </View>
      ) : null}
      {children}
      {error ? <Text className="prose-footnote text-pass">{error}</Text> : null}
    </View>
  );
}
```

- [ ] **Step 4: Export them**

Modify `src/shared/components/index.ts` — add:

```ts
export { Button } from "./button";
export { Field } from "./field";
```

- [ ] **Step 5: Register in the dev playground**

Modify `src/app/dev/components.tsx` — import `Button, Field` from `@/shared/components` and add a section inside the `ScrollView` (after the existing "Buttons" section):

```tsx
          <Section title="Primitives — Button">
            <Button variant="primary" onPress={() => {}}>Primary</Button>
            <Button variant="ghost" onPress={() => {}}>Ghost</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </Section>

          <Section title="Primitives — Field">
            <Field label="With label" optional error="Example error">
              <View className="card border-continuous px-4 py-3">
                <Text className="prose-body text-ink">control goes here</Text>
              </View>
            </Field>
          </Section>
```

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/global.css src/shared/components/button.tsx src/shared/components/field.tsx src/shared/components/index.ts src/app/dev/components.tsx
git commit -m "feat(ui): Button + Field primitives (utility-class styled) + dev gallery

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: OptionGroup primitive

**Files:**

- Create: `src/shared/components/option-group.tsx`
- Modify: `src/shared/components/index.ts`
- Modify: `src/app/dev/components.tsx`

**Interfaces:**

- Produces: `OptionGroup` with a discriminated `multiple` prop:
  - single: `{ multiple?: false; options: Option[]; value: string | null; onChange: (v: string) => void; columns?: number }`
  - multi: `{ multiple: true; options: Option[]; value: string[]; onChange: (v: string[]) => void; min?: number; max?: number; columns?: number }`
  - `Option` imported from `@/features/profile/constants`.

- [ ] **Step 1: Implement OptionGroup**

Create `src/shared/components/option-group.tsx`:

```tsx
import { Text, View } from "react-native";

import { type Option } from "@/features/profile/constants";
import { PressScale } from "@/shared/components/press-scale";

type SingleProps = {
  multiple?: false;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: number;
};

type MultiProps = {
  multiple: true;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  min?: number;
  max?: number;
  columns?: number;
};

type OptionGroupProps = SingleProps | MultiProps;

/** Selectable chips. Single- or multi-select; multi enforces an optional max. */
export function OptionGroup(props: OptionGroupProps) {
  const { options } = props;

  const isSelected = (v: string) =>
    props.multiple ? props.value.includes(v) : props.value === v;

  const toggle = (v: string) => {
    if (!props.multiple) {
      props.onChange(v);
      return;
    }
    const selected = props.value.includes(v);
    if (selected) {
      props.onChange(props.value.filter((x) => x !== v));
      return;
    }
    if (props.max != null && props.value.length >= props.max) return; // block past max
    props.onChange([...props.value, v]);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const selected = isSelected(o.value);
        const atMax =
          props.multiple &&
          !selected &&
          props.max != null &&
          props.value.length >= props.max;
        return (
          <PressScale
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: atMax }}
            onPress={() => toggle(o.value)}
            className={`option-chip ${selected ? "option-chip-selected" : ""} ${atMax ? "button-disabled" : ""}`}
          >
            <Text
              className={
                selected
                  ? "prose-footnote font-semibold text-canvas"
                  : "prose-footnote text-graphite"
              }
            >
              {o.label}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Export + register in dev playground**

Modify `src/shared/components/index.ts` — add `export { OptionGroup } from './option-group';`.

Modify `src/app/dev/components.tsx` — import `OptionGroup` and `INTERESTS`, `ALCOHOL` from `@/features/profile/constants`, add a `useState` for demo values, and a section:

```tsx
<Section title="Primitives — OptionGroup">
  <Text className="prose-caption text-ash">Single-select</Text>
  <OptionGroup options={ALCOHOL} value={single} onChange={setSingle} />
  <Text className="prose-caption text-ash">Multi-select (max 3)</Text>
  <OptionGroup
    multiple
    options={INTERESTS}
    value={multi}
    onChange={setMulti}
    max={3}
  />
</Section>
```

(Add at top of component: `const [single, setSingle] = useState<string | null>(null); const [multi, setMulti] = useState<string[]>([]);`.)

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/shared/components/option-group.tsx src/shared/components/index.ts src/app/dev/components.tsx
git commit -m "feat(ui): OptionGroup primitive (single/multi, max-enforced)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: ScaleInput + TagInput primitives

**Files:**

- Create: `src/shared/components/scale-input.tsx`
- Create: `src/shared/components/tag-input.tsx`
- Modify: `src/shared/components/index.ts`
- Modify: `src/app/dev/components.tsx`

**Interfaces:**

- Produces:
  - `ScaleInput`: `{ value: number | null; onChange: (v: number) => void; min?: number; max?: number; lowLabel?: string; highLabel?: string }`.
  - `TagInput`: `{ value: string[]; onChange: (v: string[]) => void; max?: number; placeholder?: string }`.

- [ ] **Step 1: Implement ScaleInput**

Create `src/shared/components/scale-input.tsx`:

```tsx
import { Text, View } from "react-native";

import { PressScale } from "@/shared/components/press-scale";

interface ScaleInputProps {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}

/** Segmented 1–N selector for ordinal fields (cleanliness, social level). */
export function ScaleInput({
  value,
  onChange,
  min = 1,
  max = 5,
  lowLabel,
  highLabel,
}: ScaleInputProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {steps.map((n) => {
          const selected = value === n;
          return (
            <PressScale
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(n)}
              className={`flex-1 items-center justify-center rounded-lg border py-3 ${selected ? "border-ink bg-ink" : "border-silver bg-canvas"}`}
            >
              <Text
                className={
                  selected
                    ? "prose-body font-semibold text-canvas"
                    : "prose-body text-graphite"
                }
              >
                {n}
              </Text>
            </PressScale>
          );
        })}
      </View>
      {lowLabel || highLabel ? (
        <View className="flex-row justify-between">
          <Text className="prose-caption text-ash">{lowLabel}</Text>
          <Text className="prose-caption text-ash">{highLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 2: Implement TagInput**

Create `src/shared/components/tag-input.tsx`:

```tsx
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Brand } from "@/constants/theme";
import { PressScale } from "@/shared/components/press-scale";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  placeholder?: string;
}

/** Free-text array entry: type + submit to add a removable chip, capped at `max`. */
export function TagInput({
  value,
  onChange,
  max = 10,
  placeholder,
}: TagInputProps) {
  const [text, setText] = useState("");
  const atMax = value.length >= max;

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed || atMax || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setText("");
  };

  return (
    <View className="gap-2">
      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {value.map((tag) => (
            <PressScale
              key={tag}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${tag}`}
              onPress={() => onChange(value.filter((t) => t !== tag))}
              className="option-chip option-chip-selected flex-row items-center gap-1.5"
            >
              <Text className="prose-footnote font-semibold text-canvas">
                {tag}
              </Text>
              <Text className="prose-footnote text-canvas">×</Text>
            </PressScale>
          ))}
        </View>
      ) : null}
      {!atMax ? (
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          blurOnSubmit={false}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={Brand.fog}
          className="field-input border-continuous border-silver focus:border-ink"
          style={{ paddingVertical: 0 }}
        />
      ) : null}
    </View>
  );
}
```

> Note: confirm `Brand.fog` exists in `@/constants/theme` (used by `TextField`). If the export differs, match `text-field.tsx`'s import.

- [ ] **Step 3: Export + register in dev playground**

Modify `src/shared/components/index.ts` — add:

```ts
export { ScaleInput } from "./scale-input";
export { TagInput } from "./tag-input";
```

Modify `src/app/dev/components.tsx` — import both, add `const [scale, setScale] = useState<number | null>(null); const [tags, setTags] = useState<string[]>([]);` and a section:

```tsx
<Section title="Primitives — ScaleInput / TagInput">
  <ScaleInput
    value={scale}
    onChange={setScale}
    lowLabel="Messy"
    highLabel="Spotless"
  />
  <TagInput value={tags} onChange={setTags} max={3} placeholder="Add a major" />
</Section>
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/shared/components/scale-input.tsx src/shared/components/tag-input.tsx src/shared/components/index.ts src/app/dev/components.tsx
git commit -m "feat(ui): ScaleInput + TagInput primitives

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: array-move helper (TDD) + PhotoGrid primitive

**Files:**

- Create: `src/shared/lib/array-move.ts`
- Test: `src/shared/lib/__tests__/array-move.test.ts`
- Create: `src/shared/components/photo-grid.tsx`
- Modify: `src/shared/components/index.ts`
- Modify: `src/global.css`
- Modify: `src/app/dev/components.tsx`

**Interfaces:**

- Produces:
  - `arrayMove<T>(items: T[], from: number, to: number): T[]` (pure).
  - `PhotoGrid`: `{ photos: PhotoItem[]; onAdd: () => void; onRemove: (id: string) => void; onReorder: (from: number, to: number) => void; max?: number }` where `PhotoItem = { id: string; uri: string; status?: 'uploading' | 'error' | 'ready'; onRetry?: () => void }`.

- [ ] **Step 1: Write the failing test**

Create `src/shared/lib/__tests__/array-move.test.ts`:

```ts
import { arrayMove } from "@/shared/lib/array-move";

describe("arrayMove", () => {
  it("moves an item left", () => {
    expect(arrayMove(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });
  it("moves an item right", () => {
    expect(arrayMove(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });
  it("is a no-op for out-of-range indices", () => {
    expect(arrayMove(["a", "b"], 0, 5)).toEqual(["a", "b"]);
    expect(arrayMove(["a", "b"], -1, 0)).toEqual(["a", "b"]);
  });
  it("does not mutate the input", () => {
    const input = ["a", "b", "c"];
    arrayMove(input, 0, 1);
    expect(input).toEqual(["a", "b", "c"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/shared/lib/__tests__/array-move.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement arrayMove**

Create `src/shared/lib/array-move.ts`:

```ts
/** Return a new array with the item at `from` moved to `to`. No-op if either index is out of range. */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length)
    return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/shared/lib/__tests__/array-move.test.ts`
Expected: all PASS.

- [ ] **Step 5: Add the photo-slot utility**

Append to `src/global.css`:

```css
@utility photo-slot {
  @apply aspect-square overflow-hidden rounded-xl border border-silver bg-wash;
}
```

- [ ] **Step 6: Implement PhotoGrid**

Create `src/shared/components/photo-grid.tsx`:

```tsx
import { Image } from "expo-image";
import { Text, View } from "react-native";

import { PressScale } from "@/shared/components/press-scale";

export interface PhotoItem {
  id: string;
  uri: string;
  status?: "uploading" | "error" | "ready";
  onRetry?: () => void;
}

interface PhotoGridProps {
  photos: PhotoItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  max?: number;
}

/** Add / remove / reorder photo slots. Slot 0 is the primary photo. */
export function PhotoGrid({
  photos,
  onAdd,
  onRemove,
  onReorder,
  max = 6,
}: PhotoGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {photos.map((p, i) => (
        <View key={p.id} className="w-[30%] gap-1">
          <View className="photo-slot">
            <Image
              source={{ uri: p.uri }}
              style={{ flex: 1 }}
              contentFit="cover"
            />
            {i === 0 ? (
              <View className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5">
                <Text className="prose-caption text-canvas">Primary</Text>
              </View>
            ) : null}
            {p.status === "uploading" ? (
              <View className="absolute inset-0 items-center justify-center bg-[rgba(255,255,255,0.6)]">
                <Text className="prose-caption text-graphite">Uploading…</Text>
              </View>
            ) : null}
            {p.status === "error" ? (
              <PressScale
                accessibilityRole="button"
                onPress={p.onRetry}
                className="absolute inset-0 items-center justify-center bg-[rgba(255,0,0,0.12)]"
              >
                <Text className="prose-caption font-semibold text-pass">
                  Failed — Retry
                </Text>
              </PressScale>
            ) : null}
          </View>
          <View className="flex-row justify-between">
            <PressScale
              accessibilityRole="button"
              accessibilityLabel="Move left"
              disabled={i === 0}
              onPress={() => onReorder(i, i - 1)}
            >
              <Text
                className={`prose-caption ${i === 0 ? "text-fog" : "text-graphite"}`}
              >
                ←
              </Text>
            </PressScale>
            <PressScale
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onPress={() => onRemove(p.id)}
            >
              <Text className="prose-caption text-pass">Remove</Text>
            </PressScale>
            <PressScale
              accessibilityRole="button"
              accessibilityLabel="Move right"
              disabled={i === photos.length - 1}
              onPress={() => onReorder(i, i + 1)}
            >
              <Text
                className={`prose-caption ${i === photos.length - 1 ? "text-fog" : "text-graphite"}`}
              >
                →
              </Text>
            </PressScale>
          </View>
        </View>
      ))}
      {photos.length < max ? (
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={onAdd}
          className="photo-slot w-[30%] items-center justify-center"
        >
          <Text className="prose-display text-fog">+</Text>
        </PressScale>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 7: Export + register in dev playground**

Modify `src/shared/components/index.ts` — add `export { PhotoGrid, type PhotoItem } from './photo-grid';`.
Modify `src/app/dev/components.tsx` — import `PhotoGrid`, add a section with two static demo items:

```tsx
<Section title="Primitives — PhotoGrid">
  <PhotoGrid
    photos={[
      { id: "1", uri: "https://placehold.co/300", status: "ready" },
      { id: "2", uri: "https://placehold.co/300", status: "error" },
    ]}
    onAdd={() => {}}
    onRemove={() => {}}
    onReorder={() => {}}
  />
</Section>
```

- [ ] **Step 8: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/shared/lib/array-move.ts src/shared/lib/__tests__/array-move.test.ts src/shared/components/photo-grid.tsx src/shared/components/index.ts src/global.css src/app/dev/components.tsx
git commit -m "feat(ui): PhotoGrid primitive + tested arrayMove helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Resume logic (TDD) + onboarding store + steps config skeleton

**Files:**

- Create: `src/features/onboarding/lib/onboarding-progress.ts`
- Test: `src/features/onboarding/__tests__/onboarding-progress.test.ts`
- Create: `src/features/onboarding/store/onboarding-store.ts`
- Create: `src/features/onboarding/config/steps.ts`

**Interfaces:**

- Produces:
  - `StepId = 'basics' | 'compatibility' | 'lifestyle' | 'interests' | 'dealBreakers' | 'prompts' | 'photos' | 'extras' | 'review'`.
  - `StepConfig = { id: StepId; title: string; subtitle: string; Component: ComponentType; skippable?: boolean; isComplete: (data: OnboardingData) => boolean }`.
  - `STEPS: StepConfig[]` (review's `isComplete` always `false`).
  - `firstIncompleteIndex(steps: Pick<StepConfig,'isComplete'>[], data: OnboardingData): number`.
  - `useOnboardingStore` → `{ index: number; setIndex(i): void }`.

- [ ] **Step 1: Write the failing test**

Create `src/features/onboarding/__tests__/onboarding-progress.test.ts`:

```ts
import { firstIncompleteIndex } from "@/features/onboarding/lib/onboarding-progress";
import { OnboardingData } from "@/features/profile/types";

const blankProfile = {
  id: "u1",
  email: "a@x.edu",
  school_domain: "x.edu",
  first_name: null,
  pronouns: null,
  university: "X",
  graduation_year: null,
  majors: null,
  gender_identity: null,
  sex_assigned_at_birth: null,
  sleep_schedule: null,
  bedtime: null,
  wakeup_time: null,
  cleanliness: null,
  noise_preference: null,
  study_style: null,
  guests_frequency: null,
  social_level: null,
  room_temperature: null,
  alcohol: null,
  smoking: null,
  parties: null,
  fitness: null,
  interests: null,
  deal_breakers: null,
  dorm_preference: null,
  living_program: null,
  clubs: null,
  instagram: null,
  linkedin: null,
  onboarding_complete: false,
  created_at: "",
  updated_at: "",
};
const data = (
  overrides: Partial<typeof blankProfile> = {},
): OnboardingData => ({
  profile: { ...blankProfile, ...overrides },
  photos: [],
  prompts: [],
});

const steps = [
  { isComplete: (d: OnboardingData) => !!d.profile.first_name },
  { isComplete: (d: OnboardingData) => !!d.profile.cleanliness },
  { isComplete: () => false },
];

describe("firstIncompleteIndex", () => {
  it("returns 0 for a blank profile", () => {
    expect(firstIncompleteIndex(steps, data())).toBe(0);
  });
  it("skips completed leading steps", () => {
    expect(firstIncompleteIndex(steps, data({ first_name: "Mia" }))).toBe(1);
  });
  it("returns the last index when all but the final are complete", () => {
    expect(
      firstIncompleteIndex(steps, data({ first_name: "Mia", cleanliness: 3 })),
    ).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/features/onboarding/__tests__/onboarding-progress.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement firstIncompleteIndex**

Create `src/features/onboarding/lib/onboarding-progress.ts`:

```ts
import { OnboardingData } from "@/features/profile/types";

/** Index of the first step whose data is incomplete (the resume point). Returns
 *  the last index if every preceding step is complete. */
export function firstIncompleteIndex(
  steps: { isComplete: (data: OnboardingData) => boolean }[],
  data: OnboardingData,
): number {
  const idx = steps.findIndex((s) => !s.isComplete(data));
  return idx === -1 ? steps.length - 1 : idx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/features/onboarding/__tests__/onboarding-progress.test.ts`
Expected: all PASS.

- [ ] **Step 5: Implement the store**

Create `src/features/onboarding/store/onboarding-store.ts`:

```ts
import { create } from "zustand";

interface OnboardingState {
  index: number;
  setIndex: (index: number) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  index: 0,
  setIndex: (index) => set({ index }),
}));
```

- [ ] **Step 6: Implement the steps config (with `isComplete` predicates; components added in Task 20)**

Create `src/features/onboarding/config/steps.ts`:

```ts
import { type ComponentType } from "react";

import { OnboardingData } from "@/features/profile/types";

export type StepId =
  | "basics"
  | "compatibility"
  | "lifestyle"
  | "interests"
  | "dealBreakers"
  | "prompts"
  | "photos"
  | "extras"
  | "review";

export interface StepConfig {
  id: StepId;
  title: string;
  subtitle: string;
  Component: ComponentType;
  skippable?: boolean;
  isComplete: (data: OnboardingData) => boolean;
}

const Placeholder: ComponentType = () => null;

const compatComplete = (p: OnboardingData["profile"]) =>
  !!p.sleep_schedule &&
  !!p.bedtime &&
  !!p.wakeup_time &&
  p.cleanliness != null &&
  !!p.noise_preference &&
  !!p.study_style &&
  !!p.guests_frequency &&
  p.social_level != null &&
  !!p.room_temperature;

export const STEPS: StepConfig[] = [
  {
    id: "basics",
    title: "The basics",
    subtitle: "Tell us who you are.",
    Component: Placeholder,
    isComplete: (d) =>
      !!d.profile.first_name &&
      d.profile.graduation_year != null &&
      (d.profile.majors?.length ?? 0) >= 1,
  },
  {
    id: "compatibility",
    title: "Living habits",
    subtitle: "How you live day to day.",
    Component: Placeholder,
    isComplete: (d) => compatComplete(d.profile),
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    subtitle: "A few more preferences.",
    Component: Placeholder,
    isComplete: (d) =>
      !!d.profile.alcohol &&
      !!d.profile.smoking &&
      !!d.profile.parties &&
      !!d.profile.fitness,
  },
  {
    id: "interests",
    title: "Your interests",
    subtitle: "Pick 5–10.",
    Component: Placeholder,
    isComplete: (d) => {
      const n = d.profile.interests?.length ?? 0;
      return n >= 5 && n <= 10;
    },
  },
  {
    id: "dealBreakers",
    title: "Deal-breakers",
    subtitle: "Anything you can’t live with?",
    Component: Placeholder,
    isComplete: (d) => d.profile.deal_breakers != null,
  },
  {
    id: "prompts",
    title: "Prompts",
    subtitle: "Answer 1–3 to show your personality.",
    Component: Placeholder,
    isComplete: (d) => d.prompts.length >= 1,
  },
  {
    id: "photos",
    title: "Photos",
    subtitle: "Add at least one. Drag to reorder.",
    Component: Placeholder,
    isComplete: (d) => d.photos.length >= 1,
  },
  {
    id: "extras",
    title: "Extras",
    subtitle: "Optional — round out your profile.",
    Component: Placeholder,
    skippable: true,
    isComplete: () => true,
  },
  {
    id: "review",
    title: "Review",
    subtitle: "Looks good? Finish to start matching.",
    Component: Placeholder,
    isComplete: () => false,
  },
];
```

> The `Component: Placeholder` entries are replaced with the real step components in Task 20. `dealBreakers.isComplete` checks for a non-null array (an empty selection is valid once saved).

- [ ] **Step 7: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/lib/onboarding-progress.ts src/features/onboarding/__tests__/onboarding-progress.test.ts src/features/onboarding/store/onboarding-store.ts src/features/onboarding/config/steps.ts
git commit -m "feat(onboarding): resume logic (tested), store, steps config skeleton

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: StepShell + useOnboarding orchestration

**Files:**

- Create: `src/features/onboarding/hooks/use-onboarding.ts`
- Create: `src/features/onboarding/components/StepShell.tsx`

**Interfaces:**

- Consumes: `STEPS`, `useOnboardingStore`, `firstIncompleteIndex`, `useOnboardingData`, `useProfileMutations`.
- Produces:
  - `useOnboarding()` → `{ index, step, total, data, isLoading, isError, goNext(), goBack(), skip(), canGoBack }` and `setIndex`.
  - `StepShell`: `{ children: ReactNode; canAdvance: boolean; onNext: () => void; saving?: boolean; nextLabel?: string }` — renders `ProgressBar`, title/subtitle (from the active step), scroll body, footer (Back / optional Skip / Next).

- [ ] **Step 1: Implement useOnboarding**

Create `src/features/onboarding/hooks/use-onboarding.ts`:

```ts
import { useEffect } from "react";
import { useRouter } from "expo-router";

import { STEPS } from "@/features/onboarding/config/steps";
import { firstIncompleteIndex } from "@/features/onboarding/lib/onboarding-progress";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding-store";
import { useOnboardingData } from "@/features/profile/hooks/use-profile";

/** Drives wizard navigation and resume. Data persistence happens inside each
 *  step via mutations; this hook only advances the index. */
export function useOnboarding() {
  const router = useRouter();
  const index = useOnboardingStore((s) => s.index);
  const setIndex = useOnboardingStore((s) => s.setIndex);
  const query = useOnboardingData();

  // On first successful load, jump to the first incomplete step.
  useEffect(() => {
    if (query.data) setIndex(firstIncompleteIndex(STEPS, query.data));
    // run once per fresh data load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.profile.id]);

  const total = STEPS.length;
  const step = STEPS[index];

  const goNext = () => {
    if (index < total - 1) setIndex(index + 1);
  };
  const goBack = () => {
    if (index > 0) setIndex(index - 1);
  };
  const skip = goNext;

  return {
    index,
    step,
    total,
    setIndex,
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    goNext,
    goBack,
    skip,
    canGoBack: index > 0,
    router,
  };
}
```

- [ ] **Step 2: Implement StepShell**

Create `src/features/onboarding/components/StepShell.tsx`:

```tsx
import { type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "@/features/auth/components/progress-bar";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { Button } from "@/shared/components";

interface StepShellProps {
  children: ReactNode;
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  nextLabel?: string;
}

/** Shared chrome for every wizard step: progress, title, body, footer nav. */
export function StepShell({
  children,
  canAdvance,
  onNext,
  saving,
  nextLabel = "Next",
}: StepShellProps) {
  const { index, step, total, goBack, skip, canGoBack } = useOnboarding();

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View className="gap-4 px-6 pt-4">
          <ProgressBar current={index + 1} total={total} />
          <View className="gap-1.5">
            <Text className="prose-title text-ink">{step.title}</Text>
            <Text className="prose-subtitle">{step.subtitle}</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-6 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        <View className="gap-2 px-6 pb-2">
          <Button
            variant="primary"
            onPress={onNext}
            disabled={!canAdvance}
            loading={saving}
          >
            {nextLabel}
          </Button>
          <View className="flex-row justify-between">
            {canGoBack ? (
              <Button variant="ghost" onPress={goBack}>
                Back
              </Button>
            ) : (
              <View />
            )}
            {step.skippable ? (
              <Button variant="ghost" onPress={skip}>
                Skip
              </Button>
            ) : (
              <View />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/hooks/use-onboarding.ts src/features/onboarding/components/StepShell.tsx
git commit -m "feat(onboarding): useOnboarding orchestration + shared StepShell

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: BasicsStep

**Files:**

- Create: `src/features/onboarding/steps/BasicsStep.tsx`

**Interfaces:**

- Consumes: `useOnboarding` (for `data`), `useProfileMutations` (`saveProfile`), RHF, `basicsSchema`, primitives, constants. Persists then calls `goNext`.

- [ ] **Step 1: Implement BasicsStep**

Create `src/features/onboarding/steps/BasicsStep.tsx`:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import {
  GRADUATION_YEARS,
  SEX_ASSIGNED_AT_BIRTH,
} from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { basicsSchema, type BasicsValues } from "@/features/profile/schema";
import { Field, OptionGroup, TagInput, TextField } from "@/shared/components";

const yearOptions = GRADUATION_YEARS.map((y) => ({
  value: String(y),
  label: String(y),
}));

export function BasicsStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const p = data?.profile;

  const { control, handleSubmit, formState } = useForm<BasicsValues>({
    resolver: zodResolver(basicsSchema),
    mode: "onChange",
    defaultValues: {
      first_name: p?.first_name ?? "",
      pronouns: p?.pronouns ?? "",
      graduation_year: p?.graduation_year ?? undefined,
      majors: p?.majors ?? [],
      gender_identity: p?.gender_identity ?? "",
      sex_assigned_at_birth: p?.sex_assigned_at_birth ?? undefined,
    },
  });

  const onNext = handleSubmit(async (values) => {
    await saveProfile.mutateAsync({
      first_name: values.first_name.trim(),
      pronouns: values.pronouns?.trim() || null,
      graduation_year: values.graduation_year,
      majors: values.majors,
      gender_identity: values.gender_identity?.trim() || null,
      sex_assigned_at_birth: values.sex_assigned_at_birth ?? null,
    });
    goNext();
  });

  return (
    <StepShell
      canAdvance={formState.isValid}
      onNext={onNext}
      saving={saveProfile.isPending}
    >
      <View className="card border-continuous gap-1 px-4 py-3">
        <Text className="prose-label">School</Text>
        <Text className="prose-body text-ink">
          {p?.university ?? p?.school_domain ?? "—"}
        </Text>
        <Text className="prose-caption text-ash">
          From your .edu email — can’t be changed.
        </Text>
      </View>

      <Controller
        control={control}
        name="first_name"
        render={({ field, fieldState }) => (
          <TextField
            label="First name"
            value={field.value}
            onChangeText={field.onChange}
            invalid={!!fieldState.error}
            message={fieldState.error?.message}
            placeholder="Mia"
          />
        )}
      />

      <Controller
        control={control}
        name="pronouns"
        render={({ field }) => (
          <TextField
            label="Pronouns (optional)"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            placeholder="she/her"
          />
        )}
      />

      <Controller
        control={control}
        name="graduation_year"
        render={({ field, fieldState }) => (
          <Field label="Graduation year" error={fieldState.error?.message}>
            <OptionGroup
              options={yearOptions}
              value={field.value ? String(field.value) : null}
              onChange={(v) => field.onChange(Number(v))}
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="majors"
        render={({ field, fieldState }) => (
          <Field label="Major(s)" error={fieldState.error?.message}>
            <TagInput
              value={field.value ?? []}
              onChange={field.onChange}
              max={3}
              placeholder="Add a major and press done"
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="gender_identity"
        render={({ field }) => (
          <TextField
            label="Gender identity"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            placeholder="Woman, Man, Non-binary…"
          />
        )}
      />

      <Controller
        control={control}
        name="sex_assigned_at_birth"
        render={({ field }) => (
          <Field label="Sex assigned at birth" optional>
            <OptionGroup
              options={SEX_ASSIGNED_AT_BIRTH}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
    </StepShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/steps/BasicsStep.tsx
git commit -m "feat(onboarding): Basics step (RHF + read-only school)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: CompatibilityStep

**Files:**

- Create: `src/features/onboarding/steps/CompatibilityStep.tsx`

- [ ] **Step 1: Implement CompatibilityStep**

Create `src/features/onboarding/steps/CompatibilityStep.tsx`:

```tsx
import { useState } from "react";
import { View } from "react-native";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import {
  BEDTIME,
  GUESTS_FREQUENCY,
  NOISE_PREFERENCE,
  ROOM_TEMPERATURE,
  SLEEP_SCHEDULE,
  STUDY_STYLE,
  WAKEUP_TIME,
} from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { compatibilitySchema } from "@/features/profile/schema";
import { Field, OptionGroup, ScaleInput } from "@/shared/components";

export function CompatibilityStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const p = data?.profile;

  const [form, setForm] = useState({
    sleep_schedule: p?.sleep_schedule ?? null,
    bedtime: p?.bedtime ?? null,
    wakeup_time: p?.wakeup_time ?? null,
    cleanliness: p?.cleanliness ?? null,
    noise_preference: p?.noise_preference ?? null,
    study_style: p?.study_style ?? null,
    guests_frequency: p?.guests_frequency ?? null,
    social_level: p?.social_level ?? null,
    room_temperature: p?.room_temperature ?? null,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const result = compatibilitySchema.safeParse(form);

  const onNext = async () => {
    if (!result.success) return;
    await saveProfile.mutateAsync(result.data);
    goNext();
  };

  return (
    <StepShell
      canAdvance={result.success}
      onNext={onNext}
      saving={saveProfile.isPending}
    >
      <Field label="Sleep schedule">
        <OptionGroup
          options={SLEEP_SCHEDULE}
          value={form.sleep_schedule}
          onChange={(v) => set("sleep_schedule", v)}
        />
      </Field>
      <Field label="Bedtime">
        <OptionGroup
          options={BEDTIME}
          value={form.bedtime}
          onChange={(v) => set("bedtime", v)}
        />
      </Field>
      <Field label="Wake-up time">
        <OptionGroup
          options={WAKEUP_TIME}
          value={form.wakeup_time}
          onChange={(v) => set("wakeup_time", v)}
        />
      </Field>
      <Field label="Cleanliness">
        <ScaleInput
          value={form.cleanliness}
          onChange={(v) => set("cleanliness", v)}
          lowLabel="Relaxed"
          highLabel="Spotless"
        />
      </Field>
      <Field label="Noise preference">
        <OptionGroup
          options={NOISE_PREFERENCE}
          value={form.noise_preference}
          onChange={(v) => set("noise_preference", v)}
        />
      </Field>
      <Field label="Study style">
        <OptionGroup
          options={STUDY_STYLE}
          value={form.study_style}
          onChange={(v) => set("study_style", v)}
        />
      </Field>
      <Field label="Guests">
        <OptionGroup
          options={GUESTS_FREQUENCY}
          value={form.guests_frequency}
          onChange={(v) => set("guests_frequency", v)}
        />
      </Field>
      <Field label="Social level">
        <ScaleInput
          value={form.social_level}
          onChange={(v) => set("social_level", v)}
          lowLabel="Homebody"
          highLabel="Always out"
        />
      </Field>
      <Field label="Room temperature">
        <OptionGroup
          options={ROOM_TEMPERATURE}
          value={form.room_temperature}
          onChange={(v) => set("room_temperature", v)}
        />
      </Field>
    </StepShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/steps/CompatibilityStep.tsx
git commit -m "feat(onboarding): Compatibility step (all 9 required fields)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Lifestyle, Interests, Deal-breakers steps

**Files:**

- Create: `src/features/onboarding/steps/LifestyleStep.tsx`
- Create: `src/features/onboarding/steps/InterestsStep.tsx`
- Create: `src/features/onboarding/steps/DealBreakersStep.tsx`

- [ ] **Step 1: Implement LifestyleStep**

Create `src/features/onboarding/steps/LifestyleStep.tsx`:

```tsx
import { useState } from "react";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import {
  ALCOHOL,
  FITNESS,
  PARTIES,
  SMOKING,
} from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { lifestyleSchema } from "@/features/profile/schema";
import { Field, OptionGroup } from "@/shared/components";

export function LifestyleStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const p = data?.profile;

  const [form, setForm] = useState({
    alcohol: p?.alcohol ?? null,
    smoking: p?.smoking ?? null,
    parties: p?.parties ?? null,
    fitness: p?.fitness ?? null,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const result = lifestyleSchema.safeParse(form);

  const onNext = async () => {
    if (!result.success) return;
    await saveProfile.mutateAsync(result.data);
    goNext();
  };

  return (
    <StepShell
      canAdvance={result.success}
      onNext={onNext}
      saving={saveProfile.isPending}
    >
      <Field label="Alcohol">
        <OptionGroup
          options={ALCOHOL}
          value={form.alcohol}
          onChange={(v) => set("alcohol", v)}
        />
      </Field>
      <Field label="Smoking">
        <OptionGroup
          options={SMOKING}
          value={form.smoking}
          onChange={(v) => set("smoking", v)}
        />
      </Field>
      <Field label="Parties">
        <OptionGroup
          options={PARTIES}
          value={form.parties}
          onChange={(v) => set("parties", v)}
        />
      </Field>
      <Field label="Fitness">
        <OptionGroup
          options={FITNESS}
          value={form.fitness}
          onChange={(v) => set("fitness", v)}
        />
      </Field>
    </StepShell>
  );
}
```

- [ ] **Step 2: Implement InterestsStep (live count + 5–10)**

Create `src/features/onboarding/steps/InterestsStep.tsx`:

```tsx
import { useState } from "react";
import { Text, View } from "react-native";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { INTERESTS, INTERESTS_LIMITS } from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { interestsSchema } from "@/features/profile/schema";
import { OptionGroup } from "@/shared/components";

export function InterestsStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const [interests, setInterests] = useState<string[]>(
    data?.profile.interests ?? [],
  );
  const result = interestsSchema.safeParse({ interests });

  const onNext = async () => {
    if (!result.success) return;
    await saveProfile.mutateAsync({ interests });
    goNext();
  };

  return (
    <StepShell
      canAdvance={result.success}
      onNext={onNext}
      saving={saveProfile.isPending}
    >
      <View className="flex-row justify-between">
        <Text className="prose-footnote text-slate">
          Pick {INTERESTS_LIMITS.min}–{INTERESTS_LIMITS.max}
        </Text>
        <Text className="prose-footnote font-semibold text-ink">
          {interests.length} selected
        </Text>
      </View>
      <OptionGroup
        multiple
        options={INTERESTS}
        value={interests}
        onChange={setInterests}
        min={INTERESTS_LIMITS.min}
        max={INTERESTS_LIMITS.max}
      />
    </StepShell>
  );
}
```

- [ ] **Step 3: Implement DealBreakersStep**

Create `src/features/onboarding/steps/DealBreakersStep.tsx`:

```tsx
import { useState } from "react";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { DEAL_BREAKERS } from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { OptionGroup } from "@/shared/components";

export function DealBreakersStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const [dealBreakers, setDealBreakers] = useState<string[]>(
    data?.profile.deal_breakers ?? [],
  );

  const onNext = async () => {
    await saveProfile.mutateAsync({ deal_breakers: dealBreakers });
    goNext();
  };

  return (
    <StepShell canAdvance onNext={onNext} saving={saveProfile.isPending}>
      <OptionGroup
        multiple
        options={DEAL_BREAKERS}
        value={dealBreakers}
        onChange={setDealBreakers}
      />
    </StepShell>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/steps/LifestyleStep.tsx src/features/onboarding/steps/InterestsStep.tsx src/features/onboarding/steps/DealBreakersStep.tsx
git commit -m "feat(onboarding): Lifestyle, Interests (5–10 live count), Deal-breakers steps

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: PromptsStep (1–3 prompts with answers)

**Files:**

- Create: `src/features/onboarding/steps/PromptsStep.tsx`

- [ ] **Step 1: Implement PromptsStep**

Create `src/features/onboarding/steps/PromptsStep.tsx`:

```tsx
import { useState } from "react";
import { Text, View } from "react-native";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { PROMPTS, PROMPTS_LIMITS } from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { promptsSchema } from "@/features/profile/schema";
import { Field, OptionGroup, TextField } from "@/shared/components";

const promptOptions = PROMPTS.map((p) => ({ value: p, label: p }));

export function PromptsStep() {
  const { data, goNext } = useOnboarding();
  const { savePrompts } = useProfileMutations();

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries((data?.prompts ?? []).map((p) => [p.prompt, p.answer])),
  );
  const selected = Object.keys(answers);

  const toggle = (next: string[]) => {
    if (next.length > PROMPTS_LIMITS.max) return;
    setAnswers((prev) => {
      const out: Record<string, string> = {};
      for (const key of next) out[key] = prev[key] ?? "";
      return out;
    });
  };

  const prompts = selected.map((prompt) => ({
    prompt,
    answer: answers[prompt] ?? "",
  }));
  const result = promptsSchema.safeParse({ prompts });

  const onNext = async () => {
    if (!result.success) return;
    await savePrompts.mutateAsync(result.data.prompts);
    goNext();
  };

  return (
    <StepShell
      canAdvance={result.success}
      onNext={onNext}
      saving={savePrompts.isPending}
    >
      <Field label={`Choose 1–${PROMPTS_LIMITS.max}`}>
        <OptionGroup
          multiple
          options={promptOptions}
          value={selected}
          onChange={toggle}
          max={PROMPTS_LIMITS.max}
          columns={1}
        />
      </Field>
      {selected.length > 0 ? (
        <View className="gap-4">
          {selected.map((prompt) => (
            <View key={prompt} className="gap-1.5">
              <Text className="prose-footnote font-semibold text-ink">
                {prompt}
              </Text>
              <TextField
                value={answers[prompt] ?? ""}
                onChangeText={(t) =>
                  setAnswers((prev) => ({ ...prev, [prompt]: t }))
                }
                placeholder="Your answer"
                multiline
              />
            </View>
          ))}
        </View>
      ) : null}
    </StepShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/steps/PromptsStep.tsx
git commit -m "feat(onboarding): Prompts step (select 1–3 + answers)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: PhotosStep (pick → upload → retry/reorder)

**Files:**

- Create: `src/features/onboarding/steps/PhotosStep.tsx`

**Interfaces:**

- Consumes: `expo-image-picker`, `useProfileMutations` (`uploadPhoto`, `removePhoto`, `reorderPhotos`), `photoPublicUrl`, `PhotoGrid`, `arrayMove`, `PHOTOS_LIMITS`.

- [ ] **Step 1: Implement PhotosStep**

Create `src/features/onboarding/steps/PhotosStep.tsx`:

```tsx
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Text, View } from "react-native";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { photoPublicUrl } from "@/features/profile/api";
import { PHOTOS_LIMITS } from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { arrayMove } from "@/shared/lib/array-move";
import { PhotoGrid, type PhotoItem } from "@/shared/components";

export function PhotosStep() {
  const { data, goNext } = useOnboarding();
  const { uploadPhoto, removePhoto, reorderPhotos } = useProfileMutations();

  const saved = data?.photos ?? [];
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const items: PhotoItem[] = saved.map((ph) => ({
    id: ph.id,
    uri: photoPublicUrl(ph.url),
    status: "ready" as const,
  }));
  if (pendingUri)
    items.push({ id: "pending", uri: pendingUri, status: "uploading" });
  if (failedUri)
    items.push({
      id: "failed",
      uri: failedUri,
      status: "error",
      onRetry: () => doUpload(failedUri),
    });

  const doUpload = async (uri: string) => {
    setFailedUri(null);
    setPendingUri(uri);
    try {
      await uploadPhoto.mutateAsync({ uri, position: saved.length });
      setPendingUri(null);
    } catch {
      setPendingUri(null);
      setFailedUri(uri);
    }
  };

  const onAdd = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;
    await doUpload(res.assets[0].uri);
  };

  const onReorder = async (from: number, to: number) => {
    const reordered = arrayMove(saved, from, to);
    await reorderPhotos.mutateAsync(
      reordered.map((ph, i) => ({ id: ph.id, position: i })),
    );
  };

  const canAdvance = saved.length >= PHOTOS_LIMITS.min;

  return (
    <StepShell canAdvance={canAdvance} onNext={goNext}>
      <PhotoGrid
        photos={items}
        onAdd={onAdd}
        onRemove={(id) => removePhoto.mutate(id)}
        onReorder={onReorder}
        max={PHOTOS_LIMITS.max}
      />
      {!canAdvance ? (
        <Text className="prose-footnote text-slate">
          Add at least one photo to continue.
        </Text>
      ) : null}
      <Text className="prose-caption text-ash">
        The first photo is your primary. Use ← → to reorder.
      </Text>
    </StepShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/steps/PhotosStep.tsx
git commit -m "feat(onboarding): Photos step (picker + upload, retry, reorder)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: ExtrasStep (+ private phone)

**Files:**

- Create: `src/features/onboarding/steps/ExtrasStep.tsx`

- [ ] **Step 1: Implement ExtrasStep**

Create `src/features/onboarding/steps/ExtrasStep.tsx`:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { CLUBS_MAX } from "@/features/profile/constants";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { extrasSchema, type ExtrasValues } from "@/features/profile/schema";
import { Field, TagInput, TextField } from "@/shared/components";

export function ExtrasStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile, savePrivateContact } = useProfileMutations();
  const p = data?.profile;

  const { control, handleSubmit } = useForm<ExtrasValues>({
    resolver: zodResolver(extrasSchema),
    defaultValues: {
      dorm_preference: p?.dorm_preference ?? "",
      living_program: p?.living_program ?? "",
      clubs: p?.clubs ?? [],
      instagram: p?.instagram ?? "",
      linkedin: p?.linkedin ?? "",
      phone: "",
    },
  });

  const onNext = handleSubmit(async (values) => {
    await saveProfile.mutateAsync({
      dorm_preference: values.dorm_preference?.trim() || null,
      living_program: values.living_program?.trim() || null,
      clubs: values.clubs ?? [],
      instagram: values.instagram?.trim() || null,
      linkedin: values.linkedin?.trim() || null,
    });
    if (values.phone?.trim())
      await savePrivateContact.mutateAsync(values.phone.trim());
    goNext();
  });

  return (
    <StepShell canAdvance onNext={onNext} saving={saveProfile.isPending}>
      <Controller
        control={control}
        name="dorm_preference"
        render={({ field }) => (
          <TextField
            label="Dorm preference"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            placeholder="e.g. North campus"
          />
        )}
      />
      <Controller
        control={control}
        name="living_program"
        render={({ field }) => (
          <TextField
            label="Living program"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            placeholder="e.g. Honors / LLC"
          />
        )}
      />
      <Controller
        control={control}
        name="clubs"
        render={({ field }) => (
          <Field label="Clubs">
            <TagInput
              value={field.value ?? []}
              onChange={field.onChange}
              max={CLUBS_MAX}
              placeholder="Add a club"
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="instagram"
        render={({ field }) => (
          <TextField
            label="Instagram"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            autoCapitalize="none"
            placeholder="@handle"
          />
        )}
      />
      <Controller
        control={control}
        name="linkedin"
        render={({ field }) => (
          <TextField
            label="LinkedIn"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            autoCapitalize="none"
            placeholder="profile url"
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <View className="gap-1.5">
            <TextField
              label="Phone number"
              value={field.value ?? ""}
              onChangeText={field.onChange}
              keyboardType="phone-pad"
              placeholder="(555) 555-5555"
            />
            <Text className="prose-caption text-ash">
              🔒 Private — only shared after you match with someone.
            </Text>
          </View>
        )}
      />
    </StepShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/steps/ExtrasStep.tsx
git commit -m "feat(onboarding): Extras step (optional fields + private phone)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 19: ReviewStep (preview + edit links + finish)

**Files:**

- Create: `src/features/onboarding/steps/ReviewStep.tsx`

**Interfaces:**

- Consumes: `useOnboarding` (`data`, `setIndex`, `router`), `useProfileMutations` (`complete`), `onboardingCompletionSchema`, `STEPS`.

- [ ] **Step 1: Implement ReviewStep**

Create `src/features/onboarding/steps/ReviewStep.tsx`:

```tsx
import { Text, View } from "react-native";

import { StepShell } from "@/features/onboarding/components/StepShell";
import { STEPS } from "@/features/onboarding/config/steps";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { useProfileMutations } from "@/features/profile/hooks/use-profile-mutations";
import { onboardingCompletionSchema } from "@/features/profile/schema";
import { Button } from "@/shared/components";

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <View className="flex-1 gap-0.5">
        <Text className="prose-label">{label}</Text>
        <Text className="prose-body text-ink">{value || "—"}</Text>
      </View>
      <Button variant="ghost" onPress={onEdit}>
        Edit
      </Button>
    </View>
  );
}

export function ReviewStep() {
  const { data, setIndex } = useOnboarding();
  const { complete } = useProfileMutations();
  const p = data?.profile;

  const jumpTo = (id: string) => setIndex(STEPS.findIndex((s) => s.id === id));

  const completion = onboardingCompletionSchema.safeParse({
    first_name: p?.first_name ?? "",
    graduation_year: p?.graduation_year ?? 0,
    majors: p?.majors ?? [],
    sleep_schedule: p?.sleep_schedule ?? "",
    bedtime: p?.bedtime ?? "",
    wakeup_time: p?.wakeup_time ?? "",
    cleanliness: p?.cleanliness ?? 0,
    noise_preference: p?.noise_preference ?? "",
    study_style: p?.study_style ?? "",
    guests_frequency: p?.guests_frequency ?? "",
    social_level: p?.social_level ?? 0,
    room_temperature: p?.room_temperature ?? "",
    interests: p?.interests ?? [],
    promptCount: data?.prompts.length ?? 0,
    photoCount: data?.photos.length ?? 0,
  });

  const onFinish = async () => {
    if (!completion.success) return;
    await complete.mutateAsync();
    // The (app) gate flips once the query invalidates; replace to the landing.
    // router lives on the hook return.
  };

  return (
    <StepShell
      canAdvance={completion.success}
      onNext={onFinish}
      saving={complete.isPending}
      nextLabel="Finish"
    >
      <Row
        label="Name"
        value={p?.first_name ?? ""}
        onEdit={() => jumpTo("basics")}
      />
      <Row
        label="Graduation year"
        value={p?.graduation_year ? String(p.graduation_year) : ""}
        onEdit={() => jumpTo("basics")}
      />
      <Row
        label="Majors"
        value={(p?.majors ?? []).join(", ")}
        onEdit={() => jumpTo("basics")}
      />
      <Row
        label="Interests"
        value={`${p?.interests?.length ?? 0} selected`}
        onEdit={() => jumpTo("interests")}
      />
      <Row
        label="Prompts"
        value={`${data?.prompts.length ?? 0} answered`}
        onEdit={() => jumpTo("prompts")}
      />
      <Row
        label="Photos"
        value={`${data?.photos.length ?? 0} uploaded`}
        onEdit={() => jumpTo("photos")}
      />
      {!completion.success ? (
        <Text className="prose-footnote text-pass">
          Complete the required steps above before finishing.
        </Text>
      ) : null}
    </StepShell>
  );
}
```

> The actual `router.replace('/discover')` lives in the host screen (Task 21), which watches `onboarding_complete` and redirects. This keeps the step pure of navigation side effects beyond the mutation.

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/steps/ReviewStep.tsx
git commit -m "feat(onboarding): Review step (preview, edit links, finish gate)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 20: Wire step components into STEPS config

**Files:**

- Modify: `src/features/onboarding/config/steps.ts`

- [ ] **Step 1: Replace the placeholders with real components**

In `src/features/onboarding/config/steps.ts`, add imports:

```ts
import { BasicsStep } from "@/features/onboarding/steps/BasicsStep";
import { CompatibilityStep } from "@/features/onboarding/steps/CompatibilityStep";
import { DealBreakersStep } from "@/features/onboarding/steps/DealBreakersStep";
import { ExtrasStep } from "@/features/onboarding/steps/ExtrasStep";
import { InterestsStep } from "@/features/onboarding/steps/InterestsStep";
import { LifestyleStep } from "@/features/onboarding/steps/LifestyleStep";
import { PhotosStep } from "@/features/onboarding/steps/PhotosStep";
import { PromptsStep } from "@/features/onboarding/steps/PromptsStep";
import { ReviewStep } from "@/features/onboarding/steps/ReviewStep";
```

Delete the `Placeholder` constant and set each step's `Component` to its real component (`basics → BasicsStep`, `compatibility → CompatibilityStep`, `lifestyle → LifestyleStep`, `interests → InterestsStep`, `dealBreakers → DealBreakersStep`, `prompts → PromptsStep`, `photos → PhotosStep`, `extras → ExtrasStep`, `review → ReviewStep`).

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/features/onboarding/config/steps.ts
git commit -m "feat(onboarding): wire real step components into STEPS config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 21: Routing, gate, host screen, /discover

**Files:**

- Create: `src/app/(app)/onboarding.tsx`
- Create: `src/app/(app)/(main)/_layout.tsx`
- Create: `src/app/(app)/(main)/discover.tsx`
- Move: `src/app/(app)/home.tsx` → `src/app/(app)/(main)/home.tsx`
- Modify: `src/app/(app)/_layout.tsx`

**Interfaces:**

- Consumes: `useOnboardingData`, `useOnboarding`, `STEPS`.

- [ ] **Step 1: Build the onboarding host screen**

Create `src/app/(app)/onboarding.tsx`:

```tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, data, isLoading, isError } = useOnboarding();

  // When the profile flips to complete, leave onboarding for the app.
  useEffect(() => {
    if (data?.profile.onboarding_complete) router.replace("/discover");
  }, [data?.profile.onboarding_complete, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#000000" />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="prose-subtitle text-center">
          Couldn’t load your profile. Pull to retry or restart the app.
        </Text>
      </View>
    );
  }

  const StepComponent = step.Component;
  return <StepComponent />;
}
```

- [ ] **Step 2: Build the main app group**

Create `src/app/(app)/(main)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="discover" />
  );
}
```

Create `src/app/(app)/(main)/discover.tsx`:

```tsx
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Placeholder post-onboarding landing. The real swipe deck lands here later. */
export default function Discover() {
  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text className="prose-display text-ink">Discover</Text>
          <Text className="prose-subtitle text-center">
            You’re all set. Roommate matches will show up here.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
```

- [ ] **Step 3: Move home into the main group**

Run:

```bash
git mv src/app/\(app\)/home.tsx src/app/\(app\)/\(main\)/home.tsx
```

- [ ] **Step 4: Gate onboarding vs main in the (app) layout**

Replace `src/app/(app)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

import { useOnboardingData } from "@/features/profile/hooks/use-profile";

export default function AppLayout() {
  const { data, isLoading } = useOnboardingData();

  // Hold while we learn whether onboarding is complete (splash already cleared).
  if (isLoading) return null;

  const complete = data?.profile.onboarding_complete ?? false;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!complete}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={complete}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/
git commit -m "feat(onboarding): gate incomplete users to /onboarding; add /discover landing

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 22: Storage bucket migration

**Files:**

- Create: `supabase/migrations/0002_profile_photos_storage.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0002_profile_photos_storage.sql`:

```sql
-- ================================================================
-- profile-photos storage bucket + owner-scoped RLS.
-- 0001's delete_photo_object() trigger already deletes objects from
-- this bucket by name; this creates the bucket and write policies.
-- Object path convention: "<user_id>/<filename>".
-- ================================================================

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Public read (bucket is public; same-school visibility is enforced at the
-- profile_photos row level in 0001).
drop policy if exists "profile-photos read" on storage.objects;
create policy "profile-photos read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- Owners (path prefix = their uid) may write/replace/delete their own files.
drop policy if exists "profile-photos insert own" on storage.objects;
create policy "profile-photos insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "profile-photos update own" on storage.objects;
create policy "profile-photos update own"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "profile-photos delete own" on storage.objects;
create policy "profile-photos delete own"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
```

- [ ] **Step 2: Commit** (apply via `supabase db push` against the project when credentials are available)

```bash
git add supabase/migrations/0002_profile_photos_storage.sql
git commit -m "feat(storage): profile-photos bucket + owner-scoped RLS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 23: Dev playground — onboarding screens

**Files:**

- Modify: `src/app/dev/screens.tsx`

- [ ] **Step 1: Add live onboarding links**

In `src/app/dev/screens.tsx`, add to the links `View` (after the sign-in link):

```tsx
            <Link href="/onboarding" className="prose-body font-semibold text-ink underline">
              → Onboarding (live)
            </Link>
            <Link href="/discover" className="prose-body font-semibold text-ink underline">
              → Discover (live)
            </Link>
```

> Onboarding steps read live profile data via TanStack Query, so they’re exercised through the live link rather than isolated frames (which would need a mocked query client + auth session).

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean), then:

```bash
git add src/app/dev/screens.tsx
git commit -m "chore(dev): link onboarding + discover from the dev playground

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 24: Final verification

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors across the whole project.

- [ ] **Step 2: Full test run**

Run: `npm test`
Expected: all suites pass (constants, schema, array-move, onboarding-progress).

- [ ] **Step 3: Manual smoke (when a simulator/Supabase are available)**

Verify against the acceptance criteria: sign in as an incomplete user → land on `/onboarding`; complete each step (validation blocks Next until satisfied; interests 5–10, prompts 1–3, photos 1–6 enforced); kill & relaunch mid-flow → resume at the first incomplete step with prior answers prefilled; finish → redirected to `/discover`; relaunch → goes straight to `/discover`; navigating to `/onboarding` while complete → redirected to `/discover`.

- [ ] **Step 4: Update memory if anything non-obvious surfaced** (e.g. RN Supabase upload quirks, jest-expo config gotchas).

---

## Self-Review (completed)

**Spec coverage:** Every spec section maps to a task — primitives (T7–T10), constants/schema (T3–T4), api/hooks (T5–T6), persistence + resume (T5/T6/T11/T12), 9 steps (T13–T19), step config reorderability (T11/T20), routing + access control (T21), photos + storage (T17/T22), dev playground (T7–T10, T23), verification (T24). The §9 acceptance-criteria table is the cross-check.

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to". `Placeholder` in T11 is real intermediate code, explicitly replaced in T20.

**Type consistency:** `useProfileMutations` returns `{ saveProfile, uploadPhoto, removePhoto, reorderPhotos, savePrompts, savePrivateContact, complete }` — names used consistently in T13–T19. `OnboardingData`, `Profile`, `Option`, `PhotoItem`, `firstIncompleteIndex`, `arrayMove` signatures match across producing and consuming tasks. Step `isComplete` predicates align with each step's save payload.

**Known follow-ups (non-blocking for MVP):** drag-and-drop photo reorder (arrows ship instead); isolated step previews in the dev playground (live links ship instead); applying migration 0002 + `expo-image-picker` plugin config requires live Supabase creds / a native rebuild not available in this environment.
