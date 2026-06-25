import { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Brand } from '@/constants/theme';
import { Avatar } from '@/features/messaging/components/Avatar';

const REVEAL_D = 80;
const AVATAR = 84;
const GAP = 100; // distance from screen center to each avatar's center
const SEG = GAP - AVATAR / 2; // length of each connecting line segment (centre → avatar edge)
const TOTAL_MS = 2400;

interface ConnectionCelebrationProps {
  visible: boolean;
  /** Centre of the Accept button (screen coords) — the reveal expands from here. */
  origin: { x: number; y: number } | null;
  meAvatarUrl: string | null;
  themAvatarUrl: string | null;
  meName: string | null;
  themName: string | null;
  onComplete: () => void;
}

/**
 * Accept celebration: the button expands to fill the screen (ink reveal), two
 * avatars slide in from opposite edges to centre, a glowing dot pops between them,
 * then thin lines grow outward from the dot to each avatar. Calls onComplete when done.
 */
export function ConnectionCelebration({
  visible, origin, meAvatarUrl, themAvatarUrl, meName, themName, onComplete,
}: ConnectionCelebrationProps) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const cx = width / 2;
  const cy = height / 2;

  const reveal = useSharedValue(0);
  const avatars = useSharedValue(0);
  const dot = useSharedValue(0);
  const line = useSharedValue(0);
  const label = useSharedValue(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) {
      reveal.value = 0; avatars.value = 0; dot.value = 0; line.value = 0; label.value = 0;
      return;
    }
    if (reduced) {
      reveal.value = 1; avatars.value = 1; dot.value = 1; line.value = 1; label.value = 1;
      const t = setTimeout(() => onCompleteRef.current(), 900);
      return () => clearTimeout(t);
    }
    reveal.value = withTiming(1, { duration: 480, easing: Easing.inOut(Easing.cubic) });
    avatars.value = withDelay(360, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
    dot.value = withDelay(900, withSequence(
      withTiming(1.4, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 140 }),
    ));
    line.value = withDelay(1080, withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }));
    label.value = withDelay(1340, withTiming(1, { duration: 300 }));
    const t = setTimeout(() => onCompleteRef.current(), TOTAL_MS);
    return () => clearTimeout(t);
  }, [visible, reduced, reveal, avatars, dot, line, label]);

  const ox = origin?.x ?? cx;
  const oy = origin?.y ?? cy;
  const maxX = Math.max(ox, width - ox);
  const maxY = Math.max(oy, height - oy);
  const target = (2 * Math.hypot(maxX, maxY)) / REVEAL_D + 1;

  const revealStyle = useAnimatedStyle(() => ({
    left: ox - REVEAL_D / 2,
    top: oy - REVEAL_D / 2,
    transform: [{ scale: 1 + reveal.value * (target - 1) }],
  }));
  const leftAvatarStyle = useAnimatedStyle(() => ({
    opacity: avatars.value,
    transform: [{ translateX: (1 - avatars.value) * -width * 0.6 }],
  }));
  const rightAvatarStyle = useAnimatedStyle(() => ({
    opacity: avatars.value,
    transform: [{ translateX: (1 - avatars.value) * width * 0.6 }],
  }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: Math.min(dot.value, 1), transform: [{ scale: dot.value }] }));
  const leftLineStyle = useAnimatedStyle(() => ({ width: SEG * line.value, left: cx - SEG * line.value }));
  const rightLineStyle = useAnimatedStyle(() => ({ width: SEG * line.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: label.value, transform: [{ translateY: (1 - label.value) * 10 }] }));

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View pointerEvents="none" className="bg-ink" style={[styles.circle, revealStyle]} />

        {/* connecting lines (under the dot + avatars) */}
        <Animated.View pointerEvents="none" style={[styles.line, { top: cy - 1 }, leftLineStyle]} />
        <Animated.View pointerEvents="none" style={[styles.line, { top: cy - 1, left: cx }, rightLineStyle]} />

        {/* glowing centre dot */}
        <Animated.View pointerEvents="none" style={[styles.dot, { left: cx - 7, top: cy - 7 }, dotStyle]} />

        {/* avatars */}
        <Animated.View pointerEvents="none" style={[styles.avatar, { left: cx - GAP - AVATAR / 2, top: cy - AVATAR / 2 }, leftAvatarStyle]}>
          <Avatar uri={meAvatarUrl} name={meName} size={AVATAR} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.avatar, { left: cx + GAP - AVATAR / 2, top: cy - AVATAR / 2 }, rightAvatarStyle]}>
          <Avatar uri={themAvatarUrl} name={themName} size={AVATAR} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.labelWrap, { top: cy + AVATAR / 2 + 28 }, labelStyle]}>
          <Text className="font-display text-3xl tracking-tight text-canvas">You're connected!</Text>
          {themName ? <Text className="prose-subtitle text-center text-fog">Say hi to {themName}</Text> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  circle: { position: 'absolute', width: REVEAL_D, height: REVEAL_D, borderRadius: REVEAL_D / 2 },
  line: { position: 'absolute', height: 2, backgroundColor: '#ffffff' },
  dot: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#ffffff',
    shadowColor: Brand.yes, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  avatar: { position: 'absolute', borderRadius: AVATAR / 2, borderWidth: 2, borderColor: '#ffffff', overflow: 'hidden' },
  labelWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 4 },
});
