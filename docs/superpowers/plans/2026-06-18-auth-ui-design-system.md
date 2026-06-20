# Auth UI Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace repeated Uniwind class strings with custom utility classes, switch sign-up + welcome to `SafeAreaView` (edge-to-edge backgrounds preserved), split the sign-up flow into per-step components backed by a Zustand store, and add the CLAUDE.md-mandated `/app/dev` route group.

**Architecture:** Typography/component looks become `@utility` classes in `src/global.css` (composed via `@apply` over Tailwind's default size steps). The sign-up screen becomes a thin orchestrator over four step components that share a feature-scoped Zustand store; async OTP calls live in a `use-sign-up` hook. A `__DEV__`-gated `app/dev` route group showcases utilities and screens.

**Tech Stack:** Expo Router 56, React Native, TypeScript, Uniwind (Tailwind v4), Zustand 5, react-native-safe-area-context 5, react-native-reanimated 4, Zod.

## Global Constraints

- TypeScript only. **Never `any`, never `@ts-ignore`.** (CLAUDE.md)
- **No arbitrary font sizes** (`text-[40px]` etc.). Use Tailwind default size steps only. (user)
- **No new shared React components.** Reuse `TextField`, `PressScale`, `FadeIn`; everything else becomes a utility class. (user)
- **SafeAreaView only on sign-up (and the new dev screens).** Backgrounds stay edge-to-edge: a full-bleed `bg-canvas` `View` with `SafeAreaView` wrapping only the content. **Home and welcome keep their className insets** (`pt-safe` / `pb-safe-offset-*`) — do NOT add SafeAreaView to them. (user)
- Feature-based architecture; imports ordered React → RN → third-party → `@/` → relative. (CLAUDE.md)
- Zustand = client state only; server calls stay out of store state. (CLAUDE.md)
- All work on `feature/auth`. **Never commit to `main`.** (CLAUDE.md)
- Verification per task: `npx tsc --noEmit` clean + `npm run lint` clean. Visual checks happen in `/app/dev` once it exists (Task 9).

---

## File Structure

**New files**
- `src/features/auth/store/sign-up-store.ts` — flow client state (step, phase, fields, errors) + setters/reset.
- `src/features/auth/hooks/use-sign-up.ts` — navigation + async OTP orchestration (reads store via `getState()`).
- `src/features/auth/components/steps/campus-step.tsx`
- `src/features/auth/components/steps/email-step.tsx`
- `src/features/auth/components/steps/review-step.tsx`
- `src/features/auth/components/steps/verify-step.tsx`
- `src/app/dev/_layout.tsx` — `__DEV__` redirect gate + Stack.
- `src/app/dev/index.tsx` — dev menu.
- `src/app/dev/components.tsx` — utility/component gallery.
- `src/app/dev/screens.tsx` — screen previews.

**Modified files**
- `src/global.css` — tokens + utility classes.
- `src/shared/components/text-field.tsx` — adopt `field-input`/`prose-label`/`prose-footnote`.
- `src/features/auth/components/otp-input.tsx` — char uses `font-display text-2xl`.
- `src/features/auth/components/university-combobox.tsx` — `dropdown`/`card`/`prose-*`/`bg-wash`.
- `src/features/auth/components/loading-overlay.tsx` — `prose-subtitle`.
- `src/features/auth/screens/sign-up-screen.tsx` — orchestrator + SafeAreaView.
- `src/features/welcome/welcome-screen.tsx` — classes + `__DEV__` affordance (NO SafeAreaView; keeps `pt-safe`/`pb-safe-offset-5`).
- `src/app/(app)/home.tsx` — classes only (no SafeAreaView change).
- `src/app/_layout.tsx` — register `<Stack.Screen name="dev" />`.

**Unchanged (intentionally):** `src/shared/components/index.ts` (no new exports), `src/features/auth/api.ts`, `src/features/auth/schema.ts`, `src/features/auth/components/progress-bar.tsx` (no repeated strings to extract).

---

## Task 1: Utility classes + tokens in `global.css` (spike first)

**Files:**
- Modify: `src/global.css`

**Interfaces:**
- Produces: classNames `prose-display`, `prose-title`, `prose-subtitle`, `prose-body`, `prose-label`, `prose-button`, `prose-footnote`, `prose-caption`, `button-primary`, `button-ghost`, `card`, `dropdown`, `field-input`; color utilities `bg-hairline`/`border-hairline`, `bg-wash`.

- [ ] **Step 1: Spike — add two classes and confirm `@apply` compiles in this Uniwind build**

Add inside the existing `@theme { … }` block (after `--font-display-medium`):

```css
  --color-hairline: rgba(0, 0, 0, 0.06);
  --color-wash: rgba(0, 0, 0, 0.04);
```

Then add, just below the existing `@utility shadow-card { … }` block:

```css
@utility prose-title {
  @apply font-display text-4xl tracking-tight;
}

@utility button-primary {
  @apply h-14 items-center justify-center rounded-full bg-ink;
}
```

- [ ] **Step 2: Verify the spike compiles**

Run: `npx expo start --clear` and load the app (or press `i`/`a`). Confirm the Metro/Uniwind terminal shows **no Tailwind/Uniwind compile error** and the bundle builds. Stop the server.

> If `@apply` inside `@utility` errors in this build, fall back to raw declarations, e.g. `@utility button-primary { height: 3.5rem; align-items: center; justify-content: center; border-radius: 9999px; background-color: var(--color-ink); }` and translate each class below the same way. Decide here before writing the rest.

- [ ] **Step 3: Add the remaining utility classes**

Append below the two spike utilities:

```css
@utility prose-display {
  @apply font-display text-5xl tracking-tighter;
}

@utility prose-subtitle {
  @apply font-primary text-base font-medium tracking-tight text-slate;
}

@utility prose-body {
  @apply font-primary text-base tracking-tight;
}

@utility prose-label {
  @apply font-primary text-xs font-semibold tracking-tight text-graphite;
}

@utility prose-button {
  @apply font-primary text-base font-bold tracking-tight;
}

@utility prose-footnote {
  @apply font-primary text-sm tracking-tight;
}

@utility prose-caption {
  @apply font-primary text-xs tracking-tight;
}

@utility button-ghost {
  @apply items-center justify-center py-1.5;
}

@utility card {
  @apply rounded-xl border border-silver bg-canvas;
}

@utility dropdown {
  @apply absolute left-0 right-0 max-h-70 overflow-hidden rounded-xl border border-silver bg-canvas;
}

@utility field-input {
  @apply h-12 rounded-lg border px-4 font-primary text-base text-ink bg-canvas;
}
```

Notes: `prose-caption` carries **no** weight (callers add `font-semibold` where needed) because the combobox domain row is normal-weight while the summary label is semibold. `prose-button`/`prose-footnote` carry no color (composed per use). `card`/`dropdown` omit `border-continuous` and `shadow-card`, which compose at call sites.

- [ ] **Step 4: Verify build + types**

Run: `npx tsc --noEmit` → expected: no errors.
Run: `npm run lint` → expected: no new errors.
Run: `npx expo start --clear`, load the app, confirm no Uniwind compile error, then stop.

- [ ] **Step 5: Commit**

```bash
git add src/global.css
git commit -m "feat(styles): add prose + component utility classes and overlay tokens"
```

---

## Task 2: Refactor shared TextField + auth sub-components to utility classes

**Files:**
- Modify: `src/shared/components/text-field.tsx`
- Modify: `src/features/auth/components/otp-input.tsx`
- Modify: `src/features/auth/components/university-combobox.tsx`
- Modify: `src/features/auth/components/loading-overlay.tsx`

**Interfaces:**
- Consumes: classes from Task 1. Public props of all four components are unchanged.

- [ ] **Step 1: TextField — adopt `prose-label`, `field-input`, `prose-footnote`**

In `src/shared/components/text-field.tsx`, replace the label, input, and message classNames:

```tsx
        {label ? (
          <Text className="prose-label">{label}</Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={Brand.fog}
          className={`field-input border-continuous ${
            invalid ? "border-pass" : "border-silver focus:border-ink"
          } ${className ?? ""}`}
          {...rest}
        />
        {message ? (
          <Text
            className={`prose-footnote ${invalid ? "text-pass" : "text-slate"}`}
          >
            {message}
          </Text>
        ) : null}
```

- [ ] **Step 2: OtpInput — char uses default size**

In `src/features/auth/components/otp-input.tsx`, change the digit text (was `font-display text-[26px] text-ink`):

```tsx
            <Text className="font-display text-2xl text-ink">{char}</Text>
```

- [ ] **Step 3: UniversityCombobox — `prose-label`, `dropdown`, `prose-*`, washes**

In `src/features/auth/components/university-combobox.tsx`:
- Label (was `font-primary text-xs font-semibold tracking-[-0.1px] text-graphite`):
```tsx
      <Text className="prose-label">Where do you go to school?</Text>
```
- Dropdown panel (was the long `absolute … border-silver border-continuous bg-canvas shadow-card`):
```tsx
        <View className="dropdown border-continuous top-21 z-20 shadow-card">
```
- Empty state text (was `p-4 font-primary text-sm text-slate`):
```tsx
                <Text className="prose-footnote p-4 text-slate">
                  Start typing to search…
                </Text>
```
- Result row container (was `… border-b-[rgba(0,0,0,0.05)] … active:bg-[rgba(0,0,0,0.04)]`):
```tsx
              <Pressable
                onPress={() => commit(item.name)}
                className="gap-0.5 border-b border-b-hairline px-4 py-3 active:bg-wash"
              >
```
- Result row title (was `font-primary text-[15px] font-semibold tracking-[-0.2px] text-ink`):
```tsx
                <Text className="prose-body font-semibold text-ink" numberOfLines={1}>
                  {item.name}
                </Text>
```
- Result row domain (was `font-primary text-xs text-ash`):
```tsx
                <Text className="prose-caption text-ash">{item.domain}</Text>
```
- "Not listed" row (was `bg-[rgba(0,0,0,0.02)] … active:bg-[rgba(0,0,0,0.04)]` + same title look):
```tsx
            <Pressable
              onPress={() => commit(trimmed)}
              className="px-4 py-3 active:bg-wash"
            >
              <Text className="prose-body font-semibold text-ink" numberOfLines={1}>
                My school isn&apos;t listed - use “{trimmed}”
              </Text>
            </Pressable>
```

- [ ] **Step 4: LoadingOverlay — `prose-subtitle`**

In `src/features/auth/components/loading-overlay.tsx` (was `font-primary text-base font-medium tracking-[-0.2px] text-slate`):

```tsx
      <Text className="prose-subtitle">{message}</Text>
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run lint` → no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/text-field.tsx src/features/auth/components/otp-input.tsx src/features/auth/components/university-combobox.tsx src/features/auth/components/loading-overlay.tsx
git commit -m "refactor(auth): adopt utility classes in text-field and auth components"
```

---

## Task 3: Sign-up Zustand store

**Files:**
- Create: `src/features/auth/store/sign-up-store.ts`

**Interfaces:**
- Produces: `useSignUpStore` (Zustand hook + `.getState()`), types `SignUpStep = 'campus' | 'email' | 'review'`, `SignUpPhase = 'form' | 'sending' | 'verify' | 'verifying'`. State fields: `step, phase, university (string|null), email (string), code (string), emailError (string|null), otpError (string|null), submitError (string|null)`. Setters: `setUniversity, setEmail, setCode, setEmailError, setOtpError, setSubmitError, setPhase, setStep, reset`.

- [ ] **Step 1: Write the store**

```tsx
import { create } from 'zustand';

export type SignUpStep = 'campus' | 'email' | 'review';
export type SignUpPhase = 'form' | 'sending' | 'verify' | 'verifying';

interface SignUpState {
  step: SignUpStep;
  phase: SignUpPhase;
  university: string | null;
  email: string;
  code: string;
  emailError: string | null;
  otpError: string | null;
  submitError: string | null;
  setUniversity: (value: string | null) => void;
  setEmail: (value: string) => void;
  setCode: (value: string) => void;
  setEmailError: (value: string | null) => void;
  setOtpError: (value: string | null) => void;
  setSubmitError: (value: string | null) => void;
  setPhase: (value: SignUpPhase) => void;
  setStep: (value: SignUpStep) => void;
  reset: () => void;
}

const initialState: Pick<
  SignUpState,
  | 'step'
  | 'phase'
  | 'university'
  | 'email'
  | 'code'
  | 'emailError'
  | 'otpError'
  | 'submitError'
> = {
  step: 'campus',
  phase: 'form',
  university: null,
  email: '',
  code: '',
  emailError: null,
  otpError: null,
  submitError: null,
};

/** Client state for the multi-step sign-up wizard (CLAUDE.md: onboarding progress). */
export const useSignUpStore = create<SignUpState>((set) => ({
  ...initialState,
  setUniversity: (university) => set({ university }),
  setEmail: (email) => set({ email }),
  setCode: (code) => set({ code }),
  setEmailError: (emailError) => set({ emailError }),
  setOtpError: (otpError) => set({ otpError }),
  setSubmitError: (submitError) => set({ submitError }),
  setPhase: (phase) => set({ phase }),
  setStep: (step) => set({ step }),
  reset: () => set(initialState),
}));
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/store/sign-up-store.ts
git commit -m "feat(auth): add sign-up Zustand store"
```

---

## Task 4: `use-sign-up` hook (navigation + async OTP)

**Files:**
- Create: `src/features/auth/hooks/use-sign-up.ts`

**Interfaces:**
- Consumes: `useSignUpStore` (Task 3), `sendSignupOtp`/`verifySignupOtp` from `@/features/auth/api`, `validateEmail`/`otpSchema` from `@/features/auth/schema`, `useRouter` from `expo-router`.
- Produces: `useSignUp()` returning `{ goBack, continueFromCampus, continueFromEmail, createAccount, verify, resend }` — all `() => void` (the async ones return `Promise<void>`). The hook reads state via `useSignUpStore.getState()` inside handlers, so it does **not** subscribe (no re-renders).

- [ ] **Step 1: Write the hook**

```tsx
import { useRouter } from 'expo-router';

import { sendSignupOtp, verifySignupOtp } from '@/features/auth/api';
import { otpSchema, validateEmail } from '@/features/auth/schema';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';

/**
 * Wizard navigation + the imperative OTP send/verify calls. State is read fresh
 * via getState() so this hook never subscribes (and never forces a re-render);
 * components subscribe to the specific fields they render.
 */
export function useSignUp() {
  const router = useRouter();

  const goBack = () => {
    const s = useSignUpStore.getState();
    s.setSubmitError(null);
    if (s.phase === 'verify') {
      s.setPhase('form');
      s.setStep('review');
      return;
    }
    if (s.step === 'review') {
      s.setStep('email');
    } else if (s.step === 'email') {
      s.setStep('campus');
    } else {
      s.reset();
      router.back();
    }
  };

  const continueFromCampus = () => {
    const s = useSignUpStore.getState();
    if (s.university) s.setStep('email');
  };

  const continueFromEmail = () => {
    const s = useSignUpStore.getState();
    const result = validateEmail(s.email);
    if (!result.ok) {
      s.setEmailError(result.error);
      return;
    }
    s.setEmail(result.value);
    s.setEmailError(null);
    s.setStep('review');
  };

  const createAccount = async () => {
    const s = useSignUpStore.getState();
    if (!s.university) return;
    s.setSubmitError(null);
    s.setPhase('sending');
    try {
      await sendSignupOtp(s.email, s.university);
      s.setPhase('verify');
    } catch (e) {
      s.setPhase('form');
      s.setSubmitError(
        e instanceof Error ? e.message : 'Something went wrong. Try again.',
      );
    }
  };

  const verify = async () => {
    const s = useSignUpStore.getState();
    if (!otpSchema.safeParse(s.code).success) {
      s.setOtpError('Enter the 6-digit code.');
      return;
    }
    s.setOtpError(null);
    s.setPhase('verifying');
    try {
      // On success the auth listener sets the session and the root layout swaps
      // to the protected group — this screen unmounts on its own.
      await verifySignupOtp(s.email, s.code);
    } catch (e) {
      s.setPhase('verify');
      s.setOtpError(
        e instanceof Error ? e.message : 'That code didn’t work. Try again.',
      );
      s.setCode('');
    }
  };

  const resend = async () => {
    const s = useSignUpStore.getState();
    if (!s.university) return;
    s.setOtpError(null);
    try {
      await sendSignupOtp(s.email, s.university);
    } catch {
      s.setOtpError('Could not resend the code. Try again.');
    }
  };

  return { goBack, continueFromCampus, continueFromEmail, createAccount, verify, resend };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → no errors. (Confirms `sendSignupOtp`/`verifySignupOtp`/`validateEmail`/`otpSchema` signatures match.)

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/hooks/use-sign-up.ts
git commit -m "feat(auth): add use-sign-up flow hook"
```

---

## Task 5: Step components

**Files:**
- Create: `src/features/auth/components/steps/campus-step.tsx`
- Create: `src/features/auth/components/steps/email-step.tsx`
- Create: `src/features/auth/components/steps/review-step.tsx`
- Create: `src/features/auth/components/steps/verify-step.tsx`

**Interfaces:**
- Consumes: `useSignUpStore` (Task 3), `useSignUp` (Task 4), `UniversityCombobox`, `OtpInput`, `TextField`, prose/utility classes.
- Produces: components `CampusStep`, `EmailStep`, `ReviewStep`, `VerifyStep` — all `() => JSX.Element`, no props. Each renders content only (no chrome/footer).

- [ ] **Step 1: CampusStep**

```tsx
import { Text, View } from 'react-native';

import { UniversityCombobox } from '@/features/auth/components/university-combobox';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';

export function CampusStep() {
  const university = useSignUpStore((s) => s.university);
  const setUniversity = useSignUpStore((s) => s.setUniversity);

  return (
    <>
      <Text className="prose-title text-ink">First, your{'\n'}campus.</Text>
      <Text className="prose-subtitle mb-3">
        We match you with roommates at your school.
      </Text>
      <View className="mt-1 gap-3">
        <UniversityCombobox value={university} onChange={setUniversity} />
      </View>
    </>
  );
}
```

- [ ] **Step 2: EmailStep**

```tsx
import { View } from 'react-native';
import { Text } from 'react-native';

import { useSignUp } from '@/features/auth/hooks/use-sign-up';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';
import { TextField } from '@/shared/components';

export function EmailStep() {
  const email = useSignUpStore((s) => s.email);
  const emailError = useSignUpStore((s) => s.emailError);
  const setEmail = useSignUpStore((s) => s.setEmail);
  const setEmailError = useSignUpStore((s) => s.setEmailError);
  const { continueFromEmail } = useSignUp();

  return (
    <>
      <Text className="prose-title text-ink">What&apos;s your{'\n'}email?</Text>
      <Text className="prose-subtitle mb-3">
        {__DEV__
          ? 'Dev build: any email works.'
          : 'Use your .edu address so we can verify you’re a student.'}
      </Text>
      <View className="mt-1 gap-3">
        <TextField
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError(null);
          }}
          placeholder="email@college.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          invalid={!!emailError}
          message={emailError ?? undefined}
          onSubmitEditing={continueFromEmail}
          returnKeyType="next"
        />
      </View>
    </>
  );
}
```

- [ ] **Step 3: ReviewStep** (owns local `SummaryRow`)

```tsx
import { Text, View } from 'react-native';

