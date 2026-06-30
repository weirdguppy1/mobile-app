import "@/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Brand } from "@/constants/theme";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";

// Dark navigation theme so the navigator scene/content background is the dark
// page color — not React Navigation's default white, which otherwise shows
// through during the tab/stack transition fade (a white flash on switch).
const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Brand.canvas, card: Brand.canvas },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Satoshi: require("@/assets/fonts/Satoshi.ttf"),
    "ClashDisplay-Bold": require("@/assets/fonts/ClashDisplay-Variable.ttf"),
    "ClashDisplay-Semibold": require("@/assets/fonts/ClashDisplay-Variable.ttf"),
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
      // Authorize the realtime socket so postgres_changes are RLS-scoped (a client
      // must not receive messages/reactions for matches it isn't part of).
      supabase.realtime.setAuth(data.session?.access_token ?? null);
      setSession(data.session);
      setHydrated(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      supabase.realtime.setAuth(nextSession?.access_token ?? null);
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [setSession, setHydrated]);

  // Paint the native root view (behind the React views) dark, so no white shows
  // at the edges during stack/screen transitions — the OS window default is white.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Brand.canvas);
  }, []);

  // Hold the native splash until fonts load and the session has resolved, so we
  // never flash the public screens before redirecting an authenticated user.
  if (!fontsLoaded || !hydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
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
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
