import { ScrollView, Text, View } from 'react-native';

import { PressScale, SheetModal } from '@/shared/components';

interface PromptPickerSheetProps {
  visible: boolean;
  /** Pre-filtered to exclude already-selected prompts; empty categories omitted. */
  categories: { label: string; prompts: string[] }[];
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

/**
 * Prompt picker in a SheetModal (slide-up, pull-down to dismiss): prompts
 * grouped by category as horizontally scrolling pills. Tap a pill to select
 * (closes via the parent); backdrop / X / pull-down dismiss.
 */
export function PromptPickerSheet({ visible, categories, onSelect, onClose }: PromptPickerSheetProps) {
  return (
    <SheetModal visible={visible} title="Choose a prompt" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-5 px-6 py-4">
        {categories.length === 0 ? (
          <Text className="prose-footnote text-slate">No more prompts to add.</Text>
        ) : (
          categories.map((cat) => (
            <View key={cat.label} className="gap-2">
              <Text className="prose-label text-graphite">{cat.label}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 pr-6">
                {cat.prompts.map((p) => (
                  <PressScale
                    key={p}
                    accessibilityRole="button"
                    accessibilityLabel={p}
                    onPress={() => onSelect(p)}
                    className="option-chip">
                    <Text className="prose-footnote text-graphite">{p}</Text>
                  </PressScale>
                ))}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>
    </SheetModal>
  );
}
