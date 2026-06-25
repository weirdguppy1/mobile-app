import { X } from 'lucide-react-native';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface SkipButtonProps {
  onPress: () => void;
  /** Positioning (the screen floats this above the nav bar). */
  className?: string;
}

/** Skip the whole person (DESIGN.md §7): one ~56px white circle with a ✕ in
 *  `--pass`. The only ways forward are "request something" or "skip this person". */
export function SkipButton({ onPress, className }: SkipButtonProps) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel="Skip this person"
      onPress={onPress}
      className={`h-14 w-14 items-center justify-center rounded-full bg-canvas shadow-card ${className ?? ''}`}>
      <X size={26} color={Brand.pass} strokeWidth={2.5} />
    </PressScale>
  );
}
