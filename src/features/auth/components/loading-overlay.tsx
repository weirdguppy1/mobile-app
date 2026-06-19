import { ActivityIndicator, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { MeshGradient } from '@/features/welcome/components/mesh-gradient';

/** Full-screen blocking overlay shown during the signup/verify network calls. */
export function LoadingOverlay({ message }: { message: string }) {
  return (
    <View className="absolute inset-0 items-center justify-center gap-4 bg-canvas">
      <MeshGradient variant="hero" className="absolute inset-0" pointerEvents="none" />
      <ActivityIndicator color={Brand.ink} size="large" />
      <Text className="prose-subtitle">
        {message}
      </Text>
    </View>
  );
}
