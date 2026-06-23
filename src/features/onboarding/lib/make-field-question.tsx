// src/features/onboarding/lib/make-field-question.tsx
import { type ComponentType, type ReactNode, useState } from 'react';

import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { useQuestionFlow } from '@/features/onboarding/hooks/use-question-flow';
import { type QuestionMeta } from '@/features/onboarding/config/questions';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { OnboardingData } from '@/features/profile/types';

export type Mutations = ReturnType<typeof useProfileMutations>;

export interface FieldQuestionConfig<V> {
  /** Seed the control from loaded data. */
  getValue: (data: OnboardingData) => V;
  /** Gate Continue. Omit for optional questions (always advanceable). */
  isValid?: (value: V) => boolean;
  /** Persist on Continue. */
  save: (value: V, mutations: Mutations) => Promise<void>;
  /** Render the single input. */
  control: (value: V, set: (v: V) => void) => ReactNode;
}

/** Build a one-field question screen from a declarative config. The value type V is
 *  captured here and erased from the returned component, keeping the manifest uniform
 *  and type-safe (no `any`). Title/subtitle/optional come from the active QuestionMeta. */
export function makeFieldQuestion<V>(config: FieldQuestionConfig<V>): ComponentType {
  // Holds the per-question state. Only mounted once data + question are known, so
  // getValue receives a real OnboardingData — no cast, no fabricated empty object.
  function FieldQuestionInner({ data, question, mutations, goNext, goBack, canGoBack }: {
    data: OnboardingData;
    question: QuestionMeta;
    mutations: Mutations;
    goNext: () => void;
    goBack: () => void;
    canGoBack: boolean;
  }) {
    const [saving, setSaving] = useState(false);
    const [value, setValue] = useState<V>(() => config.getValue(data));
    const canAdvance = config.isValid ? config.isValid(value) : true;

    const onNext = async () => {
      if (!canAdvance) return;
      setSaving(true);
      try {
        await config.save(value, mutations);
        goNext();
      } finally {
        setSaving(false);
      }
    };

    return (
      <QuestionShell
        title={question.title}
        subtitle={question.subtitle}
        optional={question.optional}
        canGoBack={canGoBack}
        onBack={goBack}
        canAdvance={canAdvance}
        onNext={onNext}
        saving={saving}>
        {config.control(value, setValue)}
      </QuestionShell>
    );
  }

  function FieldQuestion() {
    const { data, question, goNext, goBack, canGoBack } = useQuestionFlow();
    const mutations = useProfileMutations();
    if (!data || !question) return null;
    return (
      <FieldQuestionInner
        data={data}
        question={question}
        mutations={mutations}
        goNext={goNext}
        goBack={goBack}
        canGoBack={canGoBack}
      />
    );
  }
  return FieldQuestion;
}
