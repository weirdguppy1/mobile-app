import { ActivityIndicator, Text, View } from 'react-native';

import { Brand, DARK_PAGE, DiscoverWashes } from '@/constants/theme';

/** Full-screen blocking overlay shown during the signup/verify network calls. */
export function LoadingOverlay({ message }: { message: string }) {
  return (
    <View className="absolute inset-0 items-center justify-center gap-4 bg-canvas">
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{ backgroundColor: DARK_PAGE, experimental_backgroundImage: DiscoverWashes[0].stops }}
      />
      <ActivityIndicator color={Brand.ink} size="large" />
      <Text className="prose-subtitle">
        {message}
      </Text>
    </View>
  );
}
