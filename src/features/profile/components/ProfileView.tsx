import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ProfileChips } from '@/features/profile/components/ProfileChips';
import { ProfileDetailSection } from '@/features/profile/components/ProfileDetailSection';
import { ReadOnlyPromptCard } from '@/features/profile/components/ReadOnlyPromptCard';
import { DEAL_BREAKERS, INTERESTS } from '@/features/profile/constants';
import { useSignedPhotoUri } from '@/features/profile/hooks/use-signed-photo-uri';
import { isFieldHidden } from '@/features/profile/lib/field-visibility';
import { labelFor } from '@/features/profile/lib/label-for';
import { buildDetailGroups } from '@/features/profile/lib/profile-detail-groups';
import { buildProfileFeed, buildVitals } from '@/features/profile/lib/profile-vitals';
import { Profile, ProfilePrompt, SignedProfilePhoto } from '@/features/profile/types';

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
  const detailGroups = buildDetailGroups(profile);

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
        <ProfileChips title="Interests" labels={interests.map((v) => labelFor(INTERESTS, v))} />
      ) : null}
      {dealBreakers.length ? (
        <ProfileChips title="Deal-breakers" labels={dealBreakers.map((v) => labelFor(DEAL_BREAKERS, v))} />
      ) : null}

      {detailGroups.map((group) => (
        <ProfileDetailSection key={group.group} group={group} />
      ))}
    </ScrollView>
  );
}

function ProfilePhoto({ photo, overlay }: { photo: SignedProfilePhoto; overlay?: ReactNode }) {
  const [uri, handleError] = useSignedPhotoUri(photo);

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
