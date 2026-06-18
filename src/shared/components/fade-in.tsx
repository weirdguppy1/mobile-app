import { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface FadeInProps extends ViewProps {
  /** Delay before the fade starts, in ms. */
  delay?: number;
  /** How far the content rises as it fades in, in px. Keep it small. */
  offset?: number;
  /** Fade duration, in ms. */
  duration?: number;
}

/**
 * A soft entrance: fade up over a few px with an ease-out curve and no overshoot.
 *
 * Motion is driven through `useAnimatedStyle` rather than an `entering` layout
 * animation, so it composes cleanly with children that carry their own
 * `transform` (e.g. a rotated card) without Reanimated's overwrite warning.
 */
export function FadeIn({
  delay = 0,
  offset = 10,
  duration = 420,
  style,
  children,
  ...rest
}: FadeInProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offset }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...rest}>
      {children}
    </Animated.View>
  );
}
