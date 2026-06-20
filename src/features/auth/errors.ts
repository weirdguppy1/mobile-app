import { AuthError } from '@supabase/supabase-js';

/**
 * Turn a Supabase auth error into friendly, actionable copy. Raw GoTrue strings
 * ("Signups not allowed for otp", "Token has expired or is invalid", …) are
 * confusing for users, so we map the ones our OTP flows can hit. Anything
 * unrecognized falls back to the caller's context-appropriate message.
 */
export function authErrorMessage(error: unknown, fallback: string): string {
  const code = error instanceof AuthError ? error.code ?? '' : '';
  const msg = error instanceof Error ? error.message.toLowerCase() : '';

  // Sign-in with an email that never registered (shouldCreateUser: false).
  if (code === 'otp_disabled' || msg.includes('signups not allowed')) {
    return 'No account found for that email — sign up first.';
  }

  // Too many requests in a short window.
  if (code.includes('rate_limit') || msg.includes('rate limit') || msg.includes('too many')) {
    return 'Too many attempts. Wait a minute, then try again.';
  }

  // Wrong, used, or expired verification code.
  if (
    code === 'otp_expired' ||
    msg.includes('expired') ||
    (msg.includes('invalid') &&
      (msg.includes('token') || msg.includes('otp') || msg.includes('code')))
  ) {
    return 'That code is invalid or expired. Request a new one.';
  }

  // The .edu trigger rejecting a non-school email (the client blocks this first,
  // so this is just defense in depth if it ever slips through).
  if (msg.includes('.edu') || msg.includes('database error saving new user')) {
    return 'Use your school (.edu) email to sign up.';
  }

  return fallback;
}
