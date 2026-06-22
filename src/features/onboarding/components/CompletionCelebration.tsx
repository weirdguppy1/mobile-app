import { StyleSheet, Text, View } from 'react-native';

import { ConfettiBurst, FadeIn } from '@/shared/components';

interface CompletionCelebrationProps {
  /** Fired when the confetti burst finishes (caller then transitions away). */
  onComplete: () => void;
}

/**
 * Completion overlay (TASK.md §7): a confetti burst over a brief congratulatory
 * headline. Calls `onComplete` once the confetti finishes so the caller can
 * lift + fade into the next screen.
 */
export function CompletionCelebration({ onComplete }: CompletionCelebrationProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" className="items-center justify-center">
      <FadeIn delay={120}>
        <Text className="prose-display text-center text-ink">You're all set!</Text>
      </FadeIn>
      <ConfettiBurst onComplete={onComplete} />
    </View>
  );
}
