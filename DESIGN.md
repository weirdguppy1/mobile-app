# DESIGN.md — Roommate Match (Dark Glass)

> _Move-in week energy after dark — a quiet near-black stage where the people, the cards, and a soft per-person color wash bring all the light._

A design system for a college roommate–finding app with a Hinge-style profile feed — you scroll a person's photos and prompt answers and like the _specific_ thing that catches you. It keeps the Partiful DNA — confident, slightly editorial, playful without being childish — but reissues it as a **dark-default, glassmorphic** system. The personality lives in the _content_ (faces, dorm photos, prompt answers, match moments, gradient washes); the _chrome_ (buttons, nav, structure) stays disciplined and achromatic — now light-on-dark.

> **Naming note:** "Roommate Match" is a placeholder. Tokens are defined in `src/global.css` (`@theme`) and mirrored in `src/constants/theme.ts`.

---

## Design intent

The trick is **restraint as a stage.** A near-black page makes the colorful stuff (photos, the per-person wash) glow, and the entire action hierarchy runs on light-on-dark contrast — no blue "primary" accent diluting it. That restraint reads as confident and modern.

Five principles:

1. **Dark stage, colorful content.** The canvas is a near-black `#0d0e12`. Color enters through profile photos and a soft **per-person mesh wash** behind the feed — never through UI chrome. Warmth comes from motion, rounded forms, and the people, not from a tinted page.
2. **Light-on-dark is the only action system.** Filled-light buttons, light headings, light icons. Resist making "Like" green or "Match" purple — semantic color is reserved for a _tiny_ set of like/match states (§7).
3. **Big, tight display type — sparingly.** Statement headlines run large in Clash Display with negative tracking. The display face is for **big titles only** (hero lines, the profile name). Everything else — body, labels, buttons, and **prompt answers** — is Satoshi.
4. **Prompts are the soul; glass is the surface.** The live experience is a calm vertical scroll through one person — full-bleed photos interleaved with **glass prompt cards** (a question + a characterful answer), where personality lives. The in-app interaction is scroll-and-like, never a swipe deck.
5. **Glass, not flat.** Cards, sheets, the like-heart, and the floating tab bar are **real frosted glass** (`expo-blur`), so the wash and photos read softly through the chrome and the whole UI feels layered and alive.

The emotional peak — a mutual match — lands like an RSVP confirmation: a small, joyful burst of warm color and confetti against the quiet dark.

---

## Color palette

The system is **achromatic by default** (a light-on-dark ramp) with color reserved for surfaces/imagery and a narrow band of semantic states. Token values live in `src/global.css` and `src/constants/theme.ts` (`Brand`).

### Core (the contrast system)

| Token        | Hex / value             | Role                                                                  |
| ------------ | ----------------------- | -------------------------------------------------------------------- |
| `--ink`      | `#f4f4f5`               | Primary text, filled CTA buttons, icon fills, headings. Light-on-dark _is_ the contrast system. |
| `--canvas`   | `#0d0e12`               | Page background + base surface; light button text (`text-canvas`).   |
| `--graphite` | `#d4d4dc`               | Strong secondary text.                                               |
| `--slate`    | `#b4b4bd`               | Tertiary / descriptive body copy.                                    |
| `--ash`      | `#9a9aa4`               | Muted captions, timestamps, inactive nav.                           |
| `--fog`      | `#6e6e77`               | Subheads, disabled labels.                                          |
| `--silver`   | `rgba(255,255,255,.14)` | Hairline borders.                                                   |
| `--hairline` | `rgba(255,255,255,.08)` | Dividers.                                                            |
| `--wash`     | `rgba(255,255,255,.05)` | Faint fills (e.g. empty photo slots).                              |

### Semantic — like & match states _only_

Reserve these for like feedback and match status. **Never** decorative or brand color anywhere else — this is the rule that keeps the app looking intentional.

| Token     | Hex       | Role                                              |
| --------- | --------- | ------------------------------------------------- |
| `--yes`   | `#31c431` | "Like" / mutual-match accent.                     |
| `--maybe` | `#ffae00` | Optional stronger like. Used rarely.              |
| `--pass`  | `#ff5a5a` | "Skip" state (lighter red reads better on dark). Used sparingly. |

### Per-person washes (Discover)

Each Discover profile gets a **different ambient mesh wash**, chosen deterministically from the profile id (`src/shared/lib/wash.ts`) so each person reads distinct and a card never flickers colors on scroll. The pool (`DiscoverWashes` in `theme.ts`) is a set of low-opacity radial-bloom stacks on `DARK_PAGE`; **peach-rose** is the signature. Apply via `experimental_backgroundImage` behind the feed; photos and glass cards stay the loudest things on screen.

**Discipline:** warm/pink tones now appear ambiently, so the **match moment** differentiates by intensity (a fuller, brighter warm wash + confetti), not by being the only warm thing. If you reach for a colored fill on a button, stop — the answer is light/dark. Green/amber/red outside a like or match interaction — stop.

---

## Typography

**Never use Inter or Space Grotesk — both overused.**

- **Clash Display** (`--font-display`, registered as `ClashDisplay-Bold` / `ClashDisplay-Semibold` from a single variable file) — the "moment" face. **Big titles only:** hero/entry lines, the profile name. Used via `prose-display` / `prose-title` (which carry an explicit bold weight so the variable font renders heavy).
- **Satoshi** (`--font-primary`) — everything read frequently: body, labels, buttons, inputs, navigation, and **prompt answers**.

