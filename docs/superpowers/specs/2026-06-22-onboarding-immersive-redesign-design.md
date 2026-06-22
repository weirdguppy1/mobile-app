# Onboarding Immersive Redesign — Design Spec

**Date:** 2026-06-22
**Source task:** `tasks/TASK4.md` (Onboarding Experience Redesign)
**Status:** Approved design → ready for implementation plan

## Goal

Transition onboarding from a multi-field-per-screen wizard into an immersive,
full-screen, **one-question-per-screen** journey: section-based progress,
section interstitial screens, a blurred floating Continue overlay, optional-question
labels — all built on the **existing animation system** (no new libraries).

## Guiding constraints (from TASK4 + CLAUDE.md + DESIGN.md)

- **One question per screen.** Each question is the hero element: large display
  type, positioned slightly above center, generous whitespace, the single control
  fills the vertical space. Never feels like a stacked form. (§1, §4)
- **Section-based progress.** Progress shows position **within the current section
  only**, resets per section, never reveals total onboarding length. (§2)
- **Section interstitials.** A visually distinct chapter-break screen announces each
  new section, using mesh gradients + a tone shift. (§3)
- **Continue overlay.** Reuse the existing `Button` (do not redesign it). It floats
  in a blurred bottom overlay; content scrolls underneath; always visible. (§5)
- **Reuse the existing animation system.** No new animation library. Reuse
  `StepTransition`, `FadeIn`, `FocusScale`, `ActivateRamp`, `CheckPop`,
  `OnboardingBackground` (Skia mesh), `expo-blur`, `CompletionCelebration`. (§7)
- **Optional questions.** An "Optional" indicator near the hero; Continue is always
  enabled (blank + Continue = skip). (§8)
- **Palette discipline (DESIGN.md):** question screens are the neutral white stage
  (the hero question is the only emphasis); tone/color lives on interstitials.
  Continue is the ink-filled `button-primary`. Space Grotesk for the hero.

### Resolved decisions (signed off)

1. **Granularity: fully atomic.** Every field is its own hero screen (~32 question
   screens), driven by one data manifest. Section progress + interstitials hide the
   total length so it doesn't feel like a survey.
2. **Motion easing: keep eased timing, NO spring.** TASK4 §6 suggests spring easing
   for the next-question enter, but this directly contradicts the user's prior
   instruction (the spring made it "WAY too bouncy" → switched to eased timing).
   **User instruction wins: eased timing stays.**
3. **Drop the spotlight in onboarding.** The `Spotlight*` blur-the-other-fields
   system exists to de-clutter multi-field steps. With one input per screen there
   are no siblings to blur, so it is not wired into the new screens. The primitive
   stays in `src/shared/components` + the dev playground. `FocusScale` (input lift
   on focus) and the entry blur→sharp ramp are retained.
4. **Welcome interstitial before "The basics."** Shown only to brand-new users
   (resume jumps past it). It doubles as the `basics` section's interstitial.

## Architecture

A **data-driven question manifest** replaces the 9 step components. The flow is a
flat ordered list of `FlowItem`s — each section contributes one leading
**interstitial** followed by its **questions**. The wizard walks this list one item
at a time. Mirrors the existing `steps.ts` (metadata) + `step-components.tsx`
(id→component) split that already prevents require cycles.

```
FLOW = [
  interstitial(basics=welcome), q(first_name), q(pronouns), … q(sexual_orientation),
  interstitial(living),         q(sleep_schedule), … q(room_temperature),
  interstitial(lifestyle),      q(alcohol) … q(fitness),
  interstitial(interests),      q(interests),
  interstitial(dealBreakers),   q(deal_breakers),
  interstitial(prompts),        q(prompts),
  interstitial(photos),         q(photos),
  interstitial(extras),         q(dorm_preference) … q(phone),
  interstitial(review),         q(review),
]
```

### Navigation rules (`lib/flow.ts`, pure + tested)

- `buildFlow(SECTIONS, QUESTIONS) → FlowItem[]` — interstitial before each section,
  then that section's questions in order.
