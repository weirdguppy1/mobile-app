import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { ConversationRow } from '@/features/messaging/components/ConversationRow';
import { EmptyConversations } from '@/features/messaging/components/EmptyConversations';
import { useConversations } from '@/features/messaging/hooks/use-conversations';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';
import { TabTransition } from '@/features/navigation/components/TabTransition';
import { useNavBarHeight } from '@/features/navigation/lib/use-nav-bar-height';
import { PressScale } from '@/shared/components';

export default function MessagesScreen() {
  const navBarHeight = useNavBarHeight();
  // Conversations + notifications realtime are mounted app-wide in BottomNav, which
  // keeps this list and the unread badges live across tabs.
  const { data, isLoading, isError } = useConversations();
  const unreadNotifications = useUnreadNotificationCount();

  const body = () => {
    if (isLoading) {
      return <View className="flex-1 items-center justify-center"><ActivityIndicator color={Brand.ink} /></View>;
    }
    if (isError) {
      return (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="prose-subtitle text-center">Couldn't load your chats. Pull to retry.</Text>
        </View>
      );
    }
    if (!data || data.length === 0) return <EmptyConversations />;
    return (
      <View className="flex-1">
        <FlashList
          data={data}
          keyExtractor={(c) => c.match.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push({ pathname: '/messages/[matchId]', params: { matchId: item.match.id } })}
            />
          )}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: navBarHeight + 24 }}
        />
      </View>
    );
  };

  return (
    <TabTransition className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-3 px-6 pb-2 pt-2">
          <Text className="prose-title flex-1 text-ink">Messages</Text>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
            hitSlop={12}
            onPress={() => router.push({ pathname: '/messages/notifications' })}>
            <View>
              <Bell size={24} color={Brand.ink} strokeWidth={2} />
              {unreadNotifications > 0 ? (
                <View
                  className="absolute -right-2 -top-1.5 items-center justify-center rounded-full bg-ink px-1"
                  style={{ minWidth: 16, height: 16 }}>
                  <Text className="font-semibold text-canvas" style={{ fontSize: 10 }}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </View>
          </PressScale>
        </View>
        {body()}
      </SafeAreaView>
    </TabTransition>
  );
}
