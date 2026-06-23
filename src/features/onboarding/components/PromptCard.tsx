import { X } from 'lucide-react-native';
import { Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface PromptCardProps {
  prompt: string;
  answer: string;
  onChangeAnswer: (text: string) => void;
  onRemove: () => void;
}

/** One chosen prompt: the prompt text, a borderless multiline answer that blends
 *  seamlessly into the card, and a remove control. */
export function PromptCard({ prompt, answer, onChangeAnswer, onRemove }: PromptCardProps) {
  return (
    <View className="card border-continuous gap-2 px-4 py-4">
      <View className="flex-row items-start gap-3">
        <Text className="prose-footnote flex-1 font-semibold text-ink">{prompt}</Text>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Remove prompt"
          hitSlop={12}
          onPress={onRemove}>
          <X size={18} color={Brand.graphite} strokeWidth={2} />
        </PressScale>
      </View>
      <TextInput
        value={answer}
        onChangeText={onChangeAnswer}
        placeholder="Your answer..."
        placeholderTextColor={Brand.fog}
        multiline
        textAlignVertical="top"
        className="font-primary tracking-tight text-ink"
        style={{ fontSize: 16, padding: 0, minHeight: 44 }}
      />
    </View>
  );
}
