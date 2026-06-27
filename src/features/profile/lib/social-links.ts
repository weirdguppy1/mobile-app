import { Profile } from '@/features/profile/types';

export type SocialKey = 'instagram' | 'linkedin' | 'snapchat';

export interface SocialLink {
  key: SocialKey;
  /** Deep-linkable https URL that opens the profile in-app or in the browser. */
  url: string;
}

/** Strip leading @ and surrounding whitespace from a handle. */
function handle(value: string): string {
  return value.trim().replace(/^@+/, '').trim();
}

/** Build the tappable social links for a profile, in display order (Instagram,
 *  LinkedIn, Snapchat). Only links the user actually set are returned. Handles are
 *  normalized to full https URLs; a LinkedIn value already containing a scheme is
 *  used as-is. */
export function buildSocialLinks(
  profile: Pick<Profile, 'instagram' | 'linkedin' | 'snapchat'>,
): SocialLink[] {
  const links: SocialLink[] = [];

  const ig = profile.instagram?.trim();
  if (ig) links.push({ key: 'instagram', url: `https://instagram.com/${handle(ig)}` });

  const li = profile.linkedin?.trim();
  if (li) {
    links.push({ key: 'linkedin', url: /^https?:\/\//i.test(li) ? li : `https://${li.replace(/^\/+/, '')}` });
  }

  const sc = profile.snapchat?.trim();
  if (sc) links.push({ key: 'snapchat', url: `https://snapchat.com/add/${handle(sc)}` });

  return links;
}
