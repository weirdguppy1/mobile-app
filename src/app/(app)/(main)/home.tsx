import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { DARK_PAGE, DiscoverWashes } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { PressScale } from '@/shared/components';
import { useAuthStore } from '@/store/auth-store';

/**
 * Placeholder authenticated landing — confirms the session works end to end.
 * The real post-signup app (swipe deck, profile, etc.) lands here later.
 */
export default function Home() {
  const session = useAuthStore((s) => s.session);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{ backgroundColor: DARK_PAGE, experimental_backgroundImage: DiscoverWashes[0].stops }}
      />
      <View className="flex-1 px-6 pt-safe pb-safe-offset-6">
        <View className="flex-1 items-center justify-center gap-2.5">
          <Text className="prose-display text-ink">You&apos;re in.</Text>
          <Text className="prose-subtitle">
            Signed in as {session?.user.email ?? 'your account'}
          </Text>
        </View>
        <PressScale
          accessibilityRole="button"
          onPress={() => supabase.auth.signOut()}
          className="button-primary">
          <Text className="prose-button text-canvas">Sign out</Text>
        </PressScale>
      </View>
    </View>
  );
}
