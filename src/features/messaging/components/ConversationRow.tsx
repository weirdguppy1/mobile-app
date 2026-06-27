import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Avatar } from '@/features/messaging/components/Avatar';
import { Conversation } from '@/features/messaging/types';
import { conversationTime } from '@/shared/utils/format-time';
import { PressScale } from '@/shared/components';

interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
}

export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const { peer, lastMessage, unread } = conversation;
  const preview = lastMessage?.body ?? 'You matched — say hi 👋';

  return (
    <PressScale accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-3 px-6 py-3">
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={`View ${peer.firstName ?? 'profile'}`}
        hitSlop={6}
        onPress={() => router.push({ pathname: '/u/[id]', params: { id: peer.id } })}>
        <Avatar uri={peer.avatarUrl} name={peer.firstName} />
      </PressScale>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="prose-footnote font-semibold text-ink" numberOfLines={1}>
            {peer.firstName ?? 'Roommate'}
          </Text>
          {lastMessage ? <Text className="prose-caption text-ash">{conversationTime(lastMessage.created_at)}</Text> : null}
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className={`prose-caption flex-1 ${unread > 0 ? 'font-medium text-ink' : 'text-slate'}`}
            numberOfLines={1}>
            {preview}
          </Text>
          {unread > 0 ? (
            <View className="min-w-5 items-center justify-center rounded-full bg-ink px-1.5 py-0.5">
              <Text className="prose-caption font-semibold text-canvas">{unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressScale>
  );
}
