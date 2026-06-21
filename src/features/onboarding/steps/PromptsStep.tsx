import { useState } from 'react';
import { Text, View } from 'react-native';

import { StepShell } from '@/features/onboarding/components/StepShell';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { PROMPTS, PROMPTS_LIMITS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { promptsSchema } from '@/features/profile/schema';
import { Field, OptionGroup, TextField } from '@/shared/components';

const promptOptions = PROMPTS.map((p) => ({ value: p, label: p }));

export function PromptsStep() {
  const { data, goNext } = useOnboarding();
  const { savePrompts } = useProfileMutations();

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries((data?.prompts ?? []).map((p) => [p.prompt, p.answer])),
  );
  const selected = Object.keys(answers);

  const toggle = (next: string[]) => {
    if (next.length > PROMPTS_LIMITS.max) return;
    setAnswers((prev) => {
      const out: Record<string, string> = {};
      for (const key of next) out[key] = prev[key] ?? '';
      return out;
    });
  };

  const prompts = selected.map((prompt) => ({ prompt, answer: answers[prompt] ?? '' }));
  const result = promptsSchema.safeParse({ prompts });

  const onNext = async () => {
    if (!result.success) return;
    await savePrompts.mutateAsync(result.data.prompts);
    goNext();
  };

  return (
    <StepShell canAdvance={result.success} onNext={onNext} saving={savePrompts.isPending}>
      <Field label={`Choose 1–${PROMPTS_LIMITS.max}`}>
        <OptionGroup multiple options={promptOptions} value={selected} onChange={toggle} max={PROMPTS_LIMITS.max} columns={1} />
      </Field>
      {selected.length > 0 ? (
        <View className="gap-4">
          {selected.map((prompt) => (
            <View key={prompt} className="gap-1.5">
              <Text className="prose-footnote font-semibold text-ink">{prompt}</Text>
              <TextField
                value={answers[prompt] ?? ''}
                onChangeText={(t) => setAnswers((prev) => ({ ...prev, [prompt]: t }))}
                placeholder="Your answer"
                multiline
              />
            </View>
          ))}
        </View>
      ) : null}
    </StepShell>
  );
}
