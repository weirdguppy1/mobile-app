import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Satoshi: require('@/assets/fonts/Satoshi.ttf'),
    'SpaceGrotesk-Bold': require('@/assets/fonts/Space_Grotesk/static/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Medium': require('@/assets/fonts/Space_Grotesk/static/SpaceGrotesk-Medium.ttf'),
  });

  // Hold the native splash until the brand fonts are ready, so the first paint
  // never flashes a fallback face.
  if (!fontsLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
