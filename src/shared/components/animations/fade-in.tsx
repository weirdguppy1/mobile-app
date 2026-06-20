import { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

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
 * Motion runs through `useAnimatedStyle`, and any `className` is resolved to a
 * style object and merged in — so layout classes compose with the animation (and
 * with children that carry their own transform) without Reanimated warnings.
 */
export function FadeIn({
  className,
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

  const resolved = useResolveClassNames(className ?? '');

  return (
    <Animated.View style={[resolved, style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
