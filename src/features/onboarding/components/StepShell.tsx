import { type ReactNode, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import {
  ActivateRamp,
  Button,
  CheckPop,
  FadeIn,
  FocusScale,
  SpotlightProvider,
  SpotlightScrim,
} from '@/shared/components';

interface StepShellProps {
  children: ReactNode;
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  nextLabel?: string;
}

/** Shared chrome for every wizard step: title, body, footer nav. Background and
 *  progress are owned by the persistent shell in OnboardingScreen. */
export function StepShell({ children, canAdvance, onNext, saving, nextLabel = 'Next' }: StepShellProps) {
  const { step, goBack, skip, canGoBack } = useOnboarding();
  const reduced = useReducedMotion();
  const [confirming, setConfirming] = useState(false);
  const compress = useSharedValue(1);

  const handleNext = () => {
    if (!canAdvance) return;
    if (!reduced) {
      compress.value = withSequence(
        withTiming(0.99, { duration: 90 }),
        withSpring(1, { damping: 16, stiffness: 240 }),
      );
    }
    setConfirming(true);
    onNext();
  };

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: compress.value }] }));

  return (
    <SpotlightProvider>
      <View className="flex-1">
        <View className="gap-1.5 px-6 pt-2">
          <Text className="prose-title text-ink">{step.title}</Text>
          <FadeIn delay={180}>
            <Text className="prose-subtitle">{step.subtitle}</Text>
          </FadeIn>
        </View>

        <FocusScale className="flex-1">
          <Animated.View className="flex-1" style={bodyStyle}>
            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-4 px-6 py-6"
              keyboardShouldPersistTaps="handled">
              {children}
              <SpotlightScrim />
            </ScrollView>
          </Animated.View>
        </FocusScale>

        <View className="gap-2 px-6 pb-2">
          <View>
            <ActivateRamp active={canAdvance}>
              <Button variant="primary" onPress={handleNext} disabled={!canAdvance} loading={saving}>
                {nextLabel}
              </Button>
            </ActivateRamp>
            <View pointerEvents="none" className="absolute right-3 top-3">
              <CheckPop show={confirming} color="#ffffff" />
            </View>
          </View>
          <View className="flex-row justify-between">
            {canGoBack ? (
              <Button variant="ghost" onPress={goBack}>Back</Button>
            ) : <View />}
            {step.skippable ? (
              <Button variant="ghost" onPress={skip}>Skip</Button>
            ) : <View />}
          </View>
        </View>
      </View>
    </SpotlightProvider>
  );
}
