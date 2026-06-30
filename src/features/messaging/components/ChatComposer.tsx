import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface ChatComposerProps {
  onSend: (text: string) => void;
  /** Called as the user types, so the screen can broadcast a (throttled) typing ping. */
  onTyping: () => void;
}

export function ChatComposer({ onSend, onTyping }: ChatComposerProps) {
  const [text, setText] = useState('');
  const trimmed = text.trim();

  const submit = () => {
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-2">
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          onTyping();
        }}
        placeholder="Message…"
        placeholderTextColor={Brand.fog}
        multiline
        className="flex-1 rounded-2xl border border-silver bg-surface px-4 font-primary text-ink"
        style={{ fontSize: 16, minHeight: 44, maxHeight: 120, paddingTop: 11, paddingBottom: 11 }}
      />
      <PressScale
        accessibilityRole="button"
        accessibilityLabel="Send"
        disabled={!trimmed}
        onPress={submit}
        className={`h-11 w-11 items-center justify-center rounded-full bg-ink ${trimmed ? '' : 'button-disabled'}`}>
        <Send size={18} color={Brand.canvas} strokeWidth={2} />
      </PressScale>
    </View>
  );
}
