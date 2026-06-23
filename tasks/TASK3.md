# Task: Convert Living Habits Onboarding Into a Roommate Simulation

## Goal

Keep the existing visual design system, styling, typography, colors, and components.

Do not redesign onboarding from scratch.

Instead, transform the interaction model from a multi-question form into a roommate simulation that presents one concept at a time.

---

## Current Problem

The current screen displays multiple sections simultaneously:

* Sleep schedule
* Bedtime
* Wake-up time
* Cleanliness
* Noise preference

This creates the feeling of filling out a survey.

Users scan, evaluate, and complete fields rather than engaging with the experience.

---

## New Experience

Only show a single concept on screen at a time.

Instead of presenting all living habits at once, guide users through a sequence of roommate scenarios.

---

## Example Flow

### Question 1

🌅

The alarm goes off.

When are you usually waking up?

* Before 7am
* 7–8am
* 8–9am
* After 9am

Selecting an option automatically advances.

---

### Question 2

🌙

After a typical day, when are you usually asleep?

* Before 10pm
* 10–11pm
* 11pm–12am
* After midnight

Selecting an option automatically advances.

---

## Design Requirements

### Keep Existing Components

Reuse existing:

* Choice chips
* Buttons
* Progress indicator
* Typography
* Layout system

Do not introduce an entirely new visual language.

---

### One Question On Screen @ a time. 

Each onboarding step should focus on a single concept.

The user should never see multiple preference categories simultaneously.

---

### Large Context Header

Each screen should contain:

* Large emoji or visual cue (optional)
* Scenario-based prompt
* Answer choices

Example:

🌅

The morning alarm goes off. What time is it?

This creates a roommate simulation rather than a questionnaire.

---

### Smooth Transitions

After selecting an answer:

* Brief selection animation
* Slide to next question
* Preserve momentum

Target feeling:

"conversation"

not

"form submission"

---

## Success Criteria

Users should feel like they are:

* Describing their lifestyle
* Imagining roommate situations
* Progressing through a story

Users should not feel like they are:

* Completing a settings page
* Filling out a profile form
* Entering data into a database

The onboarding should feel like a guided roommate simulation while preserving the existing visual design system.