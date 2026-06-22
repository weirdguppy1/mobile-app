import { Canvas, Group, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { type Tone } from '@/features/onboarding/config/step-tone';

interface Bloom {
  /** Center, as a fraction of width/height (off-grid anchors per DESIGN.md). */
  x: number;
  y: number;
  /** Radius, as a fraction of the larger screen dimension. */
  r: number;
  color: string;
}

interface Mesh {
  base: string;
  /** Overall wash strength — kept low so the white stage still dominates. */
  opacity: number;
  blooms: Bloom[];
}

// Soft radial-bloom mesh gradients per DESIGN.md (grad-warm / grad-cool), drawn
// with Skia and kept subtle over the white canvas (white-stage discipline).
// neutral = no wash (the canvas shows through).
const MESH: Record<Tone, Mesh | null> = {
  warm: {
    base: '#fbe6f2',
    opacity: 0.5,
    blooms: [
      { x: 0.12, y: 0.18, r: 0.55, color: '#ffd6e8' },
      { x: 0.78, y: 0.12, r: 0.5, color: '#f8c4ff' },
      { x: 0.88, y: 0.72, r: 0.55, color: '#e0c3fc' },
      { x: 0.24, y: 0.84, r: 0.5, color: '#ffe0c2' },
      { x: 0.5, y: 0.48, r: 0.6, color: '#f0b6e0' },
    ],
  },
  cool: {
    base: '#ffffff',
    opacity: 0.55,
    blooms: [
      { x: 0.18, y: 0.22, r: 0.55, color: '#96c4ff' },
      { x: 0.82, y: 0.16, r: 0.5, color: '#c4d6ff' },
      { x: 0.7, y: 0.8, r: 0.55, color: '#b4c8ff' },
      { x: 0.3, y: 0.88, r: 0.5, color: '#d6e4ff' },
    ],
  },
  neutral: null,
};

/** Same rgb, zero alpha (CSS #RRGGBBAA) so a bloom fades cleanly to nothing. */
function fade(hex: string) {
  return `${hex}00`;
}

/** One tone's Skia mesh, or nothing for the neutral tone. */
function MeshLayer({ tone }: { tone: Tone }) {
  const { width, height } = useWindowDimensions();
  const mesh = MESH[tone];
  if (!mesh) return null;

  const maxDim = Math.max(width, height);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Group opacity={mesh.opacity}>
        <Rect x={0} y={0} width={width} height={height} color={mesh.base} />
        {mesh.blooms.map((bloom, i) => (
          <Rect key={i} x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={vec(bloom.x * width, bloom.y * height)}
              r={bloom.r * maxDim}
              colors={[bloom.color, fade(bloom.color)]}
            />
          </Rect>
        ))}
      </Group>
    </Canvas>
  );
}

/**
 * Persistent onboarding background that crossfades a soft mesh-gradient wash by
 * category to give the flow an emotional through-line (TASK.md §5). Two layers
 * crossfade — the outgoing tone fades out while the incoming fades in — so
 * transitions to/from the wash-free neutral tone resolve correctly.
 */
export function OnboardingBackground({ tone }: { tone: Tone }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(1);
  const [layers, setLayers] = useState<{ from: Tone; to: Tone }>({ from: tone, to: tone });

  useEffect(() => {
    setLayers((current) => ({ from: current.to, to: tone }));
    progress.value = 0;
    progress.value = withTiming(1, { duration: reduced ? 0 : 800, easing: Easing.inOut(Easing.quad) });
  }, [tone, progress, reduced]);

  const fromStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const toStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={StyleSheet.absoluteFill} className="bg-canvas">
      <Animated.View style={[StyleSheet.absoluteFill, fromStyle]}>
        <MeshLayer tone={layers.from} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, toStyle]}>
        <MeshLayer tone={layers.to} />
      </Animated.View>
    </View>
  );
}