- `goNext`: index + 1 (so crossing a section boundary lands on the next section's
  interstitial — the chapter break).
- `goBack`: index − 1, but **skip interstitials** (Back from a section's first
  question lands on the previous section's last question). Interstitials are
  forward-only.
- `direction`: `'forward'` when index grows, else `'back'` (drives transition).
- Resume: `firstIncompleteQuestion(QUESTIONS, data)` → the flow index of the first
  unanswered question. Interstitials never replay on resume.

```ts
type FlowItem =
  | { kind: 'interstitial'; section: SectionId; key: string }
  | { kind: 'question'; question: QuestionMeta; key: string };
```

### Question model

```ts
// config/questions.ts — METADATA ONLY (graph leaf, like steps.ts)
type SectionId =
  | 'basics' | 'living' | 'lifestyle' | 'interests'
  | 'dealBreakers' | 'prompts' | 'photos' | 'extras' | 'review';

interface QuestionMeta {
  id: string;
  section: SectionId;
  title: string;        // the hero question, e.g. "What's your name?"
  subtitle?: string;    // small helper under the hero
  optional?: boolean;   // drives the "Optional" badge + always-advanceable
}
```

`config/question-components.tsx` maps `id → ComponentType`. 29 field questions are
produced by the factory; 3 (prompts, photos, review) are bespoke (32 total).

### The field-question factory (`lib/make-field-question.tsx`)

29 questions each map to a `profiles` column (or private contact) and save via the
mutations bag. The factory makes each a declarative object — fully type-safe, **no `any`** (`V` is
captured inside the closure and erased from the returned `ComponentType`):

```ts
interface FieldQuestionConfig<V> {
  getValue: (data: OnboardingData) => V;                       // seed from loaded data
  isValid?: (value: V) => boolean;                            // omit for optional → always true
  save: (value: V, m: ProfileMutations) => Promise<void>;     // persist on Continue
  control: (value: V, set: (v: V) => void) => ReactNode;      // the single input
}
function makeFieldQuestion<V>(config: FieldQuestionConfig<V>): ComponentType;
```

The produced component: reads `useOnboarding()` (data, mutations, goNext, current
meta), holds local `value` seeded from `getValue(data)`, computes
`canAdvance = config.isValid?.(value) ?? true`, and renders
`<QuestionShell canAdvance onNext={save→goNext} saving>{control(value, set)}</QuestionShell>`.
Validity **gates** the Continue button (disabled when invalid) — no inline error UI
needed. `save` errors keep the user on the screen (await throws before `goNext`);
mutation error state surfaces via the existing TanStack/mutation handling +
`Sentry.captureException` in the mutation layer.

Example:

```ts
export const FirstNameQuestion = makeFieldQuestion({
  getValue: (d) => d.profile.first_name ?? '',
  isValid: (v) => basicsSchema.shape.first_name.safeParse(v).success, // reuse schema atoms
  save: (v, m) => m.saveProfile.mutateAsync({ first_name: v.trim() }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="Preferred name" />,
});
```

## Components

### `QuestionShell` (evolves `StepShell`)

Shared chrome for every question screen. Reads current question meta + `canGoBack`
from `useOnboarding()`.

- Hero `title` in display type (`prose-display`/`prose-title`, Space Grotesk),
  positioned slightly above center, generous whitespace. `subtitle` beneath
  (`FadeIn`). "Optional" badge when `meta.optional` (reuses the `Field`/DESIGN.md
  caption style).
- The control fills the available vertical space inside a `ScrollView`
  (`keyboardShouldPersistTaps="handled"`), with `paddingBottom` = the Continue
  overlay height so the last content clears it.
- Renders `<ContinueOverlay>` at the bottom. A `Back` ghost button when `canGoBack`.
- No `SpotlightProvider`/`SpotlightSlot`/`SpotlightScrim` (dropped, decision #3).

Props: `{ children, canAdvance, onNext, saving?, nextLabel? }` — same contract as
today's `StepShell` so the factory + bespoke components share it.

### `ContinueOverlay` (§5)

Absolutely-positioned bottom container overlaying the screen:

- `expo-blur` `BlurView` backdrop (`blurMethod` — not the deprecated
  `experimentalBlurMethod`) + a soft top fade into content (a translucent
  canvas-tinted mask above the blur; **no linear gradient** per DESIGN.md — a
  subtle solid/opacity fade).
- Wraps the **existing `Button`** (`variant="primary"`, unchanged) with
  `ActivateRamp` (ramps in when `canAdvance`) + `CheckPop` (confirm tick on press).
- Reserves bottom safe-area inset (reuse the `useNavBarHeight`-style clearance idea).
- Exposes a single height constant so `QuestionShell` can pad the scroll content.

### `SectionInterstitial` (§3, §6)

Chapter-break screen for a section. Reads the section's interstitial copy + tone.

- Full-bleed mesh-gradient background driven by the section tone (the
  `OnboardingBackground` crossfade handles the bloom — see Tone wiring).
- Big Space Grotesk announcement (`prose-display`, centered, multi-line) + optional
  body line (`prose-subtitle`). The welcome variant may show a small "signed in as
  <email>" caption.
- A bottom Continue (`Button`, not the blurred overlay — interstitials have no
  scroll content). No progress bar (the interstitial *is* the reset).

### `SectionProgress` (§2)

Persistent top chrome on question screens (rendered in `onboarding.tsx`, outside the
transition, so it animates rather than remounting):

- Section title (`prose-label`/caption) above the segment bar.
- Reuses `OnboardingProgress` segments, fed **section-local** counts
  (`current`/`total` within the current section). Hidden on interstitials.

Props: `{ sectionTitle: string; current: number; total: number }`.

### Transitions

- **Question → question:** reuse `StepTransition` unchanged (directional slide +
  fade + entry blur→sharp, eased timing).
- **Interstitials (more significant, §6):** add a backward-compatible
  `variant: 'question' | 'section'` prop to `StepTransition`. `'question'` (default)
  = current behavior. `'section'` = a larger scale (e.g. 0.92→1) + fade-through,
  longer duration. Same reanimated primitives; distinct, weightier feel. The wizard
  picks the variant from `item.kind`.
- **Mesh shift:** handled automatically — entering an interstitial sets the
  background tone to the section tone; `OnboardingBackground` crossfades (800ms).
  Entering the next question sets tone back to `neutral` (white stage).

## Sections + interstitial copy + tones

Tones reference the existing `OnboardingBackground` mesh map. Question screens are
always `neutral`.

| # | SectionId | Section title (progress) | Interstitial headline | Body | Tone |
|---|-----------|--------------------------|-----------------------|------|------|
| 1 | basics | The basics | "Let's build\nyour profile." | "No wrong answers — just be you." | firstLight |
| 2 | living | Living habits | "Now — how you\nlive day-to-day." | "The stuff that makes or breaks sharing a space." | serenity |
| 3 | lifestyle | Lifestyle | "A little about\nyour lifestyle." | "Habits and vibes." | energy |
| 4 | interests | Interests | "What you're\ninto." | "So we can spot the overlap." | expression |
| 5 | dealBreakers | Deal-breakers | "Real talk:\ndeal-breakers." | "Totally optional — only if you've got 'em." | conviction |
| 6 | prompts | Prompts | "Show some\npersonality." | "This is where you actually come through." | curiosity |
| 7 | photos | Photos | "Put a face\nto the vibe." | "Add a few photos." | radiance |
| 8 | extras | Extras | "The extras." | "Optional flourishes to round you out." | horizon |
| 9 | review | Review | "That's\neverything." | "Take a look before we start matching." | warm |

## Question manifest (~32 questions)

`required` = gates Continue via the named schema atom. `optional` = "Optional" badge
+ always advanceable. All `save` calls use `useProfileMutations()`.

### basics (7)

| id | hero title | opt | control | persist |
|----|-----------|-----|---------|---------|
| first_name | "What's your name?" | – | TextField | `saveProfile({first_name: v.trim()})` |
| pronouns | "What are your pronouns?" | ✓ | TextField (she/her…) | `saveProfile({pronouns: v.trim() || null})` |
| graduation_year | "When do you graduate?" | – | OptionGroup(years) | `saveProfile({graduation_year: Number(v)})` |
| majors | "What are you studying?" | – | TagInput(max 3) | `saveProfile({majors: v})` |
| gender_identity | "How do you identify?" | ✓ | TextField | `saveProfile({gender_identity: v.trim() || null})` |
| sex_assigned_at_birth | "Sex assigned at birth" | – | OptionGroup | `saveProfile({sex_assigned_at_birth: v})` |
| sexual_orientation | "Your sexual orientation" | – | OptionGroup | `saveProfile({sexual_orientation: v})` |

The read-only school line ("From your .edu email") moves to a caption on the welcome
interstitial.

### living (10) — all required, each `saveProfile({field: v})`, validity via `compatibilitySchema.shape.<field>`

`sleep_schedule` "What's your sleep schedule?" · `bedtime` "When do you go to bed?" ·
`wakeup_time` "When do you wake up?" · `cleanliness` "How tidy are you?"
(ScaleInput Relaxed→Spotless) · `noise_preference` "Noise while you study or sleep?" ·
`study_style` "Where do you study?" · `guests_frequency` "How often do guests come over?" ·
`romantic_guests_frequency` "Romantic guests?" · `social_level` "How social are you at home?"
(ScaleInput Homebody→Always out) · `room_temperature` "Ideal room temperature?".

### lifestyle (4) — all required, `saveProfile`, validity via `lifestyleSchema.shape.<field>`

`alcohol` "Do you drink?" · `smoking` "Do you smoke?" · `parties` "How do you feel about parties?" ·
`fitness` "How active are you?". All `OptionGroup`.

### interests (1)

| interests | "What are you into?" | – | OptionGroup multiple (min 5, max 10), shows "N selected" | `saveProfile({interests: v})`, validity `interestsSchema` |

### dealBreakers (1)

| deal_breakers | "Any deal-breakers?" | ✓ | OptionGroup multiple | `saveProfile({deal_breakers: v})` (empty allowed) |

### prompts (1, bespoke `PromptsQuestion`)

"Show some personality" / "Answer 1–3 prompts." Select chips (max 3) + a `TextField`
per selected prompt. Saves `savePrompts.mutateAsync(prompts)`; validity `promptsSchema`
(min 1). Renders inside `QuestionShell`.

### photos (1, bespoke `PhotosQuestion`)

"Add your photos" / "At least one. Drag to reorder." `PhotoGrid` with inline
upload/remove/reorder (uploads happen in-place, not on Continue). `canAdvance =
saved.length >= PHOTOS_LIMITS.min`. Continue just advances.

### extras (6, all optional)

| dorm_preference | "Dorm preference?" | ✓ | TextField | `saveProfile({dorm_preference: v.trim() || null})` |
| living_program | "Any living program?" | ✓ | TextField (Honors / LLC) | `saveProfile({living_program: v.trim() || null})` |
| clubs | "Clubs you're in?" | ✓ | TagInput(max CLUBS_MAX) | `saveProfile({clubs: v})` |
| instagram | "Your Instagram?" | ✓ | TextField (@handle, no autocap) | `saveProfile({instagram: v.trim() || null})` |
| linkedin | "LinkedIn?" | ✓ | TextField (no autocap) | `saveProfile({linkedin: v.trim() || null})` |
| phone | "Phone number?" | ✓ | TextField (phone-pad) + "🔒 Private" caption | if `v.trim()`: `savePrivateContact.mutateAsync(v.trim())` |

### review (1, bespoke `ReviewQuestion`)

"Here's your profile" — summary rows (Name, Graduation year, Majors, Interests,
Prompts, Photos) each with an **Edit** that jumps to that question (`goToQuestion(id)`).
Finish → `setCelebrating(true)` → `complete.mutateAsync()` (existing celebration/
lift flow in `onboarding.tsx`, unchanged). Validity `onboardingCompletionSchema`.

## Completion (unchanged)

`ReviewQuestion` Finish sets `celebrating` before awaiting `complete()` (so the
`(app)` layout gate doesn't unmount mid-celebration), the current screen lifts +
fades, then `CompletionCelebration` plays on the cleared background and navigates to
`/discover`. No changes to `CompletionCelebration` or the celebration sequencing in
`onboarding.tsx`.

## File structure

**Create**
- `config/sections.ts` — `SECTIONS`, `SectionId`, interstitial copy + tone.
- `config/questions.ts` — `QUESTIONS` metadata + `QuestionMeta`.
- `config/question-components.tsx` — `id → ComponentType` map.
- `lib/make-field-question.tsx` — generic factory.
- `lib/flow.ts` — `FlowItem`, `buildFlow`, next/back (skip interstitial), direction.
- `components/QuestionShell.tsx`
- `components/ContinueOverlay.tsx`
- `components/SectionInterstitial.tsx`
- `components/SectionProgress.tsx`
- `questions/PromptsQuestion.tsx`, `questions/PhotosQuestion.tsx`, `questions/ReviewQuestion.tsx`
- Tests: `__tests__/flow.test.ts`, `__tests__/questions.test.ts`; extend
  `__tests__/onboarding-progress.test.ts`.

**Modify**
- `shared/components/animations/step-transition.tsx` — add `variant` prop.
- `hooks/use-onboarding.ts` — walk `FLOW`; expose `item`, `section`, section-local
  `progress`, `goNext/goBack`, `goToQuestion`, `canGoBack`.
- `lib/onboarding-progress.ts` — `firstIncompleteQuestion` + section-local progress.
- `store/onboarding-store.ts` — unchanged shape (`index` now a flow index; doc it).
- `components/OnboardingBackground.tsx` — own + export the `Tone` type (absorbing it
  from the deleted `step-tone.ts`); MESH map already present.
- `app/(app)/onboarding.tsx` — render the current `FlowItem` (interstitial vs
  question) inside the variant-aware transition; persistent `SectionProgress` on
  question items; tone = section tone on interstitials / `neutral` on questions;
  keep completion/celebration logic.
- `app/dev/components.tsx` + `app/dev/screens.tsx` — add `QuestionShell`,
  `SectionInterstitial`, `SectionProgress`, `ContinueOverlay` previews; refresh the
  onboarding entry (CLAUDE.md dev-route mandate).

**Delete (superseded)**
- `components/StepShell.tsx`, `config/steps.ts`, `config/step-components.tsx`,
  `config/step-tone.ts`, `steps/*.tsx` (9 files), `__tests__/step-tone.test.ts`.
- Note: the user's **uncommitted** `step-tone.ts` edit (all steps → `neutral`) is
  superseded by this design; its intent (neutral question screens) is preserved —
  question screens are neutral; tone lives on interstitials. Confirm before deleting.

**Keep**
- `OnboardingBackground`, `OnboardingProgress`, `CompletionCelebration`, all
  `shared/components` primitives, `useProfileMutations`, profile schema/constants.

## Testing

Repo gate: `npx tsc --noEmit` (lint is broken) + `npx jest` (pure logic only).

- `flow.test.ts`: interstitial precedes each section's questions; `goNext` lands on
  the next interstitial at a boundary; `goBack` skips interstitials; direction.
- `onboarding-progress.test.ts`: `firstIncompleteQuestion` → first unanswered;
  → last/review when all complete; section-local `current`/`total`.
- `questions.test.ts`: every `SectionId` has ≥1 question + an interstitial; every
  question id is unique and has a component; optional flags match the schema
  (pronouns, gender_identity, deal_breakers, all extras = optional).
- Component render tests are out of scope (repo tests pure logic only).

## Out of scope

Bespoke illustrations / category imagery (no assets; DESIGN.md bans decorative SVG —
mesh + display type carry interstitials). No changes to the profile data model,
mutations, Supabase schema, or the post-onboarding app. No new dependencies.

## Branch

Create `feature/onboarding-immersive` from current `refactor/prompt-ui-change` HEAD,
carrying the uncommitted WIP (step-tone neutral edit + TASK file reorg), which is
consistent with this redesign.
