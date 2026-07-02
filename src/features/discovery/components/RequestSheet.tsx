import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Brand, Glass } from '@/constants/theme';
import { noteSchema, NoteValues } from '@/features/discovery/types';
import { PressScale, TextField } from '@/shared/components';
import { useKeyboardVisible } from '@/shared/hooks/use-keyboard-visible';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const formSchema = z.object({ note: noteSchema });

const REVEAL_DIAMETER = 80;
const SMALL_DIAMETER = 28; // size the success state collapses into at screen center

type Status = 'idle' | 'closing' | 'confirming' | 'reveal' | 'success' | 'collapsing';

// Pull-down past this distance (or a flick past this speed) dismisses the sheet.
const DISMISS_DISTANCE = 110; // px
const DISMISS_VELOCITY = 700; // px/s

/** What the requester tapped, rendered as a preview at the top of the sheet. */
export type RequestPreview =
  | { kind: 'photo'; signedUrl: string | null }
  | { kind: 'prompt'; prompt: string; answer: string };

interface RequestSheetProps {
  visible: boolean;
  preview: RequestPreview | null;
  recipientName?: string | null;
  /** Recipient's primary photo, shown on the success screen. */
  recipientPhotoUrl?: string | null;
  /** Persists the request. Must throw on failure; must NOT close the sheet. */
  onSubmit: (note: string) => Promise<void>;
  /** Called once the user dismisses the success screen so the parent can close + advance. */
  onComplete: () => void;
  /** Fires after the Modal has fully dismissed (iOS). Lets the parent defer mounting
   *  the next profile until nothing is presented over it. */
  onDismissed?: () => void;
  onClose: () => void;
}

/**
 * Attach a required note to a connection request, then play the send takeover:
 * the CTA label fades, the button holds a beat, a canvas-dark circle expands from
 * it to fill the screen (the profile behind fades away), and a success screen with
 * the recipient's photo settles in. The success screen stays until the user taps to
 * dismiss, then it fades while shrinking back into a small circle at the centre.
 */
