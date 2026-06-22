import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type EntryExitAnimationFunction,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const DISTANCE = 64;
const BLUR_MAX = 18;

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
      return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: 160 }) } };
    }
    const sign = direction === 'forward' ? 1 : -1;
    const duration = direction === 'forward' ? 320 : 380;
    return {
      initialValues: { opacity: 0, transform: [{ translateX: sign * DISTANCE }] },
      animations: {
        opacity: withTiming(1, { duration }),
        transform: [{ translateX: withSpring(0, { damping: 20, stiffness: 170 }) }],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepEnter' });
}

function makeExit(direction: Direction, reduced: boolean): CustomAnim {
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    if (reduced) {
      return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 120 }) } };
    }
    const sign = direction === 'forward' ? -1 : 1;
    const duration = direction === 'forward' ? 280 : 340;
    return {
      initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
      animations: {
        opacity: withTiming(0, { duration }),
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
    progress.value = withTiming(0, { duration: 360 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({ intensity: progress.value * BLUR_MAX }));

  return (
    <AnimatedBlurView
      pointerEvents="none"
      tint="light"
      experimentalBlurMethod="dimezisBlurView"
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
 * (TASK.md §1). Reanimated keeps the exiting view mounted through its exit, so
 * the two steps cross without a manual dual-mount.
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
