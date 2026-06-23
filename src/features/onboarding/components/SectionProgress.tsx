import { Text, View } from 'react-native';

import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';

interface SectionProgressProps {
  title: string;
  current: number;
  total: number;
}

/** Section title above a section-local segment bar (TASK4 §2). The bar resets per
 *  section because current/total are section-local; total onboarding length is never shown. */
export function SectionProgress({ title, current, total }: SectionProgressProps) {
  return (
    <View className="gap-2">
      <Text className="prose-label text-graphite">{title}</Text>
      <OnboardingProgress current={current} total={total} />
    </View>
  );
}
