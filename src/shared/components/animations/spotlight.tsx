import { BlurView } from 'expo-blur';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const SCRIM_BLUR_MAX = 14;

interface SpotlightContextValue {
  /** 0 = no blur, 1 = full scrim blur. */
  progress: SharedValue<number>;
  activeId: string | null;
  focus: (id: string) => void;
  blur: (id: string) => void;
}

const SpotlightContext = createContext<SpotlightContextValue | null>(null);

/** Returns the spotlight controls, or null when used outside a provider. */
export function useSpotlight(): SpotlightContextValue | null {
  return useContext(SpotlightContext);
}

/**
 * Coordinates the focus spotlight (TASK.md §2): when a field focuses, the scrim
 * blur fades in over the step body; the focused field elevates above it.
 */
export function SpotlightProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const focus = useCallback(
    (id: string) => {
      setActiveId(id);
      progress.value = reduced ? 0 : withTiming(1, { duration: 220 });
    },
    [progress, reduced],
  );

  const blur = useCallback(
    (id: string) => {
      setActiveId((current) => (current === id ? null : current));
      progress.value = withTiming(0, { duration: 220 });
    },
    [progress],
  );

  const value = useMemo<SpotlightContextValue>(
    () => ({ progress, activeId, focus, blur }),
    [progress, activeId, focus, blur],
  );

  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
}

/**
 * The blur layer. Render it as the LAST child of the scroll content container so
 * it paints over unfocused siblings; the focused field raises its zIndex above
 * it. Disabled under reduced motion.
 */
export function SpotlightScrim() {
  const ctx = useSpotlight();
  const reduced = useReducedMotion();

  const animatedProps = useAnimatedProps(() => ({
    intensity: (ctx?.progress.value ?? 0) * SCRIM_BLUR_MAX,
  }));

  if (!ctx || reduced) return null;

  return (
    <AnimatedBlurView
      pointerEvents="none"
      tint="light"
      experimentalBlurMethod="dimezisBlurView"
      style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
      animatedProps={animatedProps}
    />
  );
}
