import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ConfettiBurst, FadeIn } from '@/shared/components';

interface CompletionCelebrationProps {
  /** Fired once when the celebration finishes (caller then transitions away). */
  onComplete: () => void;
}

/** Safety net (ms): if the confetti's onAnimationEnd never fires, run onComplete
 *  anyway so a completed user is never stranded on this screen. */
const SAFETY_TIMEOUT = 5000;

/**
 * Completion overlay (TASK.md §7): a confetti burst over a brief congratulatory
 * headline. Calls `onComplete` once the confetti finishes — or after a safety
 * timeout if that callback never fires — so the caller can lift + fade into the
 * next screen. `onComplete` runs at most once.
 */
export function CompletionCelebration({ onComplete }: CompletionCelebrationProps) {
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(finish, SAFETY_TIMEOUT);
    return () => clearTimeout(timer);
  }, [finish]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
      <FadeIn delay={120}>
        <Text className="prose-display text-center text-ink">You're all set!</Text>
      </FadeIn>
      <ConfettiBurst onComplete={finish} />
    </View>
  );
}
