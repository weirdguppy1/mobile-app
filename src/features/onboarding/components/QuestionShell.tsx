// src/features/onboarding/components/QuestionShell.tsx
import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ContinueOverlay, useContinueOverlayHeight } from '@/features/onboarding/components/ContinueOverlay';
import { Button, FadeIn, FocusScale } from '@/shared/components';

interface QuestionShellProps {
  title: string;
  subtitle?: string;
  optional?: boolean;
  /** Optional decorative element rendered above the hero title (e.g. a circled icon). */
  icon?: ReactNode;
  canGoBack: boolean;
  onBack: () => void;
  canAdvance: boolean;
  onNext: () => void;
  saving?: boolean;
  nextLabel?: string;
  children: ReactNode;   // the single control
}

/** Immersive chrome for one question: hero title slightly above center, the control
 *  filling the space below, a blurred floating Continue. No spotlight — one input per
 *  screen is already the focus (TASK4 §1, §4, §5, §8). */
export function QuestionShell({
  title, subtitle, optional, icon, canGoBack, onBack, canAdvance, onNext, saving, nextLabel, children,
}: QuestionShellProps) {
  const overlayHeight = useContinueOverlayHeight();

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: overlayHeight + 16 }}
        contentContainerClassName="px-6 pt-6"
        keyboardShouldPersistTaps="handled">
        {canGoBack ? (
          <Button variant="ghost" onPress={onBack} className="-ml-2 mb-2 self-start">Back</Button>
        ) : null}

        <View className="gap-2 pt-6">
          {icon ? <View className="mb-1">{icon}</View> : null}
          {optional ? <Text className="prose-caption text-ash">Optional</Text> : null}
          <Text className="prose-display text-ink">{title}</Text>
          {subtitle ? (
            <FadeIn delay={140}><Text className="prose-subtitle">{subtitle}</Text></FadeIn>
          ) : null}
        </View>

        <FocusScale className="pt-8">
          {children}
        </FocusScale>
      </ScrollView>

      <ContinueOverlay canAdvance={canAdvance} onNext={onNext} saving={saving} label={nextLabel} />
    </View>
  );
}
