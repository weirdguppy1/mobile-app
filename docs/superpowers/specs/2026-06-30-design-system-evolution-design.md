# Design System Evolution — "Dark Glass"

**Date:** 2026-06-30
**Status:** Approved (design)
**Supersedes/edits:** `DESIGN.md` (the system spec), `src/global.css` (tokens + utilities), `src/constants/theme.ts` (runtime values)
**Branch context:** continues `refactor/theme+colors`.

---

## Goal

Evolve the app's design system — not a single screen. Keep the Partiful DNA from `DESIGN.md` (restraint, color from content, big tight display type) but reissue it as a **dark-default, glassmorphic** system that feels premium and alive for Gen Z. The previous light "white stage" reads clinical; a warm-paper experiment read like a coffee/editorial brand; the resolution is a **dark glass** stage where color enters only through per-person gradient washes and the people themselves.

This pass delivers the **foundation + the reference surface** (Discover + Profile). Other screens are leveled up in later passes against this new foundation.

---

## Design direction (locked via visual brainstorming)

Direction was validated through ~12 mockup rounds in the visual companion. The decisions, in order they were settled:

1. **Direction:** keep the achromatic/editorial DNA, push it further (not a from-scratch rethink).
2. **Surface feel:** rejected pure-white (clinical) and warm-paper (coffee/editorial). Landed on **dark**.
3. **Moment font:** Space Grotesk retired (overused, like Inter). **Clash Display** chosen — and restricted to **big titles only**.
4. **Color energy:** comes from per-person gradient washes + the photos, never from decorative chrome color. Invented decorative stickers rejected (no data behind them).
5. **Glass:** **strong** glassmorphism on cards, real (not faked).
6. **Theme:** **dark is the default and only theme** in this pass.
7. **Photos:** tall ~4:5 portrait, full-bleed, no caption, no tag.

---

## The System

### A — Theme & surfaces

- **Dark is the default and only theme this pass.** Tokens stay structured (semantic names, not raw hex at call sites) so a light theme can be dropped in later by swapping a token map — no component changes.
- **Light mode is preserved as a documented backup** (see "Light mode — future backup" below), not built now.
- **Page:** `#0d0e12`. **Primary text:** `#f4f4f5`. **Secondary text:** `#b4b4bd`. **Tertiary/muted:** `~#9a9aa4`.
- **Hairlines / dividers:** white at low alpha (`rgba(255,255,255,0.07)`).
- **Cards are strong glass** (see C): translucent fill, heavy blur + saturate, 1px top-highlight border; the ambient wash reads *through* the card.
- The existing achromatic intent is preserved — chrome is monochrome (now light-on-dark); saturated color appears only in washes, photos, and the match moment.

### B — Per-person rotating wash

(See memory: `discover-rotating-wash`.)

- Each **Discover** profile gets a **different ambient mesh wash**, rotating per person, so browsing feels lively and each person reads as distinct.
- **Peach-rose** is the confirmed favorite (warm peach + rose radial blooms). Rotation pool = the candidate blends explored (periwinkle, pink·violet·periwinkle, peach·rose, mint·aqua, lavender·lilac, sky·mint, indigo·violet, teal·lavender, rose·lilac, iris·cotton-candy, sky·periwinkle·mint).
- Washes are **low-opacity glows** behind the header/feed, composited via the existing `experimental_backgroundImage` + `MeshGradient` mechanism, retuned for the dark base. Photos + glass cards stay the dominant elements.
- Selection should be **stable per profile** within a session (e.g. deterministic from the profile id, not re-randomized every render) so a card doesn't flicker colors on scroll.
- Semantic warm hues now appear ambiently, so the **match moment differentiates by intensity** (fuller, brighter warm wash + confetti), not by being "the only warm thing."

### C — Glass (real glassmorphism)

