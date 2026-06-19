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
