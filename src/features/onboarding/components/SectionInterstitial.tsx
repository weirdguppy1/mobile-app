import { Text, View } from 'react-native';

import { Button, FadeIn } from '@/shared/components';

interface SectionInterstitialProps {
  headline: string;
  body: string;
  /** Welcome-only: "Signed in as you@school.edu". */
  schoolLabel?: string;
  onContinue: () => void;
}

/** Chapter-break screen announcing the next section (TASK4 §3). The mesh-gradient
 *  background + tone shift are owned by OnboardingBackground at the route level; this
 *  is the centered display-type announcement + Continue. */
export function SectionInterstitial({ headline, body, schoolLabel, onContinue }: SectionInterstitialProps) {
  return (
    <View className="flex-1 justify-center px-8">
      <View className="flex-1 justify-center gap-4">
        <Text className="prose-display text-ink">{headline}</Text>
        <FadeIn delay={160}><Text className="prose-subtitle">{body}</Text></FadeIn>
        {schoolLabel ? (
          <FadeIn delay={240}><Text className="prose-caption text-ash">{schoolLabel}</Text></FadeIn>
        ) : null}
      </View>
      <View className="pb-2">
        <Button variant="primary" onPress={onContinue}>Continue</Button>
      </View>
    </View>
  );
}
