import { Plus } from 'lucide-react-native';
import { Text } from 'react-native';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface AddPromptButtonProps {
  /** Defaults to "Add a prompt". */
  label?: string;
  onPress: () => void;
}

/** Dotted full-width tile that opens the prompt picker (TASK reference empty state).
 *  Monochrome per DESIGN.md — ink icon + label on a dashed silver border. */
export function AddPromptButton({ label = 'Add a prompt', onPress }: AddPromptButtonProps) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="add-prompt-tile">
      <Plus size={20} color={Brand.ink} strokeWidth={2} />
      <Text className="prose-button text-ink">{label}</Text>
    </PressScale>
  );
}