export function RequestSheet({
  visible, preview, recipientName, recipientPhotoUrl, onSubmit, onComplete, onDismissed, onClose,
}: RequestSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const keyboardVisible = useKeyboardVisible();

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const enter = useSharedValue(0);       // sheet entrance/exit slide
  const dragY = useSharedValue(0);       // pull-down offset while dragging
  const formOpacity = useSharedValue(1); // sheet fades out during the takeover
  const textOpacity = useSharedValue(1); // CTA label fade
  const successOpacity = useSharedValue(0);

  // The black fill circle: centre, scale, and opacity are animated through the
  // reveal (grow from the button) and the collapse (shrink to screen centre).
  const circleX = useSharedValue(0);
  const circleY = useSharedValue(0);
  const circleScale = useSharedValue(1);
  const circleOpacity = useSharedValue(1);

  const { control, handleSubmit, reset, formState } = useForm<NoteValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: { note: '' },
  });

  // Keep the latest onComplete without re-arming anything.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset everything each time the sheet opens for a fresh target.
  useEffect(() => {
    if (!visible) return;
    reset({ note: '' });
    setStatus('idle');
    setError(null);
    dragY.value = 0;
    formOpacity.value = 1;
    textOpacity.value = 1;
    successOpacity.value = 0;
    circleScale.value = 1;
    circleOpacity.value = 1;
  }, [visible, preview, reset, dragY, formOpacity, textOpacity, successOpacity, circleScale, circleOpacity]);

  // Entrance slide.
  useEffect(() => {
    if (!visible) {
      enter.value = 0;
      return;
    }
    enter.value = reduced ? 1 : 0;
    if (!reduced) enter.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [visible, reduced, enter, height]);

  // Success screen fades in and then stays put until the user dismisses it.
  useEffect(() => {
    if (status !== 'success') return;
    successOpacity.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
  }, [status, successOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - enter.value) * height + dragY.value }],
    opacity: formOpacity.value,
  }));
  // The backdrop tracks both the enter/exit slide and the pull-down progress.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: enter.value * formOpacity.value * (1 - Math.min(dragY.value / height, 1)),
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const circleStyle = useAnimatedStyle(() => ({
    left: circleX.value - REVEAL_DIAMETER / 2,
    top: circleY.value - REVEAL_DIAMETER / 2,
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));
  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: 0.92 + successOpacity.value * 0.08 }],
  }));

  // Scale needed for a REVEAL_DIAMETER circle centred at (x, y) to cover every corner.
  const coverScale = (x: number, y: number) => {
    const maxX = Math.max(x, width - x);
    const maxY = Math.max(y, height - y);
    return (2 * Math.hypot(maxX, maxY)) / REVEAL_DIAMETER + 1;
  };

  // Close with the entrance played in reverse: the sheet slides down and the
  // backdrop fades before the parent hides the Modal (animationType="none"
  // means the Modal itself contributes no exit animation).
  const animateClose = () => {
    if (status !== 'idle') return;
    setStatus('closing');
    Keyboard.dismiss();
    if (reduced) {
      onClose();
      return;
    }
    enter.value = withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) scheduleOnRN(onClose);
    });
  };

  // Pull-down-to-dismiss. Lives on the sheet header (grab handle + title row)
  // so it never competes with the multiline note field below. A short drag
  // springs back; past the distance/velocity threshold the sheet slides off.
  const beginClose = () => {
    setStatus('closing');
    Keyboard.dismiss();
  };
  const pan = Gesture.Pan()
    .enabled(status === 'idle')
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

  const runSend = async ({ note }: NoteValues) => {
    if (status !== 'idle') return;
    Keyboard.dismiss();
    setError(null);
    setStatus('confirming');
    textOpacity.value = withTiming(0, { duration: 180 });

    // Circle expands from the CTA area (bottom-centre).
    const ox = width / 2;
    const oy = height - insets.bottom - 96;
    circleX.value = ox;
    circleY.value = oy;
    circleScale.value = 1;
    circleOpacity.value = 1;
    const target = coverScale(ox, oy);

    try {
      // Run the save and a minimum "anticipation" hold together, so the label has
      // faded and the button has held a beat before the expand — even if the save
      // resolves instantly.
      await Promise.all([onSubmit(note), new Promise((resolve) => setTimeout(resolve, 340))]);
    } catch {
      textOpacity.value = withTiming(1, { duration: 180 });
      setError('Could not send your request. Try again.');
      setStatus('idle');
      return;
    }

    setStatus('reveal');
    formOpacity.value = withTiming(0, { duration: 260 });
    if (reduced) {
      circleScale.value = target;
      setStatus('success');
    } else {
      circleScale.value = withTiming(target, { duration: 560, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) scheduleOnRN(setStatus, 'success');
      });
    }
  };

  // Dismiss: fade the success state while shrinking the fill back into a small
  // circle at the centre of the screen, then hand back to the parent.
  const dismissSuccess = () => {
    if (status !== 'success') return;
    setStatus('collapsing');
    const finish = () => onCompleteRef.current();
    if (reduced) {
      successOpacity.value = withTiming(0, { duration: 160 });
      circleOpacity.value = withTiming(0, { duration: 160 }, (f) => f && scheduleOnRN(finish));
      return;
    }
    successOpacity.value = withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) });
    circleX.value = width / 2;
    circleY.value = height / 2;
    circleOpacity.value = withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) });
    circleScale.value = withTiming(
      SMALL_DIAMETER / REVEAL_DIAMETER,
      { duration: 520, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) scheduleOnRN(finish);
      },
    );
  };

  const idle = status === 'idle';
  const showTakeover = status === 'reveal' || status === 'success' || status === 'collapsing';
  const showSuccess = status === 'success' || status === 'collapsing';
  const sheetPadBottom = keyboardVisible ? 16 : Math.max(insets.bottom, 16);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={idle ? animateClose : undefined} onDismiss={onDismissed} statusBarTranslucent>
      {/* Modals get their own native window, so gestures inside need their own
          gesture-handler root (the app-level one doesn't reach in here). */}
      <GestureHandlerRootView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={idle ? animateClose : undefined}
            pointerEvents={idle ? 'auto' : 'none'}
            style={[styles.backdrop, backdropStyle]}
          />

          <Animated.View
            pointerEvents={idle ? 'auto' : 'none'}
            style={[styles.sheet, sheetStyle, { paddingBottom: sheetPadBottom }]}>
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
                  <Text className="prose-title text-ink">
                    {recipientName ? `Request ${recipientName}` : 'Send a request'}
                  </Text>
                  <PressScale accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={animateClose}>
                    <X size={20} color={Brand.graphite} strokeWidth={2} />
                  </PressScale>
                </View>
              </View>
            </GestureDetector>

            <View className="gap-4 px-6 py-4">
              {preview ? <Preview preview={preview} /> : null}

              <Controller
                control={control}
                name="note"
                render={({ field }) => (
                  <TextField
                    label="Add a note"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="anything goes..."
                    multiline
                    className="h-24 py-3"
                    style={{ textAlignVertical: 'top' }}
                    invalid={!!formState.errors.note}
                    message={formState.errors.note?.message}
                    autoFocus
                  />
                )}
              />

              {error ? <Text className="prose-footnote text-pass">{error}</Text> : null}

              <PressScale
                accessibilityRole="button"
                accessibilityLabel="Send request"
                disabled={!idle || !formState.isValid}
                onPress={idle ? handleSubmit(runSend) : undefined}
                className={`button-primary ${!formState.isValid ? 'button-disabled' : ''}`}>
                <Animated.Text className="prose-button text-canvas" style={textStyle}>
                  Send request
                </Animated.Text>
              </PressScale>
            </View>
          </Animated.View>

          {showTakeover ? (
            // bg-canvas, not bg-ink: ink is the light text color on this dark theme,
            // so an ink fill reads as a white flash. The takeover should go dark.
            <Animated.View pointerEvents="none" className="bg-canvas" style={[styles.circle, circleStyle]} />
          ) : null}

          {showSuccess ? (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Keep browsing"
              onPress={status === 'success' ? dismissSuccess : undefined}
              pointerEvents={status === 'success' ? 'auto' : 'none'}
              style={[StyleSheet.absoluteFill, styles.successWrap, successStyle]}>
              <View className="items-center gap-5 px-10">
                <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-silver bg-graphite">
                  {recipientPhotoUrl ? (
                    <Image source={{ uri: recipientPhotoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <Text className="font-display text-3xl text-canvas">{recipientName?.[0] ?? '🙂'}</Text>
                    </View>
                  )}
                </View>
                <Text className="font-display text-3xl tracking-tight text-ink" style={styles.center}>
                  {recipientName ? `Request sent to ${recipientName}` : 'Request sent'}
                </Text>
                <Text className="prose-caption text-fog" style={styles.center}>Tap anywhere to keep browsing</Text>
              </View>
            </AnimatedPressable>
          ) : null}
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

function Preview({ preview }: { preview: RequestPreview }) {
  if (preview.kind === 'photo') {
    return (
      <View
        className="self-center overflow-hidden rounded-xl border border-silver bg-wash"
        style={{ width: 120, aspectRatio: 4 / 5 }}>
        {preview.signedUrl ? (
          <Image source={{ uri: preview.signedUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="prose-caption text-graphite">Photo</Text>
          </View>
        )}
      </View>
    );
  }
  return (
    <View className="card border-continuous gap-2 px-5 py-4">
      <Text className="prose-footnote text-slate">{preview.prompt}</Text>
      <Text className="font-primary text-2xl font-bold tracking-tight text-ink">{preview.answer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '88%',
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.silver,
  },
  circle: { position: 'absolute', width: REVEAL_DIAMETER, height: REVEAL_DIAMETER, borderRadius: REVEAL_DIAMETER / 2 },
  successWrap: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
