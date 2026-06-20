import { useRouter } from 'expo-router';

import { sendSigninOtp, verifyEmailOtp } from '@/features/auth/api';
import { authErrorMessage } from '@/features/auth/errors';
import { otpSchema, validateEmail } from '@/features/auth/schema';
import { useSignInStore } from '@/features/auth/store/sign-in-store';

/**
 * Sign-in navigation + OTP send/verify for existing users. Reads state via
 * getState() so the hook never subscribes (no re-renders); mirrors useSignUp.
 */
export function useSignIn() {
  const router = useRouter();

  const goBack = () => {
    const s = useSignInStore.getState();
    s.setSubmitError(null);
    if (s.phase === 'verify') {
      s.setPhase('form');
      s.setCode('');
      return;
    }
    s.reset();
    router.back();
  };

  const sendCode = async () => {
    const s = useSignInStore.getState();
    const result = validateEmail(s.email);
    if (!result.ok) {
      s.setEmailError(result.error);
      return;
    }
    s.setEmail(result.value);
    s.setEmailError(null);
    s.setSubmitError(null);
    s.setPhase('sending');
    try {
      await sendSigninOtp(result.value);
      s.setPhase('verify');
    } catch (e) {
      s.setPhase('form');
      s.setSubmitError(authErrorMessage(e, 'Something went wrong. Try again.'));
    }
  };

  const verify = async () => {
    const s = useSignInStore.getState();
    if (!otpSchema.safeParse(s.code).success) {
      s.setOtpError('Enter the 6-digit code.');
      return;
    }
    s.setOtpError(null);
    s.setPhase('verifying');
    try {
      // On success the auth listener sets the session and the root layout swaps
      // to the protected group — this screen unmounts on its own.
      await verifyEmailOtp(s.email, s.code);
    } catch (e) {
      s.setPhase('verify');
      s.setOtpError(authErrorMessage(e, 'That code didn’t work. Try again.'));
      s.setCode('');
    }
  };

  const resend = async () => {
    const s = useSignInStore.getState();
    s.setOtpError(null);
    try {
      await sendSigninOtp(s.email);
    } catch (e) {
      s.setOtpError(authErrorMessage(e, 'Could not resend the code. Try again.'));
    }
  };

  return { goBack, sendCode, verify, resend };
}
