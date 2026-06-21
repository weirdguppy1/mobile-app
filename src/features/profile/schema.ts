import { z } from 'zod';

import {
  ALCOHOL, BEDTIME, DEAL_BREAKER_VALUES, FITNESS, GUESTS_FREQUENCY, INTEREST_VALUES,
  INTERESTS_LIMITS, MAJORS_LIMITS, NOISE_PREFERENCE, PARTIES, PROMPTS_LIMITS,
  ROOM_TEMPERATURE, SEX_ASSIGNED_AT_BIRTH, SLEEP_SCHEDULE, SMOKING, STUDY_STYLE,
  WAKEUP_TIME,
} from '@/features/profile/constants';

const oneOf = (opts: { value: string }[]) =>
  z.enum(opts.map((o) => o.value) as [string, ...string[]]);

export const basicsSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  pronouns: z.string().trim().optional().or(z.literal('')),
  graduation_year: z.number().int().min(2024).max(2035),
  majors: z.array(z.string().trim().min(1)).min(MAJORS_LIMITS.min, 'Add at least one major').max(MAJORS_LIMITS.max, 'Up to three majors'),
  gender_identity: z.string().trim().optional().or(z.literal('')),
  sex_assigned_at_birth: oneOf(SEX_ASSIGNED_AT_BIRTH).optional(),
});
export type BasicsValues = z.infer<typeof basicsSchema>;

export const compatibilitySchema = z.object({
  sleep_schedule: oneOf(SLEEP_SCHEDULE),
  bedtime: oneOf(BEDTIME),
  wakeup_time: oneOf(WAKEUP_TIME),
  cleanliness: z.number().int().min(1).max(5),
  noise_preference: oneOf(NOISE_PREFERENCE),
  study_style: oneOf(STUDY_STYLE),
  guests_frequency: oneOf(GUESTS_FREQUENCY),
  social_level: z.number().int().min(1).max(5),
  room_temperature: oneOf(ROOM_TEMPERATURE),
});
export type CompatibilityValues = z.infer<typeof compatibilitySchema>;

export const lifestyleSchema = z.object({
  alcohol: oneOf(ALCOHOL),
  smoking: oneOf(SMOKING),
  parties: oneOf(PARTIES),
  fitness: oneOf(FITNESS),
});
export type LifestyleValues = z.infer<typeof lifestyleSchema>;

export const interestsSchema = z.object({
  interests: z.array(z.enum(INTEREST_VALUES))
    .min(INTERESTS_LIMITS.min, `Pick at least ${INTERESTS_LIMITS.min}`)
    .max(INTERESTS_LIMITS.max, `Up to ${INTERESTS_LIMITS.max}`),
});
export type InterestsValues = z.infer<typeof interestsSchema>;

export const dealBreakersSchema = z.object({
  deal_breakers: z.array(z.enum(DEAL_BREAKER_VALUES)),
});
export type DealBreakersValues = z.infer<typeof dealBreakersSchema>;

export const promptsSchema = z.object({
  prompts: z.array(
    z.object({
      prompt: z.string().min(1),
      answer: z.string().trim().min(1, 'Write an answer'),
    }),
  ).min(PROMPTS_LIMITS.min, 'Answer at least one prompt').max(PROMPTS_LIMITS.max, 'Up to three prompts'),
});
export type PromptsValues = z.infer<typeof promptsSchema>;

export const extrasSchema = z.object({
  dorm_preference: z.string().trim().optional().or(z.literal('')),
  living_program: z.string().trim().optional().or(z.literal('')),
  clubs: z.array(z.string().trim().min(1)).max(10).optional(),
  instagram: z.string().trim().optional().or(z.literal('')),
  linkedin: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
});
export type ExtrasValues = z.infer<typeof extrasSchema>;

// Final gate. photoCount/promptCount are passed in from the photos/prompts tables.
export const onboardingCompletionSchema = z.object({
  first_name: z.string().trim().min(1),
  graduation_year: z.number().int().min(2024).max(2035),
  majors: z.array(z.string().trim().min(1)).min(1),
  sleep_schedule: oneOf(SLEEP_SCHEDULE),
  bedtime: oneOf(BEDTIME),
  wakeup_time: oneOf(WAKEUP_TIME),
  cleanliness: z.number().int().min(1).max(5),
  noise_preference: oneOf(NOISE_PREFERENCE),
  study_style: oneOf(STUDY_STYLE),
  guests_frequency: oneOf(GUESTS_FREQUENCY),
  social_level: z.number().int().min(1).max(5),
  room_temperature: oneOf(ROOM_TEMPERATURE),
  interests: z.array(z.enum(INTEREST_VALUES)).min(5).max(10),
  promptCount: z.number().int().min(1),
  photoCount: z.number().int().min(1),
});
