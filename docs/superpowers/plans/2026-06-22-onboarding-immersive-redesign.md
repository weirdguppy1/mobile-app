# Onboarding Immersive Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn onboarding from a 9-step multi-field wizard into an immersive, full-screen, one-question-per-screen flow with section-based progress, section interstitials, and a blurred Continue overlay — built entirely on the existing animation system.

**Architecture:** A data-driven question manifest (`questions.ts` metadata + `question-components.tsx` map, mirroring the existing `steps.ts`/`step-components.tsx` split) drives a flat `FlowItem[]` of interstitials + questions. 29 single-field questions are produced by a generic `makeFieldQuestion` factory; 3 (prompts/photos/review) are bespoke. The new system is built alongside the old in new files, then a single cutover task wires the route and deletes the old files — so `tsc` stays green at every task boundary.

**Tech Stack:** React Native 0.85 / Expo SDK 56, Expo Router, TypeScript (strict, no `any`/`@ts-ignore`), react-native-reanimated 4.3.1, expo-blur, @shopify/react-native-skia, uniwind, zustand, TanStack Query, zod, jest.

## Global Constraints

- **No new dependencies.** Reuse `StepTransition`, `FadeIn`, `FocusScale`, `ActivateRamp`, `CheckPop`, `OnboardingBackground` (Skia mesh), `OnboardingProgress`, `CompletionCelebration`, `Button`, `expo-blur`, and the input primitives.
- **No `any`, no `@ts-ignore`.** Generics must infer/erase value types.
- **One question per screen.** Hero question in display type, slightly above center, generous whitespace, single control fills vertical space.
- **Section progress only.** Show position within the current section; reset per section; never reveal total onboarding length.
- **Continue: reuse the existing `Button`, do not redesign it.** It floats in a blurred bottom overlay; content scrolls underneath; always visible.
- **Motion: eased timing, NO spring** (user override of TASK4 §6). Reuse `StepTransition` for question→question; a heavier `variant: 'section'` for interstitials.
- **No spotlight in onboarding** (one input per screen → nothing to blur). Keep `FocusScale` + entry blur. The `Spotlight*` primitives stay in `shared` + the dev playground.
- **Optional questions** show an "Optional" badge and are always advanceable.
- **Palette (DESIGN.md):** question screens are neutral white (hero question is the only emphasis); tone/mesh lives on interstitials. Continue is `button-primary` (ink). Hero uses Space Grotesk (`prose-display`/`prose-title`).
- **All interstitial + question copy lives in `config/sections.ts` and `config/questions.ts`** so wording is editable in one place. Tests must NOT assert exact copy strings (assert structure/non-empty only) so copy stays freely editable.
- **Test gate:** `npx tsc --noEmit` must pass (lint is broken — do not rely on `npm run lint`). Pure logic (config/lib) gets jest tests via `npx jest`. React components/hooks/animations have **no unit tests** (the repo has no RN component test harness — no existing component is unit-tested); their gate is `tsc` + a dev-playground preview. Where a task is React-only, this is expected, not a gap.
- **Dev route mandate (CLAUDE.md):** when a previewable presentational component is created, add it to `src/app/dev/components.tsx`; keep `src/app/dev/screens.tsx` links valid.
- **Git:** branch is `feature/onboarding-immersive`. Never commit to main. Commit messages end with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## Shared interfaces (used across tasks)

```ts
// config/sections.ts
type SectionId = 'basics' | 'living' | 'lifestyle' | 'interests'
  | 'dealBreakers' | 'prompts' | 'photos' | 'extras' | 'review';
interface SectionDef {
  id: SectionId;
  title: string;                 // progress label, e.g. "Living habits"
  tone: Tone;                    // interstitial background tone (Tone from OnboardingBackground)
  interstitial: { headline: string; body: string };
}
declare const SECTIONS: SectionDef[];

// config/questions.ts
interface QuestionMeta {
  id: string;
  section: SectionId;
  title: string;                 // hero question
  subtitle?: string;
  optional?: boolean;
  isComplete: (data: OnboardingData) => boolean;  // resume predicate (pure)
}
declare const QUESTIONS: QuestionMeta[];

// lib/flow.ts
type FlowItem =
  | { kind: 'interstitial'; section: SectionId; key: string }
  | { kind: 'question'; questionId: string; key: string };
declare function buildFlow(sections: SectionDef[], questions: QuestionMeta[]): FlowItem[];
declare function nextFlowIndex(flow: FlowItem[], index: number): number;
declare function prevQuestionIndex(flow: FlowItem[], index: number): number | null; // skips interstitials
declare function flowIndexOfQuestion(flow: FlowItem[], id: string): number;

// lib/onboarding-progress.ts (additions)
declare function firstIncompleteQuestion(questions: QuestionMeta[], data: OnboardingData): number;
declare function sectionProgress(questions: QuestionMeta[], questionId: string): { current: number; total: number };

// hooks/use-question-flow.ts
interface QuestionFlow {
  data: OnboardingData | undefined; isLoading: boolean; isError: boolean;
  index: number; item: FlowItem;
  question: QuestionMeta | null; section: SectionDef;
  progress: { current: number; total: number } | null; // null on interstitials
  goToIndex: (i: number) => void;
  goNext: () => void; goBack: () => void; canGoBack: boolean;
  goToQuestion: (id: string) => void;
}
declare function useQuestionFlow(): QuestionFlow;

// lib/make-field-question.tsx
type Mutations = ReturnType<typeof useProfileMutations>;
interface FieldQuestionConfig<V> {
  getValue: (data: OnboardingData) => V;
  isValid?: (value: V) => boolean;          // omit for optional → always advanceable
  save: (value: V, m: Mutations) => Promise<void>;
  control: (value: V, set: (v: V) => void) => ReactNode;
}
declare function makeFieldQuestion<V>(config: FieldQuestionConfig<V>): ComponentType;
```

