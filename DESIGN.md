# DESIGN.md — Roommate Match DESIGN STARTER

> _Move-in week energy on a clean white canvas — the interface stays calm and bright while the people, the cards, and the matches bring all the color._

A design system for a college roommate–finding app with a Hinge-style profile feed — you scroll a person's photos and prompt answers and like the _specific_ thing that catches you — built in the spirit of **Partiful**: confident, slightly editorial, playful without being childish. The whole personality lives in the _content_ (faces, dorm photos, prompt answers, match moments, gradient washes) while the _chrome_ (buttons, nav, structure) stays disciplined black-and-white.

> **Naming note:** "Roommate Match" is a placeholder — swap in your real product name throughout. Tokens are framework-agnostic; a CSS-variable starter block is at the bottom.

---

## Design intent

Partiful's core trick is **restraint as a stage**. A near-white page makes the colorful stuff (event photos, tilted invite cards) pop, and the entire action hierarchy runs on pure black-on-white contrast — no blue "primary" accent diluting it. That restraint reads as confident and modern rather than corporate.

Five principles carry over, reframed for roommate matching:

1. **White stage, colorful content.** The canvas is white. Color enters only through profile photos, dorm shots, and the gradient washes behind hero/empty states. Never let UI chrome compete with a person's face.
2. **Black is the only action color.** Filled-black buttons, black borders, black headings. Resist the urge to make "Like" pink or "Match" purple — semantic color is reserved for a _tiny_ set of like/match states (§7).
3. **Big, tight display type.** Statement headlines run large with negative letter-spacing for an editorial density most apps don't have. This is the signature — spend your typographic boldness here.
4. **Prompts are the soul; the tilted-card stack is the signature.** The live experience is a calm vertical scroll through one person — full-bleed photos interleaved with **prompt cards** (a question + a big, characterful answer), which is where personality actually lives. Partiful's scattered ±10–15° invitation cards stay on as your _visual_ signature in onboarding, marketing, and empty states — a physical-feeling pile of polaroids of potential roommates — but the in-app interaction is scroll-and-like, never a swipe deck.
5. **Playful, not juvenile.** Rounded geometric display letterforms and confetti-on-marble lightness signal fun; tight tracking and a monochrome action system keep it from tipping into "kiddie app."

The feeling at the emotional peak — a mutual match — should land like Partiful's RSVP confirmation: a small, joyful, well-earned burst of color against the quiet.

---

## Color palette

The system is **achromatic by default** with color reserved for surfaces, imagery, and a narrow band of semantic states.

### Core (the contrast system)

| Token        | Hex       | Role                                                                                                           |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------- |
| `--ink`      | `#000000` | Primary text, filled CTA buttons, icon fills, card borders, headings. Black-on-white _is_ the contrast system. |
| `--canvas`   | `#ffffff` | Page background, card surfaces, button text on dark, nav surface.                                              |
| `--graphite` | `#333333` | Secondary text (e.g. profile metadata: major, dorm, year).                                                     |
| `--slate`    | `#666666` | Tertiary / descriptive body copy, helper text.                                                                 |
| `--ash`      | `#999999` | Muted captions, timestamps, attribution.                                                                       |
| `--fog`      | `#b3b3b3` | Section subheads, disabled labels.                                                                             |
| `--silver`   | `#cccccc` | Hairline borders, disabled button fills.                                                                       |

### Semantic — like & match states _only_

Reserve these for like feedback and match status. **Never** use them as decorative or brand color anywhere else (this is the rule that keeps the app looking intentional).

| Token     | Hex       | Role                                                                        |
| --------- | --------- | --------------------------------------------------------------------------- |
| `--yes`   | `#31c431` | "Like" accent — the heart on a photo or prompt; also the mutual-match accent. |
| `--maybe` | `#ffae00` | "Rose / standout" — an optional stronger like on a prompt. Used rarely.       |
| `--pass`  | `#ff0000` | "Skip" state — dismissing a person. Used sparingly: a thin ring or icon, never a full red panel. |

### Surface gradients (backgrounds & overlays only — never on a button or text)

These are **soft mesh gradients** — not linear ramps. Each is a stack of 4–5 low-contrast radial blooms dropped at off-grid positions, settling onto a base color (the last layer in the `background` shorthand). The blobs overlap and bleed into one another so the wash feels organic and a little unpredictable, like watercolor on the white stage rather than a mechanical fade. **No linear gradients anywhere in the system.**


