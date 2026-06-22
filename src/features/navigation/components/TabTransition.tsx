import { useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useResolveClassNames } from 'uniwind';

import { useTabNavStore } from '@/features/navigation/store/tab-nav-store';

const DISTANCE = 36;

interface TabTransitionProps extends ViewProps {
  children: ReactNode;
}

/**
 * Quick directional slide + fade played whenever a tab screen gains focus — the
 * onboarding StepTransition feel, lighter and faster for tab switches (TASK
 * reuse). Direction comes from the tab nav store, which the BottomNav sets on
 * press. Respects reduced motion (renders settled, no animation).
 */
export function TabTransition({ className, style, children, ...rest }: TabTransitionProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const dir = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      dir.value = useTabNavStore.getState().direction === 'back' ? -1 : 1;
      if (reduced) {
        progress.value = 1;
      } else {
        progress.value = 0;
        progress.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      }
      return () => {
        // Reset while blurred so the next focus animates in cleanly (no flash).
        if (!reduced) progress.value = 0;
      };
    }, [progress, dir, reduced]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * dir.value * DISTANCE }],
  }));

  const resolved = useResolveClassNames(className ?? 'flex-1');

  return (
    <Animated.View style={[resolved, style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