Presentational components (props-only, no hook — so they're dev-previewable, matching the NavBar/BottomNav split):

```ts
// components/QuestionShell.tsx
interface QuestionShellProps {
  title: string; subtitle?: string; optional?: boolean;
  canGoBack: boolean; onBack: () => void;
  canAdvance: boolean; onNext: () => void; saving?: boolean; nextLabel?: string;
  children: ReactNode;  // the single control
}
// components/ContinueOverlay.tsx
interface ContinueOverlayProps { canAdvance: boolean; onNext: () => void; saving?: boolean; label?: string; }
declare function useContinueOverlayHeight(): number;
// components/SectionProgress.tsx
interface SectionProgressProps { title: string; current: number; total: number; }
// components/SectionInterstitial.tsx
interface SectionInterstitialProps { headline: string; body: string; schoolLabel?: string; onContinue: () => void; }
```

---

### Task 1: `StepTransition` variant (question vs section)

**Files:**
- Modify: `src/shared/components/animations/step-transition.tsx`
- Test: `src/shared/components/animations/__tests__/transition-params.test.ts` (create)

**Interfaces:**
- Produces: `transitionParams(variant: 'question'|'section', direction: 'forward'|'back', reduced: boolean): { enterFrom: { x: number; scale: number }; exitTo: { x: number; scale: number }; enterMs: number; exitMs: number }` and a new optional `variant?: 'question' | 'section'` prop on `StepTransition` (default `'question'`, preserving current behavior).

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/components/animations/__tests__/transition-params.test.ts
import { transitionParams } from '@/shared/components/animations/step-transition';

describe('transitionParams', () => {
  it('question forward slides in from the right, no scale', () => {
    const p = transitionParams('question', 'forward', false);
    expect(p.enterFrom.x).toBeGreaterThan(0);
    expect(p.enterFrom.scale).toBe(1);
    expect(p.exitTo.x).toBeLessThan(0);
  });
  it('question back reverses the slide', () => {
    const p = transitionParams('question', 'back', false);
    expect(p.enterFrom.x).toBeLessThan(0);
    expect(p.exitTo.x).toBeGreaterThan(0);
  });
  it('section variant scales (no slide) and runs longer than question', () => {
    const section = transitionParams('section', 'forward', false);
    const question = transitionParams('question', 'forward', false);
    expect(section.enterFrom.x).toBe(0);
    expect(section.enterFrom.scale).toBeLessThan(1);
    expect(section.enterMs).toBeGreaterThan(question.enterMs);
  });
  it('reduced motion zeroes movement for both variants', () => {
    for (const v of ['question', 'section'] as const) {
      const p = transitionParams(v, 'forward', true);
      expect(p.enterFrom.x).toBe(0);
      expect(p.enterFrom.scale).toBe(1);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest transition-params`
Expected: FAIL — `transitionParams` is not exported.

- [ ] **Step 3: Implement**

Add the pure `transitionParams` function and route the worklets through it. Replace the body of `src/shared/components/animations/step-transition.tsx` with:

```tsx
import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type EntryExitAnimationFunction,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const DISTANCE = 44;
const BLUR_MAX = 16;

type Direction = 'forward' | 'back';
type Variant = 'question' | 'section';
type LayoutAnimationStaticContext = { presetName: string };
type CustomAnim = EntryExitAnimationFunction & LayoutAnimationStaticContext;

/** Pure motion parameters for a transition — extracted so it can be unit-tested.
 *  question = directional slide + fade (current behavior, eased, no spring).
 *  section  = heavier scale + fade-through, longer, no slide (chapter break). */
export function transitionParams(variant: Variant, direction: Direction, reduced: boolean) {
  if (reduced) {
    return { enterFrom: { x: 0, scale: 1 }, exitTo: { x: 0, scale: 1 }, enterMs: 140, exitMs: 110 };
  }
  if (variant === 'section') {
    return { enterFrom: { x: 0, scale: 0.92 }, exitTo: { x: 0, scale: 1.04 }, enterMs: 380, exitMs: 300 };
  }
  const sign = direction === 'forward' ? 1 : -1;
  return {
    enterFrom: { x: sign * DISTANCE, scale: 1 },
    exitTo: { x: (direction === 'forward' ? -1 : 1) * DISTANCE, scale: 1 },
    enterMs: direction === 'forward' ? 230 : 270,
    exitMs: direction === 'forward' ? 190 : 230,
  };
}

function makeEnter(variant: Variant, direction: Direction, reduced: boolean): CustomAnim {
  const p = transitionParams(variant, direction, reduced);
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateX: p.enterFrom.x }, { scale: p.enterFrom.scale }] },
      animations: {
        opacity: withTiming(1, { duration: p.enterMs, easing: Easing.out(Easing.cubic) }),
        transform: [
          { translateX: withTiming(0, { duration: p.enterMs, easing: Easing.out(Easing.cubic) }) },
          { scale: withTiming(1, { duration: p.enterMs, easing: Easing.out(Easing.cubic) }) },
        ],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepEnter' });
}

function makeExit(variant: Variant, direction: Direction, reduced: boolean): CustomAnim {
  const p = transitionParams(variant, direction, reduced);
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    return {
      initialValues: { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] },
      animations: {
        opacity: withTiming(0, { duration: p.exitMs, easing: Easing.in(Easing.cubic) }),
        transform: [
          { translateX: withTiming(p.exitTo.x, { duration: p.exitMs, easing: Easing.in(Easing.cubic) }) },
          { scale: withTiming(p.exitTo.scale, { duration: p.exitMs, easing: Easing.in(Easing.cubic) }) },
        ],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepExit' });
}

/** Blur overlay that ramps from blurred to sharp on mount (TASK4 §6). */
function EntryBlur() {
  const progress = useSharedValue(1);
  useEffect(() => { progress.value = withTiming(0, { duration: 220 }); }, [progress]);
  const animatedProps = useAnimatedProps(() => ({ intensity: progress.value * BLUR_MAX }));
  return (
    <AnimatedBlurView
      pointerEvents="none"
      tint="light"
      blurMethod="dimezisBlurView"
      style={StyleSheet.absoluteFill}
      animatedProps={animatedProps}
    />
  );
}

interface StepTransitionProps {
  transitionKey: string;
  direction: Direction;
  /** 'question' (default) = slide+fade. 'section' = heavier scale+fade-through. */
  variant?: Variant;
  children: ReactNode;
}

/** Directional transition between flow screens. question→question slides + fades
 *  (eased, no spring); section interstitials use a weightier scale/fade. Reanimated
 *  keeps the exiting view mounted through its exit so the two screens cross. */
export function StepTransition({ transitionKey, direction, variant = 'question', children }: StepTransitionProps) {
  const reduced = useReducedMotion();
  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        key={transitionKey}
        entering={makeEnter(variant, direction, reduced)}
        exiting={makeExit(variant, direction, reduced)}
        style={StyleSheet.absoluteFill}>
        {children}
        {!reduced && variant === 'question' ? <EntryBlur /> : null}
      </Animated.View>
    </View>
  );
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npx jest transition-params && npx tsc --noEmit`
Expected: PASS; tsc clean (old `onboarding.tsx` still uses `StepTransition` with the default variant — unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/animations/step-transition.tsx src/shared/components/animations/__tests__/transition-params.test.ts
git commit -m "feat(animations): add section variant to StepTransition"
```

---

### Task 2: Manifest data — Tone ownership, sections, questions

**Files:**
- Modify: `src/features/onboarding/components/OnboardingBackground.tsx` (own + export `Tone`)
- Modify: `src/features/onboarding/config/step-tone.ts` (re-export `Tone` from OnboardingBackground — keeps the old route compiling until cutover)
- Create: `src/features/onboarding/config/sections.ts`
- Create: `src/features/onboarding/config/questions.ts`
- Test: `src/features/onboarding/__tests__/sections.test.ts`, `src/features/onboarding/__tests__/questions.test.ts`

**Interfaces:**
- Produces: `Tone` (exported from OnboardingBackground), `SectionId`, `SectionDef`, `SECTIONS`, `sectionById`, `QuestionMeta`, `QUESTIONS` (see Shared interfaces).

- [ ] **Step 1: Relocate the `Tone` type**

In `src/features/onboarding/components/OnboardingBackground.tsx`, **remove** the line
`import { type Tone } from "@/features/onboarding/config/step-tone";` and **add**, above `interface Bloom`:

```ts
/** Background tones — the keys of the MESH map below. `neutral` = bare white stage. */
export type Tone =
  | "warm" | "neutral" | "firstLight" | "energy" | "curiosity"
  | "conviction" | "expression" | "radiance" | "serenity" | "horizon";
```

Then replace the body of `src/features/onboarding/config/step-tone.ts` (keep `toneFor` working for the old route until cutover) with:

```ts
import { type StepId } from "@/features/onboarding/config/steps";
import { type Tone } from "@/features/onboarding/components/OnboardingBackground";

export type { Tone };

const TONE_BY_STEP: Record<StepId, Tone> = {
  basics: "neutral", compatibility: "neutral", lifestyle: "neutral",
  interests: "neutral", dealBreakers: "neutral", prompts: "neutral",
  photos: "neutral", extras: "neutral", review: "warm",
};

export function toneFor(stepId: StepId): Tone {
  return TONE_BY_STEP[stepId];
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/features/onboarding/__tests__/sections.test.ts
import { SECTIONS, sectionById, type SectionId } from '@/features/onboarding/config/sections';

const EXPECTED_ORDER: SectionId[] = [
  'basics', 'living', 'lifestyle', 'interests', 'dealBreakers', 'prompts', 'photos', 'extras', 'review',
];

describe('SECTIONS', () => {
  it('lists the nine sections in order', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(EXPECTED_ORDER);
  });
  it('every section has a title, non-empty interstitial copy, and a tone', () => {
    for (const s of SECTIONS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.interstitial.headline.length).toBeGreaterThan(0);
      expect(s.interstitial.body.length).toBeGreaterThan(0);
      expect(typeof s.tone).toBe('string');
    }
  });
  it('sectionById resolves a known id', () => {
    expect(sectionById('living').title).toBe('Living habits');
  });
});
```

```ts
// src/features/onboarding/__tests__/questions.test.ts
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
  linkedin: null, onboarding_complete: false, created_at: '', updated_at: '',
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest sections questions`
Expected: FAIL — `sections`/`questions` modules not found.

- [ ] **Step 4: Implement `sections.ts`**

```ts
// src/features/onboarding/config/sections.ts
import { type Tone } from '@/features/onboarding/components/OnboardingBackground';

export type SectionId =
  | 'basics' | 'living' | 'lifestyle' | 'interests'
  | 'dealBreakers' | 'prompts' | 'photos' | 'extras' | 'review';

export interface SectionDef {
  id: SectionId;
  /** Progress label shown above the section's segment bar. */
  title: string;
  /** Interstitial background tone (question screens stay neutral). */
  tone: Tone;
  /** Chapter-break copy. Edit headlines/body here — single source of truth. */
  interstitial: { headline: string; body: string };
}

// All user-facing interstitial copy lives here so it can be reworded in one place.
export const SECTIONS: SectionDef[] = [
  { id: 'basics', title: 'The basics', tone: 'firstLight',
    interstitial: { headline: "Let's build\nyour profile.", body: 'No wrong answers — just be you.' } },
  { id: 'living', title: 'Living habits', tone: 'serenity',
    interstitial: { headline: 'Now — how you\nlive day-to-day.', body: 'The stuff that makes or breaks sharing a space.' } },
  { id: 'lifestyle', title: 'Lifestyle', tone: 'energy',
    interstitial: { headline: 'A little about\nyour lifestyle.', body: 'Habits and vibes.' } },
  { id: 'interests', title: 'Interests', tone: 'expression',
    interstitial: { headline: "What you're\ninto.", body: 'So we can spot the overlap.' } },
  { id: 'dealBreakers', title: 'Deal-breakers', tone: 'conviction',
    interstitial: { headline: 'Real talk:\ndeal-breakers.', body: "Totally optional — only if you've got 'em." } },
  { id: 'prompts', title: 'Prompts', tone: 'curiosity',
    interstitial: { headline: 'Show some\npersonality.', body: 'This is where you actually come through.' } },
  { id: 'photos', title: 'Photos', tone: 'radiance',
    interstitial: { headline: 'Put a face\nto the vibe.', body: 'Add a few photos.' } },
  { id: 'extras', title: 'Extras', tone: 'horizon',
    interstitial: { headline: 'The extras.', body: 'Optional flourishes to round you out.' } },
  { id: 'review', title: 'Review', tone: 'warm',
    interstitial: { headline: "That's\neverything.", body: 'Take a look before we start matching.' } },
];

const BY_ID: Record<SectionId, SectionDef> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
) as Record<SectionId, SectionDef>;

export function sectionById(id: SectionId): SectionDef {
  return BY_ID[id];
}
```

- [ ] **Step 5: Implement `questions.ts`**

`isComplete` reuses the existing zod schema atoms so the validation rule is single-sourced. Optional questions are always complete.

```ts
// src/features/onboarding/config/questions.ts
import { type SectionId } from '@/features/onboarding/config/sections';
import {
  basicsSchema, compatibilitySchema, interestsSchema, lifestyleSchema, promptsSchema,
} from '@/features/profile/schema';
import { OnboardingData } from '@/features/profile/types';

export interface QuestionMeta {
  id: string;
  section: SectionId;
  title: string;        // hero question
  subtitle?: string;
  optional?: boolean;
  /** Pure resume predicate over loaded data. Optional questions → always true. */
  isComplete: (data: OnboardingData) => boolean;
}

const ok = <T>(r: { success: boolean }): boolean => r.success;
const always = () => true;

export const QUESTIONS: QuestionMeta[] = [
  // basics
  { id: 'first_name', section: 'basics', title: "What's your name?", subtitle: 'Your preferred name.',
    isComplete: (d) => ok(basicsSchema.shape.first_name.safeParse(d.profile.first_name ?? '')) },
  { id: 'pronouns', section: 'basics', title: 'What are your pronouns?', subtitle: 'she/her, he/him, they/them…',
    optional: true, isComplete: always },
  { id: 'graduation_year', section: 'basics', title: 'When do you graduate?',
    isComplete: (d) => ok(basicsSchema.shape.graduation_year.safeParse(d.profile.graduation_year ?? undefined)) },
  { id: 'majors', section: 'basics', title: 'What are you studying?', subtitle: 'Add up to three.',
    isComplete: (d) => ok(basicsSchema.shape.majors.safeParse(d.profile.majors ?? [])) },
  { id: 'gender_identity', section: 'basics', title: 'How do you identify?', optional: true, isComplete: always },
  { id: 'sex_assigned_at_birth', section: 'basics', title: 'Sex assigned at birth',
    isComplete: (d) => ok(basicsSchema.shape.sex_assigned_at_birth.safeParse(d.profile.sex_assigned_at_birth ?? undefined)) },
  { id: 'sexual_orientation', section: 'basics', title: 'Your sexual orientation',
    isComplete: (d) => ok(basicsSchema.shape.sexual_orientation.safeParse(d.profile.sexual_orientation ?? undefined)) },

  // living
  { id: 'sleep_schedule', section: 'living', title: "What's your sleep schedule?",
    isComplete: (d) => ok(compatibilitySchema.shape.sleep_schedule.safeParse(d.profile.sleep_schedule ?? undefined)) },
  { id: 'bedtime', section: 'living', title: 'When do you go to bed?',
    isComplete: (d) => ok(compatibilitySchema.shape.bedtime.safeParse(d.profile.bedtime ?? undefined)) },
  { id: 'wakeup_time', section: 'living', title: 'When do you wake up?',
    isComplete: (d) => ok(compatibilitySchema.shape.wakeup_time.safeParse(d.profile.wakeup_time ?? undefined)) },
  { id: 'cleanliness', section: 'living', title: 'How tidy are you?',
    isComplete: (d) => ok(compatibilitySchema.shape.cleanliness.safeParse(d.profile.cleanliness ?? undefined)) },
  { id: 'noise_preference', section: 'living', title: 'Noise while you study or sleep?',
    isComplete: (d) => ok(compatibilitySchema.shape.noise_preference.safeParse(d.profile.noise_preference ?? undefined)) },
  { id: 'study_style', section: 'living', title: 'Where do you study?',
    isComplete: (d) => ok(compatibilitySchema.shape.study_style.safeParse(d.profile.study_style ?? undefined)) },
  { id: 'guests_frequency', section: 'living', title: 'How often do guests come over?',
    isComplete: (d) => ok(compatibilitySchema.shape.guests_frequency.safeParse(d.profile.guests_frequency ?? undefined)) },
  { id: 'romantic_guests_frequency', section: 'living', title: 'Romantic guests?',
    isComplete: (d) => ok(compatibilitySchema.shape.romantic_guests_frequency.safeParse(d.profile.romantic_guests_frequency ?? undefined)) },
  { id: 'social_level', section: 'living', title: 'How social are you at home?',
    isComplete: (d) => ok(compatibilitySchema.shape.social_level.safeParse(d.profile.social_level ?? undefined)) },
  { id: 'room_temperature', section: 'living', title: 'Ideal room temperature?',
    isComplete: (d) => ok(compatibilitySchema.shape.room_temperature.safeParse(d.profile.room_temperature ?? undefined)) },

  // lifestyle
  { id: 'alcohol', section: 'lifestyle', title: 'Do you drink?',
    isComplete: (d) => ok(lifestyleSchema.shape.alcohol.safeParse(d.profile.alcohol ?? undefined)) },
  { id: 'smoking', section: 'lifestyle', title: 'Do you smoke?',
    isComplete: (d) => ok(lifestyleSchema.shape.smoking.safeParse(d.profile.smoking ?? undefined)) },
  { id: 'parties', section: 'lifestyle', title: 'How do you feel about parties?',
    isComplete: (d) => ok(lifestyleSchema.shape.parties.safeParse(d.profile.parties ?? undefined)) },
  { id: 'fitness', section: 'lifestyle', title: 'How active are you?',
    isComplete: (d) => ok(lifestyleSchema.shape.fitness.safeParse(d.profile.fitness ?? undefined)) },

  // interests
  { id: 'interests', section: 'interests', title: 'What are you into?', subtitle: 'Pick 5–10.',
    isComplete: (d) => ok(interestsSchema.safeParse({ interests: d.profile.interests ?? [] })) },

  // dealBreakers (optional — empty is allowed)
  { id: 'deal_breakers', section: 'dealBreakers', title: 'Any deal-breakers?',
    subtitle: "Things you can't live with.", optional: true, isComplete: always },

  // prompts (bespoke)
  { id: 'prompts', section: 'prompts', title: 'Show some personality', subtitle: 'Answer 1–3 prompts.',
    isComplete: (d) => ok(promptsSchema.safeParse({ prompts: d.prompts.map((p) => ({ prompt: p.prompt, answer: p.answer })) })) },

  // photos (bespoke)
  { id: 'photos', section: 'photos', title: 'Add your photos', subtitle: 'At least one. Drag to reorder.',
    isComplete: (d) => d.photos.length >= 1 },

  // extras (all optional)
  { id: 'dorm_preference', section: 'extras', title: 'Dorm preference?', optional: true, isComplete: always },
  { id: 'living_program', section: 'extras', title: 'Any living program?', optional: true, isComplete: always },
  { id: 'clubs', section: 'extras', title: "Clubs you're in?", optional: true, isComplete: always },
  { id: 'instagram', section: 'extras', title: 'Your Instagram?', optional: true, isComplete: always },
  { id: 'linkedin', section: 'extras', title: 'LinkedIn?', optional: true, isComplete: always },
  { id: 'phone', section: 'extras', title: 'Phone number?', subtitle: '🔒 Private — only shared after you match.',
    optional: true, isComplete: always },

  // review (bespoke) — never auto-complete; the Finish button drives completion
  { id: 'review', section: 'review', title: "Here's your profile",
    isComplete: () => false },
];
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx jest sections questions && npx tsc --noEmit`
Expected: PASS; tsc clean.

- [ ] **Step 7: Commit**

```bash
git add src/features/onboarding/components/OnboardingBackground.tsx src/features/onboarding/config/step-tone.ts src/features/onboarding/config/sections.ts src/features/onboarding/config/questions.ts src/features/onboarding/__tests__/sections.test.ts src/features/onboarding/__tests__/questions.test.ts
git commit -m "feat(onboarding): section + question manifest data"
```

---

### Task 3: Flow + progress logic

**Files:**
- Create: `src/features/onboarding/lib/flow.ts`
- Modify: `src/features/onboarding/lib/onboarding-progress.ts` (add `firstIncompleteQuestion`, `sectionProgress`; keep `firstIncompleteIndex`)
- Test: `src/features/onboarding/__tests__/flow.test.ts`, extend `src/features/onboarding/__tests__/onboarding-progress.test.ts`

**Interfaces:**
- Consumes: `SECTIONS`/`SectionDef` (Task 2), `QUESTIONS`/`QuestionMeta` (Task 2).
- Produces: `FlowItem`, `buildFlow`, `nextFlowIndex`, `prevQuestionIndex`, `flowIndexOfQuestion` (flow.ts); `firstIncompleteQuestion`, `sectionProgress` (onboarding-progress.ts).

- [ ] **Step 1: Write the failing tests**

```ts
// src/features/onboarding/__tests__/flow.test.ts
import { buildFlow, nextFlowIndex, prevQuestionIndex, flowIndexOfQuestion } from '@/features/onboarding/lib/flow';
import type { SectionDef } from '@/features/onboarding/config/sections';
import type { QuestionMeta } from '@/features/onboarding/config/questions';

const sections = [
  { id: 'a', title: 'A', tone: 'neutral', interstitial: { headline: 'h', body: 'b' } },
  { id: 'b', title: 'B', tone: 'warm', interstitial: { headline: 'h', body: 'b' } },
] as unknown as SectionDef[];
const questions = [
  { id: 'a1', section: 'a', title: 'a1', isComplete: () => true },
  { id: 'a2', section: 'a', title: 'a2', isComplete: () => true },
  { id: 'b1', section: 'b', title: 'b1', isComplete: () => true },
] as unknown as QuestionMeta[];
const flow = buildFlow(sections, questions);

describe('buildFlow', () => {
  it('puts an interstitial before each section, then its questions', () => {
    expect(flow.map((f) => f.kind)).toEqual(['interstitial', 'question', 'question', 'interstitial', 'question']);
  });
  it('keys are stable and unique', () => {
    const keys = flow.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('navigation', () => {
  it('nextFlowIndex steps forward and clamps at the end', () => {
    expect(nextFlowIndex(flow, 0)).toBe(1);
    expect(nextFlowIndex(flow, flow.length - 1)).toBe(flow.length - 1);
  });
  it('crossing a section boundary lands on the next interstitial', () => {
    // flow: [int-a(0), a1(1), a2(2), int-b(3), b1(4)]
    expect(flow[nextFlowIndex(flow, 2)].kind).toBe('interstitial');
  });
  it('prevQuestionIndex skips interstitials', () => {
    expect(prevQuestionIndex(flow, 4)).toBe(2);   // from b1 back to a2, skipping int-b
    expect(prevQuestionIndex(flow, 1)).toBeNull(); // first question has no previous question
  });
  it('flowIndexOfQuestion finds the question item', () => {
    expect(flow[flowIndexOfQuestion(flow, 'b1')].kind).toBe('question');
    expect(flowIndexOfQuestion(flow, 'nope')).toBe(-1);
  });
});
```

```ts
// append to src/features/onboarding/__tests__/onboarding-progress.test.ts
import { firstIncompleteQuestion, sectionProgress } from '@/features/onboarding/lib/onboarding-progress';
import { QUESTIONS } from '@/features/onboarding/config/questions';

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
  it('reports position within the question’s section, 1-based', () => {
    expect(sectionProgress(QUESTIONS, 'first_name')).toEqual({ current: 1, total: 7 });
    expect(sectionProgress(QUESTIONS, 'sexual_orientation')).toEqual({ current: 7, total: 7 });
  });
  it('single-question sections report 1 of 1', () => {
    expect(sectionProgress(QUESTIONS, 'interests')).toEqual({ current: 1, total: 1 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest flow onboarding-progress`
Expected: FAIL — `flow` module + new exports missing.

- [ ] **Step 3: Implement `flow.ts`**

```ts
// src/features/onboarding/lib/flow.ts
import { type QuestionMeta } from '@/features/onboarding/config/questions';
import { type SectionDef, type SectionId } from '@/features/onboarding/config/sections';

export type FlowItem =
  | { kind: 'interstitial'; section: SectionId; key: string }
  | { kind: 'question'; questionId: string; key: string };

/** One interstitial per section, followed by that section's questions, in order. */
export function buildFlow(sections: SectionDef[], questions: QuestionMeta[]): FlowItem[] {
  const flow: FlowItem[] = [];
  for (const section of sections) {
    flow.push({ kind: 'interstitial', section: section.id, key: `section:${section.id}` });
    for (const q of questions.filter((q) => q.section === section.id)) {
      flow.push({ kind: 'question', questionId: q.id, key: `q:${q.id}` });
    }
  }
  return flow;
}

/** Forward one step (interstitials included), clamped to the last item. */
export function nextFlowIndex(flow: FlowItem[], index: number): number {
  return Math.min(index + 1, flow.length - 1);
}

/** Index of the nearest previous QUESTION (interstitials are forward-only), or null. */
export function prevQuestionIndex(flow: FlowItem[], index: number): number | null {
  for (let i = index - 1; i >= 0; i--) {
    if (flow[i].kind === 'question') return i;
  }
  return null;
}

/** Flow index of a question by id, or -1. */
export function flowIndexOfQuestion(flow: FlowItem[], id: string): number {
  return flow.findIndex((f) => f.kind === 'question' && f.questionId === id);
}
```

- [ ] **Step 4: Implement the progress additions**

Append to `src/features/onboarding/lib/onboarding-progress.ts` (keep the existing `firstIncompleteIndex`):

```ts
import { type QuestionMeta } from '@/features/onboarding/config/questions';

/** Index in `questions` of the first one whose data is incomplete; the last index
 *  if all are complete (the review question, which never auto-completes). */
export function firstIncompleteQuestion(questions: QuestionMeta[], data: OnboardingData): number {
  const idx = questions.findIndex((q) => !q.isComplete(data));
  return idx === -1 ? questions.length - 1 : idx;
}

/** Section-local position of a question: 1-based `current` of `total` in its section. */
export function sectionProgress(questions: QuestionMeta[], questionId: string): { current: number; total: number } {
  const q = questions.find((q) => q.id === questionId);
  if (!q) return { current: 0, total: 0 };
  const inSection = questions.filter((other) => other.section === q.section);
  return { current: inSection.findIndex((other) => other.id === questionId) + 1, total: inSection.length };
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest flow onboarding-progress && npx tsc --noEmit`
Expected: PASS; tsc clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding/lib/flow.ts src/features/onboarding/lib/onboarding-progress.ts src/features/onboarding/__tests__/flow.test.ts src/features/onboarding/__tests__/onboarding-progress.test.ts
git commit -m "feat(onboarding): flow builder + section-local progress + resume"
```

---

### Task 4: `useQuestionFlow` hook

**Files:**
- Create: `src/features/onboarding/hooks/use-question-flow.ts`

**Interfaces:**
- Consumes: `buildFlow`, `nextFlowIndex`, `prevQuestionIndex`, `flowIndexOfQuestion` (Task 3); `SECTIONS`, `sectionById` (Task 2); `QUESTIONS` (Task 2); `sectionProgress` (Task 3); `useOnboardingStore` (existing); `useOnboardingData` (existing).
- Produces: `useQuestionFlow(): QuestionFlow` (see Shared interfaces).

No unit test (React hook; the pure logic it composes is already tested). Gate: `tsc`.

- [ ] **Step 1: Implement**

```ts
// src/features/onboarding/hooks/use-question-flow.ts
import { QUESTIONS, type QuestionMeta } from '@/features/onboarding/config/questions';
import { SECTIONS, sectionById, type SectionDef } from '@/features/onboarding/config/sections';
import {
  buildFlow, flowIndexOfQuestion, nextFlowIndex, prevQuestionIndex, type FlowItem,
} from '@/features/onboarding/lib/flow';
import { sectionProgress } from '@/features/onboarding/lib/onboarding-progress';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';

// Built once — the manifest is static.
const FLOW: FlowItem[] = buildFlow(SECTIONS, QUESTIONS);

export interface QuestionFlow {
  data: ReturnType<typeof useOnboardingData>['data'];
  isLoading: boolean;
  isError: boolean;
  index: number;
  item: FlowItem;
  question: QuestionMeta | null;
  section: SectionDef;
  progress: { current: number; total: number } | null;
  goToIndex: (i: number) => void;
  goNext: () => void;
  goBack: () => void;
  canGoBack: boolean;
  goToQuestion: (id: string) => void;
}

/** Drives the immersive onboarding flow over the static FLOW list. Mirrors the old
 *  useOnboarding contract but walks interstitials + questions instead of steps. */
export function useQuestionFlow(): QuestionFlow {
  const index = useOnboardingStore((s) => s.index);
  const setIndex = useOnboardingStore((s) => s.setIndex);
  const query = useOnboardingData();

  const clamped = Math.min(Math.max(index, 0), FLOW.length - 1);
  const item = FLOW[clamped];
  const question = item.kind === 'question'
    ? QUESTIONS.find((q) => q.id === item.questionId) ?? null
    : null;
  const sectionIdOfItem = item.kind === 'interstitial' ? item.section : question!.section;
  const section = sectionById(sectionIdOfItem);
  const progress = question ? sectionProgress(QUESTIONS, question.id) : null;
  const prev = prevQuestionIndex(FLOW, clamped);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    index: clamped,
    item,
    question,
    section,
    progress,
    goToIndex: setIndex,
    goNext: () => setIndex(nextFlowIndex(FLOW, clamped)),
    goBack: () => { if (prev !== null) setIndex(prev); },
    canGoBack: prev !== null,
    goToQuestion: (id) => { const i = flowIndexOfQuestion(FLOW, id); if (i >= 0) setIndex(i); },
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/hooks/use-question-flow.ts
git commit -m "feat(onboarding): useQuestionFlow navigation hook"
```

---

### Task 5: `ContinueOverlay` (blurred floating Continue)

**Files:**
- Create: `src/features/onboarding/components/ContinueOverlay.tsx`
- Modify: `src/app/dev/components.tsx` (add a preview)

**Interfaces:**
- Consumes: `Button`, `ActivateRamp`, `CheckPop` (`@/shared/components`); `expo-blur`; `useSafeAreaInsets`.
- Produces: `ContinueOverlay` (props in Shared interfaces), `useContinueOverlayHeight(): number`, `CONTINUE_OVERLAY_BASE`.

No unit test (presentational). Gate: `tsc` + dev preview.

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/components/ContinueOverlay.tsx
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivateRamp, Button, CheckPop } from '@/shared/components';

/** Content height of the overlay (button + padding), excluding the safe inset. */
export const CONTINUE_OVERLAY_BASE = 96;
const MIN_INSET = 12;

/** Total height the overlay occupies — screens pad their scroll content by this so
 *  the last control clears the floating Continue. */
export function useContinueOverlayHeight(): number {
  const insets = useSafeAreaInsets();
  return CONTINUE_OVERLAY_BASE + Math.max(insets.bottom, MIN_INSET);
}

interface ContinueOverlayProps {
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  label?: string;
}

/** The bottom Continue, floating in a blurred overlay so content scrolls beneath it
 *  (TASK4 §5). Reuses the existing Button unchanged; ramps in when advanceable and
 *  pops a confirm tick on press. */
export function ContinueOverlay({ canAdvance, onNext, saving, label = 'Continue' }: ContinueOverlayProps) {
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);

  const handlePress = () => {
    if (!canAdvance) return;
    setConfirming(true);
    onNext();
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Soft fade into content above the blur — a translucent canvas wash, no linear gradient (DESIGN.md). */}
      <View pointerEvents="none" style={styles.fade} />
      <BlurView
        tint="light"
        blurMethod="dimezisBlurView"
        intensity={24}
        style={[styles.blur, { paddingBottom: Math.max(insets.bottom, MIN_INSET) }]}>
        <View className="px-6 pt-3">
          <ActivateRamp active={canAdvance}>
            <Button variant="primary" onPress={handlePress} disabled={!canAdvance} loading={saving}>
              {label}
            </Button>
          </ActivateRamp>
          <View pointerEvents="none" className="absolute right-9 top-6">
            <CheckPop show={confirming} color="#ffffff" />
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fade: { height: 24, backgroundColor: 'rgba(255,255,255,0.0)' },
  blur: { backgroundColor: 'rgba(255,255,255,0.55)' },
});
```

- [ ] **Step 2: Add a dev preview**

In `src/app/dev/components.tsx`, add the import alongside the other onboarding imports:

```tsx
import { ContinueOverlay } from '@/features/onboarding/components/ContinueOverlay';
```

and a section before the closing `</ScrollView>`:

```tsx
<Section title="Onboarding — ContinueOverlay">
  <View className="h-40 overflow-hidden rounded-2xl border border-silver bg-wash">
    <ContinueOverlay canAdvance onNext={() => {}} />
  </View>
</Section>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/components/ContinueOverlay.tsx src/app/dev/components.tsx
git commit -m "feat(onboarding): blurred floating ContinueOverlay"
```

---

### Task 6: `QuestionShell` (immersive single-question chrome)

**Files:**
- Create: `src/features/onboarding/components/QuestionShell.tsx`
- Modify: `src/app/dev/components.tsx` (add a preview)

**Interfaces:**
- Consumes: `FadeIn`, `Button` (`@/shared/components`); `FocusScale` (`@/shared/components`); `ContinueOverlay`, `useContinueOverlayHeight` (Task 5); `SafeAreaView`.
- Produces: `QuestionShell` (props in Shared interfaces). Presentational — no hook.

No unit test (presentational). Gate: `tsc` + dev preview.

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/components/QuestionShell.tsx
import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ContinueOverlay, useContinueOverlayHeight } from '@/features/onboarding/components/ContinueOverlay';
import { Button, FadeIn, FocusScale } from '@/shared/components';

interface QuestionShellProps {
  title: string;
  subtitle?: string;
  optional?: boolean;
  canGoBack: boolean;
  onBack: () => void;
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  nextLabel?: string;
  children: ReactNode;   // the single control
}

/** Immersive chrome for one question: hero title slightly above center, the control
 *  filling the space below, a blurred floating Continue. No spotlight — one input per
 *  screen is already the focus (TASK4 §1, §4, §5, §8). */
export function QuestionShell({
  title, subtitle, optional, canGoBack, onBack, canAdvance, onNext, saving, nextLabel, children,
}: QuestionShellProps) {
  const overlayHeight = useContinueOverlayHeight();

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: overlayHeight + 16 }}
        contentContainerClassName="px-6 pt-6"
        keyboardShouldPersistTaps="handled">
        {canGoBack ? (
          <Button variant="ghost" onPress={onBack} className="-ml-2 mb-2 self-start">Back</Button>
        ) : null}

        <View className="gap-2 pt-6">
          {optional ? <Text className="prose-caption text-ash">Optional</Text> : null}
          <Text className="prose-display text-ink">{title}</Text>
          {subtitle ? (
            <FadeIn delay={140}><Text className="prose-subtitle">{subtitle}</Text></FadeIn>
          ) : null}
        </View>

        <FocusScale className="pt-8">
          {children}
        </FocusScale>
      </ScrollView>

      <ContinueOverlay canAdvance={canAdvance} onNext={onNext} saving={saving} label={nextLabel} />
    </View>
  );
}
```

- [ ] **Step 2: Add a dev preview**

In `src/app/dev/components.tsx` add the import:

```tsx
import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
```

and a section:

```tsx
<Section title="Onboarding — QuestionShell">
  <View className="h-96 overflow-hidden rounded-2xl border border-silver">
    <QuestionShell
      title={"What's your\nname?"}
      subtitle="Your preferred name."
      canGoBack
      onBack={() => {}}
      canAdvance
      onNext={() => {}}>
      <TextField placeholder="Preferred name" />
    </QuestionShell>
  </View>
</Section>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/components/QuestionShell.tsx src/app/dev/components.tsx
git commit -m "feat(onboarding): immersive QuestionShell chrome"
```

---

### Task 7: `SectionProgress`

**Files:**
- Create: `src/features/onboarding/components/SectionProgress.tsx`
- Modify: `src/app/dev/components.tsx` (add a preview)

**Interfaces:**
- Consumes: `OnboardingProgress` (existing).
- Produces: `SectionProgress` (props in Shared interfaces). Presentational.

No unit test (presentational; the count math is `sectionProgress`, tested in Task 3). Gate: `tsc` + dev preview.

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/components/SectionProgress.tsx
import { Text, View } from 'react-native';

import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';

interface SectionProgressProps {
  title: string;
  current: number;
  total: number;
}

/** Section title above a section-local segment bar (TASK4 §2). The bar resets per
 *  section because current/total are section-local; total onboarding length is never shown. */
export function SectionProgress({ title, current, total }: SectionProgressProps) {
  return (
    <View className="gap-2">
      <Text className="prose-label text-graphite">{title}</Text>
      <OnboardingProgress current={current} total={total} />
    </View>
  );
}
```

- [ ] **Step 2: Add a dev preview**

In `src/app/dev/components.tsx` add:

```tsx
import { SectionProgress } from '@/features/onboarding/components/SectionProgress';
```

and a section:

```tsx
<Section title="Onboarding — SectionProgress">
  <SectionProgress title="Living habits" current={3} total={10} />
</Section>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/components/SectionProgress.tsx src/app/dev/components.tsx
git commit -m "feat(onboarding): section-local SectionProgress header"
```

---

### Task 8: `makeFieldQuestion` factory

**Files:**
- Create: `src/features/onboarding/lib/make-field-question.tsx`

**Interfaces:**
- Consumes: `useQuestionFlow` (Task 4); `QuestionShell` (Task 6); `useProfileMutations` (existing).
- Produces: `makeFieldQuestion<V>(config): ComponentType` and `type Mutations = ReturnType<typeof useProfileMutations>` (see Shared interfaces).

No unit test (React glue; per-question validity is covered by `questions.isComplete` tests + schema atoms). Gate: `tsc`.

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/lib/make-field-question.tsx
import { type ComponentType, type ReactNode, useState } from 'react';

import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { OnboardingData } from '@/features/profile/types';

export type Mutations = ReturnType<typeof useProfileMutations>;

export interface FieldQuestionConfig<V> {
  /** Seed the control from loaded data. */
  getValue: (data: OnboardingData) => V;
  /** Gate Continue. Omit for optional questions (always advanceable). */
  isValid?: (value: V) => boolean;
  /** Persist on Continue. */
  save: (value: V, mutations: Mutations) => Promise<void>;
  /** Render the single input. */
  control: (value: V, set: (v: V) => void) => ReactNode;
}

/** Build a one-field question screen from a declarative config. The value type V is
 *  captured here and erased from the returned component, keeping the manifest uniform
 *  and type-safe (no `any`). Title/subtitle/optional come from the active QuestionMeta. */
export function makeFieldQuestion<V>(config: FieldQuestionConfig<V>): ComponentType {
  function FieldQuestion() {
    const { data, question, goNext, goBack, canGoBack } = useQuestionFlow();
    const mutations = useProfileMutations();
    const [saving, setSaving] = useState(false);
    const [value, setValue] = useState<V>(() => (data ? config.getValue(data) : config.getValue({ } as OnboardingData)));

    if (!question) return null;
    const canAdvance = config.isValid ? config.isValid(value) : true;

    const onNext = async () => {
      if (!canAdvance) return;
      setSaving(true);
      try {
        await config.save(value, mutations);
        goNext();
      } finally {
        setSaving(false);
      }
    };

    return (
      <QuestionShell
        title={question.title}
        subtitle={question.subtitle}
        optional={question.optional}
        canGoBack={canGoBack}
        onBack={goBack}
        canAdvance={canAdvance}
        onNext={onNext}
        saving={saving}>
        {config.control(value, setValue)}
      </QuestionShell>
    );
  }
  return FieldQuestion;
}
```

Note: `data` is guaranteed present when these render (the route shows a loader until data loads — Task 14), so `getValue` always receives real data; the `{} as OnboardingData` fallback only satisfies the initializer signature and is never hit in practice.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/lib/make-field-question.tsx
git commit -m "feat(onboarding): generic single-field question factory"
```

---

### Task 9: `PromptsQuestion` (bespoke)

**Files:**
- Create: `src/features/onboarding/questions/PromptsQuestion.tsx`

**Interfaces:**
- Consumes: `useQuestionFlow` (Task 4); `QuestionShell` (Task 6); `useProfileMutations`, `promptsSchema`, `PROMPTS`, `PROMPTS_LIMITS` (existing); `Field`, `OptionGroup`, `TextField`.
- Produces: `PromptsQuestion` (ComponentType).

No unit test (React). Gate: `tsc`. Port the body from the existing `steps/PromptsStep.tsx`, swapping `StepShell` for `QuestionShell`.

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/questions/PromptsQuestion.tsx
import { useState } from 'react';
import { Text, View } from 'react-native';

import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { PROMPTS, PROMPTS_LIMITS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { promptsSchema } from '@/features/profile/schema';
import { Field, OptionGroup, TextField } from '@/shared/components';

const promptOptions = PROMPTS.map((p) => ({ value: p, label: p }));

export function PromptsQuestion() {
  const { data, question, goNext, goBack, canGoBack } = useQuestionFlow();
  const { savePrompts } = useProfileMutations();

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries((data?.prompts ?? []).map((p) => [p.prompt, p.answer])),
  );
  const selected = Object.keys(answers);

  const toggle = (next: string[]) => {
    if (next.length > PROMPTS_LIMITS.max) return;
    setAnswers((prev) => {
      const out: Record<string, string> = {};
      for (const key of next) out[key] = prev[key] ?? '';
      return out;
    });
  };

  const prompts = selected.map((prompt) => ({ prompt, answer: answers[prompt] ?? '' }));
  const result = promptsSchema.safeParse({ prompts });

  const onNext = async () => {
    if (!result.success) return;
    await savePrompts.mutateAsync(result.data.prompts);
    goNext();
  };

  if (!question) return null;
  return (
    <QuestionShell
      title={question.title}
      subtitle={question.subtitle}
      canGoBack={canGoBack}
      onBack={goBack}
      canAdvance={result.success}
      onNext={onNext}
      saving={savePrompts.isPending}>
      <View className="gap-4">
        <Field label={`Choose 1–${PROMPTS_LIMITS.max}`}>
          <OptionGroup multiple options={promptOptions} value={selected} onChange={toggle} max={PROMPTS_LIMITS.max} />
        </Field>
        {selected.length > 0 ? (
          <View className="gap-4">
            {selected.map((prompt) => (
              <View key={prompt} className="gap-1.5">
                <Text className="prose-footnote font-semibold text-ink">{prompt}</Text>
                <TextField
                  value={answers[prompt] ?? ''}
                  onChangeText={(t) => setAnswers((prev) => ({ ...prev, [prompt]: t }))}
                  placeholder="Your answer"
                  multiline
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </QuestionShell>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/questions/PromptsQuestion.tsx
git commit -m "feat(onboarding): prompts question (bespoke)"
```

---

### Task 10: `PhotosQuestion` (bespoke)

**Files:**
- Create: `src/features/onboarding/questions/PhotosQuestion.tsx`

**Interfaces:**
- Consumes: `useQuestionFlow` (Task 4); `QuestionShell` (Task 6); `useProfileMutations`, `PHOTOS_LIMITS`, `arrayMove`, `PhotoGrid`, `PhotoItem` (existing).
- Produces: `PhotosQuestion` (ComponentType).

No unit test (React). Gate: `tsc`. Port from `steps/PhotosStep.tsx`.

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/questions/PhotosQuestion.tsx
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { PHOTOS_LIMITS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { arrayMove } from '@/shared/lib/array-move';
import { PhotoGrid, type PhotoItem } from '@/shared/components';

export function PhotosQuestion() {
  const { data, question, goNext, goBack, canGoBack } = useQuestionFlow();
  const { uploadPhoto, removePhoto, reorderPhotos } = useProfileMutations();

  const saved = data?.photos ?? [];
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const items: PhotoItem[] = saved.map((ph) => ({ id: ph.id, uri: ph.signedUrl, status: 'ready' as const }));
  if (pendingUri) items.push({ id: 'pending', uri: pendingUri, status: 'uploading' });
  if (failedUri) items.push({ id: 'failed', uri: failedUri, status: 'error', onRetry: () => doUpload(failedUri) });

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
    if (pendingUri) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    await doUpload(res.assets[0].uri);
  };

  const onReorder = async (from: number, to: number) => {
    if (from < 0 || to < 0 || from >= saved.length || to >= saved.length) return;
    const reordered = arrayMove(saved, from, to);
    await reorderPhotos.mutateAsync(reordered.map((ph, i) => ({ id: ph.id, position: i })));
  };

  const onRemove = (id: string) => {
    if (id === 'pending') return;
    if (id === 'failed') { setFailedUri(null); return; }
    removePhoto.mutate(id);
  };

  const canAdvance = saved.length >= PHOTOS_LIMITS.min;

  if (!question) return null;
  return (
    <QuestionShell
      title={question.title}
      subtitle={question.subtitle}
      canGoBack={canGoBack}
      onBack={goBack}
      canAdvance={canAdvance}
      onNext={goNext}>
      <View className="gap-3">
        <PhotoGrid photos={items} onAdd={onAdd} onRemove={onRemove} onReorder={onReorder} max={PHOTOS_LIMITS.max} />
        {!canAdvance ? <Text className="prose-footnote text-slate">Add at least one photo to continue.</Text> : null}
        <Text className="prose-caption text-ash">The first photo is your primary. Touch and hold a photo to drag and reorder.</Text>
      </View>
    </QuestionShell>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/questions/PhotosQuestion.tsx
git commit -m "feat(onboarding): photos question (bespoke)"
```

---

### Task 11: `ReviewQuestion` (bespoke, drives completion)

**Files:**
- Create: `src/features/onboarding/questions/ReviewQuestion.tsx`

**Interfaces:**
- Consumes: `useQuestionFlow` (Task 4) — uses `goToQuestion`; `QuestionShell` (Task 6); `useProfileMutations`, `useOnboardingStore`, `onboardingCompletionSchema` (existing); `Button`.
- Produces: `ReviewQuestion` (ComponentType).

No unit test (React). Gate: `tsc`. Port from `steps/ReviewStep.tsx`, replacing `setIndex(STEPS.findIndex…)` jumps with `goToQuestion(id)` and `StepShell` with `QuestionShell`. **Completion sequencing is unchanged** (set `celebrating` before awaiting `complete()`).

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/questions/ReviewQuestion.tsx
import { Text, View } from 'react-native';

import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { onboardingCompletionSchema } from '@/features/profile/schema';
import { Button } from '@/shared/components';

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <View className="flex-1 gap-0.5">
        <Text className="prose-label">{label}</Text>
        <Text className="prose-body text-ink">{value || '—'}</Text>
      </View>
      <Button variant="ghost" onPress={onEdit}>Edit</Button>
    </View>
  );
}

export function ReviewQuestion() {
  const { data, question, goToQuestion, goBack, canGoBack } = useQuestionFlow();
  const { complete } = useProfileMutations();
  const setCelebrating = useOnboardingStore((s) => s.setCelebrating);
  const p = data?.profile;

  const completion = onboardingCompletionSchema.safeParse({
    first_name: p?.first_name ?? '', graduation_year: p?.graduation_year ?? 0, majors: p?.majors ?? [],
    sleep_schedule: p?.sleep_schedule ?? '', bedtime: p?.bedtime ?? '', wakeup_time: p?.wakeup_time ?? '',
    cleanliness: p?.cleanliness ?? 0, noise_preference: p?.noise_preference ?? '', study_style: p?.study_style ?? '',
    guests_frequency: p?.guests_frequency ?? '', romantic_guests_frequency: p?.romantic_guests_frequency ?? '',
    social_level: p?.social_level ?? 0, room_temperature: p?.room_temperature ?? '',
    interests: p?.interests ?? [], promptCount: data?.prompts.length ?? 0, photoCount: data?.photos.length ?? 0,
  });

  const onFinish = async () => {
    if (!completion.success) return;
    // celebrating must flip BEFORE the mutation invalidates the profile query, or the
    // (app) layout gate unmounts this screen + the confetti. Route owns the redirect.
    setCelebrating(true);
    try {
      await complete.mutateAsync();
    } catch (error) {
      setCelebrating(false);
      throw error;
    }
  };

  if (!question) return null;
  return (
    <QuestionShell
      title={question.title}
      canGoBack={canGoBack}
      onBack={goBack}
      canAdvance={completion.success}
      onNext={onFinish}
      saving={complete.isPending}
      nextLabel="Finish">
      <View className="gap-1">
        <Row label="Name" value={p?.first_name ?? ''} onEdit={() => goToQuestion('first_name')} />
        <Row label="Graduation year" value={p?.graduation_year ? String(p.graduation_year) : ''} onEdit={() => goToQuestion('graduation_year')} />
        <Row label="Majors" value={(p?.majors ?? []).join(', ')} onEdit={() => goToQuestion('majors')} />
        <Row label="Interests" value={`${p?.interests?.length ?? 0} selected`} onEdit={() => goToQuestion('interests')} />
        <Row label="Prompts" value={`${data?.prompts.length ?? 0} answered`} onEdit={() => goToQuestion('prompts')} />
        <Row label="Photos" value={`${data?.photos.length ?? 0} uploaded`} onEdit={() => goToQuestion('photos')} />
        {!completion.success ? (
          <Text className="prose-footnote text-pass">Complete the required steps above before finishing.</Text>
        ) : null}
      </View>
    </QuestionShell>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/questions/ReviewQuestion.tsx
git commit -m "feat(onboarding): review question (bespoke)"
```

---

### Task 12: `question-components.tsx` — 29 field questions + the id→component map

**Files:**
- Create: `src/features/onboarding/config/question-components.tsx`
- Test: `src/features/onboarding/__tests__/question-components.test.ts`

**Interfaces:**
- Consumes: `makeFieldQuestion` (Task 8); `PromptsQuestion`/`PhotosQuestion`/`ReviewQuestion` (Tasks 9–11); the input primitives; profile constants + schema atoms; `QUESTIONS` (for the coverage test).
- Produces: `QUESTION_COMPONENTS: Record<string, ComponentType>`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/onboarding/__tests__/question-components.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest question-components`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// src/features/onboarding/config/question-components.tsx
import { type ComponentType } from 'react';
import { Text, View } from 'react-native';

import { makeFieldQuestion } from '@/features/onboarding/lib/make-field-question';
import { PhotosQuestion } from '@/features/onboarding/questions/PhotosQuestion';
import { PromptsQuestion } from '@/features/onboarding/questions/PromptsQuestion';
import { ReviewQuestion } from '@/features/onboarding/questions/ReviewQuestion';
import {
  ALCOHOL, BEDTIME, CLUBS_MAX, DEAL_BREAKERS, FITNESS, GRADUATION_YEARS, GUESTS_FREQUENCY,
  INTERESTS, INTERESTS_LIMITS, NOISE_PREFERENCE, PARTIES, ROMANTIC_GUESTS_FREQUENCY,
  ROOM_TEMPERATURE, SEX_ASSIGNED_AT_BIRTH, SEXUAL_ORIENTATION, SLEEP_SCHEDULE, SMOKING,
  STUDY_STYLE, WAKEUP_TIME,
} from '@/features/profile/constants';
import {
  basicsSchema, compatibilitySchema, interestsSchema, lifestyleSchema,
} from '@/features/profile/schema';
import { Field, OptionGroup, ScaleInput, TagInput, TextField } from '@/shared/components';

const yearOptions = GRADUATION_YEARS.map((y) => ({ value: String(y), label: String(y) }));
const ok = (r: { success: boolean }) => r.success;

// --- basics ---
const FirstName = makeFieldQuestion<string>({
  getValue: (d) => d.profile.first_name ?? '',
  isValid: (v) => ok(basicsSchema.shape.first_name.safeParse(v)),
  save: (v, m) => m.saveProfile.mutateAsync({ first_name: v.trim() }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="Preferred name" />,
});
const Pronouns = makeFieldQuestion<string>({
  getValue: (d) => d.profile.pronouns ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ pronouns: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="she/her, he/him, they/them…" />,
});
const GraduationYear = makeFieldQuestion<number | null>({
  getValue: (d) => d.profile.graduation_year ?? null,
  isValid: (v) => ok(basicsSchema.shape.graduation_year.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ graduation_year: v! }),
  control: (v, set) => (
    <OptionGroup options={yearOptions} value={v ? String(v) : null} onChange={(s) => set(s ? Number(s) : null)} />
  ),
});
const Majors = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.majors ?? [],
  isValid: (v) => ok(basicsSchema.shape.majors.safeParse(v)),
  save: (v, m) => m.saveProfile.mutateAsync({ majors: v }),
  control: (v, set) => <TagInput value={v} onChange={set} max={3} placeholder="Add a major and press done" />,
});
const GenderIdentity = makeFieldQuestion<string>({
  getValue: (d) => d.profile.gender_identity ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ gender_identity: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="Woman, Man, Non-binary…" />,
});
const SexAssignedAtBirth = makeFieldQuestion<string | null>({
  getValue: (d) => d.profile.sex_assigned_at_birth ?? null,
  isValid: (v) => ok(basicsSchema.shape.sex_assigned_at_birth.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ sex_assigned_at_birth: v }),
  control: (v, set) => <OptionGroup options={SEX_ASSIGNED_AT_BIRTH} value={v} onChange={set} />,
});
const SexualOrientation = makeFieldQuestion<string | null>({
  getValue: (d) => d.profile.sexual_orientation ?? null,
  isValid: (v) => ok(basicsSchema.shape.sexual_orientation.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ sexual_orientation: v }),
  control: (v, set) => <OptionGroup options={SEXUAL_ORIENTATION} value={v} onChange={set} />,
});

// --- living --- (single-select enums + two scales)
function enumQuestion(
  field: keyof typeof compatibilitySchema.shape,
  options: { value: string; label: string }[],
) {
  return makeFieldQuestion<string | null>({
    getValue: (d) => (d.profile[field as keyof typeof d.profile] as string | null) ?? null,
    isValid: (v) => ok(compatibilitySchema.shape[field].safeParse(v ?? undefined)),
    save: (v, m) => m.saveProfile.mutateAsync({ [field]: v }),
    control: (v, set) => <OptionGroup options={options} value={v} onChange={set} />,
  });
}
const SleepSchedule = enumQuestion('sleep_schedule', SLEEP_SCHEDULE);
const Bedtime = enumQuestion('bedtime', BEDTIME);
const WakeupTime = enumQuestion('wakeup_time', WAKEUP_TIME);
const NoisePreference = enumQuestion('noise_preference', NOISE_PREFERENCE);
const StudyStyle = enumQuestion('study_style', STUDY_STYLE);
const GuestsFrequency = enumQuestion('guests_frequency', GUESTS_FREQUENCY);
const RomanticGuestsFrequency = enumQuestion('romantic_guests_frequency', ROMANTIC_GUESTS_FREQUENCY);
const RoomTemperature = enumQuestion('room_temperature', ROOM_TEMPERATURE);
const Cleanliness = makeFieldQuestion<number | null>({
  getValue: (d) => d.profile.cleanliness ?? null,
  isValid: (v) => ok(compatibilitySchema.shape.cleanliness.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ cleanliness: v }),
  control: (v, set) => <ScaleInput value={v} onChange={set} lowLabel="Relaxed" highLabel="Spotless" />,
});
const SocialLevel = makeFieldQuestion<number | null>({
  getValue: (d) => d.profile.social_level ?? null,
  isValid: (v) => ok(compatibilitySchema.shape.social_level.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ social_level: v }),
  control: (v, set) => <ScaleInput value={v} onChange={set} lowLabel="Homebody" highLabel="Always out" />,
});

// --- lifestyle ---
function lifestyleQuestion(
  field: keyof typeof lifestyleSchema.shape,
  options: { value: string; label: string }[],
) {
  return makeFieldQuestion<string | null>({
    getValue: (d) => (d.profile[field as keyof typeof d.profile] as string | null) ?? null,
    isValid: (v) => ok(lifestyleSchema.shape[field].safeParse(v ?? undefined)),
    save: (v, m) => m.saveProfile.mutateAsync({ [field]: v }),
    control: (v, set) => <OptionGroup options={options} value={v} onChange={set} />,
  });
}
const Alcohol = lifestyleQuestion('alcohol', ALCOHOL);
const Smoking = lifestyleQuestion('smoking', SMOKING);
const Parties = lifestyleQuestion('parties', PARTIES);
const Fitness = lifestyleQuestion('fitness', FITNESS);

// --- interests ---
const Interests = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.interests ?? [],
  isValid: (v) => ok(interestsSchema.safeParse({ interests: v })),
  save: (v, m) => m.saveProfile.mutateAsync({ interests: v }),
  control: (v, set) => (
    <View className="gap-3">
      <View className="flex-row justify-between">
        <Text className="prose-footnote text-slate">Pick {INTERESTS_LIMITS.min}–{INTERESTS_LIMITS.max}</Text>
        <Text className="prose-footnote font-semibold text-ink">{v.length} selected</Text>
      </View>
      <OptionGroup multiple options={INTERESTS} value={v} onChange={set} min={INTERESTS_LIMITS.min} max={INTERESTS_LIMITS.max} />
    </View>
  ),
});

// --- dealBreakers (optional) ---
const DealBreakers = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.deal_breakers ?? [],
  save: (v, m) => m.saveProfile.mutateAsync({ deal_breakers: v }),
  control: (v, set) => <OptionGroup multiple options={DEAL_BREAKERS} value={v} onChange={set} />,
});

