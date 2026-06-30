import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';

import { CompletionCelebration } from '@/features/onboarding/components/CompletionCelebration';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { SectionInterstitial } from '@/features/onboarding/components/SectionInterstitial';
import { SectionProgress } from '@/features/onboarding/components/SectionProgress';
import { QUESTION_COMPONENTS } from '@/features/onboarding/config/question-components';
import { QUESTIONS } from '@/features/onboarding/config/questions';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { firstIncompleteQuestion } from '@/features/onboarding/lib/onboarding-progress';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { StepTransition } from '@/shared/components';

export default function OnboardingScreen() {
  const router = useRouter();
  const flow = useQuestionFlow();
  const { data, isLoading, isError, item, question, section, progress } = flow;
  const celebrating = useOnboardingStore((s) => s.celebrating);
  const setCelebrating = useOnboardingStore((s) => s.setCelebrating);
  const reduced = useReducedMotion();

  // Forward when the flow index grows.
  const prevIndex = useRef(flow.index);
  const direction: 'forward' | 'back' = flow.index >= prevIndex.current ? 'forward' : 'back';
  useEffect(() => { prevIndex.current = flow.index; }, [flow.index]);

  // Completion: the current screen lifts + fades FIRST; only once gone does the
  // celebration play on the cleared background, then we navigate.
  const exit = useSharedValue(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -exit.value * 40 }],
  }));

  useEffect(() => {
    if (!celebrating) return;
    if (reduced) { exit.value = 1; setShowCelebration(true); return; }
    exit.value = withTiming(1, { duration: 480, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setShowCelebration)(true);
    });
  }, [celebrating, exit, reduced]);

  const goToApp = () => {
    setShowCelebration(false);
    setCelebrating(false);
    router.replace('/discover');
  };

  // Resume to the first incomplete question once per fresh data load.
  useEffect(() => {
    if (!data) return;
    const resumeIdx = firstIncompleteQuestion(QUESTIONS, data);
    // Brand-new users (resumeIdx === 0) stay on the welcome interstitial at flow
    // index 0; only jump when resuming into a later question.
    if (resumeIdx > 0) flow.goToQuestion(QUESTIONS[resumeIdx].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.profile.id]);

  // Leave onboarding once complete — but let the celebration own the exit.
  useEffect(() => {
    if (data?.profile.onboarding_complete && !celebrating) router.replace('/discover');
  }, [data?.profile.onboarding_complete, celebrating, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <StatusBar style="light" />
        <ActivityIndicator color="#f4f4f5" />
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

  const isInterstitial = item.kind === 'interstitial';
  const tone = isInterstitial ? section.tone : 'neutral';
  const QuestionComponent = question ? QUESTION_COMPONENTS[question.id] : null;
  const schoolLabel = section.id === 'basics'
    ? `Signed in as ${data.profile.email ?? data.profile.school_domain ?? ''}`
    : undefined;

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <OnboardingBackground tone={tone} />
      <Animated.View className="flex-1" style={contentStyle}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          {!isInterstitial && progress ? (
            <View className="px-6 pt-4">
              <SectionProgress title={section.title} current={progress.current} total={progress.total} />
            </View>
          ) : null}
          <View className="flex-1">
            <StepTransition
              transitionKey={item.key}
              direction={direction}
              variant={isInterstitial ? 'section' : 'question'}>
              {isInterstitial ? (
                <SectionInterstitial
                  headline={section.interstitial.headline}
                  body={section.interstitial.body}
                  schoolLabel={schoolLabel}
                  onContinue={flow.goNext}
                />
              ) : QuestionComponent ? (
                <QuestionComponent />
              ) : null}
            </StepTransition>
          </View>
        </SafeAreaView>
      </Animated.View>
      {showCelebration ? <CompletionCelebration onComplete={goToApp} /> : null}
    </View>
  );
}
