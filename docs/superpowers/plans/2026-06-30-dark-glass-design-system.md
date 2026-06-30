# Dark Glass Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reissue the app's design system as a dark-default, glassmorphic theme and re-skin the Discover + Profile reference surface to prove it.

**Architecture:** The codebase styles via semantic tokens (`text-ink`, `bg-canvas`, `text-slate`, …) defined once in `src/global.css` (`@theme`) and mirrored as JS values in `src/constants/theme.ts` (`Brand`). We **invert those token values** to a dark achromatic ramp — one change flips every screen that used tokens semantically. We then add real-blur glass primitives (`expo-blur`, already installed), a deterministic per-profile mesh-wash picker, swap the display font to Clash Display, and re-skin Discover/Profile. Other screens inherit the dark tokens immediately and are visually audited in later passes.

**Tech Stack:** Expo SDK 56, React Native 0.85, Uniwind (Tailwind v4) + `@theme` tokens, `expo-blur`, `expo-font`, Reanimated, Jest (jest-expo), TypeScript.

## Global Constraints

- **No `any`, no `@ts-ignore`.** Type gate is `npx tsc --noEmit` (lint infra is broken in this repo; tsc is the gate).
- **Validate external input with Zod** — N/A for this plan (no new external input).
- **Dark is the only theme built this pass.** Keep call sites token-driven; do not hardcode hex in components except where a JS color value is unavoidable (use `Brand`/`Glass` from `theme.ts`).
- **Semantic colors `yes`/`maybe`/`pass` are like/match only.** Never decorative.
- **Clash Display is for big titles only** (`font-display` / `prose-display` / `prose-title`). Everything else, including prompt answers, is Satoshi (`font-primary`).
- **`expo-blur` is native** — requires a dev-client rebuild (`npx expo run:ios` / `run:android`), not just a Metro reload, before glass renders.
- **Branch:** work on the current `refactor/theme+colors` branch. Do not commit to `main`.
- **Spec:** `docs/superpowers/specs/2026-06-30-design-system-evolution-design.md` is the source of truth.
- **Known interim breakage:** inverting tokens (Task 1) turns the *whole* app dark at once. Screens other than Discover/Profile/tab-bar may show contrast/hardcoded-color glitches until their own passes — this is expected and out of scope here. Note (don't fix) anything egregious you spot.

---

## PHASE 1 — Foundation

### Task 1: Invert the token ramp to dark (`global.css` + `theme.ts`)

**Files:**
- Modify: `src/global.css:7-33`
- Modify: `src/constants/theme.ts:9-21`

**Interfaces:**
- Produces: dark values for the existing token names — class names unchanged (`bg-canvas`, `text-ink`, `text-slate`, `border-silver`, `text-graphite`, `text-ash`, `bg-wash`, `border-hairline`), and `Brand.{ink,canvas,graphite,slate,ash,fog,silver,yes,maybe,pass,sent}` unchanged keys, dark values.

- [ ] **Step 1: Edit `src/global.css` `@theme` block** — replace the core color vars (lines 8-14), `pass`, `background`/`foreground`, `hairline`/`wash` with dark values:

```css
  --color-ink: #f4f4f5;        /* primary text / contrast / filled buttons (light on dark) */
  --color-canvas: #0d0e12;     /* page + base surface */
  --color-graphite: #d4d4dc;   /* strong secondary text */
  --color-slate: #b4b4bd;      /* tertiary / body */
  --color-ash: #9a9aa4;        /* muted captions */
  --color-fog: #6e6e77;        /* subheads / disabled */
  --color-silver: rgba(255, 255, 255, 0.14); /* hairline borders */

  --color-yes: #31c431;
  --color-maybe: #ffae00;
  --color-pass: #ff5a5a;       /* lighter red reads better on dark */

  --color-sent: #0a84ff;

  --color-background: #0d0e12;
  --color-foreground: #f4f4f5;

  --font-primary: 'Satoshi';
  --font-display: 'ClashDisplay-Bold';
  --font-display-medium: 'ClashDisplay-Semibold';

  --color-hairline: rgba(255, 255, 255, 0.08);
  --color-wash: rgba(255, 255, 255, 0.05);
```

- [ ] **Step 2: Edit `src/constants/theme.ts` `Brand`** to mirror exactly:

```ts
export const Brand = {
  ink: '#f4f4f5',
  canvas: '#0d0e12',
  graphite: '#d4d4dc',
  slate: '#b4b4bd',
  ash: '#9a9aa4',
  fog: '#6e6e77',
  silver: 'rgba(255,255,255,0.14)',
  yes: '#31c431',
  maybe: '#ffae00',
  pass: '#ff5a5a',
  sent: '#0a84ff',
} as const;
```

- [ ] **Step 3: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS (no type changes, only values).

- [ ] **Step 4: Commit**

```bash
git add src/global.css src/constants/theme.ts
git commit -m "feat(theme): invert achromatic ramp to dark default"
```

---

### Task 2: Swap display font to Clash Display

**Files:**
- Create: `assets/fonts/Clash_Display/ClashDisplay-Bold.ttf`, `assets/fonts/Clash_Display/ClashDisplay-Semibold.ttf`
- Modify: `src/app/_layout.tsx:14-18`
- Delete (after): `assets/fonts/Space_Grotesk/` (only once nothing references it)

**Interfaces:**
- Produces: loaded font families `'ClashDisplay-Bold'`, `'ClashDisplay-Semibold'` matching `--font-display` / `--font-display-medium` from Task 1.

- [ ] **Step 1: Download the font.** From https://www.fontshare.com/fonts/clash-display download the family; copy the static `ClashDisplay-Bold.ttf` and `ClashDisplay-Semibold.ttf` into `assets/fonts/Clash_Display/`. (These are the only two weights the system uses.)

- [ ] **Step 2: Edit `src/app/_layout.tsx` `useFonts` map** — replace the two SpaceGrotesk lines:

```tsx
  const [fontsLoaded] = useFonts({
    Satoshi: require("@/assets/fonts/Satoshi.ttf"),
    "ClashDisplay-Bold": require("@/assets/fonts/Clash_Display/ClashDisplay-Bold.ttf"),
    "ClashDisplay-Semibold": require("@/assets/fonts/Clash_Display/ClashDisplay-Semibold.ttf"),
  });
```

- [ ] **Step 3: Confirm no Space Grotesk references remain** — Run: `grep -rn "SpaceGrotesk\|Space_Grotesk" src` — Expected: no output. (If the grep finds any, they were already replaced by the global.css change in Task 1; investigate before deleting font files.)

- [ ] **Step 4: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 5: Commit** (delete the old font dir in the same commit once grep is clean)

```bash
git rm -r assets/fonts/Space_Grotesk
git add assets/fonts/Clash_Display src/app/_layout.tsx
git commit -m "feat(theme): replace Space Grotesk with Clash Display for display type"
```

---

### Task 3: Dark mesh-wash pool + glass constants (`theme.ts`)

**Files:**
- Modify: `src/constants/theme.ts` (append exports)

**Interfaces:**
- Produces:
  - `DARK_PAGE: string`
  - `DiscoverWashes: ReadonlyArray<{ key: string; stops: string }>` — `stops` is an `experimental_backgroundImage` value (comma-joined radial-gradients); pair with `backgroundColor: DARK_PAGE`. Index 0 is `peachRose`.
  - `Glass: { card: G; sheet: G; heart: G; chip: G }` where `G = { tint: 'dark'; intensity: number; bg: string; border: string }`.

- [ ] **Step 1: Append to `src/constants/theme.ts`:**

```ts
/** Base page color for the dark theme; pair with a DiscoverWashes `stops` value. */
export const DARK_PAGE = '#0d0e12';

/** Ambient mesh washes for the Discover feed — one is chosen per profile (see
 *  shared/lib/wash.ts) so each person reads distinct. Low-opacity glows behind
 *  the floating glass cards; photos stay dominant. Index 0 (peachRose) is the
 *  product's favorite. Apply via `experimental_backgroundImage: stops` +
 *  `backgroundColor: DARK_PAGE`. */
export const DiscoverWashes = [
  { key: 'peachRose', stops: [
    'radial-gradient(circle at 100% 0%, rgba(255,150,170,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(255,180,140,0.17) 0%, transparent 60%)',
    'radial-gradient(circle at 55% 100%, rgba(255,160,180,0.12) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'periwinkle', stops: [
    'radial-gradient(circle at 100% 0%, rgba(140,180,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(170,160,255,0.16) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'mint', stops: [
    'radial-gradient(circle at 100% 0%, rgba(120,220,210,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(150,230,200,0.16) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'lavender', stops: [
    'radial-gradient(circle at 100% 0%, rgba(200,160,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(210,182,245,0.16) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'sky', stops: [
    'radial-gradient(circle at 100% 0%, rgba(120,190,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(170,230,210,0.15) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'indigo', stops: [
    'radial-gradient(circle at 100% 0%, rgba(150,150,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(190,150,245,0.16) 0%, transparent 60%)',
  ].join(', ') },
] as const;

export type DiscoverWash = (typeof DiscoverWashes)[number];

interface GlassSpec { tint: 'dark'; intensity: number; bg: string; border: string }

/** Real-glass (expo-blur) recipes. `bg` is the translucent tint laid over the
 *  blur; `border` the 1px top-light edge. "Strong" = high intensity, low bg alpha. */
export const Glass: Record<'card' | 'sheet' | 'heart' | 'chip', GlassSpec> = {
  card:  { tint: 'dark', intensity: 30, bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.14)' },
  sheet: { tint: 'dark', intensity: 42, bg: 'rgba(20,20,26,0.40)',   border: 'rgba(255,255,255,0.16)' },
  heart: { tint: 'dark', intensity: 24, bg: 'rgba(20,20,24,0.45)',   border: 'rgba(255,255,255,0.20)' },
  chip:  { tint: 'dark', intensity: 18, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.14)' },
};
```

- [ ] **Step 2: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/constants/theme.ts
git commit -m "feat(theme): add dark mesh-wash pool and glass recipes"
```

---

### Task 4: Deterministic per-profile wash picker (`shared/lib/wash.ts`) — TDD

**Files:**
- Create: `src/shared/lib/wash.ts`
- Test: `src/shared/lib/__tests__/wash.test.ts`

**Interfaces:**
- Consumes: `DiscoverWashes` (Task 3).
- Produces: `washForId(id: string): DiscoverWash` and `washIndexForId(id: string): number` — same id always yields the same wash (stable on re-render/scroll).

- [ ] **Step 1: Write the failing test** — `src/shared/lib/__tests__/wash.test.ts`:

```ts
import { DiscoverWashes } from '@/constants/theme';
import { washForId, washIndexForId } from '@/shared/lib/wash';

describe('wash picker', () => {
  it('is deterministic for the same id', () => {
    expect(washIndexForId('abc-123')).toBe(washIndexForId('abc-123'));
    expect(washForId('abc-123').key).toBe(washForId('abc-123').key);
  });

  it('always returns an index within the pool', () => {
    for (const id of ['', 'a', 'a-very-long-profile-uuid-0000', '99']) {
      const i = washIndexForId(id);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(DiscoverWashes.length);
    }
  });

  it('spreads across more than one wash for distinct ids', () => {
    const ids = Array.from({ length: 50 }, (_, n) => `id-${n}`);
    const keys = new Set(ids.map((id) => washForId(id).key));
    expect(keys.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx jest src/shared/lib/__tests__/wash.test.ts` — Expected: FAIL ("Cannot find module '@/shared/lib/wash'").

- [ ] **Step 3: Write `src/shared/lib/wash.ts`:**

```ts
import { DiscoverWashes, type DiscoverWash } from '@/constants/theme';

/** Stable index into DiscoverWashes from a profile id (FNV-ish string hash). */
export function washIndexForId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % DiscoverWashes.length;
}

/** The ambient wash for a given profile id — same id ⇒ same wash. */
export function washForId(id: string): DiscoverWash {
  return DiscoverWashes[washIndexForId(id)];
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx jest src/shared/lib/__tests__/wash.test.ts` — Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/wash.ts src/shared/lib/__tests__/wash.test.ts
git commit -m "feat(discovery): deterministic per-profile mesh-wash picker"
```

---

### Task 5: `buildHeaderVitals` — year · major only (TDD)

**Files:**
- Modify: `src/features/profile/lib/profile-vitals.ts`
- Test: `src/features/profile/lib/__tests__/profile-vitals.test.ts`

**Interfaces:**
- Produces: `buildHeaderVitals(profile: Profile): string[]` — `[graduation_year?, majors[0]?]` only; never dorm/sleep. Used by `ProfileView` header (Task 9).

- [ ] **Step 1: Write the failing test** — `src/features/profile/lib/__tests__/profile-vitals.test.ts`:

```ts
import { buildHeaderVitals } from '@/features/profile/lib/profile-vitals';
import type { Profile } from '@/features/profile/types';

const base = {
  graduation_year: 2029, majors: ['Undeclared'],
  dorm_preference: 'East', sleep_schedule: 'early_bird', hidden_fields: [],
} as unknown as Profile;

describe('buildHeaderVitals', () => {
  it('returns only year and major, never dorm/sleep', () => {
    expect(buildHeaderVitals(base)).toEqual(['2029', 'Undeclared']);
  });

  it('skips missing values', () => {
    expect(buildHeaderVitals({ ...base, majors: [] } as Profile)).toEqual(['2029']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx jest src/features/profile/lib/__tests__/profile-vitals.test.ts` — Expected: FAIL ("buildHeaderVitals is not a function").

- [ ] **Step 3: Add to `src/features/profile/lib/profile-vitals.ts`** (after `buildVitals`):

```ts
/** The condensed header line shown on the Discover/Profile header: year · major
 *  only (DESIGN.md evolution). Dorm/sleep live in chips + detail sections. */
export function buildHeaderVitals(profile: Profile): string[] {
  const tokens: string[] = [];
  if (profile.graduation_year) tokens.push(String(profile.graduation_year));
  const major = profile.majors?.[0];
  if (major) tokens.push(major);
  return tokens;
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx jest src/features/profile/lib/__tests__/profile-vitals.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/profile/lib/profile-vitals.ts src/features/profile/lib/__tests__/profile-vitals.test.ts
git commit -m "feat(profile): buildHeaderVitals (year + major only)"
```

---

### Task 6: `GlassCard` + `GlassSheet` primitives

**Files:**
- Create: `src/shared/components/glass-card.tsx`
- Create: `src/shared/components/glass-sheet.tsx`
- Modify: `src/shared/components/index.ts`

**Interfaces:**
- Consumes: `Glass` (Task 3).
- Produces:
  - `GlassCard(props: ViewProps & { children?: ReactNode })` — rounded blurred surface; pass `className` for padding/gap/positioning.
  - `GlassSheet(props: ViewProps & { children?: ReactNode })` — top-rounded blurred surface for sheets/modals.

- [ ] **Step 1: Write `src/shared/components/glass-card.tsx`:**

```tsx
import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Glass } from '@/constants/theme';

/** Real-glass surface (expo-blur). Blur fills behind a translucent tint; the
 *  caller supplies padding/gap via className. Strong intensity per DESIGN.md. */
export function GlassCard({ children, className, style, ...rest }: ViewProps & { children?: ReactNode }) {
  return (
    <View
      className={`overflow-hidden rounded-2xl ${className ?? ''}`}
      style={[{ borderWidth: 1, borderColor: Glass.card.border }, style]}
      {...rest}>
      <BlurView
        tint={Glass.card.tint}
        intensity={Glass.card.intensity}
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.card.bg }]} />
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Write `src/shared/components/glass-sheet.tsx`:**

```tsx
import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Glass } from '@/constants/theme';

/** Top-rounded real-glass surface for bottom sheets / modals (like-sheet, match
 *  modal). Heavier blur than GlassCard. */
export function GlassSheet({ children, className, style, ...rest }: ViewProps & { children?: ReactNode }) {
  return (
    <View
      className={`overflow-hidden rounded-t-3xl ${className ?? ''}`}
      style={[{ borderTopWidth: 1, borderColor: Glass.sheet.border }, style]}
      {...rest}>
      <BlurView
        tint={Glass.sheet.tint}
        intensity={Glass.sheet.intensity}
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.sheet.bg }]} />
      {children}
    </View>
  );
}
```

- [ ] **Step 3: Export from `src/shared/components/index.ts`** — add:

```ts
export { GlassCard } from './glass-card';
export { GlassSheet } from './glass-sheet';
```

- [ ] **Step 4: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/glass-card.tsx src/shared/components/glass-sheet.tsx src/shared/components/index.ts
git commit -m "feat(ui): GlassCard + GlassSheet real-blur primitives"
```

---

### Task 7: Rewrite `DESIGN.md` to the Dark Glass system

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Rewrite `DESIGN.md`** so it documents the shipped system, sourced from the spec. It must state: dark default (`#0d0e12` page, `#f4f4f5`/`#b4b4bd`/`#9a9aa4` text), white→light inverted ramp, **Clash Display for big titles only / Satoshi everywhere incl. prompt answers**, real glass (`expo-blur`, strong) on cards/sheets/tab-bar/heart, per-person rotating washes on Discover (peach-rose favorite), full-pill buttons, semantic `yes/maybe/pass` for like/match only, keep+unify motion. Include the §F.5 light-mode backup token map verbatim from the spec. Remove the obsolete white-stage / warm-paper / Space-Grotesk guidance.

- [ ] **Step 2: Commit**

```bash
git add DESIGN.md
git commit -m "docs: rewrite DESIGN.md for the Dark Glass system"
```

---

## PHASE 2 — Reference surface (Discover + Profile)

### Task 8: Glass like-heart + glass prompt card

**Files:**
- Modify: `src/features/discovery/components/RequestHeart.tsx`
- Modify: `src/features/profile/components/ReadOnlyPromptCard.tsx`

**Interfaces:**
- Consumes: `Glass` (Task 3), `GlassCard` (Task 6).
- Produces: unchanged component signatures (`RequestHeart({ target, onPress })`, `ReadOnlyPromptCard({ prompt, overlay })`).

- [ ] **Step 1: Rewrite `RequestHeart.tsx`** — frosted glass circle, ink (now light) outline heart, no fill:

```tsx
import { BlurView } from 'expo-blur';
import { Heart } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Brand, Glass } from '@/constants/theme';
import { RequestTarget } from '@/features/discovery/types';
import { PressScale } from '@/shared/components';

interface RequestHeartProps {
  target: RequestTarget;
  onPress: (target: RequestTarget) => void;
}

/** Per-element like affordance: a frosted dark-glass circle with a light outline
 *  heart (no color-fill state). Anchored bottom-right of a photo or prompt. */
export function RequestHeart({ target, onPress }: RequestHeartProps) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel="Send a request about this"
      hitSlop={8}
      onPress={() => onPress(target)}
      className="h-11 w-11 items-center justify-center overflow-hidden rounded-full"
      style={{ borderWidth: 1, borderColor: Glass.heart.border }}>
      <BlurView
        tint={Glass.heart.tint}
        intensity={Glass.heart.intensity}
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.heart.bg }]} />
      <Heart size={20} color={Brand.ink} strokeWidth={2} />
    </PressScale>
  );
}
```

- [ ] **Step 2: Rewrite `ReadOnlyPromptCard.tsx`** — use `GlassCard`; answer in Satoshi (`font-primary`) bold, with right clearance so the heart never overlaps:

```tsx
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ProfilePrompt } from '@/features/profile/types';
import { GlassCard } from '@/shared/components';

/** A prompt + answer as a read-only glass card. Shared by ProfileView (feed) and
 *  the user profile page. Answer is Satoshi (display font is titles-only). */
export function ReadOnlyPromptCard({ prompt, overlay }: { prompt: ProfilePrompt; overlay?: ReactNode }) {
  return (
    <GlassCard className="gap-2 px-5 py-5">
      <Text className="prose-footnote text-slate">{prompt.prompt}</Text>
      <Text className="font-primary text-2xl font-bold tracking-tight text-ink" style={{ paddingRight: 44 }}>
        {prompt.answer}
      </Text>
      {overlay ? <View className="absolute bottom-2 right-2">{overlay}</View> : null}
    </GlassCard>
  );
}
```

- [ ] **Step 3: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/discovery/components/RequestHeart.tsx src/features/profile/components/ReadOnlyPromptCard.tsx
git commit -m "feat(profile): glass like-heart and glass prompt card"
```

---

### Task 9: `ProfileView` dark re-skin

**Files:**
- Modify: `src/features/profile/components/ProfileView.tsx`

**Interfaces:**
- Consumes: `buildHeaderVitals` (Task 5).
- Produces: unchanged `ProfileView` props.

- [ ] **Step 1: Swap the vitals source** — change the import on line 13 and the call on line 42:
  - Line 13: `import { buildHeaderVitals, buildProfileFeed } from '@/features/profile/lib/profile-vitals';`
  - Line 42: `const vitals = buildHeaderVitals(profile);`

- [ ] **Step 2: Dark photo frame** — in `ProfilePhoto` (line 98) drop the light border, keep the rounded dark slot:

```tsx
    <View className="overflow-hidden rounded-2xl bg-wash" style={{ width: '100%', aspectRatio: 4 / 5 }}>
```

- [ ] **Step 3: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/profile/components/ProfileView.tsx
git commit -m "feat(profile): dark ProfileView — year/major header, dark photo frame"
```

---

### Task 10: Discover — per-profile wash backdrop + dark chrome

**Files:**
- Modify: `src/app/(app)/(main)/discover.tsx`

**Interfaces:**
- Consumes: `washForId` (Task 4), `DARK_PAGE` (Task 3).

- [ ] **Step 1: Add imports** — at the top with the other `@/` imports:

```tsx
import { DARK_PAGE } from '@/constants/theme';
import { washForId } from '@/shared/lib/wash';
```

- [ ] **Step 2: Set the status bar to light** — change line 184: `<StatusBar style="light" />`.

- [ ] **Step 3: Render the rotating wash behind the body.** Compute the wash for the current profile and place it as an absolute backdrop inside `SafeAreaView`, before `{body()}`:

```tsx
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {current ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
              backgroundColor: DARK_PAGE,
              experimental_backgroundImage: washForId(current.profile.id).stops,
            }}
          />
        ) : null}
        {body()}
```

- [ ] **Step 4: Keep the screen base dark** — `TabTransition className="flex-1 bg-canvas"` already resolves to the dark base (Task 1); leave it. The wash view layers on top of it and below the (transparent) ProfileView.

- [ ] **Step 5: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/(main)/discover.tsx"
git commit -m "feat(discovery): rotating per-profile mesh wash + dark status bar"
```

---

### Task 11: Glass floating tab bar (`NavBar`)

**Files:**
- Modify: `src/features/navigation/components/NavBar.tsx`

**Interfaces:**
- Consumes: `Glass` (Task 3). Unchanged `NavBar` props.

- [ ] **Step 1: Rewrite `NavBar.tsx`** — replace the opaque white surface with a frosted glass bar (blur fill + tint + top-light border), keeping the existing layout, badge, and active/muted icon logic:

```tsx
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';

import { type TabConfig } from '@/features/navigation/config/tabs';
import { NAV_BAR_MIN_INSET } from '@/features/navigation/lib/use-nav-bar-height';
import { Brand, Glass } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface NavBarProps {
  tabs: readonly TabConfig[];
  activeName: string;
  onPressTab: (name: string) => void;
  bottomInset?: number;
  badges?: Record<string, number>;
}

/** Presentational bottom nav: a frosted glass, top-rounded floating bar. Active
 *  tab reads in ink (light) + bold; the rest muted. Pure UI for the dev playground. */
export function NavBar({ tabs, activeName, onPressTab, bottomInset = 0, badges }: NavBarProps) {
  return (
    <View
      className="overflow-hidden rounded-t-3xl"
      style={{ borderTopWidth: 1, borderColor: Glass.sheet.border }}>
      <BlurView
        tint={Glass.sheet.tint}
        intensity={Glass.sheet.intensity}
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.sheet.bg }]} />
      <View
        className="flex-row px-2 pt-2"
        style={{ paddingBottom: Math.max(bottomInset, NAV_BAR_MIN_INSET) }}>
        {tabs.map((tab) => {
          const active = tab.name === activeName;
          const Icon = tab.icon;
          const badge = badges?.[tab.name] ?? 0;
          return (
            <PressScale
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={badge > 0 ? `${tab.label}, ${badge} unread` : tab.label}
              onPress={() => onPressTab(tab.name)}
              className="flex-1 items-center gap-1 py-2">
              <View>
                <Icon size={22} color={active ? Brand.ink : Brand.ash} strokeWidth={active ? 2.5 : 2} />
                {badge > 0 ? (
                  <View
                    className="absolute -right-2.5 -top-1.5 items-center justify-center rounded-full bg-ink px-1"
                    style={{ minWidth: 16, height: 16 }}>
                    <Text className="font-semibold text-canvas" style={{ fontSize: 10 }}>
                      {badge > 9 ? '9+' : badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className={active ? 'prose-caption font-semibold text-ink' : 'prose-caption text-ash'}>
                {tab.label}
              </Text>
            </PressScale>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/navigation/components/NavBar.tsx
git commit -m "feat(nav): frosted glass floating tab bar"
```

---

### Task 12: Register new primitives in the dev playground

**Files:**
- Modify: `src/app/dev/components.tsx`

**Interfaces:**
- Consumes: `GlassCard`, `GlassSheet` (Task 6), `RequestHeart` (Task 8).

- [ ] **Step 1: Read the file** — Run: `sed -n '1,80p' "src/app/dev/components.tsx"` to learn its registration pattern (categories/entries).

- [ ] **Step 2: Add entries** following that exact pattern: a "Glass" category previewing `GlassCard` (with sample prompt text inside), `GlassSheet` (with sample sheet content), and the glass `RequestHeart`. Render them over a dark wash background `View` (use `DARK_PAGE` + a `DiscoverWashes[0].stops` backdrop) so the blur is visible. Match the existing entry shape — do not invent a new registration API.

- [ ] **Step 3: Type gate** — Run: `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/dev/components.tsx"
git commit -m "chore(dev): register glass primitives in the component playground"
```

---

### Task 13: Full verification pass (rebuild + manual)

**Files:** none (verification only).

- [ ] **Step 1: Full type gate** — Run: `npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 2: Full test run** — Run: `npx jest` — Expected: PASS (includes `wash` + `profile-vitals` suites).
- [ ] **Step 3: Native rebuild** (glass is native) — Run: `npx expo run:ios` (and/or `run:android`).
- [ ] **Step 4: Manual checks** (per spec Testing) — confirm on device/simulator:
  - Discover + Profile render dark; text legible over washes.
  - Each profile shows a **different** wash; the wash is **stable** while scrolling that profile and changes when you advance to the next.
  - Glass renders on prompt cards, the like-sheet/match modal surfaces, the like-heart, and the floating tab bar (iOS first; verify Android `dimezisBlurView`).
  - Titles/name render in **Clash Display**; prompt answers and body in **Satoshi**.
  - Like-heart has **no color-fill** state.
  - Reduce-motion: existing animations fall back; haptics still fire.
  - Note (don't fix) any other screen that looks broken under the new dark tokens — feeds the next pass.
- [ ] **Step 5: Commit** any small fixes found, e.g.:

```bash
git commit -am "fix(theme): dark-glass verification follow-ups"
```

---

## Self-Review

**Spec coverage:**
- §A theme/surfaces → Task 1. §A semantic-token structure (enables light backup) → preserved by token-only inversion (Task 1).
- §B rotating wash → Tasks 3 (pool) + 4 (picker) + 10 (apply). Stable-per-profile requirement → Task 4 determinism test + Task 10 keying on `profile.id`.
- §C glass (real, strong, scope) → Tasks 3 (recipes) + 6 (primitives) + 8 (heart/card) + 11 (tab bar) + 12 (dev). Like-sheet/match modal surfaces use `GlassSheet`.
- §D typography (Clash titles-only, Satoshi incl. prompt answers) → Tasks 2 + 8 (prompt answer → `font-primary`) + 1 (font-display var).
- §E profile surface (4:5 photos, year·major header, glass cards, no-fill heart, chips) → Tasks 5 + 8 + 9. (Photos were already `aspectRatio 4/5`; kept.)
- §F components (full-pill, semantic colors) → `button-primary` already full-pill; semantic tokens unchanged in Task 1.
- §F.5 light-mode backup → documented in DESIGN.md (Task 7); architecture enabled by token-only inversion.
- §G motion (keep+unify) → existing motion untouched; no rewrite. *(Note: the shared-spring "unify" refactor is light and the existing `transition-params.ts`/`profileEnter` already centralize motion; deeper unification is deferred — not a new task here since the spec says "keep, don't rewrite.")*
- Tokens table, components-touched table, testing → covered across tasks; Task 13 runs the spec's manual matrix.

**Placeholder scan:** No "TBD"/"add error handling"/"similar to". Task 12 intentionally has a read-first step because the dev-playground registration API wasn't read during planning — the step names the exact pattern to follow rather than inventing one. Task 7 (DESIGN.md) is prose, not code, so it specifies required content rather than a code block.

**Type consistency:** `washForId`/`washIndexForId` names match between Task 4 def and Task 10 use. `buildHeaderVitals` matches Task 5 def and Task 9 use. `GlassCard`/`GlassSheet` match Task 6 def and Tasks 8/11/12 use. `Glass.{card,sheet,heart,chip}` and `DiscoverWashes`/`DARK_PAGE` match Task 3 defs and all consumers. Font family strings `'ClashDisplay-Bold'`/`'ClashDisplay-Semibold'` match Task 1 (`global.css`) and Task 2 (`_layout.tsx`).
