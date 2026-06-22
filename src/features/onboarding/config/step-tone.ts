import { type StepId } from "@/features/onboarding/config/steps";
import { type Tone } from "@/features/onboarding/components/OnboardingBackground";

export type { Tone };

const TONE_BY_STEP: Record<StepId, Tone> = {
  basics: "neutral", compatibility: "neutral", lifestyle: "neutral",
  interests: "neutral", dealBreakers: "neutral", prompts: "neutral",
  photos: "neutral", extras: "neutral", review: "warm",
};

export function toneFor(stepId: StepId): Tone {
  return TONE_BY_STEP[stepId];
}
