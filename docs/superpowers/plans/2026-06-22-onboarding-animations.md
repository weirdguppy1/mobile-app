# Onboarding Wizard Animation System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable Reanimated animation system to the onboarding wizard — directional step transitions, a focus spotlight, animated progress, tonal background crossfades, input-confirmation feedback, and a completion celebration.

**Architecture:** "Hoist the chrome": `OnboardingScreen` becomes a persistent shell owning the animated background + progress; the swapping step content is wrapped in a directional `StepTransition`. `StepShell` is slimmed to title + body + footer. Recurring animations are extracted to `src/shared/components/animations/`; onboarding-specific composites to `src/features/onboarding/components/`.

**Tech Stack:** React Native 0.85 · Expo SDK 56 · TypeScript · react-native-reanimated 4.3.1 · expo-blur · @shopify/react-native-skia · react-native-fast-confetti · uniwind · lucide-react-native · zustand

## Global Constraints

Every task implicitly includes these (verbatim from the spec / CLAUDE.md / project memory):

- **Branch:** work only on `refactor/onboarding-animations`. NEVER commit to `main`.
- **TypeScript:** never `any`, never `@ts-ignore`. Explicit `interface` for object shapes.
- **Verification gate:** `npx tsc --noEmit` must pass. `npm run lint` is known-broken (no eslint config) — do NOT rely on it.
- **Animation idiom:** new animated components follow the existing pattern — motion via `useAnimatedStyle`/`useAnimatedProps`, and any `className` resolved with `useResolveClassNames(className ?? '')` from `uniwind` and merged into the style array (see `src/shared/components/animations/fade-in.tsx`).
- **Reduced motion:** every animation respects `useReducedMotion()` from reanimated — degrade to opacity-only / instant, disable the focus blur scrim, skip the completion lift.
- **File naming:** shared animation primitives are kebab-case under `src/shared/components/animations/`; onboarding feature components are PascalCase under `src/features/onboarding/components/`.
- **Imports:** use `@/...` path aliases; group React / RN / third-party / `@/` / relative with blank lines.
- **Design tokens:** action color is `--ink` `#000000`; canvas `#ffffff`; semantic `--yes` `#31c431`, `--maybe` `#ffae00`. Gradient washes stay very low-opacity over white (white-stage discipline).
- **Commit trailer:** end every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## File structure

**Create (shared primitives, kebab-case):**
- `src/shared/components/animations/step-transition.tsx` — `StepTransition` (§1)
- `src/shared/components/animations/focus-scale.tsx` — `FocusScale` (§2)
- `src/shared/components/animations/spotlight.tsx` — `SpotlightProvider`, `SpotlightScrim`, `useSpotlight` (§2)
- `src/shared/components/animations/activate-ramp.tsx` — `ActivateRamp` (§6)
- `src/shared/components/animations/check-pop.tsx` — `CheckPop` (§6)
- `src/shared/components/animations/confetti-burst.tsx` — `ConfettiBurst` (§7)

**Create (onboarding composites, PascalCase):**
- `src/features/onboarding/components/OnboardingBackground.tsx` — tonal crossfade (§5)
- `src/features/onboarding/components/OnboardingProgress.tsx` — animated progress (§4)
- `src/features/onboarding/components/CompletionCelebration.tsx` — confetti overlay (§7)

**Create (config + tests):**
- `src/features/onboarding/config/step-tone.ts` — `Tone`, `toneFor` (§5)
- `src/features/onboarding/__tests__/step-tone.test.ts`
- `src/features/onboarding/__tests__/onboarding-store.test.ts`

**Modify:**
- `src/shared/components/index.ts` — export new primitives
- `src/shared/components/text-field.tsx` — spotlight awareness (§2)
- `src/features/onboarding/store/onboarding-store.ts` — `celebrating` flag (§7)
- `src/features/onboarding/components/StepShell.tsx` — slimmed + §2/§6 wiring
- `src/features/onboarding/steps/ReviewStep.tsx` — set `celebrating` on finish (§7)
- `src/app/(app)/_layout.tsx` — keep onboarding route mounted while `celebrating` so the confetti can finish (§7)
- `src/app/(app)/onboarding.tsx` — persistent shell + direction + celebration gating (§1/§4/§5/§7)
- `src/app/dev/components.tsx` — Animations playground section (CLAUDE.md requirement)
- `package.json` — new dependencies

---

## Task 1: Install native dependencies

**Files:**
- Modify: `package.json` (+ lockfile) via `npx expo install`

**Interfaces:**
- Produces: `expo-blur` (`BlurView`), `react-native-fast-confetti` (`Confetti`), `@shopify/react-native-skia` available to import.

- [ ] **Step 1: Install the three packages with Expo's version resolver**

Run:
```bash
npx expo install expo-blur @shopify/react-native-skia react-native-fast-confetti
```
Expected: adds `expo-blur@~56.0.x`, `@shopify/react-native-skia@2.x`, `react-native-fast-confetti@2.x` to `package.json`.

- [ ] **Step 2: Verify the packages resolve and types are present**

Run:
```bash
node -e "require.resolve('expo-blur'); require.resolve('react-native-fast-confetti'); require.resolve('@shopify/react-native-skia'); console.log('ok')"
```
Expected: prints `ok`.

- [ ] **Step 3: Confirm TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors (no source uses the packages yet).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-blur, skia & fast-confetti for onboarding animations

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> **Note for executor:** `expo-blur` and Skia are native modules. They require a dev-client rebuild (`npx expo prebuild && npx expo run:ios`) to run on device. All tasks below verify with `tsc` only; on-device verification happens after a rebuild.

---

## Task 2: `step-tone` config (TDD)

