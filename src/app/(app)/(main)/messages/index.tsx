import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { ConversationRow } from '@/features/messaging/components/ConversationRow';
import { EmptyConversations } from '@/features/messaging/components/EmptyConversations';
import { messagingKeys, useConversations } from '@/features/messaging/hooks/use-conversations';
import { useRealtimeChannel } from '@/features/messaging/hooks/use-realtime-channel';
import { TabTransition } from '@/features/navigation/components/TabTransition';
import { useNavBarHeight } from '@/features/navigation/lib/use-nav-bar-height';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

export default function MessagesScreen() {
  const navBarHeight = useNavBarHeight();
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useConversations();

  // Any message change in one of my matches → refresh previews + unread (RLS
  // scopes the stream to my own matches).
  useRealtimeChannel(userId ? 'conversations' : null, (channel) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      if (userId) qc.invalidateQueries({ queryKey: messagingKeys.conversations(userId) });
    });
  });

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
        <View className="px-6 pb-2 pt-2">
          <Text className="prose-display text-ink">Messages</Text>
        </View>
        {body()}
      </SafeAreaView>
    </TabTransition>
  );
}
