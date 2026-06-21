import { Text, View } from 'react-native';

import { PressScale } from '@/shared/components/press-scale';

interface ScaleInputProps {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}

/** Segmented 1–N selector for ordinal fields (cleanliness, social level). */
export function ScaleInput({ value, onChange, min = 1, max = 5, lowLabel, highLabel }: ScaleInputProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {steps.map((n) => {
          const selected = value === n;
          return (
            <PressScale
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(n)}
              className={`flex-1 items-center justify-center rounded-lg border py-3 ${selected ? 'border-ink bg-ink' : 'border-silver bg-canvas'}`}>
              <Text className={selected ? 'prose-body font-semibold text-canvas' : 'prose-body text-graphite'}>{n}</Text>
            </PressScale>
          );
        })}
      </View>
      {lowLabel || highLabel ? (
        <View className="flex-row justify-between">
          <Text className="prose-caption text-ash">{lowLabel}</Text>
          <Text className="prose-caption text-ash">{highLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}
