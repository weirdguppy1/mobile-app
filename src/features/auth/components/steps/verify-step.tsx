import { Pressable, Text, View } from 'react-native';

import { OtpInput } from '@/features/auth/components/otp-input';
import { useSignUp } from '@/features/auth/hooks/use-sign-up';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';

export function VerifyStep() {
  const email = useSignUpStore((s) => s.email);
  const code = useSignUpStore((s) => s.code);
  const otpError = useSignUpStore((s) => s.otpError);
  const setCode = useSignUpStore((s) => s.setCode);
  const { verify, resend } = useSignUp();

  return (
    <>
      <Text className="prose-title text-ink">Check your{'\n'}inbox.</Text>
      <Text className="prose-subtitle mb-3">
        Enter the 6-digit code we sent to{' '}
        <Text className="prose-body font-bold text-ink">{email}</Text>.
      </Text>
      <View className="mt-1 gap-3">
        <OtpInput value={code} onChange={setCode} onComplete={() => verify()} />
        {otpError ? (
          <Text className="prose-footnote text-pass">{otpError}</Text>
        ) : null}
        <Pressable onPress={resend} hitSlop={8} className="self-start py-1">
          <Text className="prose-footnote font-semibold text-graphite underline">
            Resend code
          </Text>
        </Pressable>
      </View>
    </>
  );
}
