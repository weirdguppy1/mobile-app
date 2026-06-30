import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ProfilePrompt } from '@/features/profile/types';
import { GlassCard } from '@/shared/components';

/** A prompt + answer as a read-only glass card. Shared by ProfileView (feed) and
 *  the user profile page. Answer is Satoshi (display font is titles-only). */
export function ReadOnlyPromptCard({ prompt, overlay }: { prompt: ProfilePrompt; overlay?: ReactNode }) {
  return (
    <GlassCard className="gap-2 px-5 py-5">
      <Text className="prose-footnote text-slate">{prompt.prompt}</Text>
      <Text className="font-primary text-2xl font-bold tracking-tight text-ink" style={{ paddingRight: 44 }}>
        {prompt.answer}
      </Text>
      {overlay ? <View className="absolute bottom-2 right-2">{overlay}</View> : null}
    </GlassCard>
  );
}
