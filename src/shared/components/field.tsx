import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface FieldProps {
  label?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}

/** Generic labeled wrapper for any control: label row, body, error message. */
export function Field({ label, optional, error, children }: FieldProps) {
  return (
    <View className="gap-2">
      {label ? (
        <View className="flex-row items-center gap-2">
          <Text className="prose-label">{label}</Text>
          {optional ? <Text className="prose-caption text-ash">Optional</Text> : null}
        </View>
      ) : null}
      {children}
      {error ? <Text className="prose-footnote text-pass">{error}</Text> : null}
    </View>
  );
}
