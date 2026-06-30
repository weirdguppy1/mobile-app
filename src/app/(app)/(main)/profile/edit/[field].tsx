import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Brand } from '@/constants/theme';
import {
  type FieldControl, type FieldValue, type ProfileField, profileFieldById,
} from '@/features/profile/config/profile-fields';
import { ABOUT_ME_LIMITS } from '@/features/profile/constants';
import { useOnboardingData } from '@/features/profile/hooks/use-profile';
import { useProfileMutations } from '@/features/profile/hooks/use-profile-mutations';
import { isFieldHidden, toggleHidden } from '@/features/profile/lib/field-visibility';
import { Profile } from '@/features/profile/types';
import { Button, OptionGroup, PressScale, ScaleInput, TagInput, TextField } from '@/shared/components';
import { countWords } from '@/shared/utils/count-words';

const VIS_OPTIONS = [{ value: 'visible', label: 'Visible' }, { value: 'hidden', label: 'Hidden' }];

/** Single-field editor, driven by the PROFILE_FIELDS manifest entry for `field`. */
export default function FieldEditorScreen() {
  const { field: fieldId } = useLocalSearchParams<{ field: string }>();
  const { data, isLoading, isError } = useOnboardingData();
  const field = fieldId ? profileFieldById(fieldId) : undefined;

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
          <PressScale accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
            <ChevronLeft size={26} color={Brand.ink} strokeWidth={2} />
          </PressScale>
          <Text className="prose-button text-ink">{field?.label ?? 'Edit'}</Text>
        </View>
        {isLoading || (!data && !isError) ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator color={Brand.ink} /></View>
        ) : isError || !data ? (
          <View className="flex-1 items-center justify-center px-10">
            <Text className="prose-subtitle text-center">Couldn't load your profile.</Text>
          </View>
        ) : !field ? (
          <View className="flex-1 items-center justify-center px-10">
            <Text className="prose-subtitle text-center">Unknown field.</Text>
          </View>
        ) : (
          <FieldEditor field={field} profile={data.profile} />
        )}
      </SafeAreaView>
    </View>
  );
}

function FieldEditor({ field, profile }: { field: ProfileField; profile: Profile }) {
  const { saveProfile } = useProfileMutations();
  const [visible, setVisible] = useState(!isFieldHidden(profile.hidden_fields, field.id));
  const { control, handleSubmit } = useForm<{ value: FieldValue }>({
    resolver: zodResolver(z.object({ value: field.atom })) as Resolver<{ value: FieldValue }>,
    defaultValues: { value: field.getValue(profile) },
  });

  const onSave = handleSubmit(async ({ value }) => {
    const patch = field.toPatch(value);
    if (field.hideable) patch.hidden_fields = toggleHidden(profile.hidden_fields, field.id, visible);
    await saveProfile.mutateAsync(patch);
    router.back();
  });

  // Only the Save footer avoids the keyboard; the field content stays put (the
  // ScrollView shrinks and scrolls) instead of the whole screen being shoved up.
  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-6 pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <Controller
          control={control}
          name="value"
          render={({ field: f, fieldState }) => (
            <View className="gap-2">
              {renderControl(field.control, f.value, f.onChange)}
              {fieldState.error?.message ? <Text className="prose-footnote text-pass">{fieldState.error.message}</Text> : null}
            </View>
          )}
        />
        {field.hideable ? (
          <View className="gap-2">
            <Text className="prose-label text-graphite">Visibility</Text>
            <OptionGroup options={VIS_OPTIONS} value={visible ? 'visible' : 'hidden'} onChange={(v) => setVisible(v === 'visible')} />
          </View>
        ) : null}
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="px-6 pb-2 pt-2">
          <Button variant="primary" onPress={onSave} loading={saveProfile.isPending}>Save</Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function renderControl(control: FieldControl, value: FieldValue, onChange: (v: FieldValue) => void) {
  switch (control.kind) {
    case 'text':
      return <TextField value={(value as string) ?? ''} onChangeText={onChange} placeholder={control.placeholder} />;
    case 'about': {
      const words = countWords((value as string) ?? '');
      return (
        <View className="gap-2">
          <TextInput
            value={(value as string) ?? ''}
            onChangeText={onChange}
            placeholder="What should a future roommate know about you?"
            placeholderTextColor={Brand.fog}
            multiline
            textAlignVertical="top"
            className="font-primary tracking-tight text-ink"
            style={{ fontSize: 16, padding: 0, minHeight: 120 }}
          />
          <Text className={`prose-footnote ${words > ABOUT_ME_LIMITS.maxWords ? 'text-pass' : 'text-slate'}`}>
            {words}/{ABOUT_ME_LIMITS.maxWords} words
          </Text>
        </View>
      );
    }
    case 'options':
      return <OptionGroup options={control.options} value={(value as string) || null} onChange={onChange} />;
    case 'multi':
      return <OptionGroup multiple options={control.options} value={(value as string[]) ?? []} onChange={onChange} min={control.min} max={control.max} />;
    case 'tags':
      return <TagInput value={(value as string[]) ?? []} onChange={onChange} max={control.max} placeholder={control.placeholder} />;
    case 'scale':
      return <ScaleInput value={(value as number) ?? null} onChange={onChange} lowLabel={control.low} highLabel={control.high} />;
  }
}
