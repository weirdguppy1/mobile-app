import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Glass } from '@/constants/theme';

/** Real-glass surface (expo-blur). Blur fills behind a translucent tint; the
 *  caller supplies padding/gap via className. Strong intensity per DESIGN.md. */
export function GlassCard({ children, className, style, ...rest }: ViewProps & { children?: ReactNode }) {
  return (
    <View
      className={`overflow-hidden rounded-2xl ${className ?? ''}`}
      style={[{ borderWidth: 1, borderColor: Glass.card.border }, style]}
      {...rest}>
      <BlurView
        tint={Glass.card.tint}
        intensity={Glass.card.intensity}
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.card.bg }]} />
      {children}
    </View>
  );
}
