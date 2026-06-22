import { type ReactNode } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

interface ActivateRampProps extends ViewProps {
  /** When true, children ramp in to full opacity + scale. */
  active: boolean;
  children: ReactNode;
}

/**
 * Ramps children in (opacity + scale) when `active` becomes true — used to make
 * the Next button feel like it "activates" once a step is valid (TASK.md §6).
 */
export function ActivateRamp({ active, className, style, children, ...rest }: ActivateRampProps) {
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) {
      return { opacity: active ? 1 : 0.5, transform: [{ scale: 1 }] };
    }
    return {
      opacity: withTiming(active ? 1 : 0.5, { duration: 220 }),
      transform: [{ scale: withSpring(active ? 1 : 0.98, { damping: 16, stiffness: 220 }) }],
    };
  });

  const resolved = useResolveClassNames(className ?? '');

  return (
    <Animated.View style={[resolved, style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
