# Onboarding Wizard — Design Spec

**Date:** 2026-06-21
**Branch:** `feature/user-setup`
**Status:** Approved design, pending spec review

---

## 1. Context & scope

TASK.md asks for a 9-step onboarding wizard and states that the primitives,
constants, validation, and mutations "are already implemented." **They are not
present in this repository.** Verified inventory:

**Exists & reused as-is**
- `TextField`, `PressScale`, `FadeIn` (`src/shared/components/`)
- `ProgressBar`, `OtpInput`, `LoadingOverlay` (`src/features/auth/components/`)
- Design system in `src/global.css` (`prose-*`, `button-primary`, `button-ghost`,
  `card`, `field-input`, `icon`, `shadow-card`, color tokens)
- Auth flow + session gating in `src/app/_layout.tsx`; `(app)/home.tsx` placeholder
- Full DB schema `supabase/migrations/0001_profiles.sql` (every onboarding column +
  `CHECK` constraints, plus `profile_photos`, `profile_prompts`, `private_contacts`)

**Built from scratch in this work**
- Primitives: `Button`, `Field`, `OptionGroup`, `ScaleInput`, `PhotoGrid`
- `src/types/database.ts` (typed Supabase client)
- Profile domain: `constants.ts`, `schema.ts`, `api.ts`, query/mutation hooks
- Onboarding feature: steps config, shell, 9 steps, orchestration hook, store
- Routing: onboarding gate, `/onboarding` host screen, `/discover` landing
- Storage migration `0002_profile_photos_storage.sql`
- TanStack Query + RHF wiring; dev-playground registration

**Confirmed decisions (from user):**
1. Build everything from scratch.
2. Photos: real upload via `expo-image-picker` + Supabase Storage.
3. Stack: install TanStack Query + React Hook Form + Zod per CLAUDE.md.
4. Primitives styled with Tailwind utility classes only (new `@utility` entries in
   `global.css` for repeated patterns; no `StyleSheet` unless a lib requires it).
5. All work on the current branch `feature/user-setup` (no new branch).

---

## 2. Architecture

### 2.1 Source of truth = the database

The `profiles` / `profile_photos` / `profile_prompts` rows are the persistence
layer. Each step's data is saved to Supabase as the user advances. Resume is
re-fetching the profile and computing the first incomplete step. No second local
draft store to keep in sync.

> Alternative rejected: a persisted Zustand draft + single final submit. It
> duplicates state, complicates "save after each step," and risks drift.

### 2.2 Layering (data access stays out of UI)

```
features/profile/
  constants.ts                 option lists ({value,label}) mirroring DB CHECKs
  schema.ts                    Zod: per-step schemas + onboardingCompletionSchema
  types.ts                     Profile, ProfilePhoto, ProfilePrompt (z.infer / Database)
  api.ts                       raw typed Supabase calls (no React)
  hooks/
    use-profile.ts             useQuery: profile + photos + prompts
    use-profile-mutations.ts   useMutation wrappers; invalidate on success

features/onboarding/
  config/steps.ts              STEPS array (id, title, subtitle, Component, skippable, isComplete)
  store/onboarding-store.ts    Zustand: current step index only (transient UI)
  hooks/use-onboarding.ts      orchestration: resume index, next/back/skip, complete
  components/StepShell.tsx     progress + title + scroll body + footer (Back/Next/Skip)
  steps/                       BasicsStep … ReviewStep (presentation only)
```

The wizard calls hooks; it never calls Supabase directly.

### 2.3 New dependencies

`@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`,
`expo-image-picker`. `QueryClientProvider` added in `src/app/_layout.tsx`;
`src/lib/query-client.ts` holds the client.

### 2.4 Supabase typing

`src/lib/supabase.ts` is currently untyped. Add a hand-authored
`src/types/database.ts` (`supabase gen types` needs live creds unavailable here)
covering `profiles`, `profile_photos`, `profile_prompts`, `private_contacts`, and
apply `createClient<Database>`. Auth code uses only `supabase.auth.*`, so typing
`.from()` does not break it.

---

## 3. Reusable primitives → `src/shared/components/`

Generic (reusable in future profile-editing), styled **only** with Tailwind
utility classes. Repeated visual patterns become named `@utility` entries in
`global.css` (e.g. `option-chip`, `scale-segment`, `photo-slot`).