// --- extras (all optional) ---
const DormPreference = makeFieldQuestion<string>({
  getValue: (d) => d.profile.dorm_preference ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ dorm_preference: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="e.g. North campus" />,
});
const LivingProgram = makeFieldQuestion<string>({
  getValue: (d) => d.profile.living_program ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ living_program: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="e.g. Honors / LLC" />,
});
const Clubs = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.clubs ?? [],
  save: (v, m) => m.saveProfile.mutateAsync({ clubs: v }),
  control: (v, set) => <TagInput value={v} onChange={set} max={CLUBS_MAX} placeholder="Add a club" />,
});
const Instagram = makeFieldQuestion<string>({
  getValue: (d) => d.profile.instagram ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ instagram: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} autoCapitalize="none" placeholder="@handle" />,
});
const Linkedin = makeFieldQuestion<string>({
  getValue: (d) => d.profile.linkedin ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ linkedin: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} autoCapitalize="none" placeholder="profile url" />,
});
const Phone = makeFieldQuestion<string>({
  getValue: () => '',
  save: async (v, m) => { if (v.trim()) await m.savePrivateContact.mutateAsync(v.trim()); },
  control: (v, set) => (
    <View className="gap-1.5">
      <TextField value={v} onChangeText={set} keyboardType="phone-pad" placeholder="(555) 555-5555" />
      <Text className="prose-caption text-ash">🔒 Private — only shared after you match with someone.</Text>
    </View>
  ),
});

