import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { REACTION_EMOJIS } from '@/features/messaging/types';
import { PressScale } from '@/shared/components';

const STAGGER_MS = 50; // gap between each emoji's entrance → the "snake" wave

interface ReactionBarProps {
  /** The current user's existing reaction emoji, if any (highlighted). */
  selected: string | null;
  onPick: (emoji: string) => void;
}

/** One emoji that pops in (overshoot scale) after a per-index delay. */
function PoppingEmoji({
  emoji, index, selected, onPick,
}: { emoji: string; index: number; selected: boolean; onPick: (emoji: string) => void }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(reduced ? 1 : 0);
  const opacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    const delay = index * STAGGER_MS;
    opacity.value = withDelay(delay, withTiming(1, { duration: 120 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.35, { duration: 140, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.inOut(Easing.quad) }),
      ),
    );
  }, [index, reduced, scale, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={`React ${emoji}`}
        onPress={() => onPick(emoji)}
        className={`h-9 w-9 items-center justify-center rounded-full ${selected ? 'bg-wash' : ''}`}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </PressScale>
    </Animated.View>
  );
}

/** The long-press emoji picker row; emojis cascade in one-by-one with a pop. */
export function ReactionBar({ selected, onPick }: ReactionBarProps) {
  return (
    <View className="card border-continuous shadow-card flex-row gap-1 px-2 py-1.5">
      {REACTION_EMOJIS.map((emoji, index) => (
        <PoppingEmoji key={emoji} emoji={emoji} index={index} selected={selected === emoji} onPick={onPick} />
      ))}
    </View>
  );
}