| Primitive | Purpose | Key props |
|---|---|---|
| `Button` | wraps `PressScale`; `button-primary`/`button-ghost`; loading + disabled | `variant`, `loading`, `disabled`, `onPress`, `children` |
| `Field` | labeled wrapper (label, "optional" tag, error) for any control | `label`, `optional`, `error`, `children` |
| `OptionGroup` | single- or multi-select chips from a value/label list | `options`, `value`, `onChange`, `multiple`, `min`, `max`, `columns` |
| `ScaleInput` | 1–5 segmented selector | `value`, `onChange`, `min=1`, `max=5`, `lowLabel`, `highLabel` |
| `PhotoGrid` | add / remove / reorder slots; primary = position 0; per-slot error+retry | `photos`, `onAdd`, `onRemove`, `onReorder`, `max=6` |
| `TagInput` | free-text array entry: type + add → removable chips, capped | `value`, `onChange`, `max`, `placeholder` |

- `Button` exposes `disabled`/`loading`; `StepShell` drives Next from these.
- `OptionGroup` enforces `min`/`max` visually (block selecting past `max`; surface
  count). It is the single control for all **fixed-vocabulary** steps — no hardcoded lists.
- `ScaleInput` backs `cleanliness` and `social_level` (smallint 1–5).
- `TagInput` backs the free-text `text[]` fields that have **no DB vocabulary**:
  `majors` (1–3) and `clubs` (≤10). It is a 6th primitive (beyond the 5 named in
  TASK.md) because the pattern recurs twice — justified by the "extract shared
  components when a pattern appears more than once" criterion.
- All exported from `src/shared/components/index.ts`.

---

## 4. Constants & validation → `src/features/profile/`

### 4.1 `constants.ts`

Every option list as `{ value, label }[]`, values matching DB `CHECK`
constraints exactly:

- Compatibility: `sleepSchedule`, `bedtime`, `wakeupTime`, `noisePreference`,
  `studyStyle`, `guestsFrequency`, `roomTemperature` (+ `cleanliness`,
  `socialLevel` are 1–5 scales).
- Lifestyle: `alcohol`, `smoking`, `parties`, `fitness`.
- Identity: `sexAssignedAtBirth` (`female`/`male`/`intersex`).
- `interests` (16-value vocabulary), `dealBreakers` (6-value vocabulary).
- `prompts` (the 8 suggested prompts from the schema comment).
- Graduation years 2024–2035.

### 4.2 `schema.ts`

- One Zod schema per step for Next-gating.
- `onboardingCompletionSchema` enforcing the hard completion rules: first name,
  graduation year, ≥1 major, all 9 compatibility fields, 5–10 interests, ≥1
  prompt, ≥1 photo. Used to guard the final "Finish" action.

---

## 5. Wizard shell & steps → `src/features/onboarding/`

### 5.1 `config/steps.ts`

A `STEPS` array of `{ id, title, subtitle, Component, skippable?, isComplete(data) }`.
Adding / removing / reordering a step means editing this array only (meets
"minimal code changes" acceptance criterion). `isComplete` predicates drive both
the resume calculation and the Review jump-to-edit links.

Order: Basics → Compatibility → Lifestyle → Interests → Deal-breakers → Prompts →
Photos → Extras (skippable) → Review.

### 5.2 `components/StepShell.tsx`

Shared shell used by every step:
- `ProgressBar current={index+1} total={STEPS.length}` (reused from auth).
- Title + subtitle (`prose-*`).
- Scrollable body (`children`).
- Footer: `Button` Back (ghost) / Next (primary) + optional Skip (ghost) for
  `skippable` steps.
- Next disabled until the step's Zod check passes; shows saving spinner during the
  mutation.

### 5.3 `hooks/use-onboarding.ts`

Orchestration:
- Reads `useProfile()` (profile + photos + prompts).
- Computes the resume index = first step whose `isComplete(data)` is false.
- `next()`: validate current step → call the relevant mutation → on success
  advance the store index. `back()`: decrement only (data already saved → no
  loss). `skip()`: advance without saving (Extras). `complete()`: validate against
  `onboardingCompletionSchema` → `completeOnboarding()` → `router.replace('/discover')`.

### 5.4 Steps (presentation only)

- **Basics** — RHF + zodResolver. First name, pronouns (optional), grad year
  (`OptionGroup`, 2024–2035), majors (`TagInput`, 1–3), gender identity (optional),
  sex assigned at birth (optional `OptionGroup`). School shown read-only from
  `profile.university` / `school_domain` (derived from email at signup; not editable).
- **Compatibility** — `OptionGroup` + `ScaleInput`; all 9 fields required.
- **Lifestyle** — `OptionGroup` (alcohol, smoking, parties, fitness).
- **Interests** — `OptionGroup multiple min=5 max=10` with a live count.
- **Deal-breakers** — `OptionGroup multiple` (no min).
- **Prompts** — pick 1–3 prompts from `constants.prompts`; RHF answer per pick.
- **Photos** — `PhotoGrid`; ≥1 required; real upload (see §7).
- **Extras** (skippable) — dorm, living program, clubs (`TagInput`, ≤10),
  instagram, linkedin, phone. Phone labeled **private — shared only after
  matching**; saved to `private_contacts`, not `profiles`.
