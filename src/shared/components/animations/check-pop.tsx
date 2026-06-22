import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface CheckPopProps {
  /** When true, the checkmark pops in; when false, it fades out. */
  show: boolean;
  size?: number;
  color?: string;
}

/**
 * A checkmark that springs in to confirm an accepted input (TASK.md §6).
 * Default color is ink — DESIGN.md reserves green (`--yes`) for like/match
 * interactions only, so a confirmation check must NOT be green. Callers on a
 * dark surface pass `color="#ffffff"`.
 */
export function CheckPop({ show, size = 18, color = '#000000' }: CheckPopProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = show ? 1 : 0;
      return;
    }
    progress.value = show
      ? withSpring(1, { damping: 12, stiffness: 260 })
      : withTiming(0, { duration: 120 });
  }, [show, progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Check size={size} color={color} strokeWidth={3} />
    </Animated.View>
  );
}
