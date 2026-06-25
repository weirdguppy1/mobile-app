import { Image } from 'expo-image';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { createPhotoSignedUrl } from '@/features/profile/api';
import { DEAL_BREAKERS, INTERESTS } from '@/features/profile/constants';
import {
  PROFILE_FIELD_GROUPS, PROFILE_FIELDS, type ProfileField,
} from '@/features/profile/config/profile-fields';
import { isFieldHidden } from '@/features/profile/lib/field-visibility';
import { labelFor } from '@/features/profile/lib/label-for';
import { buildProfileFeed, buildVitals } from '@/features/profile/lib/profile-vitals';
import { Profile, ProfilePrompt, SignedProfilePhoto } from '@/features/profile/types';

// Fields surfaced elsewhere (name/vitals header, about block, chips) — never shown
// as plain detail rows.
const SHOWN_ELSEWHERE = new Set([
  'first_name', 'pronouns', 'graduation_year', 'majors', 'about_me', 'interests', 'deal_breakers',
]);

interface ProfileViewProps {
  profile: Profile;
  photos: SignedProfilePhoto[];
  prompts: ProfilePrompt[];
  /** Top-right header slot (e.g. a settings gear on the self-profile). */
  headerAccessory?: ReactNode;
  /** Content rendered directly under the name/vitals header (e.g. a Discovery
   *  compatibility card); omitted ⇒ nothing shown. */
  belowHeader?: ReactNode;
  /** Discovery-only per-element like affordances; omitted ⇒ no overlays (self-preview). */
  renderPhotoOverlay?: (photo: SignedProfilePhoto, index: number) => ReactNode;
  renderPromptOverlay?: (prompt: ProfilePrompt, index: number) => ReactNode;
  /** Bottom padding so content clears a floating tab bar. */
  bottomInset?: number;
}

/** Read-only profile, exactly as another user will see it: name + vitals, photos
 *  interleaved with prompt cards, then visible detail sections. Pure/props-driven
 *  so it also powers the Discovery card later. Hidden fields are never rendered. */
export function ProfileView({
  profile, photos, prompts, headerAccessory, belowHeader, renderPhotoOverlay, renderPromptOverlay, bottomInset = 0,
}: ProfileViewProps) {
  const vitals = buildVitals(profile);
  const feed = buildProfileFeed(photos, prompts);

  const detailGroups = PROFILE_FIELD_GROUPS.map((group) => ({
    group,
    fields: PROFILE_FIELDS.filter(
      (f) => f.group === group
        && !SHOWN_ELSEWHERE.has(f.id)
        && !(f.hideable && isFieldHidden(profile.hidden_fields, f.id))
        && f.read(profile) !== 'None',
    ),
  })).filter((g) => g.fields.length > 0);

  const interests = profile.interests ?? [];
  const dealBreakers = isFieldHidden(profile.hidden_fields, 'deal_breakers') ? [] : (profile.deal_breakers ?? []);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pt-4 gap-6"
      contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="prose-display text-ink">{profile.first_name ?? 'You'}</Text>
          {profile.pronouns ? <Text className="prose-subtitle">{profile.pronouns}</Text> : null}
          {vitals.length ? <Text className="prose-footnote text-graphite">{vitals.join(' · ')}</Text> : null}
        </View>
        {headerAccessory}
      </View>

      {belowHeader}

      {profile.about_me ? (
        <Text className="prose-body text-ink">{profile.about_me}</Text>
      ) : null}

      {/* Photos interleaved with prompts */}
      {feed.map((item, i) =>
        item.type === 'photo' ? (
          <ProfilePhoto key={`ph-${item.photo.id}`} photo={item.photo} overlay={renderPhotoOverlay?.(item.photo, i)} />
        ) : (
          <ReadOnlyPromptCard key={`pr-${item.prompt.id}`} prompt={item.prompt} overlay={renderPromptOverlay?.(item.prompt, i)} />
        ),
      )}

      {interests.length ? (
        <ChipsSection title="Interests" labels={interests.map((v) => labelFor(INTERESTS, v))} />
      ) : null}
      {dealBreakers.length ? (
        <ChipsSection title="Deal-breakers" labels={dealBreakers.map((v) => labelFor(DEAL_BREAKERS, v))} />
      ) : null}

      {detailGroups.map(({ group, fields }) => (
        <View key={group} className="gap-2">
          <Text className="prose-label text-graphite">{group}</Text>
          <View className="card border-continuous px-4">
            {fields.map((f, i) => (
              <DetailRow key={f.id} field={f} value={f.read(profile)} divider={i > 0} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ProfilePhoto({ photo, overlay }: { photo: SignedProfilePhoto; overlay?: ReactNode }) {
  const [uri, setUri] = useState<string | null>(photo.signedUrl);
  const attempts = useRef(0);

  // Photos normally arrive pre-signed (batch fetch). Signed URLs are short-lived,
  // so this is a backstop: re-sign from the storage path if a URL is missing, or if
  // the image fails to load (e.g. it expired during a very long session). Capped so
  // it can't loop.
  useEffect(() => {
    setUri(photo.signedUrl);
    attempts.current = 0;
    if (!photo.signedUrl && photo.url) {
      attempts.current += 1;
      createPhotoSignedUrl(photo.url).then(setUri).catch(() => {});
    }
  }, [photo.id, photo.signedUrl, photo.url]);

  const handleError = () => {
    if (attempts.current >= 3 || !photo.url) return;
    attempts.current += 1;
    createPhotoSignedUrl(photo.url).then(setUri).catch(() => {});
  };

  return (
    <View className="overflow-hidden rounded-xl border border-silver bg-wash shadow-card" style={{ width: '100%', aspectRatio: 4 / 5 }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" onError={handleError} />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Text className="prose-caption text-graphite">Unavailable</Text>
        </View>
      )}
      {overlay ? <View className="absolute bottom-2 right-2">{overlay}</View> : null}
    </View>
  );
}

function ReadOnlyPromptCard({ prompt, overlay }: { prompt: ProfilePrompt; overlay?: ReactNode }) {
  return (
    <View className="card border-continuous shadow-card gap-2 px-5 py-5">
      <Text className="prose-footnote text-slate">{prompt.prompt}</Text>
      <Text className="font-display text-3xl tracking-tight text-ink">{prompt.answer}</Text>
      {overlay ? <View className="absolute bottom-2 right-2">{overlay}</View> : null}
    </View>
  );
}

function ChipsSection({ title, labels }: { title: string; labels: string[] }) {
  return (
    <View className="gap-2">
      <Text className="prose-label text-graphite">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {labels.map((l) => (
          <View key={l} className="rounded-full border border-silver bg-canvas px-4 py-2.5">
            <Text className="prose-footnote text-graphite">{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DetailRow({ field, value, divider }: { field: ProfileField; value: string; divider: boolean }) {
  return (
    <View className={`flex-row items-center justify-between gap-3 py-3 ${divider ? 'border-t border-silver' : ''}`}>
      <Text className="prose-footnote text-slate">{field.label}</Text>
      <Text className="prose-footnote flex-1 text-right font-medium text-ink">{value}</Text>
    </View>
  );
}