- **Review** — preview of all answers; each section links back to its step for
  edits; Finish button runs `complete()`.

### 5.5 `store/onboarding-store.ts`

Zustand holding only `currentIndex` + `setIndex`/`next`/`back`. All real data is
server state via TanStack Query.

---

## 6. Routing & access control

Declarative `Stack.Protected` (per CLAUDE.md), driven by the `onboarding_complete`
value from `useProfile()` inside `(app)/_layout.tsx`:

```
src/app/(app)/
  _layout.tsx        query profile; while loading → null (splash stays)
                     guard !complete  → mount "onboarding" only
                     guard  complete  → mount "(main)" only
  onboarding.tsx     route /onboarding — host screen rendering the current step
  (main)/
    _layout.tsx      Stack; initial route = discover
    discover.tsx     route /discover — placeholder landing
    home.tsx         existing screen moved here
```

- **Incomplete users:** main routes (discover/matches/messages/profile) are
  unmounted → onboarding is the only reachable screen → blocks all core app
  functionality (access-control requirement).
- **Completed user visiting `/onboarding`:** the screen is not in the navigator →
  resolves into `(main)` → `/discover`.
- **On finish:** `completeOnboarding` invalidates the profile query → guard flips →
  `router.replace('/discover')`.

---

## 7. Photos (real upload)

- `expo-image-picker` to select an image.
- Upload bytes to the `profile-photos` Storage bucket; insert a `profile_photos`
  row (`url` = storage path, `position` = next index). Primary = position 0.
- New migration `0002_profile_photos_storage.sql` creates the bucket + storage RLS
  policies (owner can insert/update/delete own objects; the existing
  `delete_photo_object` trigger in 0001 already assumes this bucket).
- Reorder via move-left / move-right arrows (reliable, no gesture complexity);
  drag-and-drop noted as a future enhancement.
- Upload failure → the slot shows an error state with a **Retry** button.
- Removing the final photo is allowed in the grid, but Next is gated (≥1) and the
  user sees the validation message.

---

## 8. Reuse hygiene, dev playground, verification

- Update `src/app/dev/components.tsx` to register `Button`, `Field`, `OptionGroup`,
  `ScaleInput`, `PhotoGrid`, `TagInput`; update `src/app/dev/screens.tsx` with
  `/onboarding` + `/discover` live links plus isolated step previews where they
  render without a live profile query (steps needing query data are shown via the
  live link). Follows the CLAUDE.md dev-route rule.
- No duplicated onboarding-specific primitives — all controls come from
  `src/shared/components` + `OptionGroup` fed by `constants.ts`.
- Verification gate: `npx tsc --noEmit` (project lint infra is broken).

---

## 9. Acceptance-criteria mapping

| Requirement | Mechanism |
|---|---|
| Progress saved & resumable | DB source of truth; save on each Next |
| Resume to first incomplete step | `isComplete` predicates in `use-onboarding` |
| Prefill completed answers | RHF `defaultValues` / control values from `useProfile` |
| Each step validates before advancing | per-step Zod in `StepShell` |
| Cannot complete without required fields | `onboardingCompletionSchema` on Finish |
| Interest 5–10 / prompt 1–3 / photo 1–6 limits | `OptionGroup` min/max; PhotoGrid max; schema |
| Removing final photo handled | grid allows; Next gated ≥1 |
| Upload failure retry | per-slot error + Retry in `PhotoGrid` |
| Loading/error during saves | mutation states surfaced in `StepShell` |
| Complete → `/discover` | `complete()` → `router.replace` |
| Completed users blocked from onboarding | `Stack.Protected` guard |
| Incomplete users blocked from core app | `Stack.Protected` guard |
| Reuse components/constants/mutations | shared primitives + `constants.ts` + mutation hooks |
| Add/remove/reorder step = minimal change | edit `STEPS` array |

---

## 10. Risks / open items

- **Storage bucket / RLS** must exist for real upload; covered by migration 0002,
  but cannot be verified without live Supabase creds in this environment.
- **No simulator** here to exercise the picker end to end; correctness verified via
  `tsc --noEmit`, code review, and the dev playground rather than a live device run.
- `grad year` UI: `OptionGroup` (2024–2035) keeps it within the existing primitive
  rather than adding a date/number picker dependency.
