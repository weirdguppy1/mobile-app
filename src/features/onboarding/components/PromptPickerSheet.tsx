import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PromptPickerSheetProps {
  visible: boolean;
  /** Pre-filtered to exclude already-selected prompts; empty categories omitted. */
  categories: { label: string; prompts: string[] }[];
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet prompt picker: slides up from the bottom (eased, no spring — DESIGN.md
 * §motion, `--r-modal` 16px corners), prompts grouped by category as horizontally
 * scrolling pills. Tap a pill to select (closes via the parent); tap the backdrop or
 * the X to dismiss. Built from RN Modal + Reanimated (no extra deps; tap-to-dismiss).
 */
export function PromptPickerSheet({ visible, categories, onSelect, onClose }: PromptPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      progress.value = 0;
      return;
    }
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [visible, reduced, progress, height]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[styles.backdrop, backdropStyle]}
        />
        <Animated.View
          className="bg-canvas"
          style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-9 rounded-full bg-silver" />
          </View>
          <View className="flex-row items-center justify-between px-6 pb-2">
            <Text className="prose-title text-ink">Choose a prompt</Text>
            <PressScale accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose}>
              <X size={20} color={Brand.graphite} strokeWidth={2} />
            </PressScale>
          </View>
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: Brand.silver,
  },
});
