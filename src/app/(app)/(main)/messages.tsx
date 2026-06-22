import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabTransition } from '@/features/navigation/components/TabTransition';

/** Placeholder messages tab. The conversation list lands here later. */
export default function Messages() {
  return (
    <TabTransition className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text className="prose-display text-ink">Messages</Text>
          <Text className="prose-subtitle text-center">Your conversations with matches will show up here.</Text>
        </View>
      </SafeAreaView>
    </TabTransition>
  );
}
