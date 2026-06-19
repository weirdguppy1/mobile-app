import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DevMenu() {
  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View className="flex-1 gap-6 px-6">
          <Text className="prose-display text-ink">Dev</Text>
          <View className="gap-3">
            <Link href="/dev/components" className="card border-continuous px-4 py-4">
              <Text className="prose-body font-semibold text-ink">Components</Text>
            </Link>
            <Link href="/dev/screens" className="card border-continuous px-4 py-4">
              <Text className="prose-body font-semibold text-ink">Screens</Text>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
