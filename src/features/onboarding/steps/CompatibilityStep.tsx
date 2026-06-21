import { useState } from 'react';
import { View } from 'react-native';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import {
  BEDTIME, GUESTS_FREQUENCY, NOISE_PREFERENCE, ROOM_TEMPERATURE, SLEEP_SCHEDULE,
  STUDY_STYLE, WAKEUP_TIME,
} from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { compatibilitySchema } from '@/features/profile/schema';
import { Field, OptionGroup, ScaleInput } from '@/shared/components';

export function CompatibilityStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const p = data?.profile;

  const [form, setForm] = useState({
    sleep_schedule: p?.sleep_schedule ?? null,
    bedtime: p?.bedtime ?? null,
    wakeup_time: p?.wakeup_time ?? null,
    cleanliness: p?.cleanliness ?? null,
    noise_preference: p?.noise_preference ?? null,
    study_style: p?.study_style ?? null,
    guests_frequency: p?.guests_frequency ?? null,
    social_level: p?.social_level ?? null,
    room_temperature: p?.room_temperature ?? null,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const result = compatibilitySchema.safeParse(form);

  const onNext = async () => {
    if (!result.success) return;
    await saveProfile.mutateAsync(result.data);
    goNext();
  };

  return (
    <StepShell canAdvance={result.success} onNext={onNext} saving={saveProfile.isPending}>
      <Field label="Sleep schedule"><OptionGroup options={SLEEP_SCHEDULE} value={form.sleep_schedule} onChange={(v) => set('sleep_schedule', v)} /></Field>
      <Field label="Bedtime"><OptionGroup options={BEDTIME} value={form.bedtime} onChange={(v) => set('bedtime', v)} /></Field>
      <Field label="Wake-up time"><OptionGroup options={WAKEUP_TIME} value={form.wakeup_time} onChange={(v) => set('wakeup_time', v)} /></Field>
      <Field label="Cleanliness"><ScaleInput value={form.cleanliness} onChange={(v) => set('cleanliness', v)} lowLabel="Relaxed" highLabel="Spotless" /></Field>
      <Field label="Noise preference"><OptionGroup options={NOISE_PREFERENCE} value={form.noise_preference} onChange={(v) => set('noise_preference', v)} /></Field>
      <Field label="Study style"><OptionGroup options={STUDY_STYLE} value={form.study_style} onChange={(v) => set('study_style', v)} /></Field>
      <Field label="Guests"><OptionGroup options={GUESTS_FREQUENCY} value={form.guests_frequency} onChange={(v) => set('guests_frequency', v)} /></Field>
      <Field label="Social level"><ScaleInput value={form.social_level} onChange={(v) => set('social_level', v)} lowLabel="Homebody" highLabel="Always out" /></Field>
      <Field label="Room temperature"><OptionGroup options={ROOM_TEMPERATURE} value={form.room_temperature} onChange={(v) => set('room_temperature', v)} /></Field>
    </StepShell>
  );
}
