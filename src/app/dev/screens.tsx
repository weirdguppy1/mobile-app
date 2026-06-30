import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CampusStep } from '@/features/auth/components/steps/campus-step';
import { EmailStep } from '@/features/auth/components/steps/email-step';
import { ReviewStep } from '@/features/auth/components/steps/review-step';
import { VerifyStep } from '@/features/auth/components/steps/verify-step';
import { useSignUpStore } from '@/features/auth/store/sign-up-store';

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="prose-caption font-semibold text-ash">{title}</Text>
      <View className="card border-continuous gap-3 p-4">{children}</View>
    </View>
  );
}

export default function ScreensPreview() {
  // Seed sample data so review/verify look populated.
  useEffect(() => {
    const s = useSignUpStore.getState();
    s.setCampus({ name: 'Stanford University', domain: 'stanford.edu' });
    s.setEmail('student@stanford.edu');
  }, []);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <ScrollView className="flex-1" contentContainerClassName="gap-8 px-6 py-6">
          <View className="gap-3">
            <Link href="/" className="prose-body font-semibold text-ink underline">
              → Welcome (live)
            </Link>
            <Link
              href="/(auth)/sign-up"
              className="prose-body font-semibold text-ink underline">
              → Sign-up (live)
            </Link>
            <Link
              href="/(auth)/sign-in"
              className="prose-body font-semibold text-ink underline">
              → Sign-in (live)
            </Link>
            <Link href="/onboarding" className="prose-body font-semibold text-ink underline">
              → Onboarding (live)
            </Link>
            <Link href="/discover" className="prose-body font-semibold text-ink underline">
              → Discover (live)
            </Link>
            <Link href="/messages" className="prose-body font-semibold text-ink underline">
              → Messages (live)
            </Link>
            <Link href="/profile" className="prose-body font-semibold text-ink underline">
              → Profile (live)
            </Link>
          </View>

          <Frame title="Step: campus"><CampusStep /></Frame>
          <Frame title="Step: email">
            <EmailStep
              title={"What's your\nemail?"}
              subtitle="Use your .edu address so we can verify you're a student."
              email="student@stanford.edu"
              emailError={null}
              onChangeEmail={() => {}}
              onSubmit={() => {}}
            />
          </Frame>
          <Frame title="Step: review"><ReviewStep /></Frame>
          <Frame title="Step: verify">
            <VerifyStep
              email="student@stanford.edu"
              code=""
              otpError={null}
              onChangeCode={() => {}}
              onComplete={() => {}}
              onResend={() => {}}
            />
          </Frame>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
