import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { AddPromptButton } from '@/features/onboarding/components/AddPromptButton';
import { PromptCard } from '@/features/onboarding/components/PromptCard';
import { PromptPickerSheet } from '@/features/onboarding/components/PromptPickerSheet';
import { EditScreenShell } from '@/features/profile/components/EditScreenShell';
import { PROMPT_CATEGORIES, PROMPTS_LIMITS } from '@/features/profile/constants';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { promptsSchema } from '@/features/profile/schema';
import { Button, FadeIn } from '@/shared/components';

type Draft = { prompt: string; answer: string };

/** Edit prompts: pick 1–3 and answer them. Saves the full set via replace_prompts. */
export default function EditPromptsScreen() {
  const { data } = useOnboardingData();
  const { savePrompts } = useProfileMutations();

  const [drafts, setDrafts] = useState<Draft[]>(() =>
    (data?.prompts ?? []).map((p) => ({ prompt: p.prompt, answer: p.answer })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const atMax = drafts.length >= PROMPTS_LIMITS.max;
  const selected = new Set(drafts.map((d) => d.prompt));
  const availableCategories = PROMPT_CATEGORIES.map((c) => ({
    label: c.label,
    prompts: c.prompts.filter((p) => !selected.has(p)),
  })).filter((c) => c.prompts.length > 0);

  const result = promptsSchema.safeParse({ prompts: drafts });

  const addPrompt = (prompt: string) => {
    if (drafts.length >= PROMPTS_LIMITS.max || selected.has(prompt)) return;
    setDrafts((d) => [...d, { prompt, answer: '' }]);
    setPickerOpen(false);
  };
  const setAnswer = (index: number, text: string) =>
    setDrafts((d) => d.map((x, i) => (i === index ? { ...x, answer: text } : x)));
  const removeAt = (index: number) => setDrafts((d) => d.filter((_, i) => i !== index));

  const onSave = async () => {
    if (!result.success) return;
    await savePrompts.mutateAsync(result.data.prompts);
    router.back();
  };

  return (
    <EditScreenShell
      title="Prompts"
      footer={<Button variant="primary" onPress={onSave} loading={savePrompts.isPending} disabled={!result.success}>Save</Button>}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-6 pt-2" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {drafts.map((d, i) => (
          <FadeIn key={`${d.prompt}-${i}`}>
            <PromptCard prompt={d.prompt} answer={d.answer} onChangeAnswer={(t) => setAnswer(i, t)} onRemove={() => removeAt(i)} />
          </FadeIn>
        ))}
        {!atMax ? (
          <AddPromptButton label={drafts.length === 0 ? 'Add a prompt' : 'Add another'} onPress={() => setPickerOpen(true)} />
        ) : null}
        <Text className="prose-caption text-ash">{`Answer ${PROMPTS_LIMITS.min}–${PROMPTS_LIMITS.max} prompts`}</Text>
      </ScrollView>
      <PromptPickerSheet visible={pickerOpen} categories={availableCategories} onSelect={addPrompt} onClose={() => setPickerOpen(false)} />
    </EditScreenShell>
  );
}
