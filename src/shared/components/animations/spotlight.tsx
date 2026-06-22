import { BlurView } from 'expo-blur';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  /** Index of the slot currently holding focus, or null. */
  activeSlot: number | null;
  focusSlot: (slot: number) => void;
  blurSlot: (slot: number) => void;
}

const SpotlightContext = createContext<SpotlightContextValue | null>(null);
/** The slot index a field is rendered inside, provided by SpotlightSlot. */
const SlotIndexContext = createContext<number | null>(null);

/** Returns the spotlight controls, or null when used outside a provider. */
export function useSpotlight(): SpotlightContextValue | null {
  return useContext(SpotlightContext);
}

/** Returns the index of the SpotlightSlot the caller is rendered in, or null. */
export function useSpotlightSlot(): number | null {
  return useContext(SlotIndexContext);
}

/**
 * Coordinates the focus spotlight (TASK.md §2): when a field focuses, the scrim
 * blur fades in over the step body and the slot holding that field elevates
 * above the scrim so it stays sharp — regardless of how deeply the field is
 * nested inside the slot.
 */
export function SpotlightProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const focusSlot = useCallback(
    (slot: number) => {
      setActiveSlot(slot);
      progress.value = reduced ? 0 : withTiming(1, { duration: 220 });
    },
    [progress, reduced],
  );

  const blurSlot = useCallback(
    (slot: number) => {
      setActiveSlot((current) => (current === slot ? null : current));
      progress.value = withTiming(0, { duration: 220 });
    },
    [progress],
  );

  const value = useMemo<SpotlightContextValue>(
    () => ({ progress, activeSlot, focusSlot, blurSlot }),
    [progress, activeSlot, focusSlot, blurSlot],
  );

  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
}

/**
 * Wraps one top-level child of the step body. When the focused field lives
 * inside this slot, the slot raises its zIndex above the scrim so its whole
 * subtree (the focused field at any depth) stays sharp; other slots sit below
 * the scrim and blur. While any field is focused, the non-focused slots also
 * stop receiving touches, so you can't tap another field/option until the
 * current field is dismissed (TASK.md §2). Provides its index to descendants.
 */
export function SpotlightSlot({ index, children }: { index: number; children: ReactNode }) {
  const ctx = useSpotlight();
  const reduced = useReducedMotion();
  const active = ctx?.activeSlot === index;
  const blocked = !reduced && ctx?.activeSlot != null && !active;

  return (
    <SlotIndexContext.Provider value={index}>
      <View style={{ zIndex: active ? 2 : 0, pointerEvents: blocked ? 'none' : 'auto' }}>
        {children}
      </View>
    </SlotIndexContext.Provider>
  );
}

/**
 * The blur layer. Render it as the LAST child of the scroll content container so
 * it paints over the (un-elevated) slots; the active slot raises its zIndex
 * above it. Disabled under reduced motion.
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
      blurMethod="dimezisBlurView"
      style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
      animatedProps={animatedProps}
    />
  );
}
