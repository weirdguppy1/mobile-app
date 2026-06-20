import { z } from 'zod';

/**
 * Email validation. We always require a school (.edu) address — the database
 * enforces it server-side (a trigger rejects non-.edu signups), so the client
 * must require it too, or the user hits an opaque "Database error saving new
 * user" only after submitting. Throwaway .edu addresses are fine for local
 * testing (the code is delivered to Inbucket, not a real inbox).
 */
const baseEmail = z.string().trim().email('Enter a valid email address.');

export const emailSchema = baseEmail.refine(
  (value) => /\.edu$/i.test(value.split('@')[1] ?? ''),
  { message: 'Use your school email (must end in .edu).' },
);

export function validateEmail(email: string): { ok: true; value: string } | { ok: false; error: string } {
  const result = emailSchema.safeParse(email);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid email.' };
}

/**
 * Registrable school domain from an email — the last two dot-labels of the host,
 * mirroring the database's school_domain_from_email() so client and server agree
 * (e.g. jane@cs.stanford.edu -> stanford.edu). Returns null when there's no host.
 */
export function schoolDomainFromEmail(email: string): string | null {
  const host = email.trim().toLowerCase().split('@')[1];
  if (!host) return null;
  const labels = host.split('.').filter(Boolean);
  if (labels.length < 2) return null;
  return labels.slice(-2).join('.');
}

/** The OTP code Supabase emails is 6 digits. */
export const otpSchema = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.');