import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import Animated, { Easing, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, DARK_PAGE } from '@/constants/theme';
import { DISCOVERY_PAGE_SIZE } from '@/features/discovery/api';
import { CompatibilityCard } from '@/features/discovery/components/CompatibilityCard';
import { DiscoveryEmptyState } from '@/features/discovery/components/DiscoveryEmptyState';
import { RequestHeart } from '@/features/discovery/components/RequestHeart';
import { RequestPreview, RequestSheet } from '@/features/discovery/components/RequestSheet';
import { SkipButton } from '@/features/discovery/components/SkipButton';
import { useDiscoveryActions } from '@/features/discovery/hooks/use-discovery-actions';
import { useDiscoveryFeed } from '@/features/discovery/hooks/use-discovery';
import { computeCompatibility } from '@/features/discovery/lib/compatibility';
import { RequestTarget } from '@/features/discovery/types';
import { TabTransition } from '@/features/navigation/components/TabTransition';
import { useNavBarHeight } from '@/features/navigation/lib/use-nav-bar-height';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';
import { PressScale } from '@/shared/components';
import { washForId } from '@/shared/lib/wash';

interface SheetState {
  target: RequestTarget;
  preview: RequestPreview;
}

// Each new candidate fades in and drifts up a touch (DESIGN.md §motion: "a gentle
// fade and a slight upward drift — grounded, not abrupt"). `entering` starts from
// the initial values on first paint, so there's no flash of the fully-shown card.
const profileEnter = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 14 }] },
    animations: {
      opacity: withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
      transform: [{ translateY: withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }) }],
    },
  };
};

/**
 * Discovery: browse one same-school candidate at a time as a vertical scroll
 * (ProfileView), tap a photo/prompt to attach a required note and send a
 * connection request, or skip the whole person. Reaching the end advances to the
 * next; the batch auto-tops-up until the pool is exhausted.
 */
export default function Discover() {
  const navBarHeight = useNavBarHeight();
  const { data, isLoading, isError, isFetching, refetch } = useDiscoveryFeed();
  const { data: me } = useOnboardingData();
  const { sendRequest, skip } = useDiscoveryActions();

  // Ids acted on this session. The current person is always the first candidate
  // not yet seen — acting adds to `seen`, so the next render shows the next person.
  // It also defends the brief window between a skip and its write committing.
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<SheetState | null>(null);
  // Profile to advance past once the request sheet's Modal has fully dismissed.
  const pendingAdvance = useRef<string | null>(null);

  const remaining = useMemo(
    () => (data ?? []).filter((d) => !seen.has(d.profile.id)),
    [data, seen],
  );
  const current = remaining[0];
  const exhausted = !!data && data.length < DISCOVERY_PAGE_SIZE;

  // Stylistic compatibility of the current candidate vs the viewer's own profile.
  const compatibility = useMemo(
    () => (me?.profile && current ? computeCompatibility(me.profile, current.profile) : null),
    [me?.profile, current],
  );

  // Seamlessly load the next batch the moment we run out, unless the pool is
  // exhausted. Sends/skips commit before they advance, so a refetch here excludes
  // them server-side and can't loop on already-acted people.
  useEffect(() => {
    if (remaining.length === 0 && !exhausted && !isFetching && data) refetch();
  }, [remaining.length, exhausted, isFetching, data, refetch]);

  const advance = (profileId: string) => setSeen((prev) => new Set(prev).add(profileId));

  const openSheet = (target: RequestTarget, preview: RequestPreview) => {
    setSheet({ target, preview });
  };

  // Persist the request (throws on failure so the sheet can surface it); the sheet
  // plays its takeover animation and calls onRequestComplete when it's done.
  const onSubmitNote = async (note: string) => {
    if (!sheet || !current) return;
    await sendRequest.mutateAsync({ likeeId: current.profile.id, target: sheet.target, note });
  };

  // The next ProfileView must NOT mount while the request sheet's Modal is still
  // presented: its expo-image photos get created behind the Modal and never start
  // loading (text/prompts still render). So we close the Modal here and defer the
  // advance to the Modal's onDismiss event — when it's provably gone — rather than
  // racing it with a timer.
  const onRequestComplete = () => {
    const requestedId = current?.profile.id ?? null;
    setSheet(null);
    if (Platform.OS === 'ios') {
      pendingAdvance.current = requestedId; // advanced in onSheetDismissed
    } else if (requestedId) {
      advance(requestedId); // Android Modal composites the screen behind it; no occlusion
    }
  };

  const onSheetDismissed = () => {
    const id = pendingAdvance.current;
    pendingAdvance.current = null;
    if (id) advance(id);
  };

  const onSkip = () => {
    if (!current) return;
    const id = current.profile.id;
    advance(id); // optimistic; the seen-filter covers the brief uncommitted window
    skip.mutate(id);
  };

  const body = () => {
    if (isLoading) {
      return <Centered><ActivityIndicator color={Brand.ink} /></Centered>;
    }
    if (isError) {
      return (
        <Centered>
          <Text className="prose-subtitle text-center">
            Couldn't load Discover. Pull to retry or check your connection.
          </Text>
        </Centered>
      );
    }
    if (current) {
      return (
        <Animated.View key={current.profile.id} entering={profileEnter} style={{ flex: 1 }}>
        <ProfileView
          profile={current.profile}
          photos={current.photos}
          prompts={current.prompts}
          showDetails={false}
          bottomInset={navBarHeight + 72}
          headerAccessory={
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={`View ${current.profile.first_name ?? 'profile'}`}
              hitSlop={8}
              onPress={() => router.push({ pathname: '/u/[id]', params: { id: current.profile.id } })}
              className="rounded-full border border-silver px-3 py-1.5">
              <Text className="prose-caption font-medium text-graphite">View profile</Text>
            </PressScale>
          }
          belowHeader={compatibility ? <CompatibilityCard compatibility={compatibility} /> : undefined}
          renderPhotoOverlay={(photo) => (
            <RequestHeart
              target={{ kind: 'photo', photoId: photo.id }}
              onPress={(target) => openSheet(target, { kind: 'photo', signedUrl: photo.signedUrl })}
            />
          )}
          renderPromptOverlay={(prompt) => (
            <RequestHeart
              target={{ kind: 'prompt', promptId: prompt.id }}
              onPress={(target) =>
                openSheet(target, { kind: 'prompt', prompt: prompt.prompt, answer: prompt.answer })
              }
            />
          )}
        />
        </Animated.View>
      );
    }
    if (isFetching) {
      return <Centered><ActivityIndicator color={Brand.ink} /></Centered>;
    }
    return <DiscoveryEmptyState onRefresh={() => refetch()} refreshing={isFetching} />;
  };

  return (
    <TabTransition className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {current ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: DARK_PAGE,
              experimental_backgroundImage: washForId(current.profile.id).stops,
            }}
          />
        ) : null}
        {body()}
        {current ? (
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', left: 16, bottom: navBarHeight + 16 }}>
            <SkipButton onPress={onSkip} />
          </View>
        ) : null}
      </SafeAreaView>
      <RequestSheet
        visible={!!sheet}
        preview={sheet?.preview ?? null}
        recipientName={current?.profile.first_name}
        recipientPhotoUrl={current?.photos[0]?.signedUrl ?? null}
        onSubmit={onSubmitNote}
        onComplete={onRequestComplete}
        onDismissed={onSheetDismissed}
        onClose={() => setSheet(null)}
      />
    </TabTransition>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center px-10">{children}</View>;
}
