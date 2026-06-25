import { z } from 'zod';

import { OnboardingData } from '@/features/profile/types';

/** One candidate in the browse feed: a profile plus its signed photos and prompts.
 *  Structurally identical to OnboardingData — aliased here to document intent. */
export type DiscoveryProfile = OnboardingData;

/** What a connection request points at. The `likes` row stores exactly one of
 *  liked_photo_id / liked_prompt_id (see the likes_one_target check). */
export type RequestTarget =
  | { kind: 'photo'; photoId: string }
  | { kind: 'prompt'; promptId: string };

/** The required note attached to every request. Trimmed; 1–240 chars. */
export const noteSchema = z
  .string()
  .trim()
  .min(1, 'Add a short note')
  .max(240, 'Keep it under 240 characters');

export type NoteValues = { note: z.infer<typeof noteSchema> };
