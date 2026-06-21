import { Text, View } from 'react-native';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { STEPS } from '@/features/onboarding/config/steps';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
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

export function ReviewStep() {
  const { data, setIndex } = useOnboarding();
  const { complete } = useProfileMutations();
  const p = data?.profile;

  const jumpTo = (id: string) => setIndex(STEPS.findIndex((s) => s.id === id));

  const completion = onboardingCompletionSchema.safeParse({
    first_name: p?.first_name ?? '',
    graduation_year: p?.graduation_year ?? 0,
    majors: p?.majors ?? [],
    sleep_schedule: p?.sleep_schedule ?? '',
    bedtime: p?.bedtime ?? '',
    wakeup_time: p?.wakeup_time ?? '',
    cleanliness: p?.cleanliness ?? 0,
    noise_preference: p?.noise_preference ?? '',
    study_style: p?.study_style ?? '',
    guests_frequency: p?.guests_frequency ?? '',
    social_level: p?.social_level ?? 0,
    room_temperature: p?.room_temperature ?? '',
    interests: p?.interests ?? [],
    promptCount: data?.prompts.length ?? 0,
    photoCount: data?.photos.length ?? 0,
  });

  const onFinish = async () => {
    if (!completion.success) return;
    await complete.mutateAsync();
    // The (app) gate flips once the query invalidates; replace to the landing.
    // router lives on the hook return.
  };

  return (
    <StepShell canAdvance={completion.success} onNext={onFinish} saving={complete.isPending} nextLabel="Finish">
      <Row label="Name" value={p?.first_name ?? ''} onEdit={() => jumpTo('basics')} />
      <Row label="Graduation year" value={p?.graduation_year ? String(p.graduation_year) : ''} onEdit={() => jumpTo('basics')} />
      <Row label="Majors" value={(p?.majors ?? []).join(', ')} onEdit={() => jumpTo('basics')} />
      <Row label="Interests" value={`${p?.interests?.length ?? 0} selected`} onEdit={() => jumpTo('interests')} />
      <Row label="Prompts" value={`${data?.prompts.length ?? 0} answered`} onEdit={() => jumpTo('prompts')} />
      <Row label="Photos" value={`${data?.photos.length ?? 0} uploaded`} onEdit={() => jumpTo('photos')} />
      {!completion.success ? (
        <Text className="prose-footnote text-pass">Complete the required steps above before finishing.</Text>
      ) : null}
    </StepShell>
  );
}
