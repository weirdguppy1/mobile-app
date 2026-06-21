import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components/press-scale';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  placeholder?: string;
}

/** Free-text array entry: type + submit to add a removable chip, capped at `max`. */
export function TagInput({ value, onChange, max = 10, placeholder }: TagInputProps) {
  const [text, setText] = useState('');
  const atMax = value.length >= max;

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed || atMax || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setText('');
  };

  return (
    <View className="gap-2">
      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {value.map((tag) => (
            <PressScale
              key={tag}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${tag}`}
              onPress={() => onChange(value.filter((t) => t !== tag))}
              className="option-chip option-chip-selected flex-row items-center gap-1.5">
              <Text className="prose-footnote font-semibold text-canvas">{tag}</Text>
              <Text className="prose-footnote text-canvas">×</Text>
            </PressScale>
          ))}
        </View>
      ) : null}
      {!atMax ? (
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          blurOnSubmit={false}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={Brand.fog}
          className="field-input border-continuous border-silver focus:border-ink"
          style={{ paddingVertical: 0 }}
        />
      ) : null}
    </View>
  );
}
