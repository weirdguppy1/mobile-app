import { supabase } from "@/lib/supabase";

/**
 * Start passwordless signup: creates the auth user (if new) and emails a 6-digit
 * code. The chosen university rides along in user metadata, where a Postgres
 * trigger copies it into the `profiles` table on user creation.
 */
export async function sendSignupOtp(
  email: string,
  university: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { university: university },
    },
  });
  if (error) throw error;
}

/**
 * Start passwordless sign-in for an EXISTING user: emails a 6-digit code.
 * shouldCreateUser is false, so an unknown/typo email returns an error instead
 * of silently creating an account.
 */
export async function sendSigninOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
}

/** Verify an emailed 6-digit code, which establishes the session (signup + sign-in). */
export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
}