| `--grad-warm` | pink `#ffd6e8` · violet `#f8c4ff` · lavender `#e0c3fc` · peach `#ffe0c2` · magenta-rose `#f0b6e0`, on `#fbe6f2`                    | Hero/onboarding wash, announcement strip, "It's a match!" backdrop. The signature pink-violet bloom — the one place saturated color fills a surface.                                         |
| `--grad-cool` | faint periwinkle blooms `#96c4ff` · `#c4d6ff` · `#b4c8ff` · `#d6e4ff` (hex8 — last two digits carry the low opacity), on `#ffffff` | Alternating section bands and empty states — soft periwinkle clouds dissolving into white so the section appears to lift off the page. Keep the blobs low-opacity; this wash should whisper. |
| `--grad-mint` | mint `#a8e6d0` · teal `#85dadc` · seafoam `#b8f0e0` · pale aqua `#d6f5ee`, on `#c0e2e2`                                            | Optional decorative wash inside profile-card backgrounds or category tiles.                                                                                                                  |

**Mesh discipline:** the radial-bloom positions are intentionally irregular — feel free to jitter the `at x% y%` anchors per instance so repeated surfaces don't look stamped from one template. Keep each bloom soft-edged (fade to `transparent` well before the next blob's center) so seams never read as hard bands. Full layer stacks live in §9.

**Palette discipline:** if you're reaching for a colored fill on a button, stop — the answer is black. If you're reaching for green/amber/red outside a like or match interaction, stop — those belong to those states.

---

## Typography

### Faces

**Never use Inter font. It is overused.**

Space Grotesk (Fontshare): This is your moment font (in /assets/fonts). It should only appear when the UI is trying to make someone feel something immediately.

If it’s one big number or one big word → Space Grotesk

Hero headers / entry screens
event title screens
onboarding (“Find your people”)
empty states (“No invites yet”)

Use Satoshi (in /assets/fonts) for other as the primary font for all core UI text including body, labels, buttons, inputs, navigation, and any content that is read frequently.

In Tailwind/Uniwind:
Satoshi is font-primary
Space Grotesk is font-secondary

> Keep it to these two families. A variable-weight text face lets the whole UI run through one family — regular for prose, heavier for emphasis and headings.

--- 

## Core components

### Profile (the centerpiece)

A single roommate presented as a **vertical scroll**, not a swipe card. A short header carries the **name** in display face (24–28px) with **year · major · dorm preference · sleep schedule** beneath in 14px `--graphite`. Below it, full-bleed photos (`border-radius: 12px`, `--shadow-card`) alternate with **prompt cards** down the page; you read one person top-to-bottom, and reaching the end advances to the next. There is no deck and no drag. Every photo and every prompt carries its own **like** affordance, so you respond to the _specific_ thing that resonates — the core Hinge mechanic. Keep all chrome quiet so the photos stay the loudest color on screen (§1).

- **Per-element like:** a heart anchored bottom-right of each photo and prompt — white circle, `--shadow-sm`, a mono-weight `--ink` icon that fills `--yes` once tapped.
- **Photo caption scrim:** if a caption sits on a photo, lay a bottom-up dark scrim (`transparent → rgba(0,0,0,0.55)`) behind it so white text stays legible over any image.

### Prompt card (the personality unit)

The Hinge signature, and where the **moment font earns its keep.** A white card (`--r-card`, `--shadow-card`, generous padding): the **prompt question** in `--slate` 14px (e.g. "My ideal roommate Sunday," "A green flag in a roommate," "We'll get along if…") sits above a **short, characterful answer** set large in Space Grotesk (24–28px, tight tracking). Keep answers to a sentence or two and let the type do the work. A heart in the bottom-right likes this specific answer.

### Like sheet (with optional comment)

Tapping a heart opens a bottom sheet showing the liked photo or prompt, an optional **"Add a comment…"** field, and a single black **Send like** CTA. A like _with_ a comment is the warmest signal in the app — encourage it, never require it. It slides up from the bottom (§ motion) with `--r-modal` top corners.

### Skip control

Dismissing a whole person is one circular button — white fill, `--shadow-lg`, ~56px, ✕ in `--pass`, pinned bottom-left or in the profile header. No row of swipe buttons: the only ways forward are "like something" or "skip this person," and the per-element heart is the center-stage action.

