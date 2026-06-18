import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, FontFamily } from '@/constants/theme';
import { MeshGradient } from '@/features/welcome/components/mesh-gradient';
import { TiltedCard } from '@/features/welcome/components/tilted-card';
import { WELCOME_CARDS } from '@/features/welcome/data';
import { FadeIn, PressScale } from '@/shared/components';

/**
 * The welcome / onboarding hero. White stage, a warm wash bleeding from the top,
 * a tilted stack of potential roommates, and a single confident message + CTA.
 */
export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Placeholder destination until auth/onboarding lands.
  const start = () => router.push('/explore');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MeshGradient variant="hero" style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.stack} pointerEvents="none">
          {WELCOME_CARDS.map((card, i) => (
            <FadeIn key={card.id} delay={80 + i * 70} style={styles.cardAnchor}>
              <TiltedCard card={card} />
            </FadeIn>
          ))}
        </View>

        <View style={styles.message}>
          <FadeIn delay={300}>
            <Text style={styles.headline}>Find your{'\n'}people.</Text>
          </FadeIn>

          <FadeIn delay={370}>
            <Text style={styles.subcopy}>Your ideal college roommate, matched.</Text>
          </FadeIn>

          <FadeIn delay={440} style={styles.actions}>
            <PressScale accessibilityRole="button" onPress={start} style={styles.cta}>
              <Text style={styles.ctaLabel}>Get started</Text>
            </PressScale>

            <Pressable
              accessibilityRole="button"
              onPress={start}
              hitSlop={12}
              style={({ pressed }) => [styles.ghost, pressed && styles.ghostPressed]}>
              <Text style={styles.ghostLabel}>I already have an account</Text>
            </Pressable>
          </FadeIn>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stack: {
    flex: 1,
    position: 'relative',
  },
  cardAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    gap: 16,
    paddingBottom: 8,
  },
  headline: {
    fontFamily: FontFamily.display,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -1.8,
    color: Brand.ink,
  },
  subcopy: {
    fontFamily: FontFamily.primary,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: -0.3,
    color: Brand.slate,
    maxWidth: 320,
  },
  actions: {
    gap: 14,
    marginTop: 8,
  },
  cta: {
    height: 56,
    borderRadius: 999,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: FontFamily.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Brand.canvas,
  },
  ghost: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  ghostPressed: {
    opacity: 0.5,
  },
  ghostLabel: {
    fontFamily: FontFamily.primary,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    color: Brand.graphite,
  },
});