> Keep it to these two families. Spend typographic boldness on the few big titles; let Satoshi do the quiet work everywhere else.

---

## Core components

### Profile (the centerpiece)

A single roommate as a **vertical scroll**, not a swipe card. A short header carries the **name** in Clash Display, with **year · major** beneath in `--graphite` (other traits — dorm, sleep, interests — live in chips and the detail sections, not the header). Below it, full-bleed **portrait photos** (`aspect-ratio 4/5`, rounded) alternate with **glass prompt cards**. Every photo and prompt carries its own **like** affordance.

### Prompt card (the personality unit)

A **glass card** (`GlassCard`): the **prompt question** in `--slate`, then a **short, characterful answer** in **Satoshi bold** (the display face is titles-only). The answer reserves right-edge clearance so the like-heart never overlaps the text.

### Like-heart

The per-element like affordance: a **frosted dark-glass circle** with a light outline heart icon, anchored bottom-right of a photo or prompt. **No color-fill state** — it does not turn green on tap. Tapping opens the like-sheet for that specific target.

### Like sheet / match modal

A **glass sheet** (`GlassSheet`, top-rounded, heavier blur) sliding up over the profile: the liked photo/prompt, an optional "Add a comment…" field, and a single light **Send like** CTA. The **"It's a match!"** modal is the emotional peak — a fuller warm wash backdrop, two overlapping profile photos, a big Clash headline, two stacked CTAs, and a single confetti burst exclusive to this moment.

### Buttons

**Full-pill.** Primary = filled `--ink` (light) with `--canvas` (dark) text. Ghost = transparent with a 1px hairline border. On a photo/wash hero, keep the light fill. Press → slight scale-down + spring (shared motion).

### Chips & tabs

Neutral glass pills (light translucent fill + hairline border) — **no decorative color**. Active tab/selected chip reads in `--ink`; the rest muted.

### Floating tab bar

A **frosted glass**, top-rounded floating bar (`expo-blur`) over the dark feed. Active tab in `--ink` + bold; inactive in `--ash`. Absolutely positioned so the scene flows behind it (immersive overlay).

### Empty / loading states

Dark, with a soft wash. A short, warm, directive line in the interface's own voice — "No new people right now. Widen your filters or check back after move-in lists update." An empty screen is an invitation to act, not a dead end.

---

## Imagery, icons & motion

**Photography.** Real, warm, candid student/dorm life. Profile photos are the loudest color on screen by design; keep UI around them quiet.

**Icons.** Filled/outline, mono-weight, 16–22px, `--ink` or `--canvas` only. No multicolor or gradient icons.

**Motion (keep + unify).** Deliberate and scarce, all sharing one spring feel:

- The primary interaction is a smooth **vertical scroll** through a person's photos and prompts — calm, unhurried.
- The like-heart gives an immediate lightweight scale-pop before the sheet slides up.
- Sending a like or skipping advances with a gentle fade + slight upward drift — grounded, not abrupt. Skipping eases the current profile away rather than flinging it.
- The match modal slides up, then a single confetti burst exclusive to that moment.
- Buttons scale-down/spring on press; toggles glide; inputs lift softly on focus; badges pulse subtly.
- Navigation transitions are smooth and directional; back reverses the motion. Toasts slide in from the bottom and exit cleanly.

All motion respects reduce-motion (falls back to instant/plain-fade); haptics still fire.

---

## Tokens — where they live

- **`src/global.css`** (`@theme`): color + font tokens (`--color-*`, `--font-*`), and the `@utility` classes (`prose-*`, `button-primary`, `card`, `field-input`, `option-chip`, etc.).
- **`src/constants/theme.ts`**: JS values for the few places that need them — `Brand` (color props like `placeholderTextColor`), `DARK_PAGE`, `DiscoverWashes` + `DiscoverWash`, `Glass` (blur recipes: `card` / `sheet` / `heart` / `chip`), and the legacy `MeshGradient`/`MeshBase` washes.
- **`src/shared/components/`**: `GlassCard`, `GlassSheet` (real `expo-blur` surfaces).
- **`src/shared/lib/wash.ts`**: deterministic per-profile wash picker.

---

## Light mode — future backup (NOT built)

Preserved so the explored light direction isn't lost. The token structure is semantic, so a light theme can later drop in via a token swap with no component changes. When implemented, use this map (validated in brainstorming as "cool, not clinical, not coffee"):

- **Page:** cool off-white `#f6f7f9` (deliberately not pure white — clinical — and not warm paper `#faf8f4` — reads coffee/editorial).
- **Cards:** white `#ffffff` lifting off the page via `shadow-card`; glass becomes a **light** frost (`rgba(255,255,255,0.55)` + blur).
- **Text ramp:** the original ink→silver ramp (`#000` / `#333` / `#666` / `#999` / `#ccc`).
- **Hairline:** `rgba(0,0,0,0.06)`.
- **Washes:** same per-person rotation, lighter alpha on the light base.
- **Heart:** white circle + ink outline (still no color-fill).
- Type, layout, pill buttons, photo treatment, and motion are identical to dark; only surface/glass/text tokens swap.

---

## Attribution & notes

- This system **adapts** Partiful's publicly visible design language (achromatic action system, gradient surface washes, large negatively-tracked display type) into an original spec for a roommate-matching app, reissued as a dark glass theme. It is not Partiful's own design file.
- Run a contrast check on any text placed over a wash or a photo, and verify focus states are clearly visible in the monochrome system — accessibility is the one place to add contrast the visual system wouldn't otherwise call for.
