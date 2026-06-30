import { SLEEP_SCHEDULE } from '@/features/profile/constants';
import { isFieldHidden } from '@/features/profile/lib/field-visibility';
import { labelFor } from '@/features/profile/lib/label-for';
import { Profile, ProfilePrompt, SignedProfilePhoto } from '@/features/profile/types';

/** The vitals line shown under the name (DESIGN.md: year · major · dorm · sleep).
 *  Skips empty values and any hideable field the user has hidden. */
export function buildVitals(profile: Profile): string[] {
  const tokens: string[] = [];
  if (profile.graduation_year) tokens.push(String(profile.graduation_year));
  const major = profile.majors?.[0];
  if (major) tokens.push(major);
  if (profile.dorm_preference && !isFieldHidden(profile.hidden_fields, 'dorm_preference')) {
    tokens.push(profile.dorm_preference);
  }
  if (profile.sleep_schedule && !isFieldHidden(profile.hidden_fields, 'sleep_schedule')) {
    tokens.push(labelFor(SLEEP_SCHEDULE, profile.sleep_schedule));
  }
  return tokens;
}

/** The condensed header line shown on the Discover/Profile header: year · major
 *  only (DESIGN.md evolution). Dorm/sleep live in chips + detail sections. */
export function buildHeaderVitals(profile: Profile): string[] {
  const tokens: string[] = [];
  if (profile.graduation_year) tokens.push(String(profile.graduation_year));
  const major = profile.majors?.[0];
  if (major) tokens.push(major);
  return tokens;
}

export type FeedItem =
  | { type: 'photo'; photo: SignedProfilePhoto }
  | { type: 'prompt'; prompt: ProfilePrompt };

/** Interleave photos and prompts so they alternate down the page (photo, prompt,
 *  photo, prompt, …); any remainder of the longer list trails at the end. */
export function buildProfileFeed(photos: SignedProfilePhoto[], prompts: ProfilePrompt[]): FeedItem[] {
  const feed: FeedItem[] = [];
  const max = Math.max(photos.length, prompts.length);
  for (let i = 0; i < max; i++) {
    if (i < photos.length) feed.push({ type: 'photo', photo: photos[i] });
    if (i < prompts.length) feed.push({ type: 'prompt', prompt: prompts[i] });
  }
  return feed;
}
