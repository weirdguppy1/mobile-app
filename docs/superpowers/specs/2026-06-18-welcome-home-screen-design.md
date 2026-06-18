# Welcome / Onboarding Hero — Design Spec

_2026-06-18 · branch `feature/welcome-home-screen`_

## Goal

Replace the Expo boilerplate at `src/app/index.tsx` with a beautiful, on-brand
welcome/onboarding hero for the Tinder-style college roommate-matching app. The
screen is the first impression: it must land the product promise in one glance
and feel like the Partiful-lineage design system in `DESIGN.md` — **white stage,
colorful content, black is the only action color, big tight display type, the
tilted card stack is the soul.**

Scope is purely visual: mock card data, a CTA that navigates to a placeholder.
No auth/Supabase wiring.

## Visual composition (bottom → top of z-order)

1. **Mesh backdrop.** Soft `--grad-warm` radial-bloom wash (pink `#ffd6e8` →
   violet `#f8c4ff` → lavender `#e0c3fc` → peach `#ffe0c2` → magenta-rose
   `#f0b6e0` on `#fbe6f2`), bleeding from the top edge and dissolving into the
   white canvas before it reaches the CTA. Implemented with RN's
   `experimental_backgroundImage` stacked `radial-gradient(...)` strings (already
   proven in `components/animated-icon.tsx:122`). No linear gradients.

2. **Tilted card stack.** 3–4 scattered "polaroid" roommate cards at ±6–14°,
   ~0.92–1.0 scale, peeking in the upper ~45% of the screen. No profile photos
   exist in `assets/`, so each card face is its own mesh wash (warm / cool / mint
   from `DESIGN.md` §9) carrying an initial monogram + name + metadata line
   (`Maya · '28 · CS · night owl`). 12px radius, `--shadow-card`. This is the
   signature motif communicating "lots of potential people."

3. **Headline.** Space Grotesk display, ~52px, line-height ~0.92, tracking
   `-0.03em`, `--ink`: **"Find your people."** The one place we spend
   typographic boldness.

4. **Subcopy.** One Satoshi line, `--slate`: "Your college roommate, matched —
   not assigned."

5. **Primary CTA.** Filled `--ink` button, white text, 8px radius, no shadow,
   press → opacity 0.85 + slight scale-down: **"Get started."**

6. **Secondary action.** Ghost text link below: "I already have an account."

## Motion (Reanimated, already installed)

Staggered entrance after the splash overlay clears: cards drift/rotate in first
(stagger ~80ms each), then the headline rises + fades, then subcopy, then CTA.
Button has a press-scale micro-interaction. No confetti (reserved for the match
moment per `DESIGN.md`).

## Foundational changes

- **Fonts.** Satoshi (`assets/fonts/Satoshi.ttf`) and Space Grotesk
  (`assets/fonts/Space_Grotesk/static/*`) are not loaded yet. Load them with
  `expo-font` `useFonts` in `app/_layout.tsx`, rendering nothing until loaded
  (the existing `AnimatedSplashOverlay` covers the gap). Add `primary` (Satoshi)
  and `secondary` (Space Grotesk) entries to `Fonts` in `constants/theme.ts`.

- **Reusable pieces**, scoped under a `welcome` feature folder (per AGENTS.md
  feature-based architecture), kept small and single-purpose:
  - `MeshGradient` — wraps a `View` with a named mesh wash
    (`warm` / `cool` / `mint`) via `experimental_backgroundImage`, solid-color
    fallback baked into the gradient string's final layer.
  - `TiltedCard` — one roommate polaroid (mesh face + monogram + name + meta +
    rotation/scale props).
  - `WelcomeScreen` — composes backdrop + stack + copy + CTA.
  - `index.tsx` becomes a thin route that renders `WelcomeScreen`.

## Conventions honored

- TypeScript, explicit `interface` for props, no `any`.
- `StyleSheet.create` for styles (NativeWind/Uniwind not installed despite
  AGENTS.md mention — match the existing codebase, which uses StyleSheet).
- Import ordering and `@/` path aliases per AGENTS.md.
- Light/dark: the hero is intentionally a light-canvas screen (the design system
  is white-stage); it renders consistently regardless of system scheme rather
  than inverting, since the warm wash + black ink is the brand.

## Out of scope

Auth, Supabase, real profiles, the swipe deck itself, the dev playground route.
CTA destination is a placeholder route (or no-op) for now.
