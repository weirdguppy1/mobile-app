import { useState } from 'react';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { ALCOHOL, FITNESS, PARTIES, SMOKING } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { lifestyleSchema } from '@/features/profile/schema';
import { Field, OptionGroup } from '@/shared/components';

export function LifestyleStep() {
  const { data, goNext } = useOnboarding();
  const { saveProfile } = useProfileMutations();
  const p = data?.profile;

  const [form, setForm] = useState({
    alcohol: p?.alcohol ?? null,
    smoking: p?.smoking ?? null,
    parties: p?.parties ?? null,
    fitness: p?.fitness ?? null,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const result = lifestyleSchema.safeParse(form);

  const onNext = async () => {
    if (!result.success) return;
    await saveProfile.mutateAsync(result.data);
    goNext();
  };

  return (
    <StepShell canAdvance={result.success} onNext={onNext} saving={saveProfile.isPending}>
      <Field label="Alcohol"><OptionGroup options={ALCOHOL} value={form.alcohol} onChange={(v) => set('alcohol', v)} /></Field>
      <Field label="Smoking"><OptionGroup options={SMOKING} value={form.smoking} onChange={(v) => set('smoking', v)} /></Field>
      <Field label="Parties"><OptionGroup options={PARTIES} value={form.parties} onChange={(v) => set('parties', v)} /></Field>
      <Field label="Fitness"><OptionGroup options={FITNESS} value={form.fitness} onChange={(v) => set('fitness', v)} /></Field>
    </StepShell>
  );
}
