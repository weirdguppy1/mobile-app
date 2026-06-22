# Onboarding Wizard Animation System

## Overview

The onboarding experience should feel like a smooth, guided conversation rather than a form. Animations should reinforce spatial flow, focus, and emotional clarity. 

use react-native-reanimated

If animations are used often, make them into components and store them into /src/shared/components/animations!!!!

Making these reuseable & keeping the code clean is VERY IMPORTANT!

---

## 1. Step-to-Step Transitions (Core Flow)

### Forward Navigation

* Current step slides slightly left + fades out
* Next step enters from right with subtle blur → sharp focus transition
* Uses spring easing (soft, natural deceleration)

### Back Navigation

* Reverse motion (left → right)
* Slightly slower easing than forward navigation for reflective feel

**Goal:** Establish a spatial sense of progression (moving through “layers” of onboarding).

---

## 2. Question Focus Animation

When a new step loads:

* Input field scales from 1.0-1.01 (“breathing in” effect)
* Helper text appears with delayed fade (150–250ms)
* Slightly fade the background that is the text field, return to normal when unfocused. 

**Goal:** Guide attention to the active question without overwhelming the user.

---

## 4. Progress Indicator Animation

### Progress Bar

* Smooth easing fill (avoid linear motion)
* Slight anticipation effect for the current dot step

**Goal:** Reinforce momentum and reduce perceived friction.

---

## 5. Background Context Shifts (Subtle Emotional Layer)

Background changes based on onboarding category:

* Lifestyle → warm tones
* Sleep habits → cool tones
* Social preferences → neutral tones

Transitions:

* Slow crossfade (600–1000ms) + very subtle gradient drift into place. 

**Goal:** Add emotional continuity between steps.

---

## 6. Input Confirmation Feedback

On submit/continue:

* Input field slightly compresses (“lock-in” effect)
* Checkmark or confirmation icon fades/slides in
* Next button activates with scale + opacity ramp

**Goal:** Provide clear feedback that input has been accepted.

---

## 7. Completion Animation

On finishing onboarding:

* Confetti for finnishing the process + uploaded profile. Wait for confetti to finish, then redirect. 
* After, soft upward lift + fade into the redirected screen

**Goal:** Create a satisfying transition into the main experience.

---

## Design Principles

look @ DESIGN.md

---

## Summary

The onboarding system should feel like a guided spatial journey:

* smooth transitions between steps
* gentle focus shifts
* meaningful selection feedback
* subtle emotional background changes