export const QUESTION_COMPONENTS: Record<string, ComponentType> = {
  first_name: FirstName, pronouns: Pronouns, graduation_year: GraduationYear, majors: Majors,
  gender_identity: GenderIdentity, sex_assigned_at_birth: SexAssignedAtBirth, sexual_orientation: SexualOrientation,
  sleep_schedule: SleepSchedule, bedtime: Bedtime, wakeup_time: WakeupTime, cleanliness: Cleanliness,
  noise_preference: NoisePreference, study_style: StudyStyle, guests_frequency: GuestsFrequency,
  romantic_guests_frequency: RomanticGuestsFrequency, social_level: SocialLevel, room_temperature: RoomTemperature,
  alcohol: Alcohol, smoking: Smoking, parties: Parties, fitness: Fitness,
  interests: Interests, deal_breakers: DealBreakers,
  prompts: PromptsQuestion, photos: PhotosQuestion,
  dorm_preference: DormPreference, living_program: LivingProgram, clubs: Clubs,
  instagram: Instagram, linkedin: Linkedin, phone: Phone,
  review: ReviewQuestion,
};
```

If TypeScript rejects the computed-key `{ [field]: v }` saves against `Partial<Profile>`, change those two helpers' `save` to a narrow cast `m.saveProfile.mutateAsync({ [field]: v } as Parameters<typeof m.saveProfile.mutateAsync>[0])` — still no `any`. Verify against the actual `saveProfile` mutation input type during implementation.

- [ ] **Step 4: Run test + typecheck**

Run: `npx jest question-components && npx tsc --noEmit`
Expected: PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/config/question-components.tsx src/features/onboarding/__tests__/question-components.test.ts
git commit -m "feat(onboarding): field-question manifest + id→component map"
```

---

### Task 13: `SectionInterstitial`

**Files:**
- Create: `src/features/onboarding/components/SectionInterstitial.tsx`
- Modify: `src/app/dev/components.tsx` (add a preview)

**Interfaces:**
- Consumes: `Button`, `FadeIn` (`@/shared/components`).
- Produces: `SectionInterstitial` (props in Shared interfaces). Presentational — background tone is supplied by the route via `OnboardingBackground`.

No unit test (presentational). Gate: `tsc` + dev preview.

- [ ] **Step 1: Implement**

```tsx
// src/features/onboarding/components/SectionInterstitial.tsx
import { Text, View } from 'react-native';

import { Button, FadeIn } from '@/shared/components';

interface SectionInterstitialProps {
  headline: string;
  body: string;
  /** Welcome-only: "Signed in as you@school.edu". */
  schoolLabel?: string;
  onContinue: () => void;
}

/** Chapter-break screen announcing the next section (TASK4 §3). The mesh-gradient
 *  background + tone shift are owned by OnboardingBackground at the route level; this
 *  is the centered display-type announcement + Continue. */
export function SectionInterstitial({ headline, body, schoolLabel, onContinue }: SectionInterstitialProps) {
  return (
    <View className="flex-1 justify-center px-8">
      <View className="flex-1 justify-center gap-4">
        <Text className="prose-display text-ink">{headline}</Text>
        <FadeIn delay={160}><Text className="prose-subtitle">{body}</Text></FadeIn>
        {schoolLabel ? (
          <FadeIn delay={240}><Text className="prose-caption text-ash">{schoolLabel}</Text></FadeIn>
        ) : null}
      </View>
      <View className="pb-2">
        <Button variant="primary" onPress={onContinue}>Continue</Button>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Add a dev preview**

In `src/app/dev/components.tsx` add:

```tsx
import { SectionInterstitial } from '@/features/onboarding/components/SectionInterstitial';
import { SECTIONS } from '@/features/onboarding/config/sections';
```

and a section:

```tsx
<Section title="Onboarding — SectionInterstitial">
  <View className="h-96 overflow-hidden rounded-2xl border border-silver">
    <SectionInterstitial
      headline={SECTIONS[0].interstitial.headline}
      body={SECTIONS[0].interstitial.body}
      schoolLabel="Signed in as student@stanford.edu"
      onContinue={() => {}}
    />
  </View>