- **Real blur via `expo-blur` `BlurView`**, not a translucent fill faking it. CSS `backdrop-filter` does not exist in React Native.
- **Intensity: strong** — translucent, wash reads clearly through, blur + saturate, 1px top-highlight border, soft drop shadow.
- **Scope:** glass prompt cards, the **like-sheet**, the **match modal**, menus, and the **floating bottom tab bar**. The like-heart is a frosted dark-glass circle. Chips are lighter glass.
- **New shared primitives:**
  - `GlassCard` — wraps `BlurView` with the standard tint/intensity/border/radius/shadow. Used by prompt cards and detail sections.
  - `GlassSheet` — bottom-sheet/modal surface (like-sheet, match modal) with grab handle and top-rounded glass.
  - Both live in `src/shared/components/` and are registered in the dev playground.
- **Perf (known risk, accepted):** multiple live `BlurView`s on a scrolling feed can jank on lower-end Android. Mitigations: keep blurred surfaces count-bounded per screen, and allow a **fallback to a tinted opaque fill** on low-end Android (feature flag / platform check) without changing layout. Profile before shipping widely.

### D — Typography

- `--font-display` → **Clash Display**, used **only for big titles** (hero lines, profile name). Everything else — body, labels, buttons, inputs, nav, **and prompt answers** — is **Satoshi** (`--font-primary`).
  - This **corrects `DESIGN.md`**, which currently sets prompt answers in the moment font.
- Install Clash Display into `/assets/fonts`; wire into the font loader and `--font-display`. **Retire** `SpaceGrotesk-Bold` / `SpaceGrotesk-Medium`.
- Scale stays confident-not-maximalist (name ≈30px, hero ≈44px).

### E — Profile / Discover surface

- **Photos:** tall ~4:5 portrait, full-bleed, rounded (~18px), **no caption, no decorative tag**.
- **Header:** **year · major only** (e.g. "Freshman · Undeclared"). Other traits (sleep schedule, dorm, interests) live in chips + the detail section below.
- **Prompt cards:** strong-glass `GlassCard`; question in muted text, answer in **Satoshi bold** with right-clearance so the heart never overlaps text.
- **Like-heart:** frosted dark-glass circle with the outline 🤍, consistent on photos and prompts. **No color-fill state** (no green-on-tap).
- **Chips:** neutral light-glass pills (no decorative color — semantic colors stay like/match only).

### F — Components & tokens

- **Buttons:** full-pill. Primary = solid (white-on-dark for high-contrast CTA); ghost = 1px hairline border.
- Inputs, tabs, dropdowns inherit the dark + glass treatment.
- **Semantic** `yes`/`maybe`/`pass` reserved for like/match only (unchanged rule, new context).

### F.5 — Light mode — future backup (NOT built this pass)

Preserved so the explored light direction isn't lost. When light mode is implemented later, use this token map (validated in brainstorming as the "cool, not clinical, not coffee" direction):

- **Page:** cool off-white `#f6f7f9` (deliberately *not* pure white — clinical — and *not* warm paper `#faf8f4` — reads coffee/editorial).
- **Cards:** white `#ffffff`, lifting off the page via `shadow-card`; border optional. Glass cards become a **light** frost (`rgba(255,255,255,0.55)` + blur) rather than dark glass.
- **Text ramp:** the existing ink→silver achromatic ramp (`#000` / `#333` / `#666` / `#999` / `#ccc`).
- **Hairline:** `rgba(0,0,0,0.06)`.
- **Washes:** same per-person rotation, retuned to low-opacity blooms on the light base (lighter alpha than dark).
- **Heart:** white circle + ink outline 🤍 (no color fill, same rule).
- Type, layout, pill buttons, photo treatment, motion — all identical to dark; only the surface/glass/text tokens swap.

Architecturally this is enabled by the semantic-token structure in §A. No implementation work in this pass beyond keeping call sites token-driven.

### G — Motion (keep + unify)

- Do **not** rewrite `DESIGN.md` §motion. Define **one shared spring config** (a token/util) so presses, sheet slide-ups, profile transitions, and the like-pop share consistent physics.
- Respect `useReducedMotion()` (instant/plain-fade fallback) everywhere; haptics unaffected.
- The in-flight `2026-06-30-discover-profile-design-polish` motion wave (haptics, scale-pop, skip-exit drift, match confetti) **stands** and is unified under the shared spring.

