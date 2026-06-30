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

import { LoadingOverlay } from "@/features/auth/components/loading-overlay";
import { ProgressBar } from "@/features/auth/components/progress-bar";
import { CampusStep } from "@/features/auth/components/steps/campus-step";
import { EmailStep } from "@/features/auth/components/steps/email-step";
import { ReviewStep } from "@/features/auth/components/steps/review-step";
import { VerifyStep } from "@/features/auth/components/steps/verify-step";
import { useSignUp } from "@/features/auth/hooks/use-sign-up";
import { useSignUpStore } from "@/features/auth/store/sign-up-store";
import { FadeIn, PressScale } from "@/shared/components";

const TOTAL_STEPS = 3;
const STEP_INDEX = { campus: 1, email: 2, review: 3 } as const;

export function SignUpScreen() {
  const step = useSignUpStore((s) => s.step);
  const phase = useSignUpStore((s) => s.phase);
  const university = useSignUpStore((s) => s.university);
  const email = useSignUpStore((s) => s.email);
  const code = useSignUpStore((s) => s.code);
  const emailError = useSignUpStore((s) => s.emailError);
  const otpError = useSignUpStore((s) => s.otpError);
  const submitError = useSignUpStore((s) => s.submitError);
  const setEmail = useSignUpStore((s) => s.setEmail);
  const setEmailError = useSignUpStore((s) => s.setEmailError);
  const setCode = useSignUpStore((s) => s.setCode);
  const reset = useSignUpStore((s) => s.reset);

  const {
    goBack,
    continueFromCampus,
    continueFromEmail,
    createAccount,
    verify,
    resend,
  } = useSignUp();

  // Fresh start each time the route mounts.
  useEffect(() => {
    reset();
  }, [reset]);

  const onVerify = phase === "verify" || phase === "verifying";
  const progressStep = onVerify ? TOTAL_STEPS : STEP_INDEX[step];

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View className="flex-1 px-6 pt-2 pb-4">
          <View className="h-10 flex-row items-center gap-3">
            <Pressable
              onPress={goBack}
              hitSlop={12}
              accessibilityRole="button"
              className="-ml-1.5 h-8 w-8 items-center justify-center"
            >
              <ArrowLeft className="icon" />
            </Pressable>
            <View className="flex-1">
              <ProgressBar current={progressStep} total={TOTAL_STEPS} />
            </View>
          </View>

          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <FadeIn
              key={onVerify ? "verify" : `step-${step}`}
              offset={14}
              className="flex-1 gap-3 pt-7"
            >
              {!onVerify && step === "campus" && <CampusStep />}
              {!onVerify && step === "email" && (
                <EmailStep
                  title={"What's your\nemail?"}
                  subtitle={
                    "Use your .edu address so we can verify you’re a student."
                  }
                  email={email}
                  emailError={emailError}
                  onChangeEmail={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError(null);
                  }}
                  onSubmit={continueFromEmail}
                />
              )}
              {!onVerify && step === "review" && <ReviewStep />}
              {onVerify && (
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
              {!onVerify && step === "campus" && (
                <Cta
                  label="Continue"
                  disabled={!university}
                  onPress={continueFromCampus}
                />
              )}
              {!onVerify && step === "email" && (
                <Cta
                  label="Continue"
                  disabled={email.trim().length === 0}
                  onPress={continueFromEmail}
                />
              )}
              {!onVerify && step === "review" && (
                <Cta label="Create account" onPress={createAccount} />
              )}
              {onVerify && (
                <Cta
                  label="Verify & continue"
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
          message={
            phase === "sending" ? "Creating your account…" : "Verifying…"
          }
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
