import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

import { MeshGradient } from '@/features/welcome/components/mesh-gradient';
import { TiltedCard } from '@/features/welcome/components/tilted-card';
import { WELCOME_CARDS } from '@/features/welcome/data';
import { FadeIn, PressScale } from '@/shared/components';

export function WelcomeScreen() {
  const router = useRouter();

  const start = () => router.push('/(auth)/sign-up');

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <MeshGradient variant="hero" className="absolute inset-0" pointerEvents="none" />

      <View className="flex-1 px-6 pt-safe pb-safe-offset-5">
        <View className="relative flex-1" pointerEvents="none">
          {WELCOME_CARDS.map((card, i) => (
            <FadeIn
              key={card.id}
              delay={80 + i * 70}
              className="absolute inset-0 items-center justify-center">
              <TiltedCard card={card} />
            </FadeIn>
          ))}
        </View>

        <View className="gap-4 pb-2">
          <FadeIn delay={300}>
            <Text className="prose-display text-ink">Find your{'\n'}people.</Text>
          </FadeIn>

          <FadeIn delay={370}>
            <Text className="prose-subtitle max-w-80">
              Your ideal college roommate, matched.
            </Text>
          </FadeIn>

          <FadeIn delay={440} className="mt-2 gap-3.5">
            <PressScale
              accessibilityRole="button"
              onPress={start}
              className="button-primary">
              <Text className="prose-button text-canvas">Get started</Text>
            </PressScale>

            <Pressable
              accessibilityRole="button"
              onPress={start}
              hitSlop={12}
              className="button-ghost active:opacity-50">
              <Text className="prose-footnote font-medium text-graphite">
                I already have an account
              </Text>
            </Pressable>
          </FadeIn>
        </View>
      </View>
    </View>
  );
}
