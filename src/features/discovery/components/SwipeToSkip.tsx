import { type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

interface SwipeToSkipProps {
  /** Called once a left-swipe commits — advances to the next person. */
  onSkip: () => void;
  children: ReactNode;
}

const COMMIT_FRACTION = 0.25; // of screen width
const COMMIT_VELOCITY = -500; // px/s, a gentle flick left

/**
 * Wraps a Discovery profile so a horizontal left-swipe dismisses the person and
 * advances to the next. The card tracks the finger (slight tilt + fade); past a
 * distance OR velocity threshold it slides off-left and commits, otherwise it
 * springs back. The pan only claims horizontal movement (activeOffsetX +
 * failOffsetY) so the profile still scrolls vertically. Right drags resist.
 * Reduced motion: the commit fires immediately without the slide-off.
 */
export function SwipeToSkip({ onSkip, children }: SwipeToSkipProps) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const tx = useSharedValue(0);
  const committed = useSharedValue(false);

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      tx.value = e.translationX < 0 ? e.translationX : e.translationX * 0.2;
    })
    .onEnd((e) => {
      const past = e.translationX < -width * COMMIT_FRACTION || e.velocityX < COMMIT_VELOCITY;
      if (!past) return; // spring-back handled in onFinalize
      committed.value = true;
      if (reduced) {
        scheduleOnRN(onSkip);
        return;
      }
      tx.value = withTiming(
        -width * 1.1,
        { duration: 220, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(onSkip);
        },
      );
    })
    // Fires after onEnd AND after a cancel — if we didn't commit, snap back so the
    // card can never get stuck partway off-screen.
    .onFinalize(() => {
      if (!committed.value) tx.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { rotateZ: `${(tx.value / width) * 6}deg` },
    ],
    opacity: 1 - Math.min(Math.abs(tx.value) / width, 0.35),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[{ flex: 1 }, style]}
        accessibilityActions={[{ name: 'skip', label: 'Skip this person' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'skip') onSkip();
        }}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