</Section>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/components/SectionInterstitial.tsx src/app/dev/components.tsx
git commit -m "feat(onboarding): section interstitial screen"
```

---

### Task 14: Cutover — rewrite `onboarding.tsx`, wire the flow, delete the old wizard

**Files:**
- Modify: `src/app/(app)/onboarding.tsx`
- Modify: `src/features/onboarding/store/onboarding-store.ts` (doc comment only — `index` is now a flow index)
- Delete: `src/features/onboarding/components/StepShell.tsx`, `src/features/onboarding/config/steps.ts`, `src/features/onboarding/config/step-components.tsx`, `src/features/onboarding/config/step-tone.ts`, `src/features/onboarding/hooks/use-onboarding.ts`, `src/features/onboarding/steps/` (all 9 files), `src/features/onboarding/__tests__/step-tone.test.ts`

**Interfaces:**
- Consumes: `useQuestionFlow` (Task 4), `QUESTION_COMPONENTS` (Task 12), `SectionInterstitial` (Task 13), `SectionProgress` (Task 7), `StepTransition` w/ `variant` (Task 1), `OnboardingBackground` (existing), `CompletionCelebration` (existing), `firstIncompleteQuestion` + `QUESTIONS` (Tasks 2–3).

- [ ] **Step 1: Confirm nothing else imports the to-be-deleted files**

Run:
```bash
grep -rn "features/onboarding/components/StepShell\|features/onboarding/config/steps\b\|config/step-components\|config/step-tone\|hooks/use-onboarding\|features/onboarding/steps/" src/ --include=*.ts --include=*.tsx | grep -v "src/features/onboarding/steps/" | grep -v "config/step-tone.ts:" 
```
Expected: only matches inside `src/app/(app)/onboarding.tsx` (being rewritten) and within the onboarding feature's own deleted files. `OnboardingBackground` no longer imports `step-tone` (Task 2). If any OTHER file imports them, stop and report (the spec assumed these are onboarding-internal).

- [ ] **Step 2: Rewrite `src/app/(app)/onboarding.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';

