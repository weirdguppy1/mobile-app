import { Confetti } from "react-native-fast-confetti";

interface ConfettiBurstProps {
  /** Fired once when the one-shot burst finishes. */
  onComplete?: () => void;
}

// Brand confetti: ink + the grad-warm/cool wash hues from DESIGN.md. Avoids the
// reserved semantic colors (--yes green / --maybe amber belong to like/match).
const CONFETTI_COLORS = [
  "#FF0000",
  "#FFA500",
  "#FFFF00",
  "#00FF00",
  "#00BFFF",
  "#0000FF",
  "#8A2BE2",
  "#FF1493",
];
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
