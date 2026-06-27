import { type SectionId } from '@/features/onboarding/config/sections';
import {
  aboutSchema, basicsSchema, compatibilitySchema, interestsSchema, lifestyleSchema, promptsSchema,
} from '@/features/profile/schema';
import { OnboardingData } from '@/features/profile/types';

export interface QuestionMeta {
  id: string;
  section: SectionId;
  title: string;        // hero question
  subtitle?: string;
  optional?: boolean;
  /** Pure resume predicate over loaded data. Optional questions → always true. */
  isComplete: (data: OnboardingData) => boolean;
}

const ok = <T>(r: { success: boolean }): boolean => r.success;
const always = () => true;

export const QUESTIONS: QuestionMeta[] = [
  // basics
  { id: 'first_name', section: 'basics', title: "What's your name?", subtitle: 'Your preferred name.',
    isComplete: (d) => ok(basicsSchema.shape.first_name.safeParse(d.profile.first_name ?? '')) },
  { id: 'pronouns', section: 'basics', title: 'What are your pronouns?', subtitle: 'she/her, he/him, they/them…',
    optional: true, isComplete: always },
  { id: 'graduation_year', section: 'basics', title: 'When do you graduate?',
    isComplete: (d) => ok(basicsSchema.shape.graduation_year.safeParse(d.profile.graduation_year ?? undefined)) },
  { id: 'majors', section: 'basics', title: 'What are you studying?', subtitle: 'Add up to three.',
    isComplete: (d) => ok(basicsSchema.shape.majors.safeParse(d.profile.majors ?? [])) },
  { id: 'gender_identity', section: 'basics', title: 'How do you identify?', optional: true, isComplete: always },
  { id: 'sex_assigned_at_birth', section: 'basics', title: 'Sex assigned at birth',
    isComplete: (d) => ok(basicsSchema.shape.sex_assigned_at_birth.safeParse(d.profile.sex_assigned_at_birth ?? undefined)) },
  { id: 'sexual_orientation', section: 'basics', title: 'Your sexual orientation',
    isComplete: (d) => ok(basicsSchema.shape.sexual_orientation.safeParse(d.profile.sexual_orientation ?? undefined)) },

  // living
  { id: 'sleep_schedule', section: 'living', title: "What's your sleep schedule?",
    isComplete: (d) => ok(compatibilitySchema.shape.sleep_schedule.safeParse(d.profile.sleep_schedule ?? undefined)) },
  { id: 'bedtime', section: 'living', title: 'When do you go to bed?',
    isComplete: (d) => ok(compatibilitySchema.shape.bedtime.safeParse(d.profile.bedtime ?? undefined)) },
  { id: 'wakeup_time', section: 'living', title: 'When do you wake up?',
    isComplete: (d) => ok(compatibilitySchema.shape.wakeup_time.safeParse(d.profile.wakeup_time ?? undefined)) },
  { id: 'cleanliness', section: 'living', title: 'How tidy are you?',
    isComplete: (d) => ok(compatibilitySchema.shape.cleanliness.safeParse(d.profile.cleanliness ?? undefined)) },
  { id: 'noise_preference', section: 'living', title: 'Noise while you study or sleep?',
    isComplete: (d) => ok(compatibilitySchema.shape.noise_preference.safeParse(d.profile.noise_preference ?? undefined)) },
  { id: 'study_style', section: 'living', title: 'Where do you study?',
    isComplete: (d) => ok(compatibilitySchema.shape.study_style.safeParse(d.profile.study_style ?? undefined)) },
  { id: 'guests_frequency', section: 'living', title: 'How often do guests come over?',
    isComplete: (d) => ok(compatibilitySchema.shape.guests_frequency.safeParse(d.profile.guests_frequency ?? undefined)) },
  { id: 'romantic_guests_frequency', section: 'living', title: 'Romantic guests?',
    isComplete: (d) => ok(compatibilitySchema.shape.romantic_guests_frequency.safeParse(d.profile.romantic_guests_frequency ?? undefined)) },
  { id: 'social_level', section: 'living', title: 'How social are you at home?',
    isComplete: (d) => ok(compatibilitySchema.shape.social_level.safeParse(d.profile.social_level ?? undefined)) },
  { id: 'room_temperature', section: 'living', title: 'Ideal room temperature?',
    isComplete: (d) => ok(compatibilitySchema.shape.room_temperature.safeParse(d.profile.room_temperature ?? undefined)) },

  // lifestyle
  { id: 'alcohol', section: 'lifestyle', title: 'Do you drink?',
    isComplete: (d) => ok(lifestyleSchema.shape.alcohol.safeParse(d.profile.alcohol ?? undefined)) },
  { id: 'smoking', section: 'lifestyle', title: 'Do you smoke?',
    isComplete: (d) => ok(lifestyleSchema.shape.smoking.safeParse(d.profile.smoking ?? undefined)) },
  { id: 'parties', section: 'lifestyle', title: 'How do you feel about parties?',
    isComplete: (d) => ok(lifestyleSchema.shape.parties.safeParse(d.profile.parties ?? undefined)) },
  { id: 'fitness', section: 'lifestyle', title: 'How active are you?',
    isComplete: (d) => ok(lifestyleSchema.shape.fitness.safeParse(d.profile.fitness ?? undefined)) },

  // interests
  { id: 'interests', section: 'interests', title: 'What are you into?', subtitle: 'Pick 5–10.',
    isComplete: (d) => ok(interestsSchema.safeParse({ interests: d.profile.interests ?? [] })) },

  // dealBreakers (optional — empty is allowed)
  { id: 'deal_breakers', section: 'dealBreakers', title: 'Any deal-breakers?',
    subtitle: "Things you can't live with.", optional: true, isComplete: always },

  // prompts section — "your words": a short bio, then the prompt cards
  { id: 'about_me', section: 'prompts', title: 'Tell us about you', subtitle: 'A short intro — up to 50 words.',
    isComplete: (d) => ok(aboutSchema.shape.about_me.safeParse(d.profile.about_me ?? '')) },
  { id: 'prompts', section: 'prompts', title: 'Write your profile answers', subtitle: 'Pick a prompt and make it yours.',
    isComplete: (d) => ok(promptsSchema.safeParse({ prompts: d.prompts.map((p) => ({ prompt: p.prompt, answer: p.answer })) })) },

  // photos (bespoke)
  { id: 'photos', section: 'photos', title: 'Add your photos', subtitle: 'At least one. Drag to reorder.',
    isComplete: (d) => d.photos.length >= 1 },

  // extras (all optional)
  { id: 'dorm_preference', section: 'extras', title: 'Dorm preference?', optional: true, isComplete: always },
  { id: 'living_program', section: 'extras', title: 'Any living program?', optional: true, isComplete: always },
  { id: 'clubs', section: 'extras', title: "Clubs you're in?", optional: true, isComplete: always },
  { id: 'instagram', section: 'extras', title: 'Your Instagram?', optional: true, isComplete: always },
  { id: 'linkedin', section: 'extras', title: 'LinkedIn?', optional: true, isComplete: always },
  { id: 'snapchat', section: 'extras', title: 'Snapchat?', optional: true, isComplete: always },
  { id: 'phone', section: 'extras', title: 'Phone number?', subtitle: '🔒 Private — only shared after you match.',
    optional: true, isComplete: always },

  // review (bespoke) — never auto-complete; the Finish button drives completion
  { id: 'review', section: 'review', title: "Here's your profile",
    isComplete: () => false },
];
