import { Text, View } from 'react-native';

import { type Option } from '@/features/profile/constants';
import { PressScale } from '@/shared/components/press-scale';

type SingleProps = {
  multiple?: false;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: number;
};

type MultiProps = {
  multiple: true;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  min?: number;
  max?: number;
  columns?: number;
};

type OptionGroupProps = SingleProps | MultiProps;

/** Selectable chips. Single- or multi-select; multi enforces an optional max. */
export function OptionGroup(props: OptionGroupProps) {
  const { options } = props;

  const isSelected = (v: string) =>
    props.multiple ? props.value.includes(v) : props.value === v;

  const toggle = (v: string) => {
    if (!props.multiple) {
      props.onChange(v);
      return;
    }
    const selected = props.value.includes(v);
    if (selected) {
      props.onChange(props.value.filter((x) => x !== v));
      return;
    }
    if (props.max != null && props.value.length >= props.max) return; // block past max
    props.onChange([...props.value, v]);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const selected = isSelected(o.value);
        const atMax = props.multiple && !selected && props.max != null && props.value.length >= props.max;
        return (
          <PressScale
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: atMax }}
            onPress={() => toggle(o.value)}
            className={`option-chip ${selected ? 'option-chip-selected' : ''} ${atMax ? 'button-disabled' : ''}`}>
            <Text className={selected ? 'prose-footnote font-semibold text-canvas' : 'prose-footnote text-graphite'}>
              {o.label}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
