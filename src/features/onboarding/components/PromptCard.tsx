import { X } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { PressScale, TextField } from '@/shared/components';

interface PromptCardProps {
  prompt: string;
  answer: string;
  onChangeAnswer: (text: string) => void;
  onRemove: () => void;
}

/** One chosen prompt: the prompt text, a multiline answer field, and a remove control.
 *  Reuses the shared `card` surface + `TextField`. */
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
      <TextField value={answer} onChangeText={onChangeAnswer} placeholder="Your answer" multiline />
    </View>
  );
}
