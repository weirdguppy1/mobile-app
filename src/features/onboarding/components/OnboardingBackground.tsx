import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { type Tone } from '@/features/onboarding/config/step-tone';

// Very low-opacity washes over white (DESIGN.md white-stage discipline).
const TINTS: Record<Tone, string> = {
  warm: 'rgba(251,230,242,0.55)', // grad-warm base #fbe6f2
  cool: 'rgba(214,228,255,0.50)', // periwinkle
  neutral: 'rgba(255,255,255,0)', // pure canvas
};

/**
 * Persistent onboarding background that crossfades its tint by category to give
 * the flow an emotional through-line (TASK.md §5).
 */
export function OnboardingBackground({ tone }: { tone: Tone }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(1);
  const [colors, setColors] = useState({ from: TINTS[tone], to: TINTS[tone] });

  useEffect(() => {
    setColors((current) => ({ from: current.to, to: TINTS[tone] }));
    progress.value = 0;
    progress.value = withTiming(1, { duration: reduced ? 0 : 800, easing: Easing.inOut(Easing.quad) });
  }, [tone, progress, reduced]);

  const tintStyle = useAnimatedStyle(
    () => ({ backgroundColor: interpolateColor(progress.value, [0, 1], [colors.from, colors.to]) }),
    [colors],
  );

  return (
    <View style={StyleSheet.absoluteFill} className="bg-canvas">
      <Animated.View style={[StyleSheet.absoluteFill, tintStyle]} />
    </View>
  );
}
