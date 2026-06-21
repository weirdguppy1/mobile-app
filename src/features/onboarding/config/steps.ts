import { type ComponentType } from 'react';

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

const Placeholder: ComponentType = () => null;

const compatComplete = (p: OnboardingData['profile']) =>
  !!p.sleep_schedule && !!p.bedtime && !!p.wakeup_time && p.cleanliness != null &&
  !!p.noise_preference && !!p.study_style && !!p.guests_frequency &&
  p.social_level != null && !!p.room_temperature;

export const STEPS: StepConfig[] = [
  {
    id: 'basics', title: 'The basics', subtitle: 'Tell us who you are.',
    Component: Placeholder,
    isComplete: (d) => !!d.profile.first_name && d.profile.graduation_year != null && (d.profile.majors?.length ?? 0) >= 1,
  },
  {
    id: 'compatibility', title: 'Living habits', subtitle: 'How you live day to day.',
    Component: Placeholder,
    isComplete: (d) => compatComplete(d.profile),
  },
  {
    id: 'lifestyle', title: 'Lifestyle', subtitle: 'A few more preferences.',
    Component: Placeholder,
    isComplete: (d) => !!d.profile.alcohol && !!d.profile.smoking && !!d.profile.parties && !!d.profile.fitness,
  },
  {
    id: 'interests', title: 'Your interests', subtitle: 'Pick 5–10.',
    Component: Placeholder,
    isComplete: (d) => { const n = d.profile.interests?.length ?? 0; return n >= 5 && n <= 10; },
  },
  {
    id: 'dealBreakers', title: 'Deal-breakers', subtitle: "Anything you can't live with?",
    Component: Placeholder,
    isComplete: (d) => d.profile.deal_breakers != null,
  },
  {
    id: 'prompts', title: 'Prompts', subtitle: 'Answer 1–3 to show your personality.',
    Component: Placeholder,
    isComplete: (d) => d.prompts.length >= 1,
  },
  {
    id: 'photos', title: 'Photos', subtitle: 'Add at least one. Drag to reorder.',
    Component: Placeholder,
    isComplete: (d) => d.photos.length >= 1,
  },
  {
    id: 'extras', title: 'Extras', subtitle: 'Optional — round out your profile.',
    Component: Placeholder, skippable: true,
    isComplete: () => true,
  },
  {
    id: 'review', title: 'Review', subtitle: 'Looks good? Finish to start matching.',
    Component: Placeholder,
    isComplete: () => false,
  },
];
