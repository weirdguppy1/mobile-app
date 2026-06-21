import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { CLUBS_MAX } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { extrasSchema, type ExtrasValues } from '@/features/profile/schema';
import { Field, TagInput, TextField } from '@/shared/components';

export function ExtrasStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile, savePrivateContact } = useProfileMutations();
  const p = data?.profile;

  const { control, handleSubmit } = useForm<ExtrasValues>({
    resolver: zodResolver(extrasSchema),
    defaultValues: {
      dorm_preference: p?.dorm_preference ?? '',
      living_program: p?.living_program ?? '',
      clubs: p?.clubs ?? [],
      instagram: p?.instagram ?? '',
      linkedin: p?.linkedin ?? '',
      phone: '',
    },
  });

  const onNext = handleSubmit(async (values) => {
    await saveProfile.mutateAsync({
      dorm_preference: values.dorm_preference?.trim() || null,
      living_program: values.living_program?.trim() || null,
      clubs: values.clubs ?? [],
      instagram: values.instagram?.trim() || null,
      linkedin: values.linkedin?.trim() || null,
    });
    if (values.phone?.trim()) await savePrivateContact.mutateAsync(values.phone.trim());
    goNext();
  });

  return (
    <StepShell canAdvance onNext={onNext} saving={saveProfile.isPending}>
      <Controller control={control} name="dorm_preference" render={({ field }) => (
        <TextField label="Dorm preference" value={field.value ?? ''} onChangeText={field.onChange} placeholder="e.g. North campus" />
      )} />
      <Controller control={control} name="living_program" render={({ field }) => (
        <TextField label="Living program" value={field.value ?? ''} onChangeText={field.onChange} placeholder="e.g. Honors / LLC" />
      )} />
      <Controller control={control} name="clubs" render={({ field }) => (
        <Field label="Clubs"><TagInput value={field.value ?? []} onChange={field.onChange} max={CLUBS_MAX} placeholder="Add a club" /></Field>
      )} />
      <Controller control={control} name="instagram" render={({ field }) => (
        <TextField label="Instagram" value={field.value ?? ''} onChangeText={field.onChange} autoCapitalize="none" placeholder="@handle" />
      )} />
      <Controller control={control} name="linkedin" render={({ field }) => (
        <TextField label="LinkedIn" value={field.value ?? ''} onChangeText={field.onChange} autoCapitalize="none" placeholder="profile url" />
      )} />
      <Controller control={control} name="phone" render={({ field }) => (
        <View className="gap-1.5">
          <TextField label="Phone number" value={field.value ?? ''} onChangeText={field.onChange} keyboardType="phone-pad" placeholder="(555) 555-5555" />
          <Text className="prose-caption text-ash">🔒 Private — only shared after you match with someone.</Text>
        </View>
      )} />
    </StepShell>
  );
}
