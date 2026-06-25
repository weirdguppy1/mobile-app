import { Heart } from 'lucide-react-native';

import { Brand } from '@/constants/theme';
import { RequestTarget } from '@/features/discovery/types';
import { PressScale } from '@/shared/components';

interface RequestHeartProps {
  target: RequestTarget;
  onPress: (target: RequestTarget) => void;
}

/** The per-element like affordance (DESIGN.md §7): a white circle with a mono-weight
 *  ink heart, anchored bottom-right of a photo or prompt by ProfileView. Tapping
 *  opens the request sheet for this specific target. */
export function RequestHeart({ target, onPress }: RequestHeartProps) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel="Send a request about this"
      hitSlop={8}
      onPress={() => onPress(target)}
      className="h-11 w-11 items-center justify-center rounded-full bg-canvas shadow-card">
      <Heart size={20} color={Brand.ink} strokeWidth={2} />
    </PressScale>
  );
}
