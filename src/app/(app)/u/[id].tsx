import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MessageCircle, MoreVertical, Phone } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { RequestSheet } from '@/features/discovery/components/RequestSheet';
import { useDiscoveryActions } from '@/features/discovery/hooks/use-discovery-actions';
import { ConnectionCelebration } from '@/features/notifications/components/ConnectionCelebration';
import { PhotoCarousel } from '@/features/profile/components/PhotoCarousel';
import { ProfileChips } from '@/features/profile/components/ProfileChips';
import { ProfileDetailSection } from '@/features/profile/components/ProfileDetailSection';
import { ReadOnlyPromptCard } from '@/features/profile/components/ReadOnlyPromptCard';
import { SocialsBar } from '@/features/profile/components/SocialsBar';
import { DEAL_BREAKERS, INTERESTS } from '@/features/profile/constants';
import { useCurrentUserId, useOnboardingData } from '@/features/profile/hooks/use-profile';
import { useProfileActions } from '@/features/profile/hooks/use-profile-actions';
import { useRelationship, useUserContact, useUserProfile } from '@/features/profile/hooks/use-user-profile';
import { isFieldHidden } from '@/features/profile/lib/field-visibility';
import { labelFor } from '@/features/profile/lib/label-for';
import { buildDetailGroups } from '@/features/profile/lib/profile-detail-groups';
import { buildVitals } from '@/features/profile/lib/profile-vitals';
import { Relationship } from '@/features/profile/lib/relationship';
import { Button, PressScale } from '@/shared/components';

// Socials are shown as icons at the top, so don't repeat the handles as detail rows.
const SOCIAL_FIELDS = new Set(['instagram', 'linkedin', 'snapchat']);

function formatMatchedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center px-10">{children}</View>;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = id ?? '';
  const meId = useCurrentUserId();

  const { data: me } = useOnboardingData();
  const profileQuery = useUserProfile(userId);
  const relationshipQuery = useRelationship(userId);
  const relationship = relationshipQuery.data;
  const isMatched = relationship?.state === 'matched';
  const contactQuery = useUserContact(userId, isMatched);
  const actions = useProfileActions(userId);
  const { sendRequest } = useDiscoveryActions();

  const [requestOpen, setRequestOpen] = useState(false);
  const [accepting, setAccepting] = useState<{ origin: { x: number; y: number } } | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const acceptBtnRef = useRef<View>(null);

  const profile = profileQuery.data?.profile;
  const name = profile?.first_name ?? null;

  const confirmBlock = () => {
    Alert.alert(
      name ? `Block ${name}?` : 'Block this person?',
      "They won't see your profile or message you, and you won't see them.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => actions.block.mutate(undefined, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  const openReport = () => {
    const done = () => Alert.alert('Thanks for the report', 'Our team will take a look.');
    Alert.alert(name ? `Report ${name}` : 'Report', 'Why are you reporting this profile?', [
      { text: 'Inappropriate content', onPress: () => actions.report.mutate('inappropriate', { onSuccess: done }) },
      { text: 'Fake profile', onPress: () => actions.report.mutate('fake', { onSuccess: done }) },
      { text: 'Harassment', onPress: () => actions.report.mutate('harassment', { onSuccess: done }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openOverflow = () => {
    Alert.alert(name ?? 'Options', undefined, [
      { text: 'Report', onPress: openReport },
      { text: 'Block', style: 'destructive', onPress: confirmBlock },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const confirmUnmatch = (matchId: string) => {
    Alert.alert(name ? `Unmatch ${name}?` : 'Unmatch?', 'This removes your match and your conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unmatch',
        style: 'destructive',
        onPress: () => actions.unmatch.mutate(matchId, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const onAccept = () => {
    if (accepting) return;
    matchIdRef.current = null;
    const start = (origin: { x: number; y: number }) => {
      setAccepting({ origin });
      actions.accept
        .mutateAsync()
        .then(({ matchId }) => {
          matchIdRef.current = matchId;
        })
        .catch(() => {
          matchIdRef.current = null;
        });
    };
    if (acceptBtnRef.current) {
      acceptBtnRef.current.measureInWindow((x, y, w, h) => start({ x: x + w / 2, y: y + h / 2 }));
    } else {
      start({ x: 0, y: 0 });
    }
  };

  // This screen lives above the tabs. Anchoring the thread route loads the
  // Messages index underneath it, so Back returns to the inbox and the tab bar
  // does not cover the composer.
  const openThread = (matchId: string) => {
    router.push({ pathname: '/messages/[matchId]', params: { matchId } }, { withAnchor: true });
  };

  const onCelebrationDone = () => {
    const matchId = matchIdRef.current;
    setAccepting(null);
    if (matchId) openThread(matchId);
  };

  const showOverflow = !!relationship && relationship.state !== 'self' && relationship.state !== 'blocked';

  const body = () => {
    if (profileQuery.isLoading || relationshipQuery.isLoading) {
      return <Centered><ActivityIndicator color={Brand.ink} /></Centered>;
    }
    if (profileQuery.isError || !profileQuery.data || !profile) {
      return (
        <Centered>
          <Text className="prose-subtitle text-center">This profile isn't available.</Text>
        </Centered>
      );
    }

    const { photos, prompts } = profileQuery.data;
    const vitals = buildVitals(profile);
    const detailGroups = buildDetailGroups(profile, SOCIAL_FIELDS);
    const interests = profile.interests ?? [];
    const dealBreakers = isFieldHidden(profile.hidden_fields, 'deal_breakers') ? [] : (profile.deal_breakers ?? []);
    const phone = isMatched ? contactQuery.data ?? null : null;

    return (
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}>
        <PhotoCarousel photos={photos} />

        <View className="gap-6 px-6 pt-5">
          <View className="gap-1">
            <Text className="prose-display text-ink">{name ?? 'Profile'}</Text>
            {profile.pronouns ? <Text className="prose-subtitle">{profile.pronouns}</Text> : null}
            {vitals.length ? <Text className="prose-footnote text-graphite">{vitals.join(' · ')}</Text> : null}
          </View>

          <SocialsBar profile={profile} />

          {isMatched && relationship?.matchedAt ? (
            <View className="gap-3">
              <Text className="prose-footnote text-graphite">
                Matched {formatMatchedDate(relationship.matchedAt)}
              </Text>
              {phone ? (
                <PressScale
                  accessibilityRole="button"
                  accessibilityLabel={`Text ${name ?? 'them'}`}
                  onPress={() => Linking.openURL(`sms:${phone}`).catch(() => {})}>
                  <View className="card border-continuous flex-row items-center gap-3 px-4 py-4">
                    <Phone size={18} color={Brand.ink} strokeWidth={2} />
                    <Text className="prose-footnote flex-1 font-medium text-ink">{phone}</Text>
                    <Text className="prose-caption text-graphite">Text</Text>
                  </View>
                </PressScale>
              ) : null}
            </View>
          ) : null}

          {profile.about_me ? <Text className="prose-body text-ink">{profile.about_me}</Text> : null}

          {prompts.map((prompt) => (
            <ReadOnlyPromptCard key={prompt.id} prompt={prompt} />
          ))}

          {interests.length ? (
            <ProfileChips title="Interests" labels={interests.map((v) => labelFor(INTERESTS, v))} />
          ) : null}
          {dealBreakers.length ? (
            <ProfileChips title="Deal-breakers" labels={dealBreakers.map((v) => labelFor(DEAL_BREAKERS, v))} />
          ) : null}

          {detailGroups.map((group) => (
            <ProfileDetailSection key={group.group} group={group} />
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-3 pb-1 pt-1">
          <PressScale accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
            <ChevronLeft size={26} color={Brand.ink} strokeWidth={2} />
          </PressScale>
          {showOverflow ? (
            <PressScale accessibilityRole="button" accessibilityLabel="More options" hitSlop={12} onPress={openOverflow}>
              <MoreVertical size={22} color={Brand.ink} strokeWidth={2} />
            </PressScale>
          ) : (
            <View style={{ width: 22 }} />
          )}
        </View>

        {body()}

        <ActionBar
          relationship={relationship}
          acceptBtnRef={acceptBtnRef}
          accepting={!!accepting}
          onMessage={openThread}
          onUnmatch={confirmUnmatch}
          onAccept={onAccept}
          onDecline={() => actions.decline.mutate()}
          onSendRequest={() => setRequestOpen(true)}
          onEditProfile={() => router.push({ pathname: '/profile' })}
        />
      </SafeAreaView>

      {profileQuery.data ? (
        <RequestSheet
          visible={requestOpen}
          preview={{ kind: 'photo', signedUrl: profileQuery.data.photos[0]?.signedUrl ?? null }}
          recipientName={name}
          recipientPhotoUrl={profileQuery.data.photos[0]?.signedUrl ?? null}
          onSubmit={async (note) => {
            const photoId = profileQuery.data.photos[0]?.id;
            if (!photoId) return;
            await sendRequest.mutateAsync({ likeeId: userId, target: { kind: 'photo', photoId }, note });
          }}
          onComplete={() => {
            setRequestOpen(false);
            relationshipQuery.refetch();
          }}
          onClose={() => setRequestOpen(false)}
        />
      ) : null}

      <ConnectionCelebration
        visible={!!accepting}
        origin={accepting?.origin ?? null}
        meAvatarUrl={me?.photos?.[0]?.signedUrl ?? null}
        themAvatarUrl={profileQuery.data?.photos?.[0]?.signedUrl ?? null}
        meName={me?.profile.first_name ?? null}
        themName={name}
        onComplete={onCelebrationDone}
      />
    </View>
  );
}

interface ActionBarProps {
  relationship: Relationship | undefined;
  acceptBtnRef: React.RefObject<View | null>;
  accepting: boolean;
  onMessage: (matchId: string) => void;
  onUnmatch: (matchId: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  onSendRequest: () => void;
  onEditProfile: () => void;
}

/** Relationship-aware footer. Drives the primary action(s) by relationship state. */
function ActionBar({
  relationship, acceptBtnRef, accepting,
  onMessage, onUnmatch, onAccept, onDecline, onSendRequest, onEditProfile,
}: ActionBarProps) {
  if (!relationship) return null;

  if (relationship.state === 'matched' && relationship.matchId) {
    const matchId = relationship.matchId;
    return (
      <View className="flex-row gap-3 px-6 pb-1 pt-2">
        <Button className="flex-1" onPress={() => onMessage(matchId)}>
          <View className="flex-row items-center gap-2">
            <MessageCircle size={18} color={Brand.canvas} strokeWidth={2} />
            <Text className="prose-button text-canvas">Message</Text>
          </View>
        </Button>
        <Button variant="ghost" onPress={() => onUnmatch(matchId)}>
          <Text className="prose-footnote font-medium text-graphite">Unmatch</Text>
        </Button>
      </View>
    );
  }

  if (relationship.state === 'incoming_request') {
    return (
      <View className="flex-row gap-3 px-6 pb-1 pt-2">
        <View ref={acceptBtnRef} className="flex-1">
          <Button onPress={onAccept} loading={accepting}>
            <Text className="prose-button text-canvas">Accept</Text>
          </Button>
        </View>
        <Button variant="ghost" disabled={accepting} onPress={onDecline}>
          <Text className="prose-footnote font-medium text-graphite">Decline</Text>
        </Button>
      </View>
    );
  }

  if (relationship.state === 'outgoing_request') {
    return (
      <View className="px-6 pb-1 pt-2">
        <Button disabled onPress={() => {}}>
          <Text className="prose-button text-canvas">Request sent</Text>
        </Button>
      </View>
    );
  }

  if (relationship.state === 'self') {
    return (
      <View className="px-6 pb-1 pt-2">
        <Button variant="ghost" onPress={onEditProfile}>
          <Text className="prose-footnote font-medium text-graphite">Edit profile</Text>
        </Button>
      </View>
    );
  }

  if (relationship.state === 'none') {
    return (
      <View className="px-6 pb-1 pt-2">
        <Button onPress={onSendRequest}>
          <Text className="prose-button text-canvas">Send request</Text>
        </Button>
      </View>
    );
  }

  return null; // blocked → no actions
}
