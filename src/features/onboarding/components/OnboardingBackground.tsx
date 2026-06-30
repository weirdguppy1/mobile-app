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

import { DARK_PAGE } from "@/constants/theme";

/** Background tones — the keys of the MESH map below. `neutral` = bare dark stage. */
export type Tone =
  | "warm" | "neutral" | "firstLight" | "energy" | "curiosity"
  | "conviction" | "expression" | "radiance" | "serenity" | "horizon";

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
  /** Overall wash strength — kept subtle so the dark stage dominates. */
  opacity: number;
  blooms: Bloom[];
}

// Dark-adapted radial-bloom mesh gradients. All base colors are DARK_PAGE so the
// canvas is never washed to light. Bloom colors are low-saturation tinted glows
// that read as accent halos on the dark surface. neutral = no wash (canvas shows).
const MESH: Record<string, Mesh | null> = {
  firstLight: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.18, y: 0.2, r: 0.5, color: "rgba(140,180,255,0.28)" },
      { x: 0.82, y: 0.15, r: 0.45, color: "rgba(160,170,255,0.22)" },
      { x: 0.5, y: 0.85, r: 0.6, color: "rgba(120,160,240,0.18)" },
    ],
  },

  horizon: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.45, y: 0.4, r: 1.1, color: "rgba(255,160,60,0.14)" },
      { x: 0.7, y: 0.1, r: 1.3, color: "rgba(255,130,40,0.12)" },
      { x: 0.85, y: -0.1, r: 1.45, color: "rgba(255,110,20,0.10)" },
      { x: 0.92, y: -0.18, r: 1.05, color: "rgba(200,80,0,0.16)" },
      { x: 0.92, y: -0.18, r: 0.68, color: "rgba(255,150,30,0.18)" },
      { x: 0.92, y: -0.18, r: 0.42, color: "rgba(255,200,60,0.14)" },
    ],
  },

  warm: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.5, y: 1.08, r: 0.95, color: "rgba(255,150,100,0.18)" },
      { x: 0.5, y: 0.92, r: 0.7, color: "rgba(255,180,120,0.14)" },
      { x: 0.28, y: 0.45, r: 0.5, color: "rgba(255,160,100,0.12)" },
      { x: 0.76, y: 0.32, r: 0.45, color: "rgba(255,140,180,0.12)" },
      { x: 0.5, y: 0.15, r: 0.6, color: "rgba(220,150,255,0.16)" },
    ],
  },

  energy: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.15, y: 0.25, r: 0.55, color: "rgba(255,160,80,0.18)" },
      { x: 0.82, y: 0.2, r: 0.5, color: "rgba(255,130,80,0.16)" },
      { x: 0.65, y: 0.75, r: 0.55, color: "rgba(255,120,120,0.14)" },
      { x: 0.25, y: 0.8, r: 0.45, color: "rgba(255,210,80,0.12)" },
    ],
  },

  curiosity: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.22, y: 0.18, r: 0.5, color: "rgba(180,190,255,0.18)" },
      { x: 0.8, y: 0.2, r: 0.45, color: "rgba(140,190,255,0.16)" },
      { x: 0.35, y: 0.82, r: 0.5, color: "rgba(180,160,255,0.14)" },
      { x: 0.72, y: 0.7, r: 0.45, color: "rgba(140,220,255,0.12)" },
    ],
  },

  conviction: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.18, y: 0.2, r: 0.45, color: "rgba(200,200,220,0.12)" },
      { x: 0.82, y: 0.15, r: 0.4, color: "rgba(210,210,230,0.10)" },
      { x: 0.5, y: 0.82, r: 0.55, color: "rgba(190,190,210,0.12)" },
    ],
  },

  expression: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.12, y: 0.18, r: 0.55, color: "rgba(255,140,200,0.20)" },
      { x: 0.82, y: 0.14, r: 0.5, color: "rgba(240,160,255,0.18)" },
      { x: 0.88, y: 0.72, r: 0.55, color: "rgba(200,160,255,0.16)" },
      { x: 0.24, y: 0.84, r: 0.5, color: "rgba(255,160,120,0.14)" },
      { x: 0.5, y: 0.45, r: 0.65, color: "rgba(230,140,210,0.16)" },
    ],
  },

  radiance: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.18, y: 0.22, r: 0.55, color: "rgba(100,180,255,0.22)" },
      { x: 0.82, y: 0.16, r: 0.5, color: "rgba(160,200,255,0.18)" },
      { x: 0.7, y: 0.8, r: 0.55, color: "rgba(130,180,255,0.16)" },
      { x: 0.3, y: 0.88, r: 0.5, color: "rgba(180,210,255,0.14)" },
    ],
  },

  serenity: {
    base: DARK_PAGE,
    opacity: 0.9,
    blooms: [
      { x: 0.22, y: 0.22, r: 0.45, color: "rgba(190,190,210,0.14)" },
      { x: 0.78, y: 0.18, r: 0.45, color: "rgba(180,160,255,0.16)" },
      { x: 0.55, y: 0.78, r: 0.55, color: "rgba(140,190,255,0.14)" },
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
      {/* Base rect fills the canvas with DARK_PAGE so no light bleed-through. */}
      <Rect x={0} y={0} width={width} height={height} color={mesh.base} />
      <Group opacity={mesh.opacity}>
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
