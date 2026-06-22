# Onboarding Wizard Animation System — Design Spec

**Date:** 2026-06-22
**Branch:** `refactor/onboarding-animations`
**Source requirements:** `TASK.md` (animation spec) + `DESIGN.md` (visual system)

## Goal

Make the onboarding wizard feel like a guided spatial journey rather than a form:
smooth step-to-step transitions, gentle focus shifts, meaningful selection
feedback, and subtle emotional background changes. Animations that recur are
extracted into reusable components under `src/shared/components/animations/`
(per TASK.md's explicit mandate); onboarding-specific composites live in
`src/features/onboarding/components/`.

## Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Step-transition architecture | **Hoist chrome** | Persistent background + progress; only the question content slides. 9 step files stay untouched. |
| Background tone (§5) | **Subtle tint crossfade** | No mesh-gradient dependency; respects DESIGN.md white-stage discipline. |
| Blur in step entry (§1) | **`expo-blur`** | Real blur→sharp on the entering step. |
| Focus spotlight (§2) | **`expo-blur` scrim** | Blur everything except the focused field, fading in/out. |
| Confetti (§7) | **`react-native-fast-confetti`** | Skia-based; pulls in `@shopify/react-native-skia`. |

## New dependencies

Installed via `npx expo install` so versions match Expo SDK 56:

- `expo-blur` (~56.0.3)
- `@shopify/react-native-skia` (2.6.6) — peer dep of fast-confetti
- `react-native-fast-confetti` (2.0.0)

**Native rebuild required:** `expo-blur` and Skia are native modules. They need a
dev-client rebuild (`npx expo prebuild` + `expo run:ios` / `run:android`) to run
on device. TypeScript/JS verification (`tsc --noEmit`) works without the rebuild.

## Architecture: "hoist the chrome"

Today each step renders its own `StepShell` (background + progress + title +
footer) and the whole step remounts on navigation. We split chrome into a
**persistent** outer shell and a **transitioning** inner region:

```
OnboardingScreen (persistent shell, mounted once for the flow)
├── OnboardingBackground   ← absolute fill, crossfades tone           [persistent] §5
└── SafeAreaView (edges: top, bottom)
    ├── OnboardingProgress  ← smooth fill + anticipation              [persistent] §4
    └── StepTransition       ← directional slide + fade + blur entry  [swaps]      §1
        └── StepComponent → StepShell (slimmed: title + body + footer)
```

- `StepShell` loses its background + progress bar; keeps title + scroll body +
  footer. **The chrome hoist itself modifies no step files** — they still render
  `<StepShell>` unchanged. (The only place a step file may change is the §2
  spotlight's direct-child requirement for text inputs — see that section.)
- **Direction** (forward/back) is derived in `OnboardingScreen` from a
  `useRef` of the previous index — no store field needed. Resume-jumps
  (`firstIncompleteIndex`) read as "forward".
- The persistent background and progress read the current step from
  `useOnboarding()` directly, so they animate across index changes instead of
  remounting.

## Component inventory

### Shared animation primitives — `src/shared/components/animations/` (kebab-case)

All follow the existing `useResolveClassNames` → merge-into-`useAnimatedStyle`
idiom established by `fade-in.tsx` / `press-scale.tsx`.

| File | Export | TASK § | Behavior |
|---|---|---|---|
| `fade-in.tsx` *(exists)* | `FadeIn` | §2 | Reused for delayed helper/subtitle fade (150–250ms). |
| `step-transition.tsx` | `StepTransition` | §1 | Keyed `Animated.View` with custom directional `entering`/`exiting` worklets (slide + fade; spring forward, slightly slower timing back) + an `expo-blur` overlay whose intensity ramps to 0 on enter. |
| `focus-scale.tsx` | `FocusScale` | §2 | "Breathing-in" wrapper: scales children `0.98 → 1.0` (configurable) on mount with a soft spring. |
| `spotlight.tsx` | `SpotlightProvider`, `SpotlightScrim`, `useSpotlight` | §2 | Focus spotlight (see dedicated section). |
| `activate-ramp.tsx` | `ActivateRamp` | §6 | Fades + scales children in when an `active` prop flips `true` (Next button activating). |
| `check-pop.tsx` | `CheckPop` | §6 | A `lucide-react-native` `Check` that springs/fades in when `show` is `true`. |
| `confetti-burst.tsx` | `ConfettiBurst` | §7 | Thin wrapper over `react-native-fast-confetti` with brand colors + an `onComplete` callback. |

### Onboarding composites — `src/features/onboarding/components/` (PascalCase)

| File | Export | TASK § | Behavior |
|---|---|---|---|
| `OnboardingBackground.tsx` | `OnboardingBackground` | §5 | Two stacked absolute tint layers; crossfades opacity over 600–1000ms when the `tone` prop changes. |
| `OnboardingProgress.tsx` | `OnboardingProgress` | §4 | Segmented bar; smooth non-linear fill + a slight overshoot ("anticipation") on the newly-active segment. Feature-local (knows total/anticipation); the existing auth `ProgressBar` is left untouched to avoid cross-feature edits. |
| `CompletionCelebration.tsx` | `CompletionCelebration` | §7 | Mounts `ConfettiBurst`; on confetti completion, plays a soft upward lift + fade, then calls `onDone` to navigate. |

### Config — `src/features/onboarding/config/`

| File | Export | Behavior |
|---|---|---|
| `step-tone.ts` | `Tone`, `toneFor(stepId)` | Pure mapping `StepId → 'warm' \| 'cool' \| 'neutral'`. Unit-tested. |

## Feature details

### §1 Step-to-step transitions

`StepTransition` wraps the swapping step inside `OnboardingScreen`, keyed by
`step.id`. Custom Reanimated `entering`/`exiting` worklet factories take a
`direction`:

- **Forward:** current step slides left + fades out; next enters from the right
  with a spring (soft deceleration). An `expo-blur` overlay over the entering
  content ramps intensity high→0 (blur → sharp focus).
- **Back:** reversed (left → right) with slightly longer timing for a
  reflective feel.

Reanimated keeps the exiting view mounted through its exit animation, so the two
steps cross during the transition without a manual dual-mount.

### §2 Question focus

Three independent pieces:

1. **Breathing-in scale** — `FocusScale` wraps the step body; on mount the
   content settles `0.98 → 1.0`.
2. **Delayed helper text** — the `StepShell` subtitle uses `FadeIn delay={180}`.
3. **Focus spotlight** — see below.

### §2 Focus spotlight (most complex piece)

When a text field gains focus, blur everything in the step body *except* that
field; the blur fades in on focus and out on blur.

**Constraint:** `expo-blur`'s `BlurView` blurs whatever is drawn *behind* it in
the native view order. To keep the focused field sharp, it must be drawn **above**
the scrim, and `zIndex` only reorders siblings within one stacking parent.

**Design:**

- `SpotlightProvider` wraps the `StepShell` scroll content and owns a shared
  `progress` value + the currently-active field id (via context).
- `SpotlightScrim` is an absolute-fill `AnimatedBlurView` rendered **inside the
  same scroll content container** as the fields, at `zIndex: 1`,
  `pointerEvents="none"`, with intensity driven by `progress` (ease ~220ms).
- The spotlight-aware `TextField`, on focus, sets `progress → 1` and raises its
  own root `zIndex → 2` (above the scrim); on blur it reverses. Because the
  field and the scrim share the scroll-content stacking parent, the focused
  field stays sharp while siblings sit behind the blur.

**Requirement on text steps:** onboarding text inputs must render as direct
children of the `StepShell` body (using `TextField`'s own `label` prop) rather
than nested inside another positioned wrapper, so the `zIndex` elevation beats
the scrim. Steps with text inputs (e.g. Basics, Prompts) are checked and
adjusted if needed — this is the only place the spotlight touches step files.

**Platform notes:** iOS-correct via native draw order. Android uses
`experimentalBlurMethod="dimezisBlurView"`; if the punch-through is imperfect on
Android the subtle low intensity keeps it acceptable. Under reduced motion the
scrim is disabled entirely.

### §4 Progress indicator

`OnboardingProgress` renders one segment per step. The active segment fills with
a non-linear ease and a slight scale/opacity overshoot (anticipation) as it
becomes current. Because it lives in the persistent shell, it animates across
index changes rather than remounting.

### §5 Background context shifts

`OnboardingBackground` crossfades between two absolute tint layers when `tone`
changes (600–1000ms). Tints are very-low-opacity washes derived from DESIGN.md
`grad-*` bases over white (white-stage discipline). Mapping via `toneFor`:

- `compatibility` (sleep / living habits) → **cool**
- `lifestyle` → **warm** · `prompts` → **warm** · `review` → **warm**
- `basics`, `interests`, `dealBreakers`, `photos`, `extras` → **neutral**

### §6 Input confirmation feedback

In the slimmed `StepShell` footer:

- **Next button activation** — wrapped in `ActivateRamp`; when `canAdvance`
  flips `false → true` it fades + scales in.
- **Lock-in compress** — on Next press the body does a brief subtle scale-down
  pulse ("lock-in").
- **Check pop** — on a successful save (mutation resolved) the button briefly
  shows `CheckPop` (~220ms) before `goNext` fires the step transition.

### §7 Completion

- ReviewStep's "Finish" runs the existing finish mutation. On success it sets a
  new `celebrating` flag in the onboarding store.
- `OnboardingScreen` renders `CompletionCelebration` as an overlay while
  `celebrating` and **suppresses the immediate `/discover` redirect**.
- `CompletionCelebration` fires `ConfettiBurst`; on confetti completion it plays
  a soft upward lift + fade, then calls `router.replace('/discover')`.

## Modified files

- `src/features/onboarding/components/StepShell.tsx` — slimmed (remove bg +
  progress); add delayed subtitle `FadeIn`, `FocusScale` body, `SpotlightProvider`
  + `SpotlightScrim` around content, footer `ActivateRamp` + lock-in + `CheckPop`.
- `src/app/(app)/onboarding.tsx` — persistent shell (background + progress +
  `StepTransition`), direction tracking, celebration gating.
- `src/features/onboarding/store/onboarding-store.ts` — add `celebrating` +
  setter.
- `src/features/onboarding/steps/ReviewStep.tsx` — set `celebrating` on finish
  success (instead of relying solely on the redirect effect).
- `src/shared/components/text-field.tsx` — optional spotlight awareness
  (`useSpotlight`, focus/blur elevation).
- `src/shared/components/index.ts` — export new primitives.
- `src/app/dev/components.tsx` — add an **Animations** category demoing every new
  component (CLAUDE.md dev-playground sync requirement).
- `package.json` — new dependencies.

## Accessibility

Respect Reanimated's `useReducedMotion()`: transitions degrade to opacity-only
(no slide/blur/scale), the focus scrim is disabled, and the completion lift is
skipped. Confetti still fires (brief, non-essential) but can be minimized.

## Testing & verification

- **TDD the pure logic:** `toneFor` mapping (and any direction/reduced-motion
  helper that gets extracted) with the existing Jest setup.
- **Visual verification:** the dev playground Animations category + running the
  onboarding flow.
- **Gate:** `tsc --noEmit` (lint infra is known-broken). Existing
  `onboarding-progress.test.ts` must stay green.

## Out of scope

- No changes to the auth `ProgressBar`, the match-moment confetti, or any step's
  form/validation logic beyond the spotlight direct-child requirement.
- No mesh-gradient rendering (subtle tint only).
```

