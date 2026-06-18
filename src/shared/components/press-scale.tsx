import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale at full press. Closer to 1 is subtler. */
  scaleTo?: number;
}

/**
 * A pressable that dips slightly on press and springs back with a soft, barely-
 * there bounce. The standard tap feedback for buttons and tappable cards.
 */
export function PressScale({
  children,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: PressScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

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
      style={[style, animatedStyle]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}
