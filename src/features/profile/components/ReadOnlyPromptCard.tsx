import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ProfilePrompt } from '@/features/profile/types';

/** A prompt + answer rendered as a read-only card. Shared by ProfileView (interleaved
 *  feed) and the user profile page. `overlay` pins content bottom-right (Discovery likes). */
export function ReadOnlyPromptCard({ prompt, overlay }: { prompt: ProfilePrompt; overlay?: ReactNode }) {
  return (
    <View className="card border-continuous shadow-card gap-2 px-5 py-5">
      <Text className="prose-footnote text-slate">{prompt.prompt}</Text>
      <Text className="font-display text-3xl tracking-tight text-ink">{prompt.answer}</Text>
      {overlay ? <View className="absolute bottom-2 right-2">{overlay}</View> : null}
    </View>
  );
}
