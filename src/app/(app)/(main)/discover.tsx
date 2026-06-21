import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Placeholder post-onboarding landing. The real swipe deck lands here later. */
export default function Discover() {
  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Text className="prose-display text-ink">Discover</Text>
          <Text className="prose-subtitle text-center">You're all set. Roommate matches will show up here.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
