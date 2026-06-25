import { zodResolver } from '@hookform/resolvers/zod';
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
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Brand } from '@/constants/theme';
import { noteSchema, NoteValues } from '@/features/discovery/types';
import { PressScale, TextField } from '@/shared/components';
import { useKeyboardVisible } from '@/shared/hooks/use-keyboard-visible';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const formSchema = z.object({ note: noteSchema });

const REVEAL_DIAMETER = 80;
const SMALL_DIAMETER = 28; // size the success state collapses into at screen center

type Status = 'idle' | 'confirming' | 'reveal' | 'success' | 'collapsing';

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
 * the CTA label fades, the button holds a beat, a black circle expands from it to
 * fill the screen (the profile behind fades away), and a success screen with the
 * recipient's photo settles in. The success screen stays until the user taps to
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

  const enter = useSharedValue(0);       // sheet entrance slide
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
    formOpacity.value = 1;
    textOpacity.value = 1;
    successOpacity.value = 0;
    circleScale.value = 1;
    circleOpacity.value = 1;
  }, [visible, preview, reset, formOpacity, textOpacity, successOpacity, circleScale, circleOpacity]);

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
    transform: [{ translateY: (1 - enter.value) * height }],
    opacity: formOpacity.value,
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: enter.value * formOpacity.value }));
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
        if (finished) runOnJS(setStatus)('success');
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
      circleOpacity.value = withTiming(0, { duration: 160 }, (f) => f && runOnJS(finish)());
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
        if (finished) runOnJS(finish)();
      },
    );
  };

  const idle = status === 'idle';
  const showTakeover = status === 'reveal' || status === 'success' || status === 'collapsing';
  const showSuccess = status === 'success' || status === 'collapsing';
  const sheetPadBottom = keyboardVisible ? 16 : Math.max(insets.bottom, 16);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={idle ? onClose : undefined} onDismiss={onDismissed} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={idle ? onClose : undefined}
          pointerEvents={idle ? 'auto' : 'none'}
          style={[styles.backdrop, backdropStyle]}
        />

        <Animated.View
          pointerEvents={idle ? 'auto' : 'none'}
          className="bg-canvas"
          style={[styles.sheet, sheetStyle, { paddingBottom: sheetPadBottom }]}>
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-9 rounded-full bg-silver" />
          </View>
          <View className="flex-row items-center justify-between px-6 pb-2">
            <Text className="prose-title text-ink">
              {recipientName ? `Request ${recipientName}` : 'Send a request'}
            </Text>
            <PressScale accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose}>
              <X size={20} color={Brand.graphite} strokeWidth={2} />
            </PressScale>
          </View>

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
                  placeholder="e.g. Also a CS major — looking for a quiet dorm too"
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
          <Animated.View pointerEvents="none" className="bg-ink" style={[styles.circle, circleStyle]} />
        ) : null}

        {showSuccess ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="Keep browsing"
            onPress={status === 'success' ? dismissSuccess : undefined}
            pointerEvents={status === 'success' ? 'auto' : 'none'}
            style={[StyleSheet.absoluteFill, styles.successWrap, successStyle]}>
            <View className="items-center gap-5 px-10">
              <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-canvas bg-graphite">
                {recipientPhotoUrl ? (
                  <Image source={{ uri: recipientPhotoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Text className="font-display text-3xl text-canvas">{recipientName?.[0] ?? '🙂'}</Text>
                  </View>
                )}
              </View>
              <Text className="font-display text-3xl tracking-tight text-canvas" style={styles.center}>
                {recipientName ? `Request sent to ${recipientName}` : 'Request sent'}
              </Text>
              <Text className="prose-caption text-fog" style={styles.center}>Tap anywhere to keep browsing</Text>
            </View>
          </AnimatedPressable>
        ) : null}
      </KeyboardAvoidingView>
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
      <Text className="font-display text-2xl tracking-tight text-ink">{preview.answer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.silver,
  },
  circle: { position: 'absolute', width: REVEAL_DIAMETER, height: REVEAL_DIAMETER, borderRadius: REVEAL_DIAMETER / 2 },
  successWrap: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
