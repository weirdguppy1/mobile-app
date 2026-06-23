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

import { transitionParams, type Direction, type Variant } from './transition-params';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const BLUR_MAX = 16;

type LayoutAnimationStaticContext = { presetName: string };
type CustomAnim = EntryExitAnimationFunction & LayoutAnimationStaticContext;

function makeEnter(variant: Variant, direction: Direction, reduced: boolean): CustomAnim {
  const p = transitionParams(variant, direction, reduced);
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateX: p.enterFrom.x }, { scale: p.enterFrom.scale }] },
      animations: {
        opacity: withTiming(1, { duration: p.enterMs, easing: Easing.out(Easing.cubic) }),
        transform: [
          { translateX: withTiming(0, { duration: p.enterMs, easing: Easing.out(Easing.cubic) }) },
          { scale: withTiming(1, { duration: p.enterMs, easing: Easing.out(Easing.cubic) }) },
        ],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepEnter' });
}

function makeExit(variant: Variant, direction: Direction, reduced: boolean): CustomAnim {
  const p = transitionParams(variant, direction, reduced);
  const fn: EntryExitAnimationFunction = () => {
    'worklet';
    return {
      initialValues: { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] },
      animations: {
        opacity: withTiming(0, { duration: p.exitMs, easing: Easing.in(Easing.cubic) }),
        transform: [
          { translateX: withTiming(p.exitTo.x, { duration: p.exitMs, easing: Easing.in(Easing.cubic) }) },
          { scale: withTiming(p.exitTo.scale, { duration: p.exitMs, easing: Easing.in(Easing.cubic) }) },
        ],
      },
    };
  };
  return Object.assign(fn, { presetName: 'stepExit' });
}

/** Blur overlay that ramps from blurred to sharp on mount. */
function EntryBlur() {
  const progress = useSharedValue(1);
  useEffect(() => { progress.value = withTiming(0, { duration: 220 }); }, [progress]);
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
  /** Must change on every screen change so Reanimated unmounts/remounts the Animated.View,
   *  triggering the entering/exiting animations. Typically the flow item's stable key. */
  transitionKey: string;
  direction: Direction;
  /** 'question' (default) = slide+fade. 'section' = heavier scale+fade-through. */
  variant?: Variant;
  children: ReactNode;
}

/** Directional transition between flow screens. question→question slides + fades
 *  (eased, no spring); section interstitials use a weightier scale/fade. Reanimated
 *  keeps the exiting view mounted through its exit so the two screens cross. */
export function StepTransition({ transitionKey, direction, variant = 'question', children }: StepTransitionProps) {
  const reduced = useReducedMotion();
  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        key={transitionKey}
        entering={makeEnter(variant, direction, reduced)}
        exiting={makeExit(variant, direction, reduced)}
        style={StyleSheet.absoluteFill}>
        {children}
        {!reduced && variant === 'question' ? <EntryBlur /> : null}
      </Animated.View>
    </View>
  );
}
