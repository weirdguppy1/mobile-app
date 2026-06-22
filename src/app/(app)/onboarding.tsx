import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CompletionCelebration } from '@/features/onboarding/components/CompletionCelebration';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
import { STEP_COMPONENTS } from '@/features/onboarding/config/step-components';
import { STEPS } from '@/features/onboarding/config/steps';
import { toneFor } from '@/features/onboarding/config/step-tone';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { firstIncompleteIndex } from '@/features/onboarding/lib/onboarding-progress';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { StepTransition } from '@/shared/components';

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, index, data, isLoading, isError, setIndex } = useOnboarding();
  const celebrating = useOnboardingStore((s) => s.celebrating);
  const setCelebrating = useOnboardingStore((s) => s.setCelebrating);
  const reduced = useReducedMotion();

  // Direction for the step transition: forward when the index grows.
  const prevIndex = useRef(index);
  const direction: 'forward' | 'back' = index >= prevIndex.current ? 'forward' : 'back';
  useEffect(() => {
    prevIndex.current = index;
  }, [index]);

  // Screen-level lift + fade played after the confetti, before navigating.
  const exit = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -exit.value * 40 }],
  }));

  const goToApp = () => {
    setCelebrating(false);
    router.replace('/discover');
  };

  const handleCelebrationDone = () => {
    if (reduced) {
      goToApp();
      return;
    }
    exit.value = withTiming(1, { duration: 480, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(goToApp)();
    });
  };

  // Resume to the first incomplete step once per fresh data load.
  useEffect(() => {
    if (data) setIndex(firstIncompleteIndex(STEPS, data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.profile.id]);

  // Leave onboarding once complete — but let the celebration own the exit.
  useEffect(() => {
    if (data?.profile.onboarding_complete && !celebrating) router.replace('/discover');
  }, [data?.profile.onboarding_complete, celebrating, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#000000" />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-12">
        <Text className="prose-subtitle text-center">Couldn't load your profile. Pull to retry or restart the app.</Text>
      </View>
    );
  }

  const StepComponent = STEP_COMPONENTS[step.id];

  return (
    <View className="flex-1">
      <OnboardingBackground tone={toneFor(step.id)} />
      <Animated.View className="flex-1" style={contentStyle}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View className="px-6 pt-4">
            <OnboardingProgress current={index + 1} total={STEPS.length} />
          </View>
          <View className="flex-1">
            <StepTransition transitionKey={step.id} direction={direction}>
              <StepComponent />
            </StepTransition>
          </View>
        </SafeAreaView>
      </Animated.View>
      {celebrating ? <CompletionCelebration onComplete={handleCelebrationDone} /> : null}
    </View>
  );
}
