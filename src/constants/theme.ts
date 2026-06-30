/**
 * Runtime color + gradient constants for the few places that need a JS value
 * rather than a Uniwind className: color *props* (placeholderTextColor,
 * ActivityIndicator color) and the mesh washes, which have no utility equivalent
 * (they use `experimental_backgroundImage`). Everything else is styled with
 * className utilities defined in src/global.css.
 */

export const Brand = {
  ink: '#f4f4f5',
  canvas: '#0d0e12',
  graphite: '#d4d4dc',
  slate: '#b4b4bd',
  ash: '#9a9aa4',
  fog: '#6e6e77',
  silver: 'rgba(255,255,255,0.14)',
  yes: '#31c431',
  maybe: '#ffae00',
  pass: '#ff5a5a',
  sent: '#0a84ff',
} as const;

/**
 * Soft mesh washes — stacks of low-contrast radial blooms (DESIGN.md §9), applied
 * via `experimental_backgroundImage`. Pair each with its `MeshBase` background.
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

/** Base page color for the dark theme; pair with a DiscoverWashes `stops` value. */
export const DARK_PAGE = '#0d0e12';

/** Ambient mesh washes for the Discover feed — one is chosen per profile (see
 *  shared/lib/wash.ts) so each person reads distinct. Low-opacity glows behind
 *  the floating glass cards; photos stay dominant. Index 0 (peachRose) is the
 *  product's favorite. Apply via `experimental_backgroundImage: stops` +
 *  `backgroundColor: DARK_PAGE`. */
export const DiscoverWashes = [
  { key: 'peachRose', stops: [
    'radial-gradient(circle at 100% 0%, rgba(255,150,170,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(255,180,140,0.17) 0%, transparent 60%)',
    'radial-gradient(circle at 55% 100%, rgba(255,160,180,0.12) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'periwinkle', stops: [
    'radial-gradient(circle at 100% 0%, rgba(140,180,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(170,160,255,0.16) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'mint', stops: [
    'radial-gradient(circle at 100% 0%, rgba(120,220,210,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(150,230,200,0.16) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'lavender', stops: [
    'radial-gradient(circle at 100% 0%, rgba(200,160,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(210,182,245,0.16) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'sky', stops: [
    'radial-gradient(circle at 100% 0%, rgba(120,190,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(170,230,210,0.15) 0%, transparent 60%)',
  ].join(', ') },
  { key: 'indigo', stops: [
    'radial-gradient(circle at 100% 0%, rgba(150,150,255,0.20) 0%, transparent 60%)',
    'radial-gradient(circle at 0% 6%, rgba(190,150,245,0.16) 0%, transparent 60%)',
  ].join(', ') },
] as const;

export type DiscoverWash = (typeof DiscoverWashes)[number];

interface GlassSpec { tint: 'dark'; intensity: number; bg: string; border: string }

/** Real-glass (expo-blur) recipes. `bg` is the translucent tint laid over the
 *  blur; `border` the 1px top-light edge. "Strong" = high intensity, low bg alpha. */
export const Glass: Record<'card' | 'sheet' | 'heart' | 'chip', GlassSpec> = {
  card:  { tint: 'dark', intensity: 30, bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.14)' },
  sheet: { tint: 'dark', intensity: 42, bg: 'rgba(20,20,26,0.40)',   border: 'rgba(255,255,255,0.16)' },
  heart: { tint: 'dark', intensity: 24, bg: 'rgba(20,20,24,0.45)',   border: 'rgba(255,255,255,0.20)' },
  chip:  { tint: 'dark', intensity: 18, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.14)' },
};