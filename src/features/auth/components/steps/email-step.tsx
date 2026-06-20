import { Text, View } from 'react-native';

import { TextField } from '@/shared/components';

interface EmailStepProps {
  /** Heading — use \n for the line break. */
  title: string;
  subtitle: string;
  email: string;
  emailError: string | null;
  onChangeEmail: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Email entry — shared (presentational) by the sign-up and sign-in flows. Copy
 * and handlers come from the orchestrator so each flow drives its own store/hook.
 */
export function EmailStep({
  title,
  subtitle,
  email,
  emailError,
  onChangeEmail,
  onSubmit,
}: EmailStepProps) {
  return (
    <>
      <Text className="prose-title text-ink">{title}</Text>
      <Text className="prose-subtitle mb-3">{subtitle}</Text>
      <View className="mt-1 gap-3">
        <TextField
          label="Email"
          value={email}
          onChangeText={onChangeEmail}
          placeholder="email@college.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          invalid={!!emailError}
          message={emailError ?? undefined}
          onSubmitEditing={onSubmit}
          returnKeyType="next"
        />
      </View>
    </>
  );
}
