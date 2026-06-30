import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

interface ProgressBarProps {
  /** 1-based index of the current step. */
  current: number;
  total: number;
}

/** A row of segments that fill as the user advances through the wizard. */
export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <View className="flex-row gap-1.5" accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Segment key={i} filled={i < current} />
      ))}
    </View>
  );
}

function Segment({ filled }: { filled: boolean }) {
  const progress = useSharedValue(filled ? 1 : 0);
  const fill = useResolveClassNames('absolute inset-0 rounded-full bg-ink');

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [filled, progress]);

  const fillStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
      <Animated.View style={[fill, fillStyle]} />
    </View>
  );
}
