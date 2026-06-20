import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  className?: string;
  /** Scale at full press. Closer to 1 is subtler. */
  scaleTo?: number;
}

/**
 * A pressable that dips slightly on press and springs back with a soft bounce.
 * Layout/appearance come from `className`; the scale is a Reanimated style merged
 * on top via `useResolveClassNames`.
 */
export function PressScale({
  children,
  className,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: PressScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  const resolved = useResolveClassNames(className ?? '');

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, { damping: 18, stiffness: 260 });
        onPressOut?.(e);
      }}
      style={[resolved, animatedStyle]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}
