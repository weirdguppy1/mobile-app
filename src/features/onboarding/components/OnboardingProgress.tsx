import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

interface OnboardingProgressProps {
  /** 1-based count of filled segments (current step number). */
  current: number;
  total: number;
}

/**
 * Wizard progress bar with a smooth (non-linear) fill and a slight anticipation
 * pop on the segment that just became current (TASK.md §4). Persistent across
 * step changes — it animates rather than remounting.
 */
export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  return (
    <View className="flex-row gap-1.5" accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Segment key={i} filled={i < current} anticipate={i === current - 1} />
      ))}
    </View>
  );
}

function Segment({ filled, anticipate }: { filled: boolean; anticipate: boolean }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(filled ? 1 : 0);
  const pop = useSharedValue(1);
  const fill = useResolveClassNames('absolute inset-0 rounded-full bg-ink');

  useEffect(() => {
    if (reduced) {
      progress.value = filled ? 1 : 0;
      return;
    }
    progress.value = withTiming(filled ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
    if (filled && anticipate) {
      pop.value = withSequence(
        withTiming(1.35, { duration: 160, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 12, stiffness: 240 }),
      );
    }
  }, [filled, anticipate, progress, pop, reduced]);

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: pop.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scaleX: progress.value }] }));

  return (
    <Animated.View style={containerStyle} className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(0,0,0,0.08)]">
      <Animated.View style={[fill, { transformOrigin: '0% 50%' }, fillStyle]} />
    </Animated.View>
  );
}
