// src/features/onboarding/config/question-components.tsx
import { type ComponentType } from 'react';
import { Text, View } from 'react-native';

import { makeFieldQuestion, type Mutations } from '@/features/onboarding/lib/make-field-question';
import { PhotosQuestion } from '@/features/onboarding/questions/PhotosQuestion';
import { PromptsQuestion } from '@/features/onboarding/questions/PromptsQuestion';
import { ReviewQuestion } from '@/features/onboarding/questions/ReviewQuestion';
import {
  ABOUT_ME_LIMITS, ALCOHOL, BEDTIME, CLUBS_MAX, DEAL_BREAKERS, FITNESS, GRADUATION_YEARS,
  GUESTS_FREQUENCY, INTERESTS, INTERESTS_LIMITS, NOISE_PREFERENCE, PARTIES,
  ROMANTIC_GUESTS_FREQUENCY, ROOM_TEMPERATURE, SEX_ASSIGNED_AT_BIRTH,
  SEXUAL_ORIENTATION, SLEEP_SCHEDULE, SMOKING, STUDY_STYLE, WAKEUP_TIME,
} from '@/features/profile/constants';
import {
  aboutSchema, basicsSchema, compatibilitySchema, interestsSchema, lifestyleSchema,
} from '@/features/profile/schema';
import { OptionGroup, ScaleInput, TagInput, TextField } from '@/shared/components';
import { countWords } from '@/shared/utils/count-words';

const yearOptions = GRADUATION_YEARS.map((y) => ({ value: String(y), label: String(y) }));
const ok = (r: { success: boolean }) => r.success;

// Helper type alias for the saveProfile mutateAsync input
type ProfilePatch = Parameters<Mutations['saveProfile']['mutateAsync']>[0];

// --- basics ---
const FirstName = makeFieldQuestion<string>({
  getValue: (d) => d.profile.first_name ?? '',
  isValid: (v) => ok(basicsSchema.shape.first_name.safeParse(v)),
  save: (v, m) => m.saveProfile.mutateAsync({ first_name: v.trim() }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="Preferred name" />,
});
const Pronouns = makeFieldQuestion<string>({
  getValue: (d) => d.profile.pronouns ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ pronouns: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="she/her, he/him, they/them…" />,
});
const GraduationYear = makeFieldQuestion<number | null>({
  getValue: (d) => d.profile.graduation_year ?? null,
  isValid: (v) => ok(basicsSchema.shape.graduation_year.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ graduation_year: v! }),
  control: (v, set) => (
    <OptionGroup options={yearOptions} value={v ? String(v) : null} onChange={(s) => set(s ? Number(s) : null)} />
  ),
});
const Majors = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.majors ?? [],
  isValid: (v) => ok(basicsSchema.shape.majors.safeParse(v)),
  save: (v, m) => m.saveProfile.mutateAsync({ majors: v }),
  control: (v, set) => <TagInput value={v} onChange={set} max={3} placeholder="Add a major and press done" />,
});
const GenderIdentity = makeFieldQuestion<string>({
  getValue: (d) => d.profile.gender_identity ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ gender_identity: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="Woman, Man, Non-binary…" />,
});
const SexAssignedAtBirth = makeFieldQuestion<string | null>({
  getValue: (d) => d.profile.sex_assigned_at_birth ?? null,
  isValid: (v) => ok(basicsSchema.shape.sex_assigned_at_birth.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ sex_assigned_at_birth: v }),
  control: (v, set) => <OptionGroup options={SEX_ASSIGNED_AT_BIRTH} value={v} onChange={set} />,
});
const SexualOrientation = makeFieldQuestion<string | null>({
  getValue: (d) => d.profile.sexual_orientation ?? null,
  isValid: (v) => ok(basicsSchema.shape.sexual_orientation.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ sexual_orientation: v }),
  control: (v, set) => <OptionGroup options={SEXUAL_ORIENTATION} value={v} onChange={set} />,
});

