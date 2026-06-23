import { Confetti } from 'react-native-fast-confetti';

interface ConfettiBurstProps {
  /** Fired once when the one-shot burst finishes. */
  onComplete?: () => void;
}

// Brand confetti: ink + the grad-warm/cool wash hues from DESIGN.md. Avoids the
// reserved semantic colors (--yes green / --maybe amber belong to like/match).
const CONFETTI_COLORS = ['#f8c4ff', '#96c4ff', '#ffd6e8', '#e0c3fc', '#ffe0c2'];

/**
 * A single celebratory confetti burst (TASK.md §7). One-shot (`infinite={false}`)
 * and self-positioning (falls back to screen dimensions). Skia-backed via
 * react-native-fast-confetti.
 */
export function ConfettiBurst({ onComplete }: ConfettiBurstProps) {
  return (
    <Confetti
      autoplay
      infinite={false}
      fadeOutOnEnd
      count={200}
      colors={CONFETTI_COLORS}
      onAnimationEnd={onComplete}
    />
  );
}
