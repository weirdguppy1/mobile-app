import { type ComponentType } from 'react';

import { BasicsStep } from '@/features/onboarding/steps/BasicsStep';
import { CompatibilityStep } from '@/features/onboarding/steps/CompatibilityStep';
import { DealBreakersStep } from '@/features/onboarding/steps/DealBreakersStep';
import { ExtrasStep } from '@/features/onboarding/steps/ExtrasStep';
import { InterestsStep } from '@/features/onboarding/steps/InterestsStep';
import { LifestyleStep } from '@/features/onboarding/steps/LifestyleStep';
import { PhotosStep } from '@/features/onboarding/steps/PhotosStep';
import { PromptsStep } from '@/features/onboarding/steps/PromptsStep';
import { ReviewStep } from '@/features/onboarding/steps/ReviewStep';

import { OnboardingData } from '@/features/profile/types';

export type StepId =
  | 'basics' | 'compatibility' | 'lifestyle' | 'interests'
  | 'dealBreakers' | 'prompts' | 'photos' | 'extras' | 'review';

export interface StepConfig {
  id: StepId;
  title: string;
  subtitle: string;
  Component: ComponentType;
  skippable?: boolean;
  isComplete: (data: OnboardingData) => boolean;
}

const compatComplete = (p: OnboardingData['profile']) =>
  !!p.sleep_schedule && !!p.bedtime && !!p.wakeup_time && p.cleanliness != null &&
  !!p.noise_preference && !!p.study_style && !!p.guests_frequency &&
  p.social_level != null && !!p.room_temperature;

export const STEPS: StepConfig[] = [
  {
    id: 'basics', title: 'The basics', subtitle: 'Tell us who you are.',
    Component: BasicsStep,
    isComplete: (d) => !!d.profile.first_name && d.profile.graduation_year != null && (d.profile.majors?.length ?? 0) >= 1,
  },
  {
    id: 'compatibility', title: 'Living habits', subtitle: 'How you live day to day.',
    Component: CompatibilityStep,
    isComplete: (d) => compatComplete(d.profile),
  },
  {
    id: 'lifestyle', title: 'Lifestyle', subtitle: 'A few more preferences.',
    Component: LifestyleStep,
    isComplete: (d) => !!d.profile.alcohol && !!d.profile.smoking && !!d.profile.parties && !!d.profile.fitness,
  },
  {
    id: 'interests', title: 'Your interests', subtitle: 'Pick 5–10.',
    Component: InterestsStep,
    isComplete: (d) => { const n = d.profile.interests?.length ?? 0; return n >= 5 && n <= 10; },
  },
  {
    id: 'dealBreakers', title: 'Deal-breakers', subtitle: "Anything you can't live with?",
    Component: DealBreakersStep,
    isComplete: (d) => d.profile.deal_breakers != null,
  },
  {
    id: 'prompts', title: 'Prompts', subtitle: 'Answer 1–3 to show your personality.',
    Component: PromptsStep,
    isComplete: (d) => d.prompts.length >= 1,
  },
  {
    id: 'photos', title: 'Photos', subtitle: 'Add at least one. Drag to reorder.',
    Component: PhotosStep,
    isComplete: (d) => d.photos.length >= 1,
  },
  {
    id: 'extras', title: 'Extras', subtitle: 'Optional — round out your profile.',
    Component: ExtrasStep, skippable: true,
    isComplete: () => true,
  },
  {
    id: 'review', title: 'Review', subtitle: 'Looks good? Finish to start matching.',
    Component: ReviewStep,
    isComplete: () => false,
  },
];
