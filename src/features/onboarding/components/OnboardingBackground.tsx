import {
  Canvas,
  Group,
  RadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { type Tone } from "@/features/onboarding/config/step-tone";

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
const MESH: Record<string, Mesh | null> = {
  firstLight: {
    base: "#f8fafc",
    opacity: 0.45,
    blooms: [
      { x: 0.18, y: 0.2, r: 0.5, color: "#dbeafe" },
      { x: 0.82, y: 0.15, r: 0.45, color: "#e0e7ff" },
      { x: 0.5, y: 0.85, r: 0.6, color: "#f1f5f9" },
    ],
  },

  horizon: {
    base: "#fdf4ee",
    opacity: 0.7,
    blooms: [
      { x: 0.45, y: 0.4, r: 1.1, color: "#ffe8c8" },
      { x: 0.7, y: 0.1, r: 1.3, color: "#ffd9a0" },
      { x: 0.85, y: -0.1, r: 1.45, color: "#ffcf6b" },
      { x: 0.92, y: -0.18, r: 1.05, color: "#ff8c00" },
      { x: 0.92, y: -0.18, r: 0.68, color: "#ffb833" },
      { x: 0.92, y: -0.18, r: 0.42, color: "#ffe566" },
      { x: 0.92, y: -0.18, r: 0.2, color: "#fffde0" },
    ],
  },

  warm: {
    base: "#fdf4ee",
    opacity: 0.55,
    blooms: [
      { x: 0.5, y: 1.08, r: 0.95, color: "#ffb45e" },
      { x: 0.5, y: 0.92, r: 0.7, color: "#ffd28a" },
      { x: 0.28, y: 0.45, r: 0.5, color: "#ffd6b0" },
      { x: 0.76, y: 0.32, r: 0.45, color: "#ffe0c2" },
      { x: 0.5, y: 0.15, r: 0.6, color: "#f8d9ff" },
    ],
  },

  energy: {
    base: "#fff7ed",
    opacity: 0.55,
    blooms: [
      { x: 0.15, y: 0.25, r: 0.55, color: "#fed7aa" },
      { x: 0.82, y: 0.2, r: 0.5, color: "#fdba74" },
      { x: 0.65, y: 0.75, r: 0.55, color: "#fca5a5" },
      { x: 0.25, y: 0.8, r: 0.45, color: "#fde68a" },
    ],
  },

  curiosity: {
    base: "#fafafa",
    opacity: 0.5,
    blooms: [
      { x: 0.22, y: 0.18, r: 0.5, color: "#e5e7eb" },
      { x: 0.8, y: 0.2, r: 0.45, color: "#dbeafe" },
      { x: 0.35, y: 0.82, r: 0.5, color: "#ede9fe" },
      { x: 0.72, y: 0.7, r: 0.45, color: "#e0f2fe" },
    ],
  },

  conviction: {
    base: "#fafafa",
    opacity: 0.4,
    blooms: [
      { x: 0.18, y: 0.2, r: 0.45, color: "#e5e7eb" },
      { x: 0.82, y: 0.15, r: 0.4, color: "#f3f4f6" },
      { x: 0.5, y: 0.82, r: 0.55, color: "#e7e5e4" },
    ],
  },

  expression: {
    base: "#fef2f8",
    opacity: 0.6,
    blooms: [
      { x: 0.12, y: 0.18, r: 0.55, color: "#ffd6e8" },
      { x: 0.82, y: 0.14, r: 0.5, color: "#f8c4ff" },
      { x: 0.88, y: 0.72, r: 0.55, color: "#e0c3fc" },
      { x: 0.24, y: 0.84, r: 0.5, color: "#ffe0c2" },
      { x: 0.5, y: 0.45, r: 0.65, color: "#f0b6e0" },
    ],
  },

  radiance: {
    base: "#ffffff",
    opacity: 0.55,
    blooms: [
      { x: 0.18, y: 0.22, r: 0.55, color: "#96c4ff" },
      { x: 0.82, y: 0.16, r: 0.5, color: "#c4d6ff" },
      { x: 0.7, y: 0.8, r: 0.55, color: "#b4c8ff" },
      { x: 0.3, y: 0.88, r: 0.5, color: "#d6e4ff" },
    ],
  },

  serenity: {
    base: "#fafaf9",
    opacity: 0.45,
    blooms: [
      { x: 0.22, y: 0.22, r: 0.45, color: "#e7e5e4" },
      { x: 0.78, y: 0.18, r: 0.45, color: "#ede9fe" },
      { x: 0.55, y: 0.78, r: 0.55, color: "#dbeafe" },
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
  const [layers, setLayers] = useState<{ from: Tone; to: Tone }>({
    from: tone,
    to: tone,
  });

  useEffect(() => {
    setLayers((current) => ({ from: current.to, to: tone }));
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: reduced ? 0 : 800,
      easing: Easing.inOut(Easing.quad),
    });
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