---

## Token changes (`src/global.css` + `src/constants/theme.ts`)

| Token | Before | After |
|---|---|---|
| page background | `--color-background: #ffffff` | dark `#0d0e12` |
| `--color-canvas` | `#ffffff` (page & card) | card = glass; base `#0d0e12` family |
| text ramp | ink/graphite/slate on white | `#f4f4f5` / `#b4b4bd` / `#9a9aa4` on dark |
| `--color-hairline` | `rgba(0,0,0,.06)` | `rgba(255,255,255,.07)` |
| `--font-display` | `SpaceGrotesk-Bold` | `Clash Display` |
| prompt answer face | moment font | Satoshi (via utility) |
| card surface | `card` = white + silver border | `GlassCard` (BlurView) |
| button radius | mixed 8px / pill | full-pill |

New: glass tint/intensity constants in `theme.ts` (BlurView needs JS values); `MeshGradient` rotation pool retuned for dark; shared spring config.

---

## Components touched / created

| File | Change |
|---|---|
| `DESIGN.md` | Rewrite to the Dark Glass system (this spec is the source of truth) |
| `src/global.css` | Dark + glass tokens, retune utilities (prose-*, card, chips, buttons), font-display → Clash |
| `src/constants/theme.ts` | Dark color values, glass constants, dark-retuned `MeshGradient` pool, spring config |
| `assets/fonts` + font loader | Add Clash Display; remove Space Grotesk |
| `src/shared/components/GlassCard.tsx` | **new** — BlurView card primitive |
| `src/shared/components/GlassSheet.tsx` | **new** — BlurView sheet/modal primitive |
| `src/shared/lib/wash.ts` (or similar) | **new** — per-profile deterministic wash selection |
| `src/features/profile/components/ProfileView.tsx` | Dark + glass re-skin, taller photos, header = year·major, glass prompt cards |
| `src/features/profile/components/ReadOnlyPromptCard.tsx` | Use `GlassCard`, answer in Satoshi |
| `src/features/discovery/components/RequestHeart.tsx` | Frosted glass heart, no color-fill |
| `src/app/(app)/(main)/discover.tsx` | Rotating wash per profile; dark states |
| `src/app/(app)/(main)/_layout.tsx` | Frosted floating glass tab bar |
| `src/app/dev/components.tsx` | Register GlassCard, GlassSheet, glass heart (per CLAUDE.md dev-route rule) |
| `package.json` | add `expo-blur` |

---

## Testing

- **Type gate:** `tsc --noEmit` must pass (lint infra broken per project memory; tsc is the gate).
- **Unit:** `wash.ts` deterministic selection (same profile id → same wash) gets a focused test. Glass primitives are presentational.
- **Manual (dev playground + Discover/Profile):** verify (1) dark theme renders across Discover + Profile, (2) each profile shows a different wash, stable on scroll, (3) glass cards/sheet/tab bar blur correctly on iOS, (4) text legible over the busiest washes, (5) Clash only on titles / Satoshi elsewhere, (6) like-heart has no color-fill, (7) reduce-motion fallback, (8) low-end Android fallback path renders without layout shift.

---

## Risks / notes

- **`expo-blur` is a native module** — requires a dev-client rebuild, not just a Metro reload.
- **Strong glass on a scrolling feed** is the main perf risk; tinted-fill fallback on low-end Android is the escape hatch.
- **Dark-only** now; light theme is explicitly out of scope but tokens stay themeable.
- **Rotating warm washes** soften the historical "warm = match" cue; match moment compensates with intensity + confetti.
- **Shared `ProfileView`** powers Discover, `/u/[id]`, and self-preview — the dark/glass re-skin affects all three; verify each.
- Propagating to the remaining screens (auth, onboarding, messages, home, settings) is **deferred** to follow-up passes against this foundation.
