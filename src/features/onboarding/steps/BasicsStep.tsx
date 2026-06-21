import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import {
  GRADUATION_YEARS, SEX_ASSIGNED_AT_BIRTH, SEXUAL_ORIENTATION,
} from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { basicsSchema, type BasicsValues } from '@/features/profile/schema';
import { Field, OptionGroup, TagInput, TextField } from '@/shared/components';

const yearOptions = GRADUATION_YEARS.map((y) => ({ value: String(y), label: String(y) }));

export function BasicsStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const p = data?.profile;

  const { control, handleSubmit, formState } = useForm<BasicsValues>({
    resolver: zodResolver(basicsSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: p?.first_name ?? '',
      pronouns: p?.pronouns ?? '',
      graduation_year: p?.graduation_year ?? undefined,
      majors: p?.majors ?? [],
      gender_identity: p?.gender_identity ?? '',
      sex_assigned_at_birth: p?.sex_assigned_at_birth ?? undefined,
      sexual_orientation: p?.sexual_orientation ?? undefined,
    },
  });

  const onNext = handleSubmit(async (values) => {
    await saveProfile.mutateAsync({
      first_name: values.first_name.trim(),
      pronouns: values.pronouns?.trim() || null,
      graduation_year: values.graduation_year,
      majors: values.majors,
      gender_identity: values.gender_identity?.trim() || null,
      sex_assigned_at_birth: values.sex_assigned_at_birth ?? null,
      sexual_orientation: values.sexual_orientation,
    });
    goNext();
  });

  return (
    <StepShell canAdvance={formState.isValid} onNext={onNext} saving={saveProfile.isPending}>
      <View className="card border-continuous gap-1 px-4 py-3">
        <Text className="prose-label">School</Text>
        <Text className="prose-body text-ink">{p?.university ?? p?.school_domain ?? '—'}</Text>
        <Text className="prose-caption text-ash">From your .edu email — can't be changed.</Text>
      </View>

      <Controller control={control} name="first_name" render={({ field, fieldState }) => (
        <TextField label="First name" value={field.value} onChangeText={field.onChange} invalid={!!fieldState.error} message={fieldState.error?.message} placeholder="Preferred name" />
      )} />

      <Controller control={control} name="pronouns" render={({ field }) => (
        <TextField label="Pronouns (optional)" value={field.value ?? ''} onChangeText={field.onChange} placeholder="she/her, he/him, they/them, etc." />
      )} />

      <Controller control={control} name="graduation_year" render={({ field, fieldState }) => (
        <Field label="Graduation year" error={fieldState.error?.message}>
          <OptionGroup options={yearOptions} value={field.value ? String(field.value) : null} onChange={(v) => field.onChange(Number(v))} />
        </Field>
      )} />

      <Controller control={control} name="majors" render={({ field, fieldState }) => (
        <Field label="Major(s)" error={fieldState.error?.message}>
          <TagInput value={field.value ?? []} onChange={field.onChange} max={3} placeholder="Add a major and press done" />
        </Field>
      )} />

      <Controller control={control} name="gender_identity" render={({ field }) => (
        <TextField label="Gender identity" value={field.value ?? ''} onChangeText={field.onChange} placeholder="Woman, Man, Non-binary…" />
      )} />

      <Controller control={control} name="sex_assigned_at_birth" render={({ field }) => (
        <Field label="Sex assigned at birth">
          <OptionGroup options={SEX_ASSIGNED_AT_BIRTH} value={field.value ?? null} onChange={field.onChange} />
        </Field>
      )} />

      <Controller control={control} name="sexual_orientation" render={({ field, fieldState }) => (
        <Field label="Sexual orientation" error={fieldState.error?.message}>
          <OptionGroup options={SEXUAL_ORIENTATION} value={field.value ?? null} onChange={field.onChange} />
        </Field>
      )} />
    </StepShell>
  );
}
