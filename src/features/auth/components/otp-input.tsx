import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired when all `length` digits are entered. */
  onComplete?: (value: string) => void;
  length?: number;
}

/** Six-box one-time-code field backed by a single hidden numeric input. */
export function OtpInput({ value, onChange, onComplete, length = 6 }: OtpInputProps) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <Pressable className="flex-row gap-2.5" onPress={() => ref.current?.focus()}>
      {Array.from({ length }, (_, i) => {
        const char = value[i] ?? '';
        const active = focused && i === value.length;
        return (
          <View
            key={i}
            className={`aspect-[0.82] max-w-14 flex-1 items-center justify-center rounded-xl border-[1.5px] border-continuous bg-canvas ${
              active || char ? 'border-ink' : 'border-silver'
            }`}>
            <Text className="font-display text-2xl text-ink">{char}</Text>
          </View>
        );
      })}

      <TextInput
        ref={ref}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        className="absolute h-px w-px opacity-0"
      />
    </Pressable>
  );
}
