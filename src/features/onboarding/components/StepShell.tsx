import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/features/auth/components/progress-bar';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { Button } from '@/shared/components';

interface StepShellProps {
  children: ReactNode;
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  nextLabel?: string;
}

/** Shared chrome for every wizard step: progress, title, body, footer nav. */
export function StepShell({ children, canAdvance, onNext, saving, nextLabel = 'Next' }: StepShellProps) {
  const { index, step, total, goBack, skip, canGoBack } = useOnboarding();

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View className="gap-4 px-6 pt-4">
          <ProgressBar current={index + 1} total={total} />
          <View className="gap-1.5">
            <Text className="prose-title text-ink">{step.title}</Text>
            <Text className="prose-subtitle">{step.subtitle}</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-6 py-6" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>

        <View className="gap-2 px-6 pb-2">
          <Button variant="primary" onPress={onNext} disabled={!canAdvance} loading={saving}>
            {nextLabel}
          </Button>
          <View className="flex-row justify-between">
            {canGoBack ? (
              <Button variant="ghost" onPress={goBack}>Back</Button>
            ) : <View />}
            {step.skippable ? (
              <Button variant="ghost" onPress={skip}>Skip</Button>
            ) : <View />}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
