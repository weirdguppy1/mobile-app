import { z } from 'zod';

import {
  ALCOHOL, BEDTIME, CLUBS_MAX, DEAL_BREAKERS, FITNESS, GRADUATION_YEARS, GUESTS_FREQUENCY,
  INTERESTS, INTERESTS_LIMITS, MAJORS_LIMITS, NOISE_PREFERENCE, type Option, PARTIES,
  ROMANTIC_GUESTS_FREQUENCY, ROOM_TEMPERATURE, SEX_ASSIGNED_AT_BIRTH, SEXUAL_ORIENTATION,
  SLEEP_SCHEDULE, SMOKING, STUDY_STYLE, WAKEUP_TIME,
} from '@/features/profile/constants';
import { labelFor } from '@/features/profile/lib/label-for';
import {
  aboutSchema, basicsSchema, compatibilitySchema, dealBreakersSchema, extrasSchema,
  interestsSchema, lifestyleSchema,
} from '@/features/profile/schema';
import { Profile } from '@/features/profile/types';
import { Database } from '@/types/database';

export type ProfilePatch = Database['public']['Tables']['profiles']['Update'];
/** Form value for a single editable field. */
export type FieldValue = string | string[] | number | null;

export type FieldControl =
  | { kind: 'text'; placeholder?: string }
  | { kind: 'about' }
  | { kind: 'options'; options: Option[] }
  | { kind: 'multi'; options: Option[]; min?: number; max?: number }
  | { kind: 'tags'; max: number; placeholder?: string }
  | { kind: 'scale'; low: string; high: string };

export interface ProfileField {
  id: string;
  label: string;
  group: string;             // section header in the Edit list / ProfileView
  control: FieldControl;
  atom: z.ZodTypeAny;        // validates the FORM value (RHF zodResolver)
  hideable: boolean;         // can be hidden from other users
  getValue: (p: Profile) => FieldValue;
  toPatch: (v: FieldValue) => ProfilePatch;
  read: (p: Profile) => string; // current-value text for the Edit row / display
}

type Col = keyof Profile;
const str = (p: Profile, c: Col) => (p[c] as string | null) ?? '';
const arr = (p: Profile, c: Col) => (p[c] as string[] | null) ?? [];
const NONE = 'None';

const singleEnum = (id: Col, label: string, group: string, options: Option[], atom: z.ZodTypeAny, hideable: boolean): ProfileField => ({
  id, label, group, hideable, control: { kind: 'options', options }, atom,
  getValue: (p) => str(p, id),
  toPatch: (v) => ({ [id]: v as string }) as ProfilePatch,
  read: (p) => labelFor(options, p[id] as string | null) || NONE,
});

const optionalText = (id: Col, label: string, group: string, hideable: boolean, atom: z.ZodTypeAny, placeholder?: string): ProfileField => ({
  id, label, group, hideable, control: { kind: 'text', placeholder }, atom,
  getValue: (p) => str(p, id),
  toPatch: (v) => ({ [id]: (v as string).trim() || null }) as ProfilePatch,
  read: (p) => str(p, id) || NONE,
});

const tagsField = (id: Col, label: string, group: string, max: number, atom: z.ZodTypeAny, hideable: boolean, placeholder?: string): ProfileField => ({
  id, label, group, hideable, control: { kind: 'tags', max, placeholder }, atom,
  getValue: (p) => arr(p, id),
  toPatch: (v) => ({ [id]: v as string[] }) as ProfilePatch,
  read: (p) => arr(p, id).join(', ') || NONE,
});

const multiField = (id: Col, label: string, group: string, options: Option[], atom: z.ZodTypeAny, hideable: boolean, min?: number, max?: number): ProfileField => ({
  id, label, group, hideable, control: { kind: 'multi', options, min, max }, atom,
  getValue: (p) => arr(p, id),
  toPatch: (v) => ({ [id]: v as string[] }) as ProfilePatch,
  read: (p) => { const n = arr(p, id).length; return n ? `${n} selected` : NONE; },
});

const scaleField = (id: Col, label: string, group: string, low: string, high: string, atom: z.ZodTypeAny, hideable: boolean): ProfileField => ({
  id, label, group, hideable, control: { kind: 'scale', low, high }, atom,
  getValue: (p) => (p[id] as number | null) ?? null,
  toPatch: (v) => ({ [id]: v as number }) as ProfilePatch,
  read: (p) => { const n = p[id] as number | null; return n ? `${n}/5` : NONE; },
});

const yearOptions: Option[] = GRADUATION_YEARS.map((y) => ({ value: String(y), label: String(y) }));

