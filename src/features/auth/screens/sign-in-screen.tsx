import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand } from "@/constants/theme";
import { LoadingOverlay } from "@/features/auth/components/loading-overlay";
import { EmailStep } from "@/features/auth/components/steps/email-step";
import { VerifyStep } from "@/features/auth/components/steps/verify-step";
import { useSignIn } from "@/features/auth/hooks/use-sign-in";
import { useSignInStore } from "@/features/auth/store/sign-in-store";
import { FadeIn, PressScale } from "@/shared/components";

/**
 * Sign-in for existing users: email -> code, no campus. A thin orchestrator over
 * useSignInStore + useSignIn, reusing the shared EmailStep/VerifyStep — same
 * tools and structure as SignUpScreen. On a successful verify the auth listener
 * swaps the root layout to the app, so this screen unmounts on its own.
 */
export function SignInScreen() {
  const phase = useSignInStore((s) => s.phase);
  const email = useSignInStore((s) => s.email);
  const code = useSignInStore((s) => s.code);
  const emailError = useSignInStore((s) => s.emailError);
  const otpError = useSignInStore((s) => s.otpError);
  const submitError = useSignInStore((s) => s.submitError);
  const setEmail = useSignInStore((s) => s.setEmail);
  const setEmailError = useSignInStore((s) => s.setEmailError);
  const setCode = useSignInStore((s) => s.setCode);
  const reset = useSignInStore((s) => s.reset);

  const { goBack, sendCode, verify, resend } = useSignIn();

  // Fresh start each time the route mounts.
  useEffect(() => {
    reset();
  }, [reset]);

  const onVerify = phase === "verify" || phase === "verifying";

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View className="flex-1 px-6 pt-2 pb-4">
          <View className="h-10 flex-row items-center">
            <Pressable
              onPress={goBack}
              hitSlop={12}
              accessibilityRole="button"
              className="-ml-1.5 h-8 w-8 items-center justify-center"
            >
              <ArrowLeft className="icon" color={Brand.ink} />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <FadeIn
              key={onVerify ? "verify" : "email"}
              offset={14}
              className="flex-1 gap-3 pt-7"
            >
              {!onVerify ? (
                <EmailStep
                  title={"Welcome\nback."}
                  subtitle={"Enter your school email and we’ll send you a code."}
                  email={email}
                  emailError={emailError}
                  onChangeEmail={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError(null);
                  }}
                  onSubmit={sendCode}
                />
              ) : (
                <VerifyStep
                  email={email}
                  code={code}
                  otpError={otpError}
                  onChangeCode={setCode}
                  onComplete={verify}
                  onResend={resend}
                />
              )}
            </FadeIn>

            <View className="gap-3">
              {submitError ? (
                <Text className="prose-footnote text-pass">{submitError}</Text>
              ) : null}
              {!onVerify ? (
                <Cta
                  label="Send code"
                  disabled={email.trim().length === 0}
                  onPress={sendCode}
                />
              ) : (
                <Cta
                  label="Verify & sign in"
                  disabled={code.length < 6}
                  onPress={verify}
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      {(phase === "sending" || phase === "verifying") && (
        <LoadingOverlay
          message={phase === "sending" ? "Sending your code…" : "Signing you in…"}
        />
      )}
    </View>
  );
}

function Cta({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <PressScale
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`button-primary ${disabled ? "opacity-[0.35]" : ""}`}
    >
      <Text className="prose-button text-canvas">{label}</Text>
    </PressScale>
  );
}
