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
    s.setUniversity('Stanford University');
    s.setEmail('student@stanford.edu');
  }, []);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <ScrollView contentContainerClassName="gap-8 px-6 py-6">
          <View className="gap-3">
            <Link href="/" className="prose-body font-semibold text-ink underline">
              → Welcome (live)
            </Link>
            <Link
              href="/(auth)/sign-up"
              className="prose-body font-semibold text-ink underline">
              → Sign-up (live)
            </Link>
          </View>

          <Frame title="Step: campus"><CampusStep /></Frame>
          <Frame title="Step: email"><EmailStep /></Frame>
          <Frame title="Step: review"><ReviewStep /></Frame>
          <Frame title="Step: verify"><VerifyStep /></Frame>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
