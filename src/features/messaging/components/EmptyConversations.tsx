import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/shared/components';

/** Shown when the user has no matches yet. */
export function EmptyConversations() {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-10">
      <Text className="prose-title text-center text-ink">No matches yet</Text>
      <Text className="prose-subtitle text-center">
        When you and someone you've requested both connect, your chat shows up here.
      </Text>
      <View className="pt-2">
        <Button variant="ghost" onPress={() => router.push({ pathname: '/discover' })}>
          Browse in Discover
        </Button>
      </View>
    </View>
  );
}
