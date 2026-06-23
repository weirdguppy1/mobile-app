// src/features/onboarding/questions/ReviewQuestion.tsx
import { Text, View } from 'react-native';

import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding-store';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { onboardingCompletionSchema } from '@/features/profile/schema';
import { Button } from '@/shared/components';

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <View className="flex-1 gap-0.5">
        <Text className="prose-label">{label}</Text>
        <Text className="prose-body text-ink">{value || '—'}</Text>
      </View>
      <Button variant="ghost" onPress={onEdit}>Edit</Button>
    </View>
  );
}

export function ReviewQuestion() {
  const { data, question, goToQuestion, goBack, canGoBack } = useQuestionFlow();
  const { complete } = useProfileMutations();
  const setCelebrating = useOnboardingStore((s) => s.setCelebrating);
  const p = data?.profile;

  const completion = onboardingCompletionSchema.safeParse({
    first_name: p?.first_name ?? '', graduation_year: p?.graduation_year ?? 0, majors: p?.majors ?? [],
    sleep_schedule: p?.sleep_schedule ?? '', bedtime: p?.bedtime ?? '', wakeup_time: p?.wakeup_time ?? '',
    cleanliness: p?.cleanliness ?? 0, noise_preference: p?.noise_preference ?? '', study_style: p?.study_style ?? '',
    guests_frequency: p?.guests_frequency ?? '', romantic_guests_frequency: p?.romantic_guests_frequency ?? '',
    social_level: p?.social_level ?? 0, room_temperature: p?.room_temperature ?? '',
    interests: p?.interests ?? [], about_me: p?.about_me ?? '',
    promptCount: data?.prompts.length ?? 0, photoCount: data?.photos.length ?? 0,
  });

  const onFinish = async () => {
    if (!completion.success) return;
    // celebrating must flip BEFORE the mutation invalidates the profile query, or the
    // (app) layout gate unmounts this screen + the confetti. Route owns the redirect.
    setCelebrating(true);
    try {
      await complete.mutateAsync();
    } catch (error) {
      setCelebrating(false);
      throw error;
    }
  };

  if (!question) return null;
  return (
    <QuestionShell
      title={question.title}
      canGoBack={canGoBack}
      onBack={goBack}
      canAdvance={completion.success}
      onNext={onFinish}
      saving={complete.isPending}
      nextLabel="Finish">
      <View className="gap-1">
        <Row label="Name" value={p?.first_name ?? ''} onEdit={() => goToQuestion('first_name')} />
        <Row label="Graduation year" value={p?.graduation_year ? String(p.graduation_year) : ''} onEdit={() => goToQuestion('graduation_year')} />
        <Row label="Majors" value={(p?.majors ?? []).join(', ')} onEdit={() => goToQuestion('majors')} />
        <Row label="About" value={p?.about_me ?? ''} onEdit={() => goToQuestion('about_me')} />
        <Row label="Interests" value={`${p?.interests?.length ?? 0} selected`} onEdit={() => goToQuestion('interests')} />
        <Row label="Prompts" value={`${data?.prompts.length ?? 0} answered`} onEdit={() => goToQuestion('prompts')} />
        <Row label="Photos" value={`${data?.photos.length ?? 0} uploaded`} onEdit={() => goToQuestion('photos')} />
        {!completion.success ? (
          <Text className="prose-footnote text-pass">Complete the required steps above before finishing.</Text>
        ) : null}
      </View>
    </QuestionShell>
  );
}
