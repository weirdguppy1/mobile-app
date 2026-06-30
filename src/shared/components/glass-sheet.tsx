import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Glass } from '@/constants/theme';

/** Top-rounded real-glass surface for bottom sheets / modals (like-sheet, match
 *  modal). Heavier blur than GlassCard. */
export function GlassSheet({ children, className, style, ...rest }: ViewProps & { children?: ReactNode }) {
  return (
    <View
      className={`overflow-hidden rounded-t-3xl ${className ?? ''}`}
      style={[{ borderTopWidth: 1, borderColor: Glass.sheet.border }, style]}
      {...rest}>
      <BlurView
        tint={Glass.sheet.tint}
        intensity={Glass.sheet.intensity}
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.sheet.bg }]} />
      {children}
    </View>
  );
}