export const PROFILE_FIELDS: ProfileField[] = [
  // Basics
  {
    id: 'first_name', label: 'First name', group: 'Basics', hideable: false,
    control: { kind: 'text', placeholder: 'Preferred name' }, atom: basicsSchema.shape.first_name,
    getValue: (p) => str(p, 'first_name'),
    toPatch: (v) => ({ first_name: (v as string).trim() }),
    read: (p) => str(p, 'first_name') || NONE,
  },
  optionalText('pronouns', 'Pronouns', 'Basics', true, basicsSchema.shape.pronouns, 'she/her, he/him, they/them…'),
  {
    id: 'graduation_year', label: 'Graduation year', group: 'Basics', hideable: false,
    control: { kind: 'options', options: yearOptions }, atom: z.string().min(1, 'Pick a year'),
    getValue: (p) => (p.graduation_year ? String(p.graduation_year) : ''),
    toPatch: (v) => ({ graduation_year: Number(v) }),
    read: (p) => (p.graduation_year ? String(p.graduation_year) : NONE),
  },
  tagsField('majors', 'Majors', 'Basics', MAJORS_LIMITS.max, basicsSchema.shape.majors, false, 'Add a major'),
  optionalText('gender_identity', 'Gender identity', 'Basics', true, basicsSchema.shape.gender_identity, 'Woman, Man, Non-binary…'),
  singleEnum('sex_assigned_at_birth', 'Sex assigned at birth', 'Basics', SEX_ASSIGNED_AT_BIRTH, basicsSchema.shape.sex_assigned_at_birth, true),
  singleEnum('sexual_orientation', 'Sexual orientation', 'Basics', SEXUAL_ORIENTATION, basicsSchema.shape.sexual_orientation, true),

  // About
  {
    id: 'about_me', label: 'About me', group: 'About', hideable: false,
    control: { kind: 'about' }, atom: aboutSchema.shape.about_me,
    getValue: (p) => str(p, 'about_me'),
    toPatch: (v) => ({ about_me: (v as string).trim() }),
    read: (p) => str(p, 'about_me') || NONE,
  },

  // Living habits
  singleEnum('sleep_schedule', 'Sleep schedule', 'Living habits', SLEEP_SCHEDULE, compatibilitySchema.shape.sleep_schedule, true),
  singleEnum('bedtime', 'Bedtime', 'Living habits', BEDTIME, compatibilitySchema.shape.bedtime, true),
  singleEnum('wakeup_time', 'Wake-up time', 'Living habits', WAKEUP_TIME, compatibilitySchema.shape.wakeup_time, true),
  scaleField('cleanliness', 'Cleanliness', 'Living habits', 'Relaxed', 'Spotless', compatibilitySchema.shape.cleanliness, true),
  singleEnum('noise_preference', 'Noise preference', 'Living habits', NOISE_PREFERENCE, compatibilitySchema.shape.noise_preference, true),
  singleEnum('study_style', 'Study style', 'Living habits', STUDY_STYLE, compatibilitySchema.shape.study_style, true),
  singleEnum('guests_frequency', 'Guests', 'Living habits', GUESTS_FREQUENCY, compatibilitySchema.shape.guests_frequency, true),
  singleEnum('romantic_guests_frequency', 'Romantic guests', 'Living habits', ROMANTIC_GUESTS_FREQUENCY, compatibilitySchema.shape.romantic_guests_frequency, true),
  scaleField('social_level', 'Social level', 'Living habits', 'Homebody', 'Always out', compatibilitySchema.shape.social_level, true),
  singleEnum('room_temperature', 'Room temperature', 'Living habits', ROOM_TEMPERATURE, compatibilitySchema.shape.room_temperature, true),

  // Lifestyle
  singleEnum('alcohol', 'Alcohol', 'Lifestyle', ALCOHOL, lifestyleSchema.shape.alcohol, true),
  singleEnum('smoking', 'Smoking', 'Lifestyle', SMOKING, lifestyleSchema.shape.smoking, true),
  singleEnum('parties', 'Parties', 'Lifestyle', PARTIES, lifestyleSchema.shape.parties, true),
  singleEnum('fitness', 'Fitness', 'Lifestyle', FITNESS, lifestyleSchema.shape.fitness, true),

  // Interests & deal-breakers
  multiField('interests', 'Interests', 'Interests', INTERESTS, interestsSchema.shape.interests, false, INTERESTS_LIMITS.min, INTERESTS_LIMITS.max),
  multiField('deal_breakers', 'Deal-breakers', 'Deal-breakers', DEAL_BREAKERS, dealBreakersSchema.shape.deal_breakers, true),

  // Socials / extras
  optionalText('dorm_preference', 'Dorm preference', 'Socials', true, extrasSchema.shape.dorm_preference, 'e.g. North campus'),
  optionalText('living_program', 'Living program', 'Socials', true, extrasSchema.shape.living_program, 'e.g. Honors / LLC'),
  tagsField('clubs', 'Clubs', 'Socials', CLUBS_MAX, extrasSchema.shape.clubs, true, 'Add a club'),
  optionalText('instagram', 'Instagram', 'Socials', true, extrasSchema.shape.instagram, '@handle'),
  optionalText('linkedin', 'LinkedIn', 'Socials', true, extrasSchema.shape.linkedin, 'profile url'),
  optionalText('snapchat', 'Snapchat', 'Socials', true, extrasSchema.shape.snapchat, '@username'),
];

export const profileFieldById = (id: string): ProfileField | undefined =>
  PROFILE_FIELDS.find((f) => f.id === id);

/** Ordered list of distinct group names, in manifest order. */
export const PROFILE_FIELD_GROUPS: string[] = PROFILE_FIELDS.reduce<string[]>((groups, f) => {
  if (!groups.includes(f.group)) groups.push(f.group);
  return groups;
}, []);
