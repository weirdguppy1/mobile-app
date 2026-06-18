import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Satoshi: require('@/assets/fonts/Satoshi.ttf'),
    'SpaceGrotesk-Bold': require('@/assets/fonts/Space_Grotesk/static/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Medium': require('@/assets/fonts/Space_Grotesk/static/SpaceGrotesk-Medium.ttf'),
  });

  // Keep the native splash up until our brand fonts are ready, so the first
  // paint never flashes a fallback face.
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
