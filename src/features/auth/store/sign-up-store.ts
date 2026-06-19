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
