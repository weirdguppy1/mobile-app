import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

import { DARK_PAGE, DiscoverWashes } from '@/constants/theme';
import { TiltedCard } from '@/features/welcome/components/tilted-card';
import { WELCOME_CARDS } from '@/features/welcome/data';
import { FadeIn, PressScale } from '@/shared/components';

export function WelcomeScreen() {
  const router = useRouter();

  const start = () => router.push('/(auth)/sign-up');
  const signIn = () => router.push('/(auth)/sign-in');

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      {/* Dark ambient wash — peach-rose radial blooms on the dark page */}
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{
          backgroundColor: DARK_PAGE,
          experimental_backgroundImage: DiscoverWashes[0].stops,
        }}
      />

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
            <Text className="prose-display text-ink">Find your{'\n'}perfect roommate.</Text>
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
              onPress={signIn}
              hitSlop={12}
              className="button-ghost active:opacity-50">
              <Text className="prose-footnote font-medium text-graphite">
                I already have an account
              </Text>
            </Pressable>

            {__DEV__ ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/dev')}
                hitSlop={8}
                className="items-center py-1 active:opacity-50">
                <Text className="prose-caption text-ash">Dev menu</Text>
              </Pressable>
            ) : null}
          </FadeIn>
        </View>
      </View>
    </View>
  );
}
