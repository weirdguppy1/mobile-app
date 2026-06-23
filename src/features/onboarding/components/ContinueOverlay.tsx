// src/features/onboarding/components/ContinueOverlay.tsx
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivateRamp, Button, CheckPop } from '@/shared/components';

/** Content height of the overlay (button + padding), excluding the safe inset. */
const CONTINUE_OVERLAY_BASE = 96;
const MIN_INSET = 12;

/** Total height the overlay occupies — screens pad their scroll content by this so
 *  the last control clears the floating Continue. */
export function useContinueOverlayHeight(): number {
  const insets = useSafeAreaInsets();
  return CONTINUE_OVERLAY_BASE + Math.max(insets.bottom, MIN_INSET);
}

interface ContinueOverlayProps {
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  label?: string;
}

/** The bottom Continue, floating in a blurred overlay so content scrolls beneath it
 *  (TASK4 §5). Reuses the existing Button unchanged; ramps in when advanceable and
 *  pops a confirm tick on press. */
export function ContinueOverlay({ canAdvance, onNext, saving, label = 'Continue' }: ContinueOverlayProps) {
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);

  const handlePress = () => {
    if (!canAdvance) return;
    setConfirming(true);
    onNext();
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Soft graduated wash into the content above the blur — stacked translucent strips
          (no linear gradient per DESIGN.md). Opacities tunable on device QA. */}
      <View pointerEvents="none">
        <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.18)' }} />
        <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.36)' }} />
        <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.52)' }} />
      </View>
      <BlurView
        tint="light"
        blurMethod="dimezisBlurView"
        intensity={24}
        style={[styles.blur, { paddingBottom: Math.max(insets.bottom, MIN_INSET) }]}>
        <View className="px-6 pt-3">
          <ActivateRamp active={canAdvance}>
            <Button variant="primary" onPress={handlePress} disabled={!canAdvance} loading={saving}>
              {label}
            </Button>
          </ActivateRamp>
          <View pointerEvents="none" className="absolute right-9 top-6">
            <CheckPop show={confirming} color="#ffffff" />
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  blur: { backgroundColor: 'rgba(255,255,255,0.55)' },
});