# Onboarding Wizard

Build a multi-step onboarding flow for new users. Existing UI components, validation, constants, and data mutations are already implemented — focus on wiring everything together and reusing the provided primitives.

## Goal

A user who has signed up but has not completed onboarding should be guided through the onboarding flow and, upon completion, be marked as onboarded and redirected to `/discover`.

---

## Core Requirements

### Wizard Flow

Create a multi-step onboarding experience with:

1. Basics
2. Compatibility
3. Lifestyle
4. Interests
5. Deal-breakers
6. Prompts
7. Photos
8. Extras (optional)
9. Review

Use a shared step shell that provides:

* Progress indicator
* Back / Next navigation
* Optional Skip button where applicable
* Validation before advancing

---

### Persistence

Progress should be saved as the user moves through the flow.

Requirements:

* Users can leave and return without losing progress.
* Refreshing the app should resume onboarding.
* Previously completed answers should be prefilled.
* `onboarding_complete` remains `false` until the final step.

---

### Step Details

#### 1. Basics

Collect:

* First name
* Pronouns (optional)
* Graduation year
* Major(s)
* Gender identity (optional)
* Sex assigned at birth (optional)

Display school information derived from the user's email, but do not allow editing.

#### 2. Compatibility

Collect roommate compatibility preferences such as:

* Sleep schedule
* Bedtime
* Wake-up time
* Cleanliness
* Noise preference
* Study style
* Guest frequency
* Social level
* Room temperature

These fields are required.

#### 3. Lifestyle

Collect:

* Alcohol preferences
* Smoking preferences
* Party habits
* Fitness habits

#### 4. Interests

Allow users to select interests.

Requirements:

* Minimum: 5
* Maximum: 10
* Show a live selection count

#### 5. Deal-breakers

Allow users to select any roommate deal-breakers.

#### 6. Prompts

Users should:

* Select 1–3 prompts
* Provide answers for each prompt

#### 7. Photos

Users should:

* Upload 1–6 photos
* Reorder photos
* Choose a primary photo automatically via ordering

Requirements:

* At least one photo is required
* Upload failures should show a clear retry path

#### 8. Extras (Optional)

Optional profile enhancements:

* Dorm preference
* Living program
* Clubs
* Instagram
* LinkedIn
* Phone number

Phone numbers should be clearly labeled as private and only shared after matching.

#### 9. Review

Show a preview of the completed profile.

Users should be able to return to previous steps and make edits before finishing.

---

## Completion Rules

Users cannot finish onboarding unless they have:

* First name
* Graduation year
* At least one major
* All compatibility fields completed
* 5–10 interests selected
* At least one prompt
* At least one photo

When onboarding is completed:

* Set `onboarding_complete = true`
* Redirect to `/discover`

---

## Routing

* Incomplete users should be routed to onboarding.
* Completed users should not be able to re-enter onboarding.
* Visiting `/onboarding` after completion should redirect to `/discover`.

---

## Reuse Existing Components

Use the provided:

* OptionGroup
* ScaleInput
* PhotoGrid
* Field
* Button

All option values should come from the shared profile constants.

Avoid duplicating controls or hardcoding option lists.

---

## Edge Cases

Ensure the flow handles:

* Refreshing mid-onboarding
* Returning later and resuming progress
* Validation before advancing
* Interest limits (5–10)
* Prompt limits (1–3)
* Photo limits (1–6)
* Removing the final photo
* Upload failures
* Loading and error states during saves

---

## Acceptance Criteria

* Progress is saved and resumable.
* Each step validates before advancing.
* Users cannot complete onboarding unless all required fields are present.
* Photo, prompt, and interest limits are enforced in the UI.
* Completing onboarding redirects the user to `/discover`.
* Completed users cannot re-enter onboarding.
* Existing components, constants, and mutations are reused throughout.

## Access Control

Users with `onboarding_complete = false` should not be able to access any core app functionality.

Requirements:

* Redirect incomplete users to `/onboarding` on app launch.
* Block access to:

  * Discover
  * Matches
  * Messages
  * Profile viewing
  * Any other authenticated app screens
* The onboarding flow should be the only accessible route until onboarding is completed.
* Once onboarding is completed, users are redirected to `/discover`.

---

## Resume Behavior

The onboarding flow should be fully resumable.

Requirements:

* Progress is saved after each completed step.
* Users can close the app and return later without losing progress.
* Refreshing the app should restore their previous state.
* On launch, automatically determine the first incomplete step and continue from there.
* Previously completed fields should be prefilled.
* Back navigation should never discard entered data.

Example:

* User completes Basics, Compatibility, and Lifestyle.
* User closes the app.
* On next launch, they are routed directly to Interests and continue onboarding from where they left off.

## Code Quality & Reusability

Build the onboarding flow with long-term reuse in mind.

Requirements:

* Prefer reusable components over step-specific implementations.
* Create shared components when a pattern appears more than once.
* Keep step components focused on presentation and user interaction.
* Extract business logic into hooks, utilities, or mutations where appropriate.
* Avoid large, monolithic screens.

Styling:

* Reuse existing utility classes wherever possible.
* For low-level UI elements (cards, buttons, containers, inputs, badges, etc.), use existing utility classes/components before creating new ones.
* If a new primitive is needed, make it generic enough to be reused elsewhere in the app.
* Maintain consistent spacing, typography, and interaction patterns across all onboarding screens.

Architecture:

* Keep data access outside of UI components.
* Continue using the existing mutation layer; do not make direct database calls from screens.
* Design step components so they can be reused later in profile editing flows.
* Favor composition and configuration over duplicated code.

Acceptance Criteria:

* No duplicated onboarding-specific UI primitives.
* Shared patterns are extracted into reusable components.
* Screens remain easy to maintain and extend.
* Adding, removing, or reordering a step requires minimal code changes.