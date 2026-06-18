import { StyleSheet, Text, View } from 'react-native';

import { Brand, CardShadow, FontFamily } from '@/constants/theme';
import type { RoommateCard } from '@/features/welcome/data';

import { MeshGradient } from './mesh-gradient';

interface TiltedCardProps {
  card: RoommateCard;
}

const CARD_WIDTH = 158;

/**
 * One roommate "polaroid" — a mesh-gradient photo with a monogram, framed in
 * white with a caption. Scattered at a slight rotation, these form the tilted
 * card stack that is the soul of the product (DESIGN.md).
 *
 * Resting position only; entrance motion is handled by the wrapping `FadeIn` so
 * its transform never competes with this card's rotation.
 */
export function TiltedCard({ card }: TiltedCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          transform: [
            { translateX: card.offsetX },
            { translateY: card.offsetY },
            { rotate: `${card.rotate}deg` },
            { scale: card.scale },
          ],
        },
      ]}>
      <MeshGradient variant={card.wash} style={styles.photo}>
        <Text style={styles.monogram}>{card.monogram}</Text>
      </MeshGradient>
      <View style={styles.caption}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {card.meta}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    padding: 8,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: Brand.canvas,
    borderRadius: 14,
    borderCurve: 'continuous',
    boxShadow: CardShadow,
  },
  photo: {
    height: CARD_WIDTH * 1.18,
    borderRadius: 8,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  monogram: {
    fontFamily: FontFamily.display,
    fontSize: 64,
    color: Brand.canvas,
    opacity: 0.92,
  },
  caption: {
    paddingHorizontal: 4,
    gap: 2,
  },
  name: {
    fontFamily: FontFamily.primary,
    fontSize: 15,
    fontWeight: '700',
    color: Brand.ink,
    letterSpacing: -0.3,
  },
  meta: {
    fontFamily: FontFamily.primary,
    fontSize: 12,
    fontWeight: '500',
    color: Brand.slate,
    letterSpacing: -0.2,
  },
});