**Files:**
- Create: `src/features/onboarding/config/step-tone.ts`
- Test: `src/features/onboarding/__tests__/step-tone.test.ts`

**Interfaces:**
- Consumes: `StepId` from `src/features/onboarding/config/steps.ts`.
- Produces: `export type Tone = 'warm' | 'cool' | 'neutral'` and `export function toneFor(stepId: StepId): Tone`.

- [ ] **Step 1: Write the failing test**

Create `src/features/onboarding/__tests__/step-tone.test.ts`:
```ts
import { toneFor } from '@/features/onboarding/config/step-tone';

describe('toneFor', () => {
  it('maps sleep/living-habits to cool', () => {
    expect(toneFor('compatibility')).toBe('cool');
  });

  it('maps lifestyle, prompts and review to warm', () => {
    expect(toneFor('lifestyle')).toBe('warm');
    expect(toneFor('prompts')).toBe('warm');
    expect(toneFor('review')).toBe('warm');
  });

  it('maps the remaining steps to neutral', () => {
    expect(toneFor('basics')).toBe('neutral');
    expect(toneFor('interests')).toBe('neutral');
    expect(toneFor('dealBreakers')).toBe('neutral');
    expect(toneFor('photos')).toBe('neutral');
    expect(toneFor('extras')).toBe('neutral');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/onboarding/__tests__/step-tone.test.ts`
Expected: FAIL — cannot find module `step-tone`.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/onboarding/config/step-tone.ts`:
```ts
import { type StepId } from '@/features/onboarding/config/steps';

/** Emotional background tone per onboarding category (TASK.md §5). */
export type Tone = 'warm' | 'cool' | 'neutral';

const TONE_BY_STEP: Record<StepId, Tone> = {
  basics: 'neutral',
  compatibility: 'cool', // sleep / living habits
  lifestyle: 'warm',
  interests: 'neutral',
  dealBreakers: 'neutral',
  prompts: 'warm', // expressive / personality
  photos: 'neutral',
  extras: 'neutral',
  review: 'warm', // celebratory lead-in to completion
};