### "Likes you" inbox

The list that drives matches: people who liked one of your photos or prompts. Each entry shows _what_ they liked (a snippet in a `rgba(0,0,0,0.05)` quote block) plus any comment, on a `--r-card` / `--shadow-card` surface; a `--yes` "New" pill marks fresh likes. Liking someone back from here creates the match.

### Primary CTA button

`background: --ink; color: --canvas; border-radius: 8px; padding: 10px 24px;` text face 700 at 14px, `-0.04em`. On a photo/gradient hero, invert: white fill, black text. Hover/press → opacity 0.85. **No shadow** in default state.

### Ghost / secondary button

Transparent fill, `1px solid --ink`, black text, 8px radius (or 4px for nav-bar placement). Text face 550 at 16px. For "Skip," "Edit profile," secondary header actions.

### Match-status pill / badge

Full-pill radius, `background: rgba(0,0,0,0.05)`, text `--ink` 12px text face 700, padding 6px 12px. Semantic variants for connection state — _New match_ uses `--yes` fill with white text; everything else stays neutral grey.

### "It's a match!" modal

The emotional peak — fired when you like someone back (from "Likes you," or you each liked the other's content). Give it the full `--grad-warm` backdrop (the one place saturated pink fills chrome). Two profile photos as overlapping circles, a big display-face headline ("You both said yes!"), and two stacked black CTAs ("Send a message" / "Keep browsing"). 16px modal radius. A brief confetti burst is on-brand here — keep it to this moment only.

### Filter / tab selector

Pill container `background: rgba(0,0,0,0.05)`, full-pill radius; active tab = white fill + `--shadow-sm`. Text face 550 at 14px, padding 8px 16px. For "Year," "Same dorm," "Sleep schedule," etc.

### Profile / form inputs

8px radius, `1px solid --silver`, 16px text. Label above in 12px `--graphite`. Focus → `1px solid --ink` (no colored focus ring — keep the monochrome system, but ensure the focus state is clearly visible for accessibility).

### Empty / loading states

Wrap in `--grad-cool`. A short, warm, directive line in the interface's own voice — "No new people right now. Widen your filters or check back after move-in lists update." An empty screen is an invitation to act, not a dead end.

---

## Imagery, icons & motion

**Photography.** Real, warm, candid student/dorm life — natural light, a little grain, genuine energy. Profile photos are the loudest color on screen by design; keep UI around them quiet.

**Tilted-card motif.** The scattered ±10–15° card stack lives in onboarding, marketing, and empty states to communicate "lots of potential people" — it's the visual signature tying you to the Partiful lineage. It stays a _visual_ motif only; the live experience is the scrolling profile (see Core components → Profile), not a deck.

**Icons.** Filled, mono-weight, 16–20px, `--ink` or `--canvas` only. No multicolor or gradient icons. No decorative SVG patterns.

**Motion.** Deliberate and scarce:

The primary interaction is a smooth **vertical scroll** through a profile's photos and prompts — light momentum, no snapping; reading a person should feel calm and unhurried. Photos and prompt cards may rise in subtly as they enter the viewport. Tapping a heart gives an immediate, lightweight scale-pop on the icon before the like sheet slides up.

Sending a like or skipping a person advances to the next profile with a gentle fade and a slight upward drift — grounded, not abrupt. Skipping should ease the current profile away rather than fling it.

Match events should feel special. The match modal should slide in from the bottom with a quick ease-out transition, followed by a single confetti burst animation that is exclusive to this moment. Profile transitions should use shared element animation, especially when expanding an avatar into a full profile view.

Micro-interactions should reinforce responsiveness throughout the UI. Buttons should slightly scale down on press and spring back. Toggles should glide smoothly with inertia. Inputs should softly lift and glow on focus without distracting from content. Badges and unread indicators should use subtle pulsing or scale “pop” effects to draw attention without noise.

Navigation transitions should remain smooth and directional, with tabs sliding horizontally and screens transitioning with soft fade and movement. Back navigation should reverse the motion to preserve spatial consistency.

Notifications and toasts should slide in from the bottom with a light bounce and exit cleanly without lingering. Reaction feedback, such as likes, should use small, lightweight scale or fade bursts rather than heavy particle effects.

---

## CSS custom properties — starter block (not set in stone)

```css
:root {
  /* Core */
  --ink: #000000;
  --canvas: #ffffff;
  --graphite: #333333;
  --slate: #666666;
  --ash: #999999;
  --fog: #b3b3b3;
  --silver: #cccccc;

  /* Semantic — like/match states ONLY */
  --yes: #31c431;
  --maybe: #ffae00;
  --pass: #ff0000;

  /* Surface gradients — soft mesh, backgrounds/overlays only (apply via `background: var(--grad-*)`) */
  --grad-warm:
    radial-gradient(at 12% 18%, #ffd6e8 0px, transparent 55%),
    radial-gradient(at 78% 12%, #f8c4ff 0px, transparent 50%),
    radial-gradient(at 88% 72%, #e0c3fc 0px, transparent 55%),
    radial-gradient(at 24% 84%, #ffe0c2 0px, transparent 50%),
    radial-gradient(at 50% 48%, #f0b6e0 0px, transparent 60%), #fbe6f2;
  --grad-cool:
    radial-gradient(at 18% 22%, #96c4ff 0px, transparent 55%),
    radial-gradient(at 82% 16%, #c4d6ff 0px, transparent 50%),
    radial-gradient(at 70% 80%, #b4c8ff 0px, transparent 55%),
    radial-gradient(at 30% 88%, #d6e4ff 0px, transparent 50%), #ffffff;
  --grad-mint:
    radial-gradient(at 16% 20%, #a8e6d0 0px, transparent 55%),
    radial-gradient(at 80% 14%, #85dadc 0px, transparent 50%),
    radial-gradient(at 86% 78%, #b8f0e0 0px, transparent 55%),
    radial-gradient(at 26% 82%, #d6f5ee 0px, transparent 50%), #c0e2e2;

  --font-primary:
    "Satoshi";
  --font-secondary:
    "Space Grotesk";

  /* Type — scale (size / line-height / tracking) */
  --display-xl: 112px;
  --display-xl-lh: 0.85;
  --display-xl-ls: -0.03em;
  --display: 48px;
  --display-lh: 1;
  --display-ls: -0.02em;
  --heading-lg: 36px;
  --heading-lg-lh: 1.2;
  --heading-lg-ls: -0.04em;
  --heading: 24px;
  --heading-lh: 1.2;
  --heading-ls: -0.04em;
  --heading-sm: 18px;
  --heading-sm-lh: 1.4;
  --heading-sm-ls: -0.02em;
  --body: 16px;
  --body-lh: 1.4;
  --body-ls: -0.02em;
  --caption: 12px;
  --caption-lh: 1.2;
  --caption-ls: -0.02em;

  /* Weights */
  --w-regular: 400;
  --w-medium: 550;
  --w-emphasis: 650;
  --w-bold: 700;
  --w-display: 825;

  /* Spacing */
  --space-4: 4px;
  --space-8: 8px;
  --space-10: 10px;
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  --space-40: 40px;
  --space-60: 60px;
  --space-80: 80px;
  --section-gap: 80px;
  --gutter: 20px;
  --page-max: 1200px;

  /* Radius */
  --r-pill: 9999px;
  --r-nav: 4px;
  --r-button: 8px;
  --r-card: 12px;
  --r-modal: 16px;

  /* Elevation */
  --shadow-sm: rgba(0, 0, 0, 0.1) 0px 0px 6px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.1) 0px 0px 20px 0px;
  --shadow-card:
    rgba(0, 0, 0, 0.05) 0px 0.8px 2.4px -0.6px,
    rgba(0, 0, 0, 0.05) 0px 2.4px 7.2px -1.25px,
    rgba(0, 0, 0, 0.05) 0px 6.4px 19.1px -1.875px,
    rgba(0, 0, 0, 0.05) 0px 20px 60px -2.5px;
}
```

---

## 10. Attribution & notes

- This system **adapts** Partiful's publicly visible design language (achromatic action system, gradient surface washes, tilted-card motif, large negatively-tracked display type) into an original spec for a roommate-matching app. It is not Partiful's own design file.
- Run a contrast check on any text placed over photos (the card scrim handles this) and verify focus states are visible despite the monochrome system — accessibility is the one place to add a little ink the visual system wouldn't otherwise call for.
