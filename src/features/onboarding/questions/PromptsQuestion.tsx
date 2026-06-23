import { Quote } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { AddPromptButton } from '@/features/onboarding/components/AddPromptButton';
import { PromptCard } from '@/features/onboarding/components/PromptCard';
import { PromptPickerSheet } from '@/features/onboarding/components/PromptPickerSheet';
import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { PROMPT_CATEGORIES, PROMPTS_LIMITS } from '@/features/profile/constants';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { promptsSchema } from '@/features/profile/schema';
import { FadeIn } from '@/shared/components';

type Draft = { prompt: string; answer: string };

export function PromptsQuestion() {
  const { data, question, goNext, goBack, canGoBack } = useQuestionFlow();
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
  const removeAt = (index: number) => {
    const removed = drafts[index];
    const next = drafts.filter((_, i) => i !== index);
    setDrafts(next);
    // If this prompt was already persisted, delete it from the DB now by re-syncing
    // the remaining answered prompts (savePrompts → replace_prompts = delete-all +
    // reinsert; the DB rejects empty answers, so unanswered drafts stay local until
    // Continue). Skip the round-trip when the removed prompt was never saved.
    const wasSaved = (data?.prompts ?? []).some((p) => p.prompt === removed.prompt);
    if (wasSaved) savePrompts.mutate(next.filter((x) => x.answer.trim().length > 0));
  };

  const onNext = async () => {
    if (!result.success) return;
    await savePrompts.mutateAsync(result.data.prompts);
    goNext();
  };

  if (!question) return null;
  return (
    <QuestionShell
      title={question.title}
      subtitle={question.subtitle}
      icon={
        <View className="h-10 w-10 items-center justify-center rounded-full border border-silver">
          <Quote size={18} color={Brand.ink} strokeWidth={2} />
        </View>
      }
      canGoBack={canGoBack}
      onBack={goBack}
      canAdvance={result.success}
      onNext={onNext}
      saving={savePrompts.isPending}>
      <View className="gap-4">
        {drafts.map((d, i) => (
          <FadeIn key={`${d.prompt}-${i}`}>
            <PromptCard
              prompt={d.prompt}
              answer={d.answer}
              onChangeAnswer={(t) => setAnswer(i, t)}
              onRemove={() => removeAt(i)}
            />
          </FadeIn>
        ))}

        {!atMax ? (
          <AddPromptButton
            label={drafts.length === 0 ? 'Add a prompt' : 'Add another'}
            onPress={() => setPickerOpen(true)}
          />
        ) : null}

        <Text className="prose-caption text-ash">
          {`Answer ${PROMPTS_LIMITS.min}–${PROMPTS_LIMITS.max} prompts`}
        </Text>
      </View>

      <PromptPickerSheet
        visible={pickerOpen}
        categories={availableCategories}
        onSelect={addPrompt}
        onClose={() => setPickerOpen(false)}
      />
    </QuestionShell>
  );
}
