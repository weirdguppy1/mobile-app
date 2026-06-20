# Auth UI refactor + utility-class design system

**Date:** 2026-06-18
**Branch:** `feature/auth`
**Status:** Design — awaiting review

## Problem

The auth surface repeats the same long Uniwind class strings across screens
(`font-display text-[40px] leading-10.5 tracking-[-1.4px] text-ink`, the slate
subtitle string, the ink pill button, the field-label string). The sign-up
screen holds its entire multi-step flow in one file with local `useState`. The
sign-up header (back chevron + progress bar) collides with the iPhone status
bar / notch because it only clears the safe inset by 2px (`pt-safe-offset-2`).

## Goals

1. Replace repeated class strings with a small set of **custom Tailwind utility
   classes** defined in `src/global.css` (`@utility`), covering typography
   ("prose") roles and bundled component looks (button, card, dropdown, input).
2. Use **Tailwind's default font-size steps** (`text-sm`, `text-base`,
   `text-4xl`…) inside those utilities — **no arbitrary `text-[40px]` sizes**.
3. Wrap screen content in **`<SafeAreaView>`** on **sign-up** (and the new dev
   screens) while keeping backgrounds **edge-to-edge**; fix the
   progress-bar/notch collision. **Welcome and home keep their className
   insets** — no SafeAreaView.
4. Split the sign-up flow into **per-step components** with shared state in a
   feature-scoped **Zustand** store + an async hook.
5. Create the CLAUDE.md-mandated **`/app/dev`** route group (dev-only) and
   register the new utilities/screens.

## Non-goals

- **No new shared React components** (no `Screen`/`Button` wrappers). The
  original "new shared components" ask is intentionally replaced by utility
  classes per updated direction. Existing `TextField`, `PressScale`, `FadeIn`
  stay and adopt the new classes.
- No SafeAreaView change to the **home or welcome** screens (both keep their
  `pt-safe` / `pb-safe-offset-*` className insets, per direction). Only sign-up
  and the new dev screens use SafeAreaView.
- No test-runner introduction (none is configured); verification is typecheck +
  bundle + visual check in `/app/dev`.
- No backend/api/schema changes; `sendSignupOtp` / `verifySignupOtp` are reused
  as-is.

## Approach chosen (from brainstorming)

- Type system: **scale + role utilities**, expressed with Tailwind **default
  sizes**.
- Scope: **whole current surface** (sign-up, welcome, home, all auth
  components).
- Dev route: **build it now**, kept simple.

## Design

### 1. Utility classes — `src/global.css`

Defined as `@utility` blocks alongside the existing `shadow-card`, composed with
`@apply` over existing/default utilities so they are guaranteed to compile to
the same RN styles the codebase already uses. Tracking snaps to the default
`tracking-tight` / `tracking-tighter` tokens. Line-heights come from the default
size steps.

**Typography ("prose") roles** — bundle font family, default size, line-height,
tracking; roles with a fixed weight/color bake those in, otherwise color/weight
compose at the call site:

| class | `@apply` | replaces (at) |
|---|---|---|
| `prose-display` | `font-display text-5xl tracking-tighter` | welcome hero (52→48), home title (48) |
| `prose-title` | `font-display text-4xl tracking-tight` | sign-up step titles (40→36) |
| `prose-subtitle` | `font-primary text-base font-medium tracking-tight text-slate` | lead paragraph (×4) |
| `prose-body` | `font-primary text-base tracking-tight` | neutral body |
| `prose-label` | `font-primary text-xs font-semibold tracking-tight text-graphite` | field labels |
| `prose-button` | `font-primary text-base font-bold tracking-tight` | CTA label (color composes) |
| `prose-footnote` | `font-primary text-sm tracking-tight` | helper / error / link (color composes) |
| `prose-caption` | `font-primary text-xs font-semibold tracking-tight` | meta / summary label (color composes) |

**Component looks:**

| class | `@apply` | replaces (at) |
|---|---|---|
| `button-primary` | `h-14 items-center justify-center rounded-full bg-ink` | sign-up `Cta`, welcome CTA, home sign-out |
| `button-ghost` | `items-center justify-center py-1.5` | "I already have an account", "Resend code" |
| `card` | `rounded-xl border border-silver bg-canvas` | review summary card, combobox panel |
| `dropdown` | `absolute left-0 right-0 max-h-70 overflow-hidden rounded-xl border border-silver bg-canvas` | combobox results (composes `shadow-card`) |
| `field-input` | `h-12 rounded-lg border px-4 font-primary text-base text-ink bg-canvas` | `TextField` input base |

Notes:
- `border-continuous` (iOS continuous corner curve) and `shadow-card` stay
  composed at call sites next to `card`/`dropdown` — they are single-token
  utilities and keep these blocks portable.
- The OTP cell look is used once; it stays inline rather than becoming a class.
- Button text color stays on the child `<Text>` (`prose-button text-canvas` /
  `text-ink`) since RN text color can't be inherited from the container.
  `disabled` opacity (`opacity-[0.35]`) composes at the call site.

**New theme tokens** (in `@theme`), to kill ad-hoc rgba overlays:

```css
--color-hairline: rgba(0, 0, 0, 0.06);   /* dividers → bg-hairline */
--color-wash: rgba(0, 0, 0, 0.04);        /* pressed rows → active:bg-wash */
```