export function toneFor(stepId: StepId): Tone {
  return TONE_BY_STEP[stepId];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/onboarding/__tests__/step-tone.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/features/onboarding/config/step-tone.ts src/features/onboarding/__tests__/step-tone.test.ts
git commit -m "feat(onboarding): step->tone mapping for background shifts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `FocusScale` primitive (§2 breathing-in)

**Files:**
- Create: `src/shared/components/animations/focus-scale.tsx`
- Modify: `src/shared/components/index.ts`

**Interfaces:**
- Produces: `export function FocusScale(props: ViewProps & { from?: number; to?: number })`. Scales children `from`→`to` on mount with a soft spring; respects reduced motion.

- [ ] **Step 1: Write the component**

Create `src/shared/components/animations/focus-scale.tsx`:
```tsx
import { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

interface FocusScaleProps extends ViewProps {
  /** Starting scale on mount. */
  from?: number;
  /** Resting scale. */
  to?: number;
}

/**
 * A subtle "breathing-in" entrance: children settle from `from` to `to` on
 * mount. Used to draw the eye to the active question (TASK.md §2).
 */
export function FocusScale({ className, from = 0.98, to = 1, style, children, ...rest }: FocusScaleProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withSpring(1, { damping: 18, stiffness: 180 });
  }, [progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: from + (to - from) * progress.value }],
  }));

  const resolved = useResolveClassNames(className ?? '');

  return (
    <Animated.View style={[resolved, style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
```

- [ ] **Step 2: Export it**

In `src/shared/components/index.ts`, add (keep alphabetical-ish grouping with the other animations export):
```ts
export { FocusScale } from './animations/focus-scale';
```

- [ ] **Step 3: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/shared/components/animations/focus-scale.tsx src/shared/components/index.ts
git commit -m "feat(shared): FocusScale breathing-in animation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `ActivateRamp` primitive (§6 button activation)

**Files:**
- Create: `src/shared/components/animations/activate-ramp.tsx`
- Modify: `src/shared/components/index.ts`

**Interfaces:**
- Produces: `export function ActivateRamp(props: ViewProps & { active: boolean })`. When `active` flips true, children ramp opacity `0.5→1` and scale `0.98→1`.

- [ ] **Step 1: Write the component**

Create `src/shared/components/animations/activate-ramp.tsx`:
```tsx
import { type ReactNode } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

interface ActivateRampProps extends ViewProps {
  /** When true, children ramp in to full opacity + scale. */
  active: boolean;
  children: ReactNode;
}

/**
 * Ramps children in (opacity + scale) when `active` becomes true — used to make
 * the Next button feel like it "activates" once a step is valid (TASK.md §6).
 */
export function ActivateRamp({ active, className, style, children, ...rest }: ActivateRampProps) {
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) {
      return { opacity: active ? 1 : 0.5, transform: [{ scale: 1 }] };
    }
    return {
      opacity: withTiming(active ? 1 : 0.5, { duration: 220 }),
      transform: [{ scale: withSpring(active ? 1 : 0.98, { damping: 16, stiffness: 220 }) }],
    };
  });

  const resolved = useResolveClassNames(className ?? '');

  return (
    <Animated.View style={[resolved, style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
```

- [ ] **Step 2: Export it**

In `src/shared/components/index.ts`, add:
```ts
export { ActivateRamp } from './animations/activate-ramp';
```

- [ ] **Step 3: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/shared/components/animations/activate-ramp.tsx src/shared/components/index.ts
git commit -m "feat(shared): ActivateRamp activation animation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `CheckPop` primitive (§6 confirmation icon)

**Files:**
- Create: `src/shared/components/animations/check-pop.tsx`
- Modify: `src/shared/components/index.ts`

**Interfaces:**
- Produces: `export function CheckPop(props: { show: boolean; size?: number; color?: string })`. A lucide `Check` that springs/fades in when `show` is true.

- [ ] **Step 1: Write the component**

Create `src/shared/components/animations/check-pop.tsx`:
```tsx
import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface CheckPopProps {
  /** When true, the checkmark pops in; when false, it fades out. */
  show: boolean;
  size?: number;
  color?: string;
}

/**
 * A checkmark that springs in to confirm an accepted input (TASK.md §6).
 * Default color is ink — DESIGN.md reserves green (`--yes`) for like/match
 * interactions only, so a confirmation check must NOT be green. Callers on a
 * dark surface pass `color="#ffffff"`.
 */
export function CheckPop({ show, size = 18, color = '#000000' }: CheckPopProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = show ? 1 : 0;
      return;
    }
    progress.value = show
      ? withSpring(1, { damping: 12, stiffness: 260 })
      : withTiming(0, { duration: 120 });
  }, [show, progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Check size={size} color={color} strokeWidth={3} />
    </Animated.View>
  );
}
```

- [ ] **Step 2: Export it**

In `src/shared/components/index.ts`, add:
```ts
export { CheckPop } from './animations/check-pop';
```

- [ ] **Step 3: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/shared/components/animations/check-pop.tsx src/shared/components/index.ts
git commit -m "feat(shared): CheckPop confirmation icon

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `StepTransition` primitive (§1 directional slide + blur)

**Files:**
- Create: `src/shared/components/animations/step-transition.tsx`
- Modify: `src/shared/components/index.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export function StepTransition(props: { transitionKey: string; direction: 'forward' | 'back'; children: ReactNode })`. Re-key per step so entering/exiting fire on navigation.

- [ ] **Step 1: Write the component**

Create `src/shared/components/animations/step-transition.tsx`:
```tsx
import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type EntryExitAnimationFunction,
  type LayoutAnimationStaticContext,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const DISTANCE = 64;
const BLUR_MAX = 18;

type Direction = 'forward' | 'back';
type CustomAnim = EntryExitAnimationFunction & LayoutAnimationStaticContext;

function makeEnter(direction: Direction, reduced: boolean): CustomAnim {
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    if (reduced) {
      return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: 160 }) } };
    }
    const sign = direction === 'forward' ? 1 : -1;
    const duration = direction === 'forward' ? 320 : 380;
    return {
      initialValues: { opacity: 0, transform: [{ translateX: sign * DISTANCE }] },
      animations: {
        opacity: withTiming(1, { duration }),
        transform: [{ translateX: withSpring(0, { damping: 20, stiffness: 170 }) }],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepEnter' });
}

function makeExit(direction: Direction, reduced: boolean): CustomAnim {
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    if (reduced) {
      return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 120 }) } };
    }
    const sign = direction === 'forward' ? -1 : 1;
    const duration = direction === 'forward' ? 280 : 340;
    return {
      initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
      animations: {
        opacity: withTiming(0, { duration }),
        transform: [{ translateX: withTiming(sign * DISTANCE, { duration, easing: Easing.in(Easing.cubic) }) }],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepExit' });
}

/** Blur overlay that ramps from blurred to sharp on mount (TASK.md §1). */
function EntryBlur() {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: 360 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({ intensity: progress.value * BLUR_MAX }));

  return (
    <AnimatedBlurView
      pointerEvents="none"
      tint="light"
      experimentalBlurMethod="dimezisBlurView"
      style={StyleSheet.absoluteFill}
      animatedProps={animatedProps}
    />
  );
}

interface StepTransitionProps {
  /** Re-key per step so entering/exiting animations fire on navigation. */
  transitionKey: string;
  direction: Direction;
  children: ReactNode;
}

/**
 * Directional step transition: the outgoing step slides + fades away while the
 * incoming step enters from the opposite side and resolves from blurred to
 * sharp. Back navigation reverses direction with slightly slower timing
 * (TASK.md §1). Reanimated keeps the exiting view mounted through its exit, so
 * the two steps cross without a manual dual-mount.
 */
export function StepTransition({ transitionKey, direction, children }: StepTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        key={transitionKey}
        entering={makeEnter(direction, reduced)}
        exiting={makeExit(direction, reduced)}
        style={StyleSheet.absoluteFill}>
        {children}
        {!reduced ? <EntryBlur /> : null}
      </Animated.View>
    </View>
  );
}
```

- [ ] **Step 2: Export it**

In `src/shared/components/index.ts`, add:
```ts
export { StepTransition } from './animations/step-transition';
```

- [ ] **Step 3: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/shared/components/animations/step-transition.tsx src/shared/components/index.ts
git commit -m "feat(shared): StepTransition directional slide + blur

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `Spotlight` primitives (§2 focus spotlight)

**Files:**
- Create: `src/shared/components/animations/spotlight.tsx`
- Modify: `src/shared/components/index.ts`

**Interfaces:**
- Produces:
  - `export function SpotlightProvider(props: { children: ReactNode })`
  - `export function SpotlightScrim()` — the blur overlay (renders inside the scroll content, `zIndex: 1`)
  - `export function useSpotlight(): SpotlightContextValue | null` where
    `interface SpotlightContextValue { progress: SharedValue<number>; activeId: string | null; focus: (id: string) => void; blur: (id: string) => void }`
- Contract: a consumer (the focused field) must raise its own root `zIndex` to `2` so it draws above the scrim; the scrim must be the **last** child of the scroll content container so it paints over the unfocused siblings.

- [ ] **Step 1: Write the component**

Create `src/shared/components/animations/spotlight.tsx`:
```tsx
import { BlurView } from 'expo-blur';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const SCRIM_BLUR_MAX = 14;

interface SpotlightContextValue {
  /** 0 = no blur, 1 = full scrim blur. */
  progress: SharedValue<number>;
  activeId: string | null;
  focus: (id: string) => void;
  blur: (id: string) => void;
}

const SpotlightContext = createContext<SpotlightContextValue | null>(null);

/** Returns the spotlight controls, or null when used outside a provider. */
export function useSpotlight(): SpotlightContextValue | null {
  return useContext(SpotlightContext);
}

/**
 * Coordinates the focus spotlight (TASK.md §2): when a field focuses, the scrim
 * blur fades in over the step body; the focused field elevates above it.
 */
export function SpotlightProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const focus = useCallback(
    (id: string) => {
      setActiveId(id);
      progress.value = reduced ? 0 : withTiming(1, { duration: 220 });
    },
    [progress, reduced],
  );

  const blur = useCallback(
    (id: string) => {
      setActiveId((current) => (current === id ? null : current));
      progress.value = withTiming(0, { duration: 220 });
    },
    [progress],
  );

  const value = useMemo<SpotlightContextValue>(
    () => ({ progress, activeId, focus, blur }),
    [progress, activeId, focus, blur],
  );

  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
}

/**
 * The blur layer. Render it as the LAST child of the scroll content container so
 * it paints over unfocused siblings; the focused field raises its zIndex above
 * it. Disabled under reduced motion.
 */
export function SpotlightScrim() {
  const ctx = useSpotlight();
  const reduced = useReducedMotion();

  const animatedProps = useAnimatedProps(() => ({
    intensity: (ctx?.progress.value ?? 0) * SCRIM_BLUR_MAX,
  }));

  if (!ctx || reduced) return null;

  return (
    <AnimatedBlurView
      pointerEvents="none"
      tint="light"
      experimentalBlurMethod="dimezisBlurView"
      style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
      animatedProps={animatedProps}
    />
  );
}
```

- [ ] **Step 2: Export it**

In `src/shared/components/index.ts`, add:
```ts
export { SpotlightProvider, SpotlightScrim, useSpotlight } from './animations/spotlight';
```

- [ ] **Step 3: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/shared/components/animations/spotlight.tsx src/shared/components/index.ts
git commit -m "feat(shared): Spotlight focus-blur provider & scrim

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `TextField` spotlight awareness (§2)

**Files:**
- Modify: `src/shared/components/text-field.tsx`

**Interfaces:**
- Consumes: `useSpotlight` from Task 7.
- Behavior: on focus, register with the spotlight and raise the field root's `zIndex` to 2 (sharp above the scrim); on blur, reverse. No-op when rendered outside a `SpotlightProvider` (e.g. auth, dev gallery).

- [ ] **Step 1: Replace the file contents**

Overwrite `src/shared/components/text-field.tsx`:
```tsx
import { forwardRef, useId, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { Brand } from "@/constants/theme";

import { useSpotlight } from "./animations/spotlight";

interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Validation/help message shown under the field. Red when `invalid`. */
  message?: string;
  invalid?: boolean;
}

/**
 * Monochrome form input per DESIGN.md: silver hairline border, 8px radius, label
 * above in graphite, ink border on focus (no colored ring).
 *
 * When rendered inside a SpotlightProvider, focusing the field fades a blur
 * scrim over the rest of the step and elevates this field above it (TASK.md §2).
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, message, invalid, className, onFocus, onBlur, ...rest }, ref) {
    const spotlight = useSpotlight();
    const id = useId();
    const [focused, setFocused] = useState(false);

    return (
      <View className="gap-2" style={{ zIndex: focused ? 2 : 0 }}>
        {label ? <Text className="prose-label">{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={Brand.fog}
          onFocus={(e) => {
            setFocused(true);
            spotlight?.focus(id);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            spotlight?.blur(id);
            onBlur?.(e);
          }}
          className={`field-input border-continuous  ${
            invalid ? "border-pass" : "border-silver focus:border-ink"
          } ${className ?? ""}`}
          {...rest}
        />
        {message ? (
          <Text
            className={`prose-footnote ${invalid ? "text-pass" : "text-slate"}`}
          >
            {message}
          </Text>
        ) : null}
      </View>
    );
  },
);
```

- [ ] **Step 2: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/shared/components/text-field.tsx
git commit -m "feat(shared): TextField spotlight focus elevation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: `ConfettiBurst` primitive (§7)

**Files:**
- Create: `src/shared/components/animations/confetti-burst.tsx`
- Modify: `src/shared/components/index.ts`

**Interfaces:**
- Consumes: `Confetti` from `react-native-fast-confetti` (Task 1).
- Produces: `export function ConfettiBurst(props: { onComplete?: () => void })`. A one-shot full-screen burst with brand colors; calls `onComplete` when it finishes.

- [ ] **Step 1: Write the component**

Create `src/shared/components/animations/confetti-burst.tsx`:
```tsx
import { Confetti } from 'react-native-fast-confetti';

interface ConfettiBurstProps {
  /** Fired once when the one-shot burst finishes. */
  onComplete?: () => void;
}

// Brand confetti: ink + the grad-warm/cool wash hues from DESIGN.md. Avoids the
// reserved semantic colors (--yes green / --maybe amber belong to like/match).
const CONFETTI_COLORS = ['#000000', '#f8c4ff', '#96c4ff', '#ffd6e8', '#e0c3fc', '#ffe0c2'];

/**
 * A single celebratory confetti burst (TASK.md §7). One-shot (`infinite={false}`)
 * and self-positioning (falls back to screen dimensions). Skia-backed via
 * react-native-fast-confetti.
 */
export function ConfettiBurst({ onComplete }: ConfettiBurstProps) {
  return (
    <Confetti
      autoplay
      infinite={false}
      fadeOutOnEnd
      count={200}
      colors={CONFETTI_COLORS}
      onAnimationEnd={onComplete}
    />
  );
}
```

- [ ] **Step 2: Export it**

In `src/shared/components/index.ts`, add:
```ts
export { ConfettiBurst } from './animations/confetti-burst';
```

- [ ] **Step 3: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/shared/components/animations/confetti-burst.tsx src/shared/components/index.ts
git commit -m "feat(shared): ConfettiBurst completion confetti

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: `OnboardingBackground` (§5 tonal crossfade)

**Files:**
- Create: `src/features/onboarding/components/OnboardingBackground.tsx`

**Interfaces:**
- Consumes: `Tone` from `step-tone.ts` (Task 2).
- Produces: `export function OnboardingBackground(props: { tone: Tone })`. Absolute-fill white canvas with a tint layer that crossfades when `tone` changes (~800ms).

- [ ] **Step 1: Write the component**

Create `src/features/onboarding/components/OnboardingBackground.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { type Tone } from '@/features/onboarding/config/step-tone';

// Very low-opacity washes over white (DESIGN.md white-stage discipline).
const TINTS: Record<Tone, string> = {
  warm: 'rgba(251,230,242,0.55)', // grad-warm base #fbe6f2
  cool: 'rgba(214,228,255,0.50)', // periwinkle
  neutral: 'rgba(255,255,255,0)', // pure canvas
};

/**
 * Persistent onboarding background that crossfades its tint by category to give
 * the flow an emotional through-line (TASK.md §5).
 */
export function OnboardingBackground({ tone }: { tone: Tone }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(1);
  const [colors, setColors] = useState({ from: TINTS[tone], to: TINTS[tone] });

  useEffect(() => {
    setColors((current) => ({ from: current.to, to: TINTS[tone] }));
    progress.value = 0;
    progress.value = withTiming(1, { duration: reduced ? 0 : 800, easing: Easing.inOut(Easing.quad) });
  }, [tone, progress, reduced]);

  const tintStyle = useAnimatedStyle(
    () => ({ backgroundColor: interpolateColor(progress.value, [0, 1], [colors.from, colors.to]) }),
    [colors],
  );

  return (
    <View style={StyleSheet.absoluteFill} className="bg-canvas">
      <Animated.View style={[StyleSheet.absoluteFill, tintStyle]} />
    </View>
  );
}
```

- [ ] **Step 2: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/features/onboarding/components/OnboardingBackground.tsx
git commit -m "feat(onboarding): OnboardingBackground tonal crossfade

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: `OnboardingProgress` (§4 animated progress)

**Files:**
- Create: `src/features/onboarding/components/OnboardingProgress.tsx`

**Interfaces:**
- Produces: `export function OnboardingProgress(props: { current: number; total: number })` where `current` is the 1-based count of filled segments. Each segment fills left-to-right with a non-linear ease; the newly-filled segment gets a slight scaleY anticipation pop.

- [ ] **Step 1: Write the component**

Create `src/features/onboarding/components/OnboardingProgress.tsx`:
```tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

interface OnboardingProgressProps {
  /** 1-based count of filled segments (current step number). */
  current: number;
  total: number;
}

/**
 * Wizard progress bar with a smooth (non-linear) fill and a slight anticipation
 * pop on the segment that just became current (TASK.md §4). Persistent across
 * step changes — it animates rather than remounting.
 */
export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  return (
    <View className="flex-row gap-1.5" accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Segment key={i} filled={i < current} anticipate={i === current - 1} />
      ))}
    </View>
  );
}

function Segment({ filled, anticipate }: { filled: boolean; anticipate: boolean }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(filled ? 1 : 0);
  const pop = useSharedValue(1);
  const fill = useResolveClassNames('absolute inset-0 rounded-full bg-ink');

  useEffect(() => {
    if (reduced) {
      progress.value = filled ? 1 : 0;
      return;
    }
    progress.value = withTiming(filled ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
    if (filled && anticipate) {
      pop.value = withSequence(
        withTiming(1.35, { duration: 160, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 12, stiffness: 240 }),
      );
    }
  }, [filled, anticipate, progress, pop, reduced]);

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: pop.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scaleX: progress.value }] }));

  return (
    <Animated.View style={containerStyle} className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.08)]">
      <Animated.View style={[fill, { transformOrigin: '0% 50%' }, fillStyle]} />
    </Animated.View>
  );
}
```

- [ ] **Step 2: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/features/onboarding/components/OnboardingProgress.tsx
git commit -m "feat(onboarding): OnboardingProgress animated fill + anticipation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: `CompletionCelebration` (§7 confetti overlay)

**Files:**
- Create: `src/features/onboarding/components/CompletionCelebration.tsx`

**Interfaces:**
- Consumes: `ConfettiBurst` (Task 9), `FadeIn` (existing).
- Produces: `export function CompletionCelebration(props: { onComplete: () => void })`. A full-screen overlay (pointerEvents none) that shows a confetti burst + a centered "You're all set!" headline, and calls `onComplete` when the confetti finishes. The screen-level lift/fade is handled by the caller (Task 14).

- [ ] **Step 1: Write the component**

Create `src/features/onboarding/components/CompletionCelebration.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';

import { ConfettiBurst, FadeIn } from '@/shared/components';

interface CompletionCelebrationProps {
  /** Fired when the confetti burst finishes (caller then transitions away). */
  onComplete: () => void;
}

/**
 * Completion overlay (TASK.md §7): a confetti burst over a brief congratulatory
 * headline. Calls `onComplete` once the confetti finishes so the caller can
 * lift + fade into the next screen.
 */
export function CompletionCelebration({ onComplete }: CompletionCelebrationProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
      <FadeIn delay={120}>
        <Text className="prose-display text-center text-ink">You're all set!</Text>
      </FadeIn>
      <ConfettiBurst onComplete={onComplete} />
    </View>
  );
}
```

> **Note:** `prose-display` (defined in `src/global.css`) already applies the display/moment font via `font-display` — do NOT add `font-secondary` (it is not a defined utility in this project).

- [ ] **Step 2: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/features/onboarding/components/CompletionCelebration.tsx
git commit -m "feat(onboarding): CompletionCelebration confetti overlay

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: `celebrating` store flag (TDD)

**Files:**
- Modify: `src/features/onboarding/store/onboarding-store.ts`
- Test: `src/features/onboarding/__tests__/onboarding-store.test.ts`

**Interfaces:**
- Produces: `celebrating: boolean` (default `false`) and `setCelebrating: (v: boolean) => void` on the store.

- [ ] **Step 1: Write the failing test**

Create `src/features/onboarding/__tests__/onboarding-store.test.ts`:
```ts
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';

describe('onboarding store', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ index: 0, celebrating: false });
  });

  it('defaults celebrating to false', () => {
    expect(useOnboardingStore.getState().celebrating).toBe(false);
  });

  it('setCelebrating toggles the flag', () => {
    useOnboardingStore.getState().setCelebrating(true);
    expect(useOnboardingStore.getState().celebrating).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/onboarding/__tests__/onboarding-store.test.ts`
Expected: FAIL — `setCelebrating` is not a function / `celebrating` undefined.

- [ ] **Step 3: Update the store**

Overwrite `src/features/onboarding/store/onboarding-store.ts`:
```ts
import { create } from 'zustand';

interface OnboardingState {
  index: number;
  setIndex: (index: number) => void;
  /** True while the completion celebration plays (suppresses the auto-redirect). */
  celebrating: boolean;
  setCelebrating: (celebrating: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  index: 0,
  setIndex: (index) => set({ index }),
  celebrating: false,
  setCelebrating: (celebrating) => set({ celebrating }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/onboarding/__tests__/onboarding-store.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/features/onboarding/store/onboarding-store.ts src/features/onboarding/__tests__/onboarding-store.test.ts
git commit -m "feat(onboarding): celebrating flag in store

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Slim `StepShell` + wire §2/§6

**Files:**
- Modify: `src/features/onboarding/components/StepShell.tsx`

**Interfaces:**
- Consumes: `SpotlightProvider`, `SpotlightScrim`, `FocusScale`, `ActivateRamp`, `CheckPop`, `FadeIn`, `Button` (all from `@/shared/components`); `useOnboarding`.
- Behavior change: `StepShell` no longer renders the background or progress bar (moved to the screen in Task 15) or its own `SafeAreaView`. It renders title + delayed subtitle + spotlighted scrolling body (with breathing-in scale + lock-in compress) + footer (activation ramp + confirmation check).
- Public props are UNCHANGED: `{ children, canAdvance, onNext, saving?, nextLabel? }` — so the 9 step files need no edits.

- [ ] **Step 1: Replace the file contents**

Overwrite `src/features/onboarding/components/StepShell.tsx`:
```tsx
import { type ReactNode, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import {
  ActivateRamp,
  Button,
  CheckPop,
  FadeIn,
  FocusScale,
  SpotlightProvider,
  SpotlightScrim,
} from '@/shared/components';

interface StepShellProps {
  children: ReactNode;
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  nextLabel?: string;
}

/** Shared chrome for every wizard step: title, body, footer nav. Background and
 *  progress are owned by the persistent shell in OnboardingScreen. */
export function StepShell({ children, canAdvance, onNext, saving, nextLabel = 'Next' }: StepShellProps) {
  const { step, goBack, skip, canGoBack } = useOnboarding();
  const reduced = useReducedMotion();
  const [confirming, setConfirming] = useState(false);
  const compress = useSharedValue(1);

  const handleNext = () => {
    if (!canAdvance) return;
    if (!reduced) {
      compress.value = withSequence(
        withTiming(0.99, { duration: 90 }),
        withSpring(1, { damping: 16, stiffness: 240 }),
      );
    }
    setConfirming(true);
    onNext();
  };

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: compress.value }] }));

  return (
    <SpotlightProvider>
      <View className="flex-1">
        <View className="gap-1.5 px-6 pt-2">
          <Text className="prose-title text-ink">{step.title}</Text>
          <FadeIn delay={180}>
            <Text className="prose-subtitle">{step.subtitle}</Text>
          </FadeIn>
        </View>

        <FocusScale className="flex-1">
          <Animated.View className="flex-1" style={bodyStyle}>
            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-4 px-6 py-6"
              keyboardShouldPersistTaps="handled">
              {children}
              <SpotlightScrim />
            </ScrollView>
          </Animated.View>
        </FocusScale>

        <View className="gap-2 px-6 pb-2">
          <View>
            <ActivateRamp active={canAdvance}>
              <Button variant="primary" onPress={handleNext} disabled={!canAdvance} loading={saving}>
                {nextLabel}
              </Button>
            </ActivateRamp>
            <View pointerEvents="none" className="absolute right-3 top-3">
              <CheckPop show={confirming} color="#ffffff" />
            </View>
          </View>
          <View className="flex-row justify-between">
            {canGoBack ? (
              <Button variant="ghost" onPress={goBack}>Back</Button>
            ) : <View />}
            {step.skippable ? (
              <Button variant="ghost" onPress={skip}>Skip</Button>
            ) : <View />}
          </View>
        </View>
      </View>
    </SpotlightProvider>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run existing onboarding tests (regression)**

Run: `npx jest src/features/onboarding`
Expected: PASS (step-tone, onboarding-store, onboarding-progress).

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/components/StepShell.tsx
git commit -m "feat(onboarding): slim StepShell + spotlight, focus-scale & confirm feedback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Persistent shell in `OnboardingScreen` + `ReviewStep` celebration + gate

**Files:**
- Modify: `src/app/(app)/onboarding.tsx`
- Modify: `src/app/(app)/_layout.tsx`
- Modify: `src/features/onboarding/steps/ReviewStep.tsx`

**Interfaces:**
- Consumes: `OnboardingBackground` (Task 10), `OnboardingProgress` (Task 11), `CompletionCelebration` (Task 12), `StepTransition` (Task 6), `toneFor` (Task 2), `useOnboardingStore` `celebrating`/`setCelebrating` (Task 13).
- Behavior: `OnboardingScreen` renders the persistent background + progress + a wrapped, lift-on-exit content area; the step content is wrapped in `StepTransition`. Direction is derived from a previous-index ref. The auto-redirect to `/discover` is suppressed while `celebrating`; the celebration's `onComplete` lifts + fades the screen, then navigates. `ReviewStep.onFinish` sets `celebrating` on success.
- **Integration constraint (critical):** `(app)/_layout.tsx` gates the onboarding route with `<Stack.Protected guard={!complete}>`. When `complete` mutation flips `onboarding_complete` to true, the gate would unmount the onboarding route — and the celebration overlay inside it — before the confetti finishes. The gate must treat the user as still-in-onboarding while `celebrating`. And `ReviewStep` must set `celebrating` BEFORE awaiting the mutation, so the flag is already set when the refetched `onboarding_complete=true` lands.

- [ ] **Step 1: Replace the OnboardingScreen contents**

Overwrite `src/app/(app)/onboarding.tsx`:
```tsx
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CompletionCelebration } from '@/features/onboarding/components/CompletionCelebration';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
import { STEP_COMPONENTS } from '@/features/onboarding/config/step-components';
import { STEPS } from '@/features/onboarding/config/steps';
import { toneFor } from '@/features/onboarding/config/step-tone';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { firstIncompleteIndex } from '@/features/onboarding/lib/onboarding-progress';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { StepTransition } from '@/shared/components';

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, index, data, isLoading, isError, setIndex } = useOnboarding();
  const celebrating = useOnboardingStore((s) => s.celebrating);
  const setCelebrating = useOnboardingStore((s) => s.setCelebrating);
  const reduced = useReducedMotion();

  // Direction for the step transition: forward when the index grows.
  const prevIndex = useRef(index);
  const direction: 'forward' | 'back' = index >= prevIndex.current ? 'forward' : 'back';
  useEffect(() => {
    prevIndex.current = index;
  }, [index]);

  // Screen-level lift + fade played after the confetti, before navigating.
  const exit = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -exit.value * 40 }],
  }));

  const goToApp = () => {
    setCelebrating(false);
    router.replace('/discover');
  };

  const handleCelebrationDone = () => {
    if (reduced) {
      goToApp();
      return;
    }
    exit.value = withTiming(1, { duration: 480, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(goToApp)();
    });
  };

  // Resume to the first incomplete step once per fresh data load.
  useEffect(() => {
    if (data) setIndex(firstIncompleteIndex(STEPS, data));
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

  const StepComponent = STEP_COMPONENTS[step.id];

  return (
    <View className="flex-1">
      <OnboardingBackground tone={toneFor(step.id)} />
      <Animated.View className="flex-1" style={contentStyle}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View className="px-6 pt-4">
            <OnboardingProgress current={index + 1} total={STEPS.length} />
          </View>
          <View className="flex-1">
            <StepTransition transitionKey={step.id} direction={direction}>
              <StepComponent />
            </StepTransition>
          </View>
        </SafeAreaView>
      </Animated.View>
      {celebrating ? <CompletionCelebration onComplete={handleCelebrationDone} /> : null}
    </View>
  );
}
```

- [ ] **Step 2: Set `celebrating` on finish in ReviewStep**

In `src/features/onboarding/steps/ReviewStep.tsx`:

Add the store import after the existing imports block:
```tsx
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
```

Read the setter inside the component, right after the existing `const { complete } = useProfileMutations();` line:
```tsx
  const setCelebrating = useOnboardingStore((s) => s.setCelebrating);
```

Replace the existing `onFinish` with:
```tsx
  const onFinish = async () => {
    if (!completion.success) return;
    // Set celebrating BEFORE the mutation: when complete() invalidates the
    // profile query and onboarding_complete flips true, the (app) layout gate
    // must already see celebrating=true or it unmounts this screen (and the
    // confetti) immediately. OnboardingScreen handles the redirect once the
    // confetti + lift finish.
    setCelebrating(true);
    try {
      await complete.mutateAsync();
    } catch (error) {
      setCelebrating(false);
      throw error;
    }
  };
```

- [ ] **Step 3: Keep the onboarding route mounted during the celebration**

In `src/app/(app)/_layout.tsx`, add the store import after the existing `useOnboardingData` import:
```tsx
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
```

Read the flag inside `AppLayout`, right after the `const { data, isLoading } = useOnboardingData();` line:
```tsx
  const celebrating = useOnboardingStore((s) => s.celebrating);
```

Replace the `const complete = ...` line with one that treats the user as still
in onboarding while the celebration plays:
```tsx
  // Stay in onboarding while the completion celebration plays, so its confetti
  // overlay (rendered inside the onboarding screen) isn't torn down early.
  const complete = (data?.profile.onboarding_complete ?? false) && !celebrating;
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run onboarding tests (regression)**

Run: `npx jest src/features/onboarding`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/onboarding.tsx" "src/app/(app)/_layout.tsx" src/features/onboarding/steps/ReviewStep.tsx
git commit -m "feat(onboarding): persistent animated shell + completion celebration

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Dev playground — Animations section

**Files:**
- Modify: `src/app/dev/components.tsx`

**Interfaces:**
- Consumes: all new shared primitives. Demonstrates each so the playground stays in sync (CLAUDE.md requirement).

- [ ] **Step 1: Extend the imports**

In `src/app/dev/components.tsx`, replace the existing `@/shared/components` import line with:
```tsx
import {
  ActivateRamp, Button, CheckPop, ConfettiBurst, FadeIn, Field, FocusScale,
  OptionGroup, PhotoGrid, PressScale, ScaleInput, SpotlightProvider, SpotlightScrim,
  TagInput, TextField,
} from '@/shared/components';
```
And add the onboarding progress import (feature component, separate line group):
```tsx
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
```

- [ ] **Step 2: Add local state for the new demos**

Inside `ComponentsGallery`, after the existing `const [tags, setTags] = useState<string[]>([]);` line, add:
```tsx
  const [active, setActive] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
```

- [ ] **Step 3: Add the Animations section**

In `src/app/dev/components.tsx`, immediately after the existing `<Section title="Motion">…</Section>` block, add:
```tsx
          <Section title="Animations — FocusScale">
            <FocusScale className="card border-continuous px-4 py-4">
              <Text className="prose-body text-ink">Breathing-in on mount</Text>
            </FocusScale>
          </Section>

          <Section title="Animations — ActivateRamp / CheckPop">
            <PressScale className="button-ghost" onPress={() => setActive((v) => !v)}>
              <Text className="prose-footnote font-medium text-graphite">Toggle active: {String(active)}</Text>
            </PressScale>
            <ActivateRamp active={active}>
              <View className="button-primary">
                <Text className="prose-button text-canvas">Ramps in when active</Text>
              </View>
            </ActivateRamp>
            <PressScale className="button-ghost" onPress={() => setConfirmed((v) => !v)}>
              <Text className="prose-footnote font-medium text-graphite">Toggle check</Text>
            </PressScale>
            <CheckPop show={confirmed} />
          </Section>

          <Section title="Animations — OnboardingProgress">
            <OnboardingProgress current={2} total={5} />
          </Section>

          <Section title="Animations — Spotlight (focus a field)">
            <SpotlightProvider>
              <View className="gap-3">
                <TextField label="Focus me — others blur" placeholder="tap to focus" />
                <TextField label="Sibling field" placeholder="blurs while the other is focused" />
                <SpotlightScrim />
              </View>
            </SpotlightProvider>
          </Section>

          <Section title="Animations — Confetti">
            <PressScale className="button-primary" onPress={() => setConfettiOn(true)}>
              <Text className="prose-button text-canvas">Fire confetti</Text>
            </PressScale>
            {confettiOn ? <ConfettiBurst onComplete={() => setConfettiOn(false)} /> : null}
          </Section>
```

> **Executor note:** `StepTransition` and `CompletionCelebration` are flow-level compositions, awkward to demo in isolation; they are exercised by running the onboarding flow itself. The section above covers every standalone primitive.

- [ ] **Step 4: Typecheck & commit**

```bash
npx tsc --noEmit
git add src/app/dev/components.tsx
git commit -m "docs(dev): showcase onboarding animation primitives

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full onboarding test suite**

Run: `npx jest src/features/onboarding`
Expected: all PASS (step-tone, onboarding-store, onboarding-progress).

- [ ] **Step 3: On-device smoke test (requires dev-client rebuild)**

Run:
```bash
npx expo prebuild
npx expo run:ios
```
Then walk the onboarding flow and confirm, against `TASK.md`:
- §1 forward/back step slide + blur-to-sharp; back is slightly slower.
- §2 a focused text field stays sharp while the rest blurs; fades out on blur; body breathes in on each step.
- §4 progress fills smoothly with a pop on the new segment.
- §5 background tone shifts (cool on living-habits, warm on lifestyle/prompts/review).
- §6 Next button ramps in when valid; lock-in compress + check on advance.
- §7 finishing fires confetti, then lifts + fades into `/discover`.
- Enable iOS "Reduce Motion" and confirm transitions degrade to fades and the spotlight blur is off.

> If §1/§2 blur looks wrong on Android specifically, that is the documented `expo-blur` Android caveat — the low intensity keeps it acceptable; do not block on it.

---

## Self-review (completed during planning)

**Spec coverage:** §1 → Task 6 (+15 wiring); §2 → Tasks 3,7,8 (+14 wiring); §4 → Task 11 (+15); §5 → Tasks 2,10 (+15); §6 → Tasks 4,5 (+14); §7 → Tasks 9,12,13 (+15). Dev-playground sync → Task 16. Dependencies → Task 1. All TASK.md sections map to tasks.

**Type consistency:** `Tone`/`toneFor` (Task 2) consumed in 10 & 15. `useSpotlight`/`SpotlightProvider`/`SpotlightScrim` (Task 7) consumed in 8 & 14. `ConfettiBurst` (Task 9) consumed in 12. `celebrating`/`setCelebrating` (Task 13) consumed in 15. `StepTransition({transitionKey,direction,children})` (Task 6) consumed in 15. `OnboardingProgress({current,total})` (Task 11) consumed in 15 & 16. `StepShell` public props unchanged → 9 step files untouched except ReviewStep's finish handler.

**Placeholder scan:** no TBD/TODO; every code step contains complete source.