// --- living --- (single-select enums + two scales)
function enumQuestion(
  field: keyof typeof compatibilitySchema.shape,
  options: { value: string; label: string }[],
) {
  return makeFieldQuestion<string | null>({
    getValue: (d) => (d.profile[field as keyof typeof d.profile] as string | null) ?? null,
    isValid: (v) => ok(compatibilitySchema.shape[field].safeParse(v ?? undefined)),
    save: (v, m) => m.saveProfile.mutateAsync({ [field]: v } as ProfilePatch),
    control: (v, set) => <OptionGroup options={options} value={v} onChange={set} />,
  });
}
const SleepSchedule = enumQuestion('sleep_schedule', SLEEP_SCHEDULE);
const Bedtime = enumQuestion('bedtime', BEDTIME);
const WakeupTime = enumQuestion('wakeup_time', WAKEUP_TIME);
const NoisePreference = enumQuestion('noise_preference', NOISE_PREFERENCE);
const StudyStyle = enumQuestion('study_style', STUDY_STYLE);
const GuestsFrequency = enumQuestion('guests_frequency', GUESTS_FREQUENCY);
const RomanticGuestsFrequency = enumQuestion('romantic_guests_frequency', ROMANTIC_GUESTS_FREQUENCY);
const RoomTemperature = enumQuestion('room_temperature', ROOM_TEMPERATURE);
const Cleanliness = makeFieldQuestion<number | null>({
  getValue: (d) => d.profile.cleanliness ?? null,
  isValid: (v) => ok(compatibilitySchema.shape.cleanliness.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ cleanliness: v }),
  control: (v, set) => <ScaleInput value={v} onChange={set} lowLabel="Relaxed" highLabel="Spotless" />,
});
const SocialLevel = makeFieldQuestion<number | null>({
  getValue: (d) => d.profile.social_level ?? null,
  isValid: (v) => ok(compatibilitySchema.shape.social_level.safeParse(v ?? undefined)),
  save: (v, m) => m.saveProfile.mutateAsync({ social_level: v }),
  control: (v, set) => <ScaleInput value={v} onChange={set} lowLabel="Homebody" highLabel="Always out" />,
});

// --- lifestyle ---
function lifestyleQuestion(
  field: keyof typeof lifestyleSchema.shape,
  options: { value: string; label: string }[],
) {
  return makeFieldQuestion<string | null>({
    getValue: (d) => (d.profile[field as keyof typeof d.profile] as string | null) ?? null,
    isValid: (v) => ok(lifestyleSchema.shape[field].safeParse(v ?? undefined)),
    save: (v, m) => m.saveProfile.mutateAsync({ [field]: v } as ProfilePatch),
    control: (v, set) => <OptionGroup options={options} value={v} onChange={set} />,
  });
}
const Alcohol = lifestyleQuestion('alcohol', ALCOHOL);
const Smoking = lifestyleQuestion('smoking', SMOKING);
const Parties = lifestyleQuestion('parties', PARTIES);
const Fitness = lifestyleQuestion('fitness', FITNESS);

// --- interests ---
const Interests = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.interests ?? [],
  isValid: (v) => ok(interestsSchema.safeParse({ interests: v })),
  save: (v, m) => m.saveProfile.mutateAsync({ interests: v }),
  control: (v, set) => (
    <View className="gap-3">
      <View className="flex-row justify-between">
        <Text className="prose-footnote text-slate">Pick {INTERESTS_LIMITS.min}–{INTERESTS_LIMITS.max}</Text>
        <Text className="prose-footnote font-semibold text-ink">{v.length} selected</Text>
      </View>
      <OptionGroup multiple options={INTERESTS} value={v} onChange={set} min={INTERESTS_LIMITS.min} max={INTERESTS_LIMITS.max} />
    </View>
  ),
});

// --- dealBreakers (optional) ---
const DealBreakers = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.deal_breakers ?? [],
  save: (v, m) => m.saveProfile.mutateAsync({ deal_breakers: v }),
  control: (v, set) => <OptionGroup multiple options={DEAL_BREAKERS} value={v} onChange={set} />,
});

// --- prompts section: about_me (the bio that opens "your words") ---
const AboutMe = makeFieldQuestion<string>({
  getValue: (d) => d.profile.about_me ?? '',
  isValid: (v) => ok(aboutSchema.shape.about_me.safeParse(v)),
  save: (v, m) => m.saveProfile.mutateAsync({ about_me: v.trim() }),
  control: (v, set) => {
    const words = countWords(v);
    return (
      <TextField
        value={v}
        onChangeText={set}
        multiline
        textAlignVertical="top"
        placeholder="What should a future roommate know about you?"
        style={{ minHeight: 120 }}
        message={`${words}/${ABOUT_ME_LIMITS.maxWords} words`}
        invalid={words > ABOUT_ME_LIMITS.maxWords}
      />
    );
  },
});

// --- extras (all optional) ---
const DormPreference = makeFieldQuestion<string>({
  getValue: (d) => d.profile.dorm_preference ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ dorm_preference: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="e.g. North campus" />,
});
const LivingProgram = makeFieldQuestion<string>({
  getValue: (d) => d.profile.living_program ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ living_program: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} placeholder="e.g. Honors / LLC" />,
});
const Clubs = makeFieldQuestion<string[]>({
  getValue: (d) => d.profile.clubs ?? [],
  save: (v, m) => m.saveProfile.mutateAsync({ clubs: v }),
  control: (v, set) => <TagInput value={v} onChange={set} max={CLUBS_MAX} placeholder="Add a club" />,
});
const Instagram = makeFieldQuestion<string>({
  getValue: (d) => d.profile.instagram ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ instagram: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} autoCapitalize="none" placeholder="@handle" />,
});
const Linkedin = makeFieldQuestion<string>({
  getValue: (d) => d.profile.linkedin ?? '',
  save: (v, m) => m.saveProfile.mutateAsync({ linkedin: v.trim() || null }),
  control: (v, set) => <TextField value={v} onChangeText={set} autoCapitalize="none" placeholder="profile url" />,
});
const Phone = makeFieldQuestion<string>({
  getValue: () => '',
  save: async (v, m) => { if (v.trim()) await m.savePrivateContact.mutateAsync(v.trim()); },
  control: (v, set) => (
    <View className="gap-1.5">
      <TextField value={v} onChangeText={set} keyboardType="phone-pad" placeholder="(555) 555-5555" />
      <Text className="prose-caption text-ash">🔒 Private — only shared after you match with someone.</Text>
    </View>
  ),
});

export const QUESTION_COMPONENTS: Record<string, ComponentType> = {
  first_name: FirstName, pronouns: Pronouns, graduation_year: GraduationYear, majors: Majors,
  gender_identity: GenderIdentity, sex_assigned_at_birth: SexAssignedAtBirth, sexual_orientation: SexualOrientation,
  sleep_schedule: SleepSchedule, bedtime: Bedtime, wakeup_time: WakeupTime, cleanliness: Cleanliness,
  noise_preference: NoisePreference, study_style: StudyStyle, guests_frequency: GuestsFrequency,
  romantic_guests_frequency: RomanticGuestsFrequency, social_level: SocialLevel, room_temperature: RoomTemperature,
  alcohol: Alcohol, smoking: Smoking, parties: Parties, fitness: Fitness,
  interests: Interests, deal_breakers: DealBreakers,
  about_me: AboutMe, prompts: PromptsQuestion, photos: PhotosQuestion,
  dorm_preference: DormPreference, living_program: LivingProgram, clubs: Clubs,
  instagram: Instagram, linkedin: Linkedin, phone: Phone,
  review: ReviewQuestion,
};
