import { Image } from 'expo-image';
import { Text, View } from 'react-native';

interface AvatarProps {
  uri: string | null;
  name: string | null;
  size?: number;
}

/** Circular peer avatar; falls back to the first initial when there's no photo. */
export function Avatar({ uri, name, size = 52 }: AvatarProps) {
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border border-silver bg-surface"
      style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <Text className="font-display text-ink" style={{ fontSize: size * 0.4 }}>
          {(name?.[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  );
}
