import { create } from 'zustand';

export type SignInPhase = 'form' | 'sending' | 'verify' | 'verifying';

interface SignInState {
  phase: SignInPhase;
  email: string;
  code: string;
  emailError: string | null;
  otpError: string | null;
  submitError: string | null;
  setEmail: (value: string) => void;
  setCode: (value: string) => void;
  setEmailError: (value: string | null) => void;
  setOtpError: (value: string | null) => void;
  setSubmitError: (value: string | null) => void;
  setPhase: (value: SignInPhase) => void;
  reset: () => void;
}

const initialState: Pick<
  SignInState,
  'phase' | 'email' | 'code' | 'emailError' | 'otpError' | 'submitError'
> = {
  phase: 'form',
  email: '',
  code: '',
  emailError: null,
  otpError: null,
  submitError: null,
};

/** Client state for the sign-in flow (email -> code). Mirrors the sign-up store. */
export const useSignInStore = create<SignInState>((set) => ({
  ...initialState,
  setEmail: (email) => set({ email }),
  setCode: (code) => set({ code }),
  setEmailError: (emailError) => set({ emailError }),
  setOtpError: (otpError) => set({ otpError }),
  setSubmitError: (submitError) => set({ submitError }),
  setPhase: (phase) => set({ phase }),
  reset: () => set(initialState),
}));
