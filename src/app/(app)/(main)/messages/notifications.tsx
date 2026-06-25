import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { EditScreenShell } from '@/features/profile/components/EditScreenShell';
import { ConnectionCelebration } from '@/features/notifications/components/ConnectionCelebration';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { useNotificationActions } from '@/features/notifications/hooks/use-notification-actions';
import { useNotifications, useNotificationsRealtime } from '@/features/notifications/hooks/use-notifications';
import { NotificationItem } from '@/features/notifications/types';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center px-10">{children}</View>;
}

export default function NotificationsScreen() {
  const { data, isLoading, isError } = useNotifications();
  const { data: me } = useOnboardingData();
  const { markRead, accept, decline } = useNotificationActions();
  useNotificationsRealtime();

  const [accepting, setAccepting] = useState<{ item: NotificationItem; origin: { x: number; y: number } } | null>(null);
  const matchIdRef = useRef<string | null>(null);

  // Opening the inbox clears the unread badge.
  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myAvatar = me?.photos?.[0]?.signedUrl ?? null;
  const myName = me?.profile.first_name ?? null;

  const onAccept = async (item: NotificationItem, origin: { x: number; y: number }) => {
    if (accepting) return;
    matchIdRef.current = null;
    setAccepting({ item, origin });
    try {
      const { matchId } = await accept.mutateAsync(item.actor.id);
      matchIdRef.current = matchId;
    } catch {
      matchIdRef.current = null;
    }
  };

  const onCelebrationDone = () => {
    const matchId = matchIdRef.current;
    setAccepting(null);
    if (matchId) router.replace({ pathname: '/messages/[matchId]', params: { matchId } });
  };

  const onOpen = (item: NotificationItem) => {
    if (item.match_id) router.push({ pathname: '/messages/[matchId]', params: { matchId: item.match_id } });
  };

  const body = () => {
    if (isLoading) return <Centered><ActivityIndicator color={Brand.ink} /></Centered>;
    if (isError) return <Centered><Text className="prose-subtitle text-center">Couldn't load notifications.</Text></Centered>;
    if (!data || data.length === 0) {
      return <Centered><Text className="prose-subtitle text-center">No notifications yet.</Text></Centered>;
    }
    return (
      <View className="flex-1">
        <FlashList
          data={data}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onOpen={onOpen}
              onAccept={onAccept}
              onDecline={(it) => decline.mutate({ requesterId: it.actor.id, notificationId: it.id })}
              disabled={!!accepting}
            />
          )}
          contentContainerStyle={{ paddingVertical: 4 }}
        />
      </View>
    );
  };

  return (
    <>
      <EditScreenShell title="Notifications">{body()}</EditScreenShell>
      <ConnectionCelebration
        visible={!!accepting}
        origin={accepting?.origin ?? null}
        meAvatarUrl={myAvatar}
        themAvatarUrl={accepting?.item.actor.avatarUrl ?? null}
        meName={myName}
        themName={accepting?.item.actor.firstName ?? null}
        onComplete={onCelebrationDone}
      />
    </>
  );
}