import { CompletionCelebration } from '@/features/onboarding/components/CompletionCelebration';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { SectionInterstitial } from '@/features/onboarding/components/SectionInterstitial';
import { SectionProgress } from '@/features/onboarding/components/SectionProgress';
import { QUESTION_COMPONENTS } from '@/features/onboarding/config/question-components';
import { QUESTIONS } from '@/features/onboarding/config/questions';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { firstIncompleteQuestion } from '@/features/onboarding/lib/onboarding-progress';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { StepTransition } from '@/shared/components';

export default function OnboardingScreen() {
  const router = useRouter();
  const flow = useQuestionFlow();
  const { data, isLoading, isError, item, question, section, progress } = flow;
  const celebrating = useOnboardingStore((s) => s.celebrating);
  const setCelebrating = useOnboardingStore((s) => s.setCelebrating);
  const reduced = useReducedMotion();

  // Forward when the flow index grows.
  const prevIndex = useRef(flow.index);
  const direction: 'forward' | 'back' = flow.index >= prevIndex.current ? 'forward' : 'back';
  useEffect(() => { prevIndex.current = flow.index; }, [flow.index]);

  // Completion: the current screen lifts + fades FIRST; only once gone does the
  // celebration play on the cleared background, then we navigate.
  const exit = useSharedValue(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -exit.value * 40 }],
  }));

  useEffect(() => {
    if (!celebrating) return;
    if (reduced) { exit.value = 1; setShowCelebration(true); return; }
    exit.value = withTiming(1, { duration: 480, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setShowCelebration)(true);
    });
  }, [celebrating, exit, reduced]);

  const goToApp = () => {
    setShowCelebration(false);
    setCelebrating(false);
    router.replace('/discover');
  };

  // Resume to the first incomplete question once per fresh data load.
  useEffect(() => {
    if (data) flow.goToQuestion(QUESTIONS[firstIncompleteQuestion(QUESTIONS, data)].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.profile.id]);

  // Leave onboarding once complete — but let the celebration own the exit.
  useEffect(() => {
    if (data?.profile.onboarding_complete && !celebrating) router.replace('/discover');
  }, [data?.profile.onboarding_complete, celebrating, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#000000" />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-12">
        <Text className="prose-subtitle text-center">Couldn't load your profile. Pull to retry or restart the app.</Text>
      </View>
    );
  }

  const isInterstitial = item.kind === 'interstitial';
  const tone = isInterstitial ? section.tone : 'neutral';
  const QuestionComponent = question ? QUESTION_COMPONENTS[question.id] : null;
  const schoolLabel = section.id === 'basics'
    ? `Signed in as ${data.profile.email ?? data.profile.school_domain ?? ''}`
    : undefined;

  return (
    <View className="flex-1">
      <OnboardingBackground tone={tone} />
      <Animated.View className="flex-1" style={contentStyle}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          {!isInterstitial && progress ? (
            <View className="px-6 pt-4">
              <SectionProgress title={section.title} current={progress.current} total={progress.total} />
            </View>
          ) : null}
          <View className="flex-1">
            <StepTransition
              transitionKey={item.key}
              direction={direction}
              variant={isInterstitial ? 'section' : 'question'}>
              {isInterstitial ? (
                <SectionInterstitial
                  headline={section.interstitial.headline}
                  body={section.interstitial.body}
                  schoolLabel={schoolLabel}
                  onContinue={flow.goNext}
                />
              ) : QuestionComponent ? (
                <QuestionComponent />
              ) : null}
            </StepTransition>
          </View>
        </SafeAreaView>
      </Animated.View>
      {showCelebration ? <CompletionCelebration onComplete={goToApp} /> : null}
    </View>
  );
}
```

- [ ] **Step 3: Update the store doc comment**

In `src/features/onboarding/store/onboarding-store.ts`, change the `index` comment to reflect its new meaning:

```ts
  /** Current position in the onboarding FLOW (interstitials + questions), not a step index. */
  index: number;
