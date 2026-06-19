import '@/global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Satoshi: require('@/assets/fonts/Satoshi.ttf'),
    'SpaceGrotesk-Bold': require('@/assets/fonts/Space_Grotesk/static/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Medium': require('@/assets/fonts/Space_Grotesk/static/SpaceGrotesk-Medium.ttf'),
  });

  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  // Bootstrap the session once, then keep it in sync with Supabase auth events.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setHydrated(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [setSession, setHydrated]);

  // Hold the native splash until fonts load and the session has resolved, so we
  // never flash the public screens before redirecting an authenticated user.
  if (!fontsLoaded || !hydrated) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="dev" />
      </Stack>
    </SafeAreaProvider>
  );
}
