/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Brand system from DESIGN.md — achromatic by default. Black-on-white IS the
 * contrast system; the semantic colors are reserved for swipe/match states only.
 */
export const Brand = {
  ink: '#000000',
  canvas: '#ffffff',
  graphite: '#333333',
  slate: '#666666',
  ash: '#999999',
  fog: '#b3b3b3',
  silver: '#cccccc',
  // semantic — swipe/match states ONLY
  yes: '#31c431',
  maybe: '#ffae00',
  pass: '#ff0000',
} as const;

/**
 * Font families loaded in app/_layout.tsx via expo-font.
 * `primary` (Satoshi) carries all frequently-read UI text; `display` (Space
 * Grotesk) is the "moment" face — only for headlines and big single words.
 */
export const FontFamily = {
  primary: 'Satoshi',
  display: 'SpaceGrotesk-Bold',
  displayMedium: 'SpaceGrotesk-Medium',
} as const;

/**
 * Soft mesh washes — stacks of low-contrast radial blooms at off-grid anchors,
 * per DESIGN.md §9. Apply via `experimental_backgroundImage`; pair each with its
 * base color (`MeshBase`) as the view's `backgroundColor`. No linear gradients.
 */
export const MeshGradient = {
  warm: [
    'radial-gradient(circle at 14% 16%, #ffd6e8 0%, transparent 56%)',
    'radial-gradient(circle at 80% 10%, #f8c4ff 0%, transparent 52%)',
    'radial-gradient(circle at 88% 74%, #e0c3fc 0%, transparent 56%)',
    'radial-gradient(circle at 22% 86%, #ffe0c2 0%, transparent 52%)',
    'radial-gradient(circle at 52% 48%, #f0b6e0 0%, transparent 62%)',
  ].join(', '),
  cool: [
    'radial-gradient(circle at 18% 22%, #96c4ff 0%, transparent 56%)',
    'radial-gradient(circle at 82% 16%, #c4d6ff 0%, transparent 52%)',
    'radial-gradient(circle at 70% 82%, #b4c8ff 0%, transparent 56%)',
    'radial-gradient(circle at 30% 88%, #d6e4ff 0%, transparent 52%)',
  ].join(', '),
  mint: [
    'radial-gradient(circle at 16% 18%, #a8e6d0 0%, transparent 56%)',
    'radial-gradient(circle at 80% 12%, #85dadc 0%, transparent 52%)',
    'radial-gradient(circle at 86% 80%, #b8f0e0 0%, transparent 56%)',
    'radial-gradient(circle at 26% 84%, #d6f5ee 0%, transparent 52%)',
  ].join(', '),
  // Hero backdrop: blooms anchored high so color bleeds from the top edge and
  // dissolves into the white canvas before reaching the message block below.
  hero: [
    'radial-gradient(circle at 18% 2%, #ffd6e8 0%, transparent 44%)',
    'radial-gradient(circle at 86% 8%, #f8c4ff 0%, transparent 42%)',
    'radial-gradient(circle at 58% 20%, #e0c3fc 0%, transparent 46%)',
    'radial-gradient(circle at 8% 30%, #ffe0c2 0%, transparent 40%)',
    'radial-gradient(circle at 96% 40%, #f0b6e0 0%, transparent 42%)',
  ].join(', '),
} as const;

export type MeshVariant = keyof typeof MeshGradient;

export const MeshBase: Record<MeshVariant, string> = {
  warm: '#fbe6f2',
  cool: '#ffffff',
  mint: '#c0e2e2',
  hero: '#ffffff',
};

/** DESIGN.md --shadow-card, expressed as a CSS boxShadow string. */
export const CardShadow =
  '0px 0.8px 2.4px -0.6px rgba(0,0,0,0.05), 0px 2.4px 7.2px -1.25px rgba(0,0,0,0.05), 0px 6.4px 19.1px -1.875px rgba(0,0,0,0.05), 0px 20px 60px -2.5px rgba(0,0,0,0.05)';
