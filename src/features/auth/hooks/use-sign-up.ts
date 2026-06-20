import { useRouter } from 'expo-router';

import { sendSignupOtp, verifyEmailOtp } from '@/features/auth/api';
import { authErrorMessage } from '@/features/auth/errors';
import { otpSchema, schoolDomainFromEmail, validateEmail } from '@/features/auth/schema';
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
    // The email's school domain must match the campus they picked. Free-text
    // campuses have no known domain, so there we only enforce the .edu rule.
    if (s.universityDomain) {
      const emailDomain = schoolDomainFromEmail(result.value);
      if (emailDomain !== s.universityDomain.toLowerCase()) {
        s.setEmailError(
          `That email isn't a ${s.universityDomain} address — use your ${s.university} email.`,
        );
        return;
      }
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
      s.setSubmitError(authErrorMessage(e, 'Something went wrong. Try again.'));
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
      await verifyEmailOtp(s.email, s.code);
    } catch (e) {
      s.setPhase('verify');
      s.setOtpError(authErrorMessage(e, 'That code didn’t work. Try again.'));
      s.setCode('');
    }
  };

  const resend = async () => {
    const s = useSignUpStore.getState();
    if (!s.university) return;
    s.setOtpError(null);
    try {
      await sendSignupOtp(s.email, s.university);
    } catch (e) {
      s.setOtpError(authErrorMessage(e, 'Could not resend the code. Try again.'));
    }
  };

  return { goBack, continueFromCampus, continueFromEmail, createAccount, verify, resend };
}
