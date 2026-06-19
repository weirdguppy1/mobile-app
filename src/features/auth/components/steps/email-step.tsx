import { Text, View } from 'react-native';

import { useSignUp } from '@/features/auth/hooks/use-sign-up';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';
import { TextField } from '@/shared/components';

export function EmailStep() {
  const email = useSignUpStore((s) => s.email);
  const emailError = useSignUpStore((s) => s.emailError);
  const setEmail = useSignUpStore((s) => s.setEmail);
  const setEmailError = useSignUpStore((s) => s.setEmailError);
  const { continueFromEmail } = useSignUp();

  return (
    <>
      <Text className="prose-title text-ink">What&apos;s your{'\n'}email?</Text>
      <Text className="prose-subtitle mb-3">
        {__DEV__
          ? 'Dev build: any email works.'
          : 'Use your .edu address so we can verify you’re a student.'}
      </Text>
      <View className="mt-1 gap-3">
        <TextField
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError(null);
          }}
          placeholder="email@college.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          invalid={!!emailError}
          message={emailError ?? undefined}
          onSubmitEditing={continueFromEmail}
          returnKeyType="next"
        />
      </View>
    </>
  );
}
