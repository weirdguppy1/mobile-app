import { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

interface FocusScaleProps extends ViewProps {
  /** Starting scale on mount. */
  from?: number;
  /** Resting scale. */
  to?: number;
}

/**
 * A subtle "breathing-in" entrance: children settle from `from` to `to` on
 * mount. Used to draw the eye to the active question (TASK.md §2).
 */
export function FocusScale({ className, from = 0.98, to = 1, style, children, ...rest }: FocusScaleProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: from + (to - from) * progress.value }],
  }));

  const resolved = useResolveClassNames(className ?? '');

  return (
    <Animated.View style={[resolved, style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
