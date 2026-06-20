import { Pressable, Text, View } from 'react-native';

import { OtpInput } from '@/features/auth/components/otp-input';

interface VerifyStepProps {
  email: string;
  code: string;
  otpError: string | null;
  onChangeCode: (value: string) => void;
  onComplete: () => void;
  onResend: () => void;
}

/**
 * OTP entry — shared (presentational) by the sign-up and sign-in flows. Identical
 * copy for both; the orchestrator wires its own store/hook through the props.
 */
export function VerifyStep({
  email,
  code,
  otpError,
  onChangeCode,
  onComplete,
  onResend,
}: VerifyStepProps) {
  return (
    <>
      <Text className="prose-title text-ink">Check your{'\n'}inbox.</Text>
      <Text className="prose-subtitle mb-3">
        Enter the 6-digit code we sent to{' '}
        <Text className="prose-body font-bold text-ink">{email}</Text>.
      </Text>
      <View className="mt-1 gap-3">
        <OtpInput value={code} onChange={onChangeCode} onComplete={() => onComplete()} />
        {otpError ? (
          <Text className="prose-footnote text-pass">{otpError}</Text>
        ) : null}
        <Pressable onPress={onResend} hitSlop={8} className="self-start py-1">
          <Text className="prose-footnote font-semibold text-graphite underline">
            Resend code
          </Text>
        </Pressable>
      </View>
    </>
  );
}
