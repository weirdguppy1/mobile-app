import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type EntryExitAnimationFunction,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const DISTANCE = 44;
const BLUR_MAX = 16;

type Direction = 'forward' | 'back';
// LayoutAnimationStaticContext is defined in reanimated's commonTypes but not
// re-exported from the package root in this version (4.3.1). We inline the
// equivalent shape — { presetName: string } — which is what Animated.View's
// entering/exiting props require alongside EntryExitAnimationFunction.
type LayoutAnimationStaticContext = { presetName: string };
type CustomAnim = EntryExitAnimationFunction & LayoutAnimationStaticContext;

function makeEnter(direction: Direction, reduced: boolean): CustomAnim {
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    if (reduced) {
      return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: 140 }) } };
    }
    const sign = direction === 'forward' ? 1 : -1;
    // Back is a touch slower than forward for a reflective feel. Timing (not
    // spring) so the slide settles cleanly with no overshoot/bounce.
    const duration = direction === 'forward' ? 230 : 270;
    return {
      initialValues: { opacity: 0, transform: [{ translateX: sign * DISTANCE }] },
      animations: {
        opacity: withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
        transform: [{ translateX: withTiming(0, { duration, easing: Easing.out(Easing.cubic) }) }],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepEnter' });
}

function makeExit(direction: Direction, reduced: boolean): CustomAnim {
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    if (reduced) {
      return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 110 }) } };
    }
    const sign = direction === 'forward' ? -1 : 1;
    const duration = direction === 'forward' ? 190 : 230;
    return {
      initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
      animations: {
        opacity: withTiming(0, { duration, easing: Easing.in(Easing.cubic) }),
        transform: [{ translateX: withTiming(sign * DISTANCE, { duration, easing: Easing.in(Easing.cubic) }) }],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepExit' });
}

/** Blur overlay that ramps from blurred to sharp on mount (TASK.md §1). */
function EntryBlur() {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: 220 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({ intensity: progress.value * BLUR_MAX }));

  return (
    <AnimatedBlurView
      pointerEvents="none"
      tint="light"
      blurMethod="dimezisBlurView"
      style={StyleSheet.absoluteFill}
      animatedProps={animatedProps}
    />
  );
}

interface StepTransitionProps {
  /** Re-key per step so entering/exiting animations fire on navigation. */
  transitionKey: string;
  direction: Direction;
  children: ReactNode;
}

/**
 * Directional step transition: the outgoing step slides + fades away while the
 * incoming step enters from the opposite side and resolves from blurred to
 * sharp. Back navigation reverses direction with slightly slower timing
 * (TASK.md §1). Eased timing (no spring) keeps the slide crisp and bounce-free.
 * Reanimated keeps the exiting view mounted through its exit, so the two steps
 * cross without a manual dual-mount.
 */
export function StepTransition({ transitionKey, direction, children }: StepTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        key={transitionKey}
        entering={makeEnter(direction, reduced)}
        exiting={makeExit(direction, reduced)}
        style={StyleSheet.absoluteFill}>
        {children}
        {!reduced ? <EntryBlur /> : null}
      </Animated.View>
    </View>
  );
}