import { useSignUpStore } from '@/features/auth/store/sign-up-store';

export function ReviewStep() {
  const university = useSignUpStore((s) => s.university);
  const email = useSignUpStore((s) => s.email);

  return (
    <>
      <Text className="prose-title text-ink">Looks{'\n'}good?</Text>
      <Text className="prose-subtitle mb-3">
        We’ll email you a code to finish signing up.
      </Text>
      <View className="card border-continuous mt-2 px-4">
        <SummaryRow label="School" value={university ?? '—'} />
        <View className="h-px bg-hairline" />
        <SummaryRow label="Email" value={email} />
      </View>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 py-4">
      <Text className="prose-caption font-semibold text-ash">{label}</Text>
      <Text className="prose-body font-semibold text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: VerifyStep**

```tsx
import { Pressable, Text, View } from 'react-native';

import { OtpInput } from '@/features/auth/components/otp-input';
import { useSignUp } from '@/features/auth/hooks/use-sign-up';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';

export function VerifyStep() {
  const email = useSignUpStore((s) => s.email);
  const code = useSignUpStore((s) => s.code);
  const otpError = useSignUpStore((s) => s.otpError);
  const setCode = useSignUpStore((s) => s.setCode);
  const { verify, resend } = useSignUp();

  return (
    <>
      <Text className="prose-title text-ink">Check your{'\n'}inbox.</Text>
      <Text className="prose-subtitle mb-3">
        Enter the 6-digit code we sent to{' '}
        <Text className="prose-body font-bold text-ink">{email}</Text>.
      </Text>
      <View className="mt-1 gap-3">
        <OtpInput value={code} onChange={setCode} onComplete={() => verify()} />
        {otpError ? (
          <Text className="prose-footnote text-pass">{otpError}</Text>
        ) : null}
        <Pressable onPress={resend} hitSlop={8} className="self-start py-1">
          <Text className="prose-footnote font-semibold text-graphite underline">
            Resend code
          </Text>
        </Pressable>
      </View>
    </>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run lint` → no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/components/steps/
git commit -m "feat(auth): split sign-up into per-step components"
```

---

## Task 6: Sign-up orchestrator (SafeAreaView + store-driven)

**Files:**
- Modify: `src/features/auth/screens/sign-up-screen.tsx` (full rewrite)

**Interfaces:**
- Consumes: `useSignUpStore`, `useSignUp`, the four step components, `ProgressBar`, `LoadingOverlay`, `FadeIn`, `PressScale`, `SafeAreaView`.
- Produces: `SignUpScreen` (unchanged export name/route usage).

- [ ] **Step 1: Rewrite the screen**

```tsx
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/features/auth/components/loading-overlay';
import { ProgressBar } from '@/features/auth/components/progress-bar';
import { CampusStep } from '@/features/auth/components/steps/campus-step';
import { EmailStep } from '@/features/auth/components/steps/email-step';
import { ReviewStep } from '@/features/auth/components/steps/review-step';
import { VerifyStep } from '@/features/auth/components/steps/verify-step';
import { useSignUp } from '@/features/auth/hooks/use-sign-up';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';
import { FadeIn, PressScale } from '@/shared/components';

const TOTAL_STEPS = 3;
const STEP_INDEX = { campus: 1, email: 2, review: 3 } as const;

export function SignUpScreen() {
  const step = useSignUpStore((s) => s.step);
  const phase = useSignUpStore((s) => s.phase);
  const university = useSignUpStore((s) => s.university);
  const email = useSignUpStore((s) => s.email);
  const code = useSignUpStore((s) => s.code);
  const submitError = useSignUpStore((s) => s.submitError);
  const reset = useSignUpStore((s) => s.reset);

  const { goBack, continueFromCampus, continueFromEmail, createAccount, verify } =
    useSignUp();

  // Fresh start each time the route mounts.
  useEffect(() => {
    reset();
  }, [reset]);

  if (phase === 'sending') return <LoadingOverlay message="Creating your account…" />;
  if (phase === 'verifying') return <LoadingOverlay message="Verifying…" />;

  const onVerify = phase === 'verify';
  const progressStep = onVerify ? TOTAL_STEPS : STEP_INDEX[step];

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 px-6">
        <View className="h-10 flex-row items-center gap-3">
          <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            className="-ml-1.5 h-8 w-8 items-center justify-center"
          >
            <Text className="font-display text-3xl leading-8 text-ink">‹</Text>
          </Pressable>
          <View className="flex-1">
            <ProgressBar current={progressStep} total={TOTAL_STEPS} />
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FadeIn
            key={onVerify ? 'verify' : `step-${step}`}
            offset={14}
            className="flex-1 gap-3 pt-7"
          >
            {!onVerify && step === 'campus' && <CampusStep />}
            {!onVerify && step === 'email' && <EmailStep />}
            {!onVerify && step === 'review' && <ReviewStep />}
            {onVerify && <VerifyStep />}
          </FadeIn>

          <View className="gap-3">
            {submitError ? (
              <Text className="prose-footnote text-pass">{submitError}</Text>
            ) : null}
            {!onVerify && step === 'campus' && (
              <Cta label="Continue" disabled={!university} onPress={continueFromCampus} />
            )}
            {!onVerify && step === 'email' && (
              <Cta
                label="Continue"
                disabled={email.trim().length === 0}
                onPress={continueFromEmail}
              />
            )}
            {!onVerify && step === 'review' && (
              <Cta label="Create account" onPress={createAccount} />
            )}
            {onVerify && (
              <Cta label="Verify & continue" disabled={code.length < 6} onPress={verify} />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Cta({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <PressScale
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`button-primary ${disabled ? 'opacity-[0.35]' : ''}`}
    >
      <Text className="prose-button text-canvas">{label}</Text>
    </PressScale>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run lint` → no new errors.

- [ ] **Step 3: Manual check** (device/simulator)

Run `npx expo start`, open the sign-up route from welcome. Confirm: the back ‹ + progress bar sit **below** the notch (collision fixed); steps advance campus → email → review; "Create account" sends; OTP verify works; background stays full-bleed.

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/screens/sign-up-screen.tsx
git commit -m "refactor(auth): sign-up screen becomes SafeAreaView orchestrator over steps"
```

---

## Task 7: Welcome screen — utility classes + dev affordance (NO SafeAreaView)

**Files:**
- Modify: `src/features/welcome/welcome-screen.tsx`

**Interfaces:**
- Consumes: classes from Task 1, `useRouter` (already imported). **Do NOT import or use `SafeAreaView`** — welcome keeps its existing `pt-safe`/`pb-safe-offset-5` className insets.

- [ ] **Step 1: Rewrite the screen body**

Swap the class strings and add the `__DEV__` affordance. Keep the existing full-bleed `View` + className safe-area insets exactly as they are (imports are unchanged):

```tsx
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

import { MeshGradient } from '@/features/welcome/components/mesh-gradient';
import { TiltedCard } from '@/features/welcome/components/tilted-card';
import { WELCOME_CARDS } from '@/features/welcome/data';
import { FadeIn, PressScale } from '@/shared/components';

export function WelcomeScreen() {
  const router = useRouter();

  const start = () => router.push('/(auth)/sign-up');

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <MeshGradient variant="hero" className="absolute inset-0" pointerEvents="none" />

      <View className="flex-1 px-6 pt-safe pb-safe-offset-5">
        <View className="relative flex-1" pointerEvents="none">
          {WELCOME_CARDS.map((card, i) => (
            <FadeIn
              key={card.id}
              delay={80 + i * 70}
              className="absolute inset-0 items-center justify-center">
              <TiltedCard card={card} />
            </FadeIn>
          ))}
        </View>

        <View className="gap-4 pb-2">
          <FadeIn delay={300}>
            <Text className="prose-display text-ink">Find your{'\n'}people.</Text>
          </FadeIn>

          <FadeIn delay={370}>
            <Text className="prose-subtitle max-w-80">
              Your ideal college roommate, matched.
            </Text>
          </FadeIn>

          <FadeIn delay={440} className="mt-2 gap-3.5">
            <PressScale
              accessibilityRole="button"
              onPress={start}
              className="button-primary">
              <Text className="prose-button text-canvas">Get started</Text>
            </PressScale>

            <Pressable
              accessibilityRole="button"
              onPress={start}
              hitSlop={12}
              className="button-ghost active:opacity-50">
              <Text className="prose-footnote font-medium text-graphite">
                I already have an account
              </Text>
            </Pressable>

            {__DEV__ ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/dev')}
                hitSlop={8}
                className="items-center py-1 active:opacity-50">
                <Text className="prose-caption text-ash">Dev menu</Text>
              </Pressable>
            ) : null}
          </FadeIn>
        </View>
      </View>
    </View>
  );
}
```

(Delete the original block-comment if you like; keep behavior identical. The `/dev` push is exercised after Task 9.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → no errors. (The `router.push('/dev')` typed route resolves once `app/dev/` exists in Task 9; if typed-routes errors here, complete Task 9 before final typecheck — note this ordering.)

- [ ] **Step 3: Commit**

```bash
git add src/features/welcome/welcome-screen.tsx
git commit -m "refactor(welcome): utility classes + dev affordance"
```

---

## Task 8: Home screen — utility classes only (no SafeAreaView change)

**Files:**
- Modify: `src/app/(app)/home.tsx`

- [ ] **Step 1: Swap class strings (keep `pt-safe`/`pb-safe-offset-6`)**

```tsx
        <View className="flex-1 items-center justify-center gap-2.5">
          <Text className="prose-display text-ink">You&apos;re in.</Text>
          <Text className="prose-subtitle">
            Signed in as {session?.user.email ?? 'your account'}
          </Text>
        </View>
        <PressScale
          accessibilityRole="button"
          onPress={() => supabase.auth.signOut()}
          className="button-primary">
          <Text className="prose-button text-canvas">Sign out</Text>
        </PressScale>
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run lint` → no new errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/home.tsx"
git commit -m "refactor(home): adopt utility classes (safe-area unchanged)"
```

---

## Task 9: `/app/dev` route group

**Files:**
- Create: `src/app/dev/_layout.tsx`, `src/app/dev/index.tsx`, `src/app/dev/components.tsx`, `src/app/dev/screens.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Consumes: everything built above; `Link`/`Redirect`/`Stack` from `expo-router`.

- [ ] **Step 1: Dev layout (gate)**

`src/app/dev/_layout.tsx`:

```tsx
import { Redirect, Stack } from 'expo-router';

/** Dev-only playground. In production this group redirects to the root. */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Register the group in the root layout**

In `src/app/_layout.tsx`, add a sibling screen after the protected blocks (inside the `<Stack>`), so the route resolves; the layout above gates access:

```tsx
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="dev" />
```

- [ ] **Step 3: Dev menu**

`src/app/dev/index.tsx`:

```tsx
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DevMenu() {
  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 gap-6 px-6">
        <Text className="prose-display text-ink">Dev</Text>
        <View className="gap-3">
          <Link href="/dev/components" className="card border-continuous px-4 py-4">
            <Text className="prose-body font-semibold text-ink">Components</Text>
          </Link>
          <Link href="/dev/screens" className="card border-continuous px-4 py-4">
            <Text className="prose-body font-semibold text-ink">Screens</Text>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}
```

- [ ] **Step 4: Components gallery**

`src/app/dev/components.tsx`:

```tsx
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/features/auth/components/loading-overlay';
import { OtpInput } from '@/features/auth/components/otp-input';
import { ProgressBar } from '@/features/auth/components/progress-bar';
import { FadeIn, PressScale, TextField } from '@/shared/components';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="prose-caption font-semibold text-ash">{title}</Text>
      {children}
    </View>
  );
}

export default function ComponentsGallery() {
  const [otp, setOtp] = useState('');

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <ScrollView contentContainerClassName="gap-8 px-6 py-6">
          <Section title="Typography">
            <Text className="prose-display text-ink">Display</Text>
            <Text className="prose-title text-ink">Title</Text>
            <Text className="prose-subtitle">Subtitle / lead paragraph</Text>
            <Text className="prose-body text-ink">Body</Text>
            <Text className="prose-label">Field label</Text>
            <Text className="prose-footnote text-slate">Footnote / helper</Text>
            <Text className="prose-caption text-ash">Caption</Text>
          </Section>

          <Section title="Buttons">
            <PressScale className="button-primary">
              <Text className="prose-button text-canvas">button-primary</Text>
            </PressScale>
            <PressScale className="button-ghost">
              <Text className="prose-footnote font-medium text-graphite">button-ghost</Text>
            </PressScale>
          </Section>

          <Section title="Inputs">
            <TextField label="Default" placeholder="placeholder" />
            <TextField label="Invalid" invalid message="Something is wrong" value="bad" />
            <OtpInput value={otp} onChange={setOtp} />
          </Section>

          <Section title="Surfaces">
            <View className="card border-continuous px-4 py-4">
              <Text className="prose-body text-ink">card</Text>
            </View>
            <View className="card border-continuous shadow-card px-4 py-4">
              <Text className="prose-body text-ink">card + shadow-card</Text>
            </View>
          </Section>

          <Section title="Feedback">
            <ProgressBar current={2} total={3} />
            <View className="h-44 overflow-hidden rounded-xl border border-silver">
              <LoadingOverlay message="Creating your account…" />
            </View>
          </Section>

          <Section title="Motion">
            <FadeIn>
              <Text className="prose-body text-ink">FadeIn content</Text>
            </FadeIn>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
```

- [ ] **Step 5: Screen previews**

`src/app/dev/screens.tsx`:

```tsx
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CampusStep } from '@/features/auth/components/steps/campus-step';
import { EmailStep } from '@/features/auth/components/steps/email-step';
import { ReviewStep } from '@/features/auth/components/steps/review-step';
import { VerifyStep } from '@/features/auth/components/steps/verify-step';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="prose-caption font-semibold text-ash">{title}</Text>
      <View className="card border-continuous gap-3 p-4">{children}</View>
    </View>
  );
}

export default function ScreensPreview() {
  // Seed sample data so review/verify look populated.
  useEffect(() => {
    const s = useSignUpStore.getState();
    s.setUniversity('Stanford University');
    s.setEmail('student@stanford.edu');
  }, []);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <ScrollView contentContainerClassName="gap-8 px-6 py-6">
          <View className="gap-3">
            <Link href="/" className="prose-body font-semibold text-ink underline">
              → Welcome (live)
            </Link>
            <Link
              href="/(auth)/sign-up"
              className="prose-body font-semibold text-ink underline">
              → Sign-up (live)
            </Link>
          </View>

          <Frame title="Step: campus"><CampusStep /></Frame>
          <Frame title="Step: email"><EmailStep /></Frame>
          <Frame title="Step: review"><ReviewStep /></Frame>
          <Frame title="Step: verify"><VerifyStep /></Frame>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` → no errors (also clears the `router.push('/dev')` typed-route reference from Task 7). Run: `npm run lint` → no new errors.

- [ ] **Step 7: Manual check**

`npx expo start` → from welcome tap "Dev menu" → open Components (all sections render) and Screens (step frames + live links). Confirm building with `NODE_ENV=production` style (or a release build) would redirect `/dev` to `/` (gate works).

- [ ] **Step 8: Commit**

```bash
git add "src/app/dev/" "src/app/_layout.tsx"
git commit -m "feat(dev): add __DEV__-gated /app/dev playground (components + screens)"
```

---

## Task 10: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Type + lint**

Run: `npx tsc --noEmit` → no errors. Run: `npm run lint` → no new errors.

- [ ] **Step 2: Grep for leftover bundled strings / arbitrary sizes**

Run: `grep -rn "text-\[" src` → expected: none in the touched files (arbitrary sizes removed; any remaining are pre-existing non-text utilities like `aspect-[0.82]`, `opacity-[0.35]`, which are allowed).
Run: `grep -rn "font-primary text-base font-medium" src` → expected: none (all became `prose-subtitle`).

- [ ] **Step 3: Manual regression**

`npx expo start` and confirm: welcome (edge-to-edge mesh, CTA, className insets unchanged — no SafeAreaView), full sign-up happy path (campus → email → review → create → verify → lands on home), back navigation + notch spacing, home unchanged, `/dev` menu/components/screens.

- [ ] **Step 4: No commit needed** (all work committed per task). Branch `feature/auth` ready for review.

---

## Self-Review

**Spec coverage:**
- Utility classes (prose + component) → Task 1. ✓
- Default Tailwind sizes, no `text-[40px]` → Task 1 (`@apply` over default steps), verified Task 10 Step 2. ✓
- Surface utilities + tokens (`card`, `dropdown`, `hairline`, `wash`) → Task 1. ✓
- SafeAreaView in sign-up + dev only, NOT home/welcome → Tasks 6, 9 (welcome/home keep className insets, Tasks 7, 8). ✓
- Progress-bar/notch fix → Task 6 (SafeAreaView top edge), manual check Step 3. ✓
- Sign-up split + Zustand store + hook → Tasks 3, 4, 5, 6. ✓
- `/app/dev` group (index/components/screens), gated, registered → Task 9. ✓
- No new shared components → enforced in Global Constraints; `index.ts` untouched. ✓
- Error/empty/loading preserved → LoadingOverlay (Task 6), inline `prose-footnote text-pass` (Tasks 5, 6), combobox empty state (Task 2). ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `useSignUpStore` selectors and `useSignUp()` return names (`goBack`, `continueFromCampus`, `continueFromEmail`, `createAccount`, `verify`, `resend`) match across Tasks 4–6; `SignUpStep`/`SignUpPhase` values consistent. ✓

**Ordering note:** Task 7's `router.push('/dev')` typed route fully resolves after Task 9; final typecheck is clean by Task 9 Step 6 / Task 10.
