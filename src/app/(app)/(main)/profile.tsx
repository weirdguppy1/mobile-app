import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabTransition } from '@/features/navigation/components/TabTransition';
import { useNavBarHeight } from '@/features/navigation/lib/use-nav-bar-height';
import { supabase } from '@/lib/supabase';
import { PressScale } from '@/shared/components';

/** Placeholder profile tab. Profile editing lands here later; hosts sign-out. */
export default function Profile() {
  // The nav bar overlays the screen, so reserve clearance for the sign-out CTA.
  const navBarHeight = useNavBarHeight();
  return (
    <TabTransition className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View className="flex-1 px-6 pt-4" style={{ paddingBottom: navBarHeight + 8 }}>
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="prose-display text-ink">Profile</Text>
            <Text className="prose-subtitle text-center">Your profile and settings live here.</Text>
          </View>
          <PressScale
            accessibilityRole="button"
            onPress={() => supabase.auth.signOut()}
            className="button-primary">
            <Text className="prose-button text-canvas">Sign out</Text>
          </PressScale>
        </View>
      </SafeAreaView>
    </TabTransition>
  );
}
