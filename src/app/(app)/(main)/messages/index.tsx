import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
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
  const [query, setQuery] = useState('');

  // Filter chats by the peer's name or their latest message.
  const q = query.trim().toLowerCase();
  const filtered = q
    ? (data ?? []).filter(
        (c) =>
          (c.peer.firstName ?? '').toLowerCase().includes(q) ||
          (c.lastMessage?.body ?? '').toLowerCase().includes(q),
      )
    : data ?? [];

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
    if (filtered.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="prose-subtitle text-center">No chats match "{query.trim()}".</Text>
        </View>
      );
    }
    return (
      <View className="flex-1">
        <FlashList
          data={filtered}
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
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-3 px-6 pb-2 pt-2">
          <View
            className="flex-1 flex-row items-center gap-2 rounded-2xl border border-silver bg-surface px-3"
            style={{ height: 40 }}>
            <Search size={18} color={Brand.graphite} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search chats"
              placeholderTextColor={Brand.fog}
              className="flex-1 font-primary text-ink"
              style={{ fontSize: 15, paddingVertical: 0 }}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <PressScale
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={() => setQuery('')}>
                <X size={16} color={Brand.graphite} strokeWidth={2} />
              </PressScale>
            ) : null}
          </View>
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
