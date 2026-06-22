import { type Tone } from '@/features/onboarding/components/OnboardingBackground';

export type SectionId =
  | 'basics' | 'living' | 'lifestyle' | 'interests'
  | 'dealBreakers' | 'prompts' | 'photos' | 'extras' | 'review';

export interface SectionDef {
  id: SectionId;
  /** Progress label shown above the section's segment bar. */
  title: string;
  /** Interstitial background tone (question screens stay neutral). */
  tone: Tone;
  /** Chapter-break copy. Edit headlines/body here — single source of truth. */
  interstitial: { headline: string; body: string };
}

// All user-facing interstitial copy lives here so it can be reworded in one place.
export const SECTIONS: SectionDef[] = [
  { id: 'basics', title: 'The basics', tone: 'firstLight',
    interstitial: { headline: "Let's build\nyour profile.", body: 'No wrong answers — just be you.' } },
  { id: 'living', title: 'Living habits', tone: 'serenity',
    interstitial: { headline: 'Now — how you\nlive day-to-day.', body: 'The stuff that makes or breaks sharing a space.' } },
  { id: 'lifestyle', title: 'Lifestyle', tone: 'energy',
    interstitial: { headline: 'A little about\nyour lifestyle.', body: 'Habits and vibes.' } },
  { id: 'interests', title: 'Interests', tone: 'expression',
    interstitial: { headline: "What you're\ninto.", body: 'So we can spot the overlap.' } },
  { id: 'dealBreakers', title: 'Deal-breakers', tone: 'conviction',
    interstitial: { headline: 'Real talk:\ndeal-breakers.', body: "Totally optional — only if you've got 'em." } },
  { id: 'prompts', title: 'Prompts', tone: 'curiosity',
    interstitial: { headline: 'Show some\npersonality.', body: 'This is where you actually come through.' } },
  { id: 'photos', title: 'Photos', tone: 'radiance',
    interstitial: { headline: 'Put a face\nto the vibe.', body: 'Add a few photos.' } },
  { id: 'extras', title: 'Extras', tone: 'horizon',
    interstitial: { headline: 'The extras.', body: 'Optional flourishes to round you out.' } },
  { id: 'review', title: 'Review', tone: 'warm',
    interstitial: { headline: "That's\neverything.", body: 'Take a look before we start matching.' } },
];

const BY_ID: Record<SectionId, SectionDef> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
) as Record<SectionId, SectionDef>;

export function sectionById(id: SectionId): SectionDef {
  return BY_ID[id];
}
