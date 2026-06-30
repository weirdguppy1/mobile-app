# Discover + Profile — Production-Grade Design Pass

**Date:** 2026-06-30
**Status:** Approved (design)
**Surface:** Discovery feed (`src/app/(app)/(main)/discover.tsx`) + `ProfileView` (`src/features/profile/components/ProfileView.tsx`) and the components they compose.

---

## Goal

Make the Discover feed + Profile view **95% production-ready** so it becomes the *reference surface* the rest of the app is later leveled up to. The underlying engineering is already solid; the gap is **finish** — the surface reads "developer-built" rather than "designed."

Three deficiencies, confirmed by reading the code:

1. **Visual polish** — the feed never uses the mesh washes `DESIGN.md` §1 promises; vertical rhythm is a uniform `gap-6` stack with no hierarchy.
2. **Missing states** — loading is a bare `ActivityIndicator`; the error state is dead-end text claiming "pull to retry" with no retry attached. No skeletons exist anywhere in the app.
3. **Motion / delight** — `DESIGN.md` §motion (lines 156–180) is largely unimplemented: no haptics anywhere, skip has no exit motion, the like heart has no scale-pop.

**Non-goals (explicitly deferred to a follow-up spec):** viewport-rise entrance animations on photos/prompts; shared-element avatar→`/u/[id]` transition. Both are in `DESIGN.md` §motion but heavier; out of scope here.

---

## Design

Four parts. Parts A's primitives are intentionally generic — they are the leverage that later specs reuse to level up the rest of the app.

### Part A — Reusable primitives (`src/shared/`)

#### A1. `shared/lib/haptics.ts`
Semantic wrapper over `expo-haptics`. There are currently **zero** haptics in the app.

- **Interface:**
  - `tap()` → `Haptics.impactAsync(ImpactFeedbackStyle.Light)` — like-heart tap, skip.
  - `success()` → `Haptics.notificationAsync(NotificationFeedbackType.Success)` — request sent, match.
  - `select()` → `Haptics.selectionAsync()` — reserved for future toggles/pickers.
- **Behavior:** each call is fire-and-forget and wrapped so a rejected promise never throws into UI code (haptics are best-effort). No-op safe on devices/simulators without a Taptic engine.
- **Dependency:** add `expo-haptics` (Expo SDK package; install via `npx expo install expo-haptics`).

#### A2. `shared/components/Skeleton.tsx`
A shimmer placeholder primitive.

- **`Skeleton`** — props: `className`/style for size + radius. Renders a `bg-wash` block with a Reanimated **opacity loop** (≈0.5 → 1 → 0.5, ~1100ms, ease-in-out). Must respect reduce-motion: when `useReducedMotion()` is true, render a static `bg-wash` block (no animation).
- **`ProfileSkeleton`** — composes `Skeleton` to the real profile shape so the load is recognizable, not generic: a short title bar (name), a thin vitals line, a full-width `aspectRatio: 4/5` photo block, and one prompt-card-shaped block. Matches `ProfileView`'s `px-6 pt-4 gap-6` container so it occupies the same footprint.
- Lives in `shared/components/index.ts` barrel.

#### A3. `shared/components/ErrorState.tsx`
Recoverable error UI, replacing dead-end text.

- **Props:** `message: string`, `onRetry: () => void`, optional `retrying?: boolean`.
- **Renders:** a mono-weight `--ink` lucide icon (e.g. `WifiOff` / `CircleAlert`, 20–24px, per `DESIGN.md` icon rules), the message in `prose-subtitle`, and a **Retry** button (existing `Button` primitive / `button-primary`) that calls `onRetry`. Shows a spinner-in-button or disabled state while `retrying`.
- Centered layout, reused by Discover now and other screens later.

### Part B — Visual polish (`ProfileView`)

#### B1. Faint top hero wash
Lift the profile off the white stage without letting chrome compete with photos.

- A soft mesh bloom (reuse `MeshGradient.hero` + `MeshBase.hero` from `constants/theme.ts`) rendered as a **non-scrolling backdrop behind the name + vitals header**, dissolving into white *before the first photo*. Implemented with `experimental_backgroundImage` (the existing mechanism; no utility equivalent) on a `View` positioned at the top of the screen, sized to roughly the header band height, with the feed scrolling over/below it.
- Photos remain the loudest color on screen (`DESIGN.md` §1). The wash whispers — it is a hero lift, not a colored panel.
- Applies on **all three `ProfileView` usages** (Discover, `/u/[id]`, self-preview) since it's part of the shared component, which is correct — the hero header is universal.

#### B2. Intentional vertical rhythm
Replace the uniform `gap-6` stack in `ProfileView` with hierarchy:

- **Header group** (name / pronouns / vitals) stays tight (existing `gap-1`).
- **Generous gap** between the header/about block and the start of the photo+prompt feed.
- **Hairline divider + quiet `prose-label` section heading** (e.g. "More about me") before the detail sections (`buildDetailGroups`), so the lower info tables read as a distinct zone rather than more feed. Use `border-hairline`.
- Interests / deal-breaker chips keep their current grouping but sit in the "details" zone below the divider.

#### B3. Prompt-card + heart consistency
- Verify `ReadOnlyPromptCard` keeps its editorial weight (`font-display text-3xl`) and that the per-element heart placement (`absolute bottom-2 right-2`) is visually consistent between photos and prompt cards across both Discover and the full profile.
- No structural change expected — this is a consistency check, fix only if it drifts.

### Part C — States (`discover.tsx`)

- **C1. Loading** (`isLoading`, currently `discover.tsx:127`): render `ProfileSkeleton` instead of `ActivityIndicator`.
- **C2. Error** (`isError`, currently `discover.tsx:129`): render `ErrorState` with `onRetry={refetch}` and `retrying={isFetching}`. Remove the misleading static "pull to retry" text.
- **C3. Fetching next batch** (`isFetching` with no `current`, currently `discover.tsx:177`): render `ProfileSkeleton` instead of the second `ActivityIndicator`, so batch top-up matches first load.

### Part D — Motion (shipping `DESIGN.md` §motion)

- **D1. Like heart scale-pop** (`RequestHeart`): on press, the icon does an immediate lightweight scale-pop (Reanimated spring, e.g. 1 → ~1.18 → 1), fire a `haptics.tap()`, *then* open the sheet (`DESIGN.md` §motion line 158). `PressScale` already gives the press-down; this adds the deliberate pop on the *like* action specifically.
- **D2. Skip exit motion** (`discover.tsx` `onSkip`): the current profile **eases away** (fade to 0 + downward drift, ~250–300ms ease-out) before advancing, rather than vanishing instantly (`DESIGN.md` §motion line 160: "ease away rather than fling"). Fire `haptics.tap()` on skip. The existing `profileEnter` already handles the *next* profile's entrance — coordinate so exit completes (or overlaps gracefully) before/with the next mount. Keep the existing optimistic-skip + seen-filter logic intact; this is presentation only.
- **D3. Success haptic**: fire `haptics.success()` at the match/confirmation moment (the existing confetti burst). Wire at the point the match modal/burst triggers.

Reduce-motion: D1/D2 scale/drift animations fall back to instant (or a plain fade) when `useReducedMotion()` is true. Haptics are unaffected.

---

## Components touched / created

| File | Change |
|---|---|
| `src/shared/lib/haptics.ts` | **new** — semantic haptics wrapper |
| `src/shared/components/Skeleton.tsx` | **new** — `Skeleton` + `ProfileSkeleton` |
| `src/shared/components/ErrorState.tsx` | **new** — error + retry |
| `src/shared/components/index.ts` | export new components |
| `src/features/profile/components/ProfileView.tsx` | hero wash backdrop (B1), vertical rhythm + divider (B2) |
| `src/features/profile/components/ReadOnlyPromptCard.tsx` | consistency check only (B3) |
| `src/features/discovery/components/RequestHeart.tsx` | scale-pop + haptic on like (D1) |
| `src/app/(app)/(main)/discover.tsx` | skeleton load (C1/C3), `ErrorState` (C2), skip exit motion + haptics (D2), success haptic (D3) |
| `src/app/dev/components.tsx` | register `Skeleton`, `ProfileSkeleton`, `ErrorState` in the dev playground (per CLAUDE.md dev-route rule) |
| `package.json` | add `expo-haptics` |

## Testing

- **Type gate:** `tsc --noEmit` must pass (lint infra is broken per project memory; tsc is the gate).
- **Unit:** pure logic is unchanged, so no new logic tests required. If `ProfileSkeleton`/`ErrorState` get extracted helpers, add focused tests; otherwise these are presentational.
- **Manual (dev playground + Discover):** verify (1) loading shows `ProfileSkeleton`, (2) forced error shows `ErrorState` and Retry refetches, (3) like heart pops + haptic + sheet opens, (4) skip eases away + haptic, (5) hero wash renders and photos stay dominant, (6) reduce-motion disables shimmer/pop/drift but keeps haptics.

## Risks / notes

- **Hero wash on shared `ProfileView`** affects all three usages — intended, but verify the self-profile and `/u/[id]` headers still look right, not just Discover.
- **Skip exit + next enter coordination** is the trickiest piece — the existing iOS Modal-occlusion / `pendingAdvance` logic must not regress. Treat exit motion as additive presentation around the current advance flow.
- `expo-haptics` is a native module — requires a dev-client rebuild, not just a Metro reload.
- Mesh wash uses `experimental_backgroundImage` (already used in the codebase); confirm it composites correctly behind a `ScrollView` header band.
