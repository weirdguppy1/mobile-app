import { Text, View } from 'react-native';

import type { RoommateCard } from '@/features/welcome/data';

import { MeshGradient } from './mesh-gradient';

interface TiltedCardProps {
  card: RoommateCard;
}

/**
 * One roommate "polaroid" — a mesh-gradient photo with a monogram, framed in
 * white with a caption. Scattered at a slight rotation, these form the tilted
 * card stack that is the soul of the product (DESIGN.md).
 *
 * Resting position only; the entrance is handled by the wrapping `FadeIn`.
 */
export function TiltedCard({ card }: TiltedCardProps) {
  return (
    <View
      className="w-39.5 gap-2.5 rounded-[14px] border-continuous bg-canvas p-2 pb-3 shadow-card"
      style={{
        transform: [
          { translateX: card.offsetX },
          { translateY: card.offsetY },
          { rotate: `${card.rotate}deg` },
          { scale: card.scale },
        ],
      }}>
      <MeshGradient
        variant={card.wash}
        className="h-46.5 w-full items-center justify-center overflow-hidden rounded-lg border-continuous">
        <Text className="font-display text-[64px] text-canvas opacity-90">{card.monogram}</Text>
      </MeshGradient>
      <View className="gap-0.5 px-1">
        <Text className="font-primary text-[15px] font-bold tracking-[-0.3px] text-ink" numberOfLines={1}>
          {card.name}
        </Text>
        <Text className="font-primary text-xs font-medium tracking-[-0.2px] text-slate" numberOfLines={1}>
          {card.meta}
        </Text>
      </View>
    </View>
  );
}
