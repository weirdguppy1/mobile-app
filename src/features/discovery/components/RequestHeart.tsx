import { BlurView } from 'expo-blur';
import { Heart } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Brand, Glass } from '@/constants/theme';
import { RequestTarget } from '@/features/discovery/types';
import { PressScale } from '@/shared/components';

interface RequestHeartProps {
  target: RequestTarget;
  onPress: (target: RequestTarget) => void;
}

/** Per-element like affordance: a frosted dark-glass circle with a light outline
 *  heart (no color-fill state). Anchored bottom-right of a photo or prompt. */
export function RequestHeart({ target, onPress }: RequestHeartProps) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel="Send a request about this"
      hitSlop={8}
      onPress={() => onPress(target)}
      className="h-11 w-11">
      <View
        className="h-full w-full items-center justify-center overflow-hidden rounded-full"
        style={{ borderWidth: 1, borderColor: Glass.heart.border }}>
        <BlurView
          tint={Glass.heart.tint}
          intensity={Glass.heart.intensity}
          blurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.heart.bg }]} />
        <Heart size={20} color={Brand.ink} strokeWidth={2} />
      </View>
    </PressScale>
  );
}