> **Risk / first step:** this codebase's `global.css` has not used `@utility +
> @apply` before (only raw-CSS `@utility`). The first implementation task is a
> spike: define one `prose-*` and one component class, render them in
> `/app/dev`, and confirm they compile to the expected RN styles. If `@apply`
> isn't supported by this Uniwind build, fall back to raw CSS declarations
> inside `@utility` (the property set used here is RN-mappable). Decide before
> writing all classes.

### 2. SafeAreaView pattern (edge-to-edge preserved)

`SafeAreaProvider` is already mounted at the root. Per screen, the background
view stays full-bleed and only content is inset:

```tsx
<View className="flex-1 bg-canvas">
  <StatusBar style="dark" />
  <MeshGradient variant="hero" className="absolute inset-0" pointerEvents="none" /> {/* welcome */}
  <SafeAreaView className="flex-1 px-6" edges={['top', 'bottom']}>
    {/* content */}
  </SafeAreaView>
</View>
```

- **sign-up**: this replaces the `pt-safe-offset-2 pb-safe-offset-4` content
  wrapper; the header row now starts below the notch, fixing the progress-bar
  collision. `KeyboardAvoidingView` stays inside the `SafeAreaView`.
- **welcome**: safe-area handling unchanged (keeps `pt-safe` /
  `pb-safe-offset-5`); only class strings + a `__DEV__` affordance change.
- **home**: unchanged (keeps className insets).

### 3. Sign-up flow: split + Zustand

**Store** — `src/features/auth/store/sign-up-store.ts` (client state only, per
CLAUDE.md "onboarding progress"):

```ts
type Step = 'campus' | 'email' | 'review';
type Phase = 'form' | 'sending' | 'verify' | 'verifying';

interface SignUpState {
  step: Step;
  phase: Phase;
  university: string | null;
  email: string;
  code: string;
  emailError: string | null;
  otpError: string | null;
  submitError: string | null;
  // setters: setUniversity, setEmail, setCode, set*Error, setPhase, setStep
  // nav: next(), back(), reset()
}
```

**Hook** — `src/features/auth/hooks/use-sign-up.ts`: async orchestration
(`createAccount`, `verify`, `resend`) calling `features/auth/api.ts`, flipping
`phase`/errors in the store. Keeps server calls out of Zustand state.

**Step components** — `src/features/auth/components/steps/`:
`campus-step.tsx`, `email-step.tsx`, `review-step.tsx`, `verify-step.tsx`. Each
renders only its content (title + subtitle + field) and reads/writes the store.
`SummaryRow` moves into `review-step.tsx`.

**Orchestrator** — `src/features/auth/screens/sign-up-screen.tsx`: shrinks to
background + `SafeAreaView` + back button + `ProgressBar` + keyed `FadeIn`
active step + footer CTA. CTA label/enabled derive from `step` + `phase`;
`sending`/`verifying` still render `LoadingOverlay`. Behavior is identical to
today.

**Data flow:** step components ↔ store (sync); hook ↔ api.ts (async);
orchestrator reads store to pick step + drive the CTA.

### 4. `/app/dev` route group (simple)

- `src/app/dev/_layout.tsx` — `if (!__DEV__) return <Redirect href="/" />`, else
  a `Stack`.
- `src/app/dev/index.tsx` — menu linking to Components / Screens.
- `src/app/dev/components.tsx` — live samples by category: **Typography**
  (`prose-*`), **Buttons** (`button-primary`/`button-ghost`), **Inputs**
  (`TextField` states, `OtpInput`), **Surfaces** (`card`, `dropdown`,
  `shadow-card`), **Feedback** (`ProgressBar`, `LoadingOverlay`), **Motion**
  (`FadeIn`, `PressScale`).
- `src/app/dev/screens.tsx` — previews of welcome, the four sign-up steps
  (mock store values), and home.
- `src/app/_layout.tsx` — register `<Stack.Screen name="dev" />` (always
  declared; the layout itself gates on `__DEV__`).
- `src/features/welcome/welcome-screen.tsx` — a small `__DEV__`-only affordance
  routing to `/dev`.

CLAUDE.md upkeep rule: this PR registers the new utility classes (Typography +
Surfaces + Buttons + Inputs pages) and the new/relocated screens; future
component/screen changes must update these pages too.

## Error / empty / loading

Preserved exactly: `LoadingOverlay` during `sending`/`verifying`; inline errors
become `prose-footnote text-pass`; combobox empty/"not listed" states unchanged.

## Files

**New:** `features/auth/store/sign-up-store.ts`,
`features/auth/hooks/use-sign-up.ts`,
`features/auth/components/steps/{campus,email,review,verify}-step.tsx`,
`app/dev/_layout.tsx`, `app/dev/index.tsx`, `app/dev/components.tsx`,
`app/dev/screens.tsx`.

**Edited:** `src/global.css`,
`features/auth/screens/sign-up-screen.tsx`,
`features/auth/components/{otp-input,progress-bar,university-combobox,loading-overlay}.tsx`,
`shared/components/text-field.tsx`,
`features/welcome/welcome-screen.tsx`, `app/(app)/home.tsx`,
`app/_layout.tsx`.

**Unchanged:** `shared/components/index.ts` (no new shared components),
`features/auth/api.ts`, `features/auth/schema.ts`.

## Verification

1. Spike: confirm `@utility + @apply` compiles (see Risk note) before bulk work.
2. `npx tsc --noEmit` clean (type safety is the top CLAUDE.md priority).
3. App bundles; each utility/screen checked in `/app/dev`.
4. Manual: sign-up steps advance, OTP verifies, back button + notch spacing
   correct, welcome/home unchanged visually beyond the intentional size snaps.

## Git

All work on `feature/auth` (not `main`). Commit the spec, then implement.