```

- [ ] **Step 4: Delete the old wizard files**

```bash
git rm src/features/onboarding/components/StepShell.tsx \
  src/features/onboarding/config/steps.ts \
  src/features/onboarding/config/step-components.tsx \
  src/features/onboarding/config/step-tone.ts \
  src/features/onboarding/hooks/use-onboarding.ts \
  src/features/onboarding/__tests__/step-tone.test.ts \
  src/features/onboarding/steps/BasicsStep.tsx \
  src/features/onboarding/steps/CompatibilityStep.tsx \
  src/features/onboarding/steps/DealBreakersStep.tsx \
  src/features/onboarding/steps/ExtrasStep.tsx \
  src/features/onboarding/steps/InterestsStep.tsx \
  src/features/onboarding/steps/LifestyleStep.tsx \
  src/features/onboarding/steps/PhotosStep.tsx \
  src/features/onboarding/steps/PromptsStep.tsx \
  src/features/onboarding/steps/ReviewStep.tsx
```

- [ ] **Step 5: Full typecheck + tests**

Run: `npx tsc --noEmit && npx jest`
Expected: tsc clean (no dangling imports); all jest suites pass. If tsc reports a leftover import of a deleted file, fix that importer (it should only be the rewritten `onboarding.tsx`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(onboarding): cut over route to immersive flow; remove old wizard"
```

---

### Task 15: Dev playground sweep + manual QA checklist

**Files:**
- Modify: `src/app/dev/components.tsx` (remove any reference to deleted components; verify the new previews compile)
- Modify: `src/app/dev/screens.tsx` (the `/onboarding` live link already exists — verify it renders)

**Interfaces:** none new.

- [ ] **Step 1: Verify the dev playground has no dangling imports**

Run:
```bash
grep -n "StepShell\|/steps/\|step-components\|step-tone\|use-onboarding'" src/app/dev/components.tsx src/app/dev/screens.tsx
```
Expected: no matches. (`components.tsx` imports `OnboardingProgress`, `ContinueOverlay`, `QuestionShell`, `SectionProgress`, `SectionInterstitial` — all current.)

- [ ] **Step 2: Typecheck + tests + full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: tsc clean; all suites green.

- [ ] **Step 3: Manual QA (document results in the task report)**

These require a running dev client (expo-blur + Skia are native — `npx expo run:ios` / existing dev build). Confirm:
- Welcome interstitial shows first for a brand-new profile; Continue → first basics question.
- One question per screen; hero question large; control fills space; Continue floats with a blur and content scrolls under it.
- Section progress shows the section title + a bar that resets when a new section begins; total length never shown.
- Crossing into a new section shows that section's interstitial with a heavier scale/fade transition and a mesh tone shift; question↔question uses the slide+fade.
- Optional questions (pronouns, gender, deal-breakers, all extras) show "Optional" and Continue is enabled while blank.
- Back never lands on an interstitial.
- Resume: kill mid-flow, reopen → lands on the first unanswered question (no interstitial replay).
- Finish on Review → screen lifts away, then the celebration plays, then navigates to /discover.
- Reduced-motion (OS setting) → no slides/scales; instant transitions; flow still works.

- [ ] **Step 4: Commit (if any dev edits were needed)**

```bash
git add src/app/dev/components.tsx src/app/dev/screens.tsx
git commit -m "chore(dev): sync onboarding playground with immersive flow"
```

---

## Self-Review

**1. Spec coverage:**
- §1 one-question-per-screen hero → Tasks 6 (QuestionShell) + 12 (controls). ✓
- §2 section-based progress (resets, no total) → Tasks 3 (`sectionProgress`) + 7 (SectionProgress) + 14 (render only on questions). ✓
- §3 section interstitials → Tasks 2 (copy/tone) + 13 (screen) + 14 (render). ✓
- §4 full-screen utilization → Task 6 (control fills space, hero layout). ✓
- §5 blurred Continue overlay reusing Button → Task 5. ✓
- §6 motion (question slide+fade+blur; section heavier; eased, no spring) → Tasks 1 + 14. ✓ (spring conflict resolved per sign-off.)
- §7 reuse existing animation system → no new deps; Global Constraints + reuse list. ✓
- §8 optional labels → Tasks 2 (`optional` flags) + 6 (badge) + 8 (always advanceable). ✓
- Welcome interstitial → Tasks 2 (basics interstitial) + 14 (schoolLabel). ✓
- Completion unchanged → Task 11 + 14. ✓
- Editable copy in one place → Tasks 2 (sections.ts/questions.ts) + Global Constraints (no copy assertions). ✓
- Dev route mandate → Tasks 5/6/7/13 add previews; Task 15 sweeps. ✓
- Delete old + supersede step-tone → Task 14. ✓

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N"; every code step has complete code; the one conditional (computed-key cast in Task 12) gives the exact fallback. ✓

**3. Type consistency:** `FlowItem` uses `questionId` (string) consistently across flow.ts, the hook, and onboarding.tsx. `useQuestionFlow` field names (`item`, `question`, `section`, `progress`, `goNext/goBack/goToQuestion/canGoBack`) match every consumer (factory, bespoke questions, route). `QuestionShell` prop names match the factory + the three bespoke questions. `Mutations = ReturnType<typeof useProfileMutations>` matches the real bag (`saveProfile`, `savePrompts`, `uploadPhoto`, `removePhoto`, `reorderPhotos`, `savePrivateContact`, `complete`). `Tone` is owned by OnboardingBackground and imported by sections.ts. ✓

**Risk note for implementers:** the only place TypeScript may push back is the computed-key partial-update saves in Task 12 (`{ [field]: v }`); the task gives the exact narrow-cast fallback. Everything else uses concrete keys.
