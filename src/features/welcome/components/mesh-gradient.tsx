import { View, type ViewProps } from 'react-native';

import { MeshBase, MeshGradient as MeshStops, type MeshVariant } from '@/constants/theme';

interface MeshGradientProps extends ViewProps {
  /** Which soft wash to render. See DESIGN.md §9. */
  variant: MeshVariant;
}

/**
 * A soft mesh-gradient surface — a stack of low-contrast radial blooms settling
 * onto a base color. Backgrounds and overlays only; never behind text that needs
 * to stay legible without a scrim, and never on a button.
 */
export function MeshGradient({ variant, style, ...rest }: MeshGradientProps) {
  return (
    <View
      style={[
        {
          backgroundColor: MeshBase[variant],
          experimental_backgroundImage: MeshStops[variant],
        },
        style,
      ]}
      {...rest}
    />
  );
}
