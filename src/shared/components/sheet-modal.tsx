import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Glass } from '@/constants/theme';
import { PressScale } from '@/shared/components/press-scale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pull-down past this distance (or a flick past this speed) dismisses the sheet.
const DISMISS_DISTANCE = 110; // px
const DISMISS_VELOCITY = 700; // px/s

interface SheetModalProps {
  visible: boolean;
  /** Header title, next to the shell-provided X button. */
  title: string;
  /** Called once the exit animation finishes; the parent then flips `visible`. */
  onClose: () => void;
  /** Sheet body below the header. Scroll it yourself if it can grow. */
  children: ReactNode;
}

/**
 * Bottom-sheet shell: dark-glass surface, backdrop, slide-up entrance, and two
 * dismissals that mirror it — an animated close (X / backdrop / Android back)
 * and a pull-down on the header that springs back on a short drag or slides
 * off past a distance/velocity threshold. The pan lives on the header only
 * (grab handle + title row) so it never competes with scrollable content.
 *
 * For simple content sheets (e.g. PromptPickerSheet). RequestSheet keeps its
 * own plumbing: its send takeover and keyboard handling need more control
 * than this shell exposes.
 */
export function SheetModal({ visible, title, onClose, children }: SheetModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();

  const [closing, setClosing] = useState(false);
  const enter = useSharedValue(0); // entrance/exit slide
  const dragY = useSharedValue(0); // pull-down offset while dragging

  // Entrance slide; also re-arms after a dismissed sheet is reopened.
  useEffect(() => {
    if (!visible) {
      enter.value = 0;
      return;
    }
    setClosing(false);
    dragY.value = 0;
    enter.value = reduced ? 1 : 0;
    if (!reduced) enter.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [visible, reduced, enter, dragY]);

  // Close with the entrance played in reverse; the Modal itself contributes no
  // exit animation (animationType="none"), so the slide must finish first.
  const animateClose = () => {
    if (closing) return;
    setClosing(true);
    Keyboard.dismiss();
    if (reduced) {
      onClose();
      return;
    }
    enter.value = withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) scheduleOnRN(onClose);
    });
  };

  const beginClose = () => {
    setClosing(true);
    Keyboard.dismiss();
  };
  const pan = Gesture.Pan()
    .enabled(!closing)
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      const commit = e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY;
      if (!commit) {
        // Near-critically damped so the sheet settles back without a bounce.
        dragY.value = withSpring(0, { damping: 28, stiffness: 300 });
        return;
      }
      scheduleOnRN(beginClose);
      dragY.value = withTiming(height, { duration: 220, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) scheduleOnRN(onClose);
      });
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - enter.value) * height + dragY.value }],
  }));
  // The backdrop tracks both the enter/exit slide and the pull-down progress.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: enter.value * (1 - Math.min(dragY.value / height, 1)),
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={animateClose} statusBarTranslucent>
      {/* Modals get their own native window, so gestures inside need their own
          gesture-handler root (the app-level one doesn't reach in here). */}
      <GestureHandlerRootView style={styles.root}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={closing ? undefined : animateClose}
          style={[styles.backdrop, backdropStyle]}
        />
        <Animated.View
          pointerEvents={closing ? 'none' : 'auto'}
          style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <BlurView
            tint={Glass.sheet.tint}
            intensity={Glass.sheet.intensity}
            blurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.sheet.bg }]} />
          <GestureDetector gesture={pan}>
            <View>
              <View className="items-center pb-2 pt-3">
                <View className="h-1 w-9 rounded-full bg-silver" />
              </View>
              <View className="flex-row items-center justify-between px-6 pb-2">
                <Text className="prose-title text-ink">{title}</Text>
                <PressScale accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={animateClose}>
                  <X size={20} color={Brand.graphite} strokeWidth={2} />
                </PressScale>
              </View>
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '80%',
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.silver,
  },
});
