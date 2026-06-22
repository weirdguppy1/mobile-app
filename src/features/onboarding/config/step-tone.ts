import { type StepId } from "@/features/onboarding/config/steps";

/** Emotional background tone per onboarding category (TASK.md §5). */
export type Tone =
  | "warm"
  | "neutral"
  | "firstLight"
  | "energy"
  | "curiosity"
  | "conviction"
  | "expression"
  | "radiance"
  | "serenity"
  | "horizon";

const TONE_BY_STEP: Record<StepId, Tone> = {
  basics: "neutral",
  compatibility: "horizon", // sleep / living habits
  lifestyle: "neutral",
  interests: "expression",
  dealBreakers: "neutral",
  prompts: "energy", // expressive / personality
  photos: "neutral",
  extras: "neutral",
  review: "warm", // celebratory lead-in to completion
};

export function toneFor(stepId: StepId): Tone {
  return TONE_BY_STEP[stepId];
}
