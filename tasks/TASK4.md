# Onboarding Experience Redesign

## Goal

Transition onboarding from a multi-question form experience into a more immersive, full-screen, one-question-at-a-time flow.

The experience should feel closer to a guided roommate profile creation journey rather than a survey.

---

# Core Changes

## 1. One Question Per Screen

Move from displaying multiple questions or dense form layouts to showing a single question at a time.

Each question should become the primary focus of the screen.

### Requirements

- Display only one question per screen.
- Question should feel like the hero element of the page.
- Large typography.
- Generous whitespace.
- Avoid the feeling of a compact form stacked in the middle of the screen.

### Layout Principles

Question:

- Large, prominent typography.
- Positioned slightly above center.
- Easy to scan immediately.

Answers:

- Fill the available vertical space.
- Larger tap targets.
- Comfortable spacing.

The goal is for every screen to feel intentional and immersive.

---

## 2. Section-Based Progress

Progress should represent progress within the current section only.

### Example

Instead of:

```text
Overall Progress
████████░░░░░░░░
```

Show:

```text
Lifestyle Preferences
██████░░░░
```

### Requirements

- Progress bar resets when entering a new section.
- Users should not see total onboarding length.
- Users should only understand how much remains in the current category.
- Reduces survey fatigue.

---

## 3. Section Transition Screens

When moving between sections, insert an interstitial transition screen.

Current flow:

```text
Question
↓
Question
↓
Question
↓
New Section Questions
```

New flow:

```text
Question
↓
Question
↓
Question
↓
Section Transition Screen
↓
Next Section Questions
```

---

# Section Transition Design

Create a dedicated screen announcing the next section.

### Example

```text
Roommate Lifestyle Complete

Next:
Living Preferences
```

or

```text
Great.

Let's talk about your social habits.
```

---

### Visual Treatment

This screen should feel noticeably different from question screens.

Add support for:

- Mesh gradients
- Tone shifts
- Illustrations
- Category imagery
- Abstract roommate-themed visuals

Examples:

- Warm sunrise gradient
- Cozy room illustration
- Social-themed abstract shapes
- Clean minimal visual with soft motion

Purpose:

- Provide a mental reset.
- Break onboarding into digestible chapters.
- Create anticipation for the next section.

---

## 4. Full-Screen Utilization

Current onboarding screens leave too much unused space and resemble a form.

Refactor layouts so screens utilize available height more effectively.

---

## 5. Continue Button Overlay

Keep the existing bottom continue action.

Do not redesign the component.

Reuse the existing implementation.

### Requirements

- Continue area remains fixed to the bottom.
- Continue area overlays content.
- Continue area is always visible.
- Preserve current component structure.

---

### Visual Style

Use a blurred overlay treatment similar to the reference.

Requirements:

- Backdrop blur.
- Soft fade into content.
- Content can scroll underneath if needed.
- Feels integrated rather than detached.

Example behavior:

```text
Content
Content
Content

──────────────
Blur Overlay
[ Continue ]
──────────────
```

The continue container should feel like it floats above the onboarding experience.

---

## 6. Motion & Transitions

When navigating between questions:

### Question Transition

Current Question:

- Slight slide left.
- Fade out.

Next Question:

- Enter from right.
- Slight blur → sharp focus.
- Spring easing.

### Section Transition

Question Screen
→ Section Interstitial
→ Next Section

Should feel more significant than standard question transitions.

Potential additions:

- Mesh gradient shift.
- Subtle scale animation.
- Fade through color.
- Soft parallax motion.

---

# Design Goal

The onboarding experience should feel like:

- Creating a roommate profile
- Completing an interactive personality experience
- Progressing through chapters

It should not feel like:

- A survey
- A settings page
- A long form

Every screen should feel focused, immersive, and visually intentional while continuing to use the existing component system.

## 7. Reuse Existing Animation System

Do not introduce a new animation library, framework, or animation architecture.

The onboarding redesign should leverage the existing animation components, primitives, and transition patterns already present in the app.

### Requirements

- Reuse existing animation utilities wherever possible.
- Reuse existing spring configurations.
- Reuse existing screen transition patterns.
- Reuse existing shared motion components.
- Reuse existing blur and overlay implementations.
- Avoid creating onboarding-specific animation infrastructure unless absolutely necessary.

### Question Transitions

Implement the new one-question-at-a-time experience using the current animation system.

Desired behavior:

- Current question exits.
- Next question enters.
- Maintain consistency with existing app motion language.

### Section Transition Screens

Section interstitials should also use existing animation primitives.

Examples:

- Existing fade animations
- Existing slide transitions
- Existing scale transitions
- Existing mesh gradient animations
- Existing background tone transitions

### Design Principle

The onboarding experience should feel like a natural extension of the rest of the application.

Users should recognize the same motion language throughout the product rather than encountering a completely different animation style during onboarding.

Prioritize consistency over novelty.

## 8. Optional Questions

Some onboarding questions are optional and should clearly communicate that answering is not required.

Users should never feel blocked or forced to provide information they are uncomfortable sharing.

### Requirements

- Clearly label optional questions.
- Display an "Optional" indicator near the question title.
- Users should immediately understand that the question can be skipped.