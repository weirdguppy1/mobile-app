import { type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { PressScale } from '@/shared/components/press-scale';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
}

/** Primary (filled ink) or ghost button built on the shared press animation. */
export function Button({ children, variant = 'primary', loading, disabled, onPress, className }: ButtonProps) {
  const inactive = disabled || loading;
  const base = variant === 'primary' ? 'button-primary' : 'button-ghost';

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPress={onPress}
      className={`${base} ${inactive ? 'button-disabled' : ''} ${className ?? ''}`}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#000000'} />
      ) : typeof children === 'string' ? (
        <Text className={variant === 'primary' ? 'prose-button text-canvas' : 'prose-button text-graphite'}>
          {children}
        </Text>
      ) : (
        <View>{children}</View>
      )}
    </PressScale>
  );
}
