import { PROFILE_FIELD_GROUPS, PROFILE_FIELDS } from '@/features/profile/config/profile-fields';
import { isFieldHidden } from '@/features/profile/lib/field-visibility';
import { Profile } from '@/features/profile/types';

// Fields surfaced elsewhere (name/vitals header, about block, chips) — never shown
// as plain detail rows.
const SHOWN_ELSEWHERE = new Set([
  'first_name', 'pronouns', 'graduation_year', 'majors', 'about_me', 'interests', 'deal_breakers',
]);

export interface ProfileDetailGroup {
  group: string;
  rows: Array<{ id: string; label: string; value: string }>;
}

/** Visible detail sections for a read-only profile: each PROFILE_FIELD_GROUP with the
 *  fields that aren't shown elsewhere, aren't hidden, and have a real value. `exclude`
 *  drops additional field ids (e.g. the socials handles the profile page renders as icons). */
export function buildDetailGroups(profile: Profile, exclude?: ReadonlySet<string>): ProfileDetailGroup[] {
  return PROFILE_FIELD_GROUPS.map((group) => ({
    group,
    rows: PROFILE_FIELDS.filter(
      (f) => f.group === group
        && !SHOWN_ELSEWHERE.has(f.id)
        && !exclude?.has(f.id)
        && !(f.hideable && isFieldHidden(profile.hidden_fields, f.id))
        && f.read(profile) !== 'None',
    ).map((f) => ({ id: f.id, label: f.label, value: f.read(profile) })),
  })).filter((g) => g.rows.length > 0);
}
