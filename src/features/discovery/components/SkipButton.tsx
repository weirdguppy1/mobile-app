import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Brand, Glass } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface SkipButtonProps {
  onPress: () => void;
  /** Positioning (the screen floats this above the nav bar). */
  className?: string;
}

/** Skip the whole person (DESIGN.md §7): one ~56px frosted-glass circle with a ✕
 *  in `--pass`. The only ways forward are "request something" or "skip this person". */
export function SkipButton({ onPress, className }: SkipButtonProps) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel="Skip this person"
      onPress={onPress}
      className={`h-14 w-14 ${className ?? ''}`}>
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
        <X size={26} color={Brand.pass} strokeWidth={2.5} />
      </View>
    </PressScale>
  );
}
