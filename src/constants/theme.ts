/**
 * Runtime color + gradient constants for the few places that need a JS value
 * rather than a Uniwind className: color *props* (placeholderTextColor,
 * ActivityIndicator color) and the mesh washes, which have no utility equivalent
 * (they use `experimental_backgroundImage`). Everything else is styled with
 * className utilities defined in src/global.css.
 */

export const Brand = {
  ink: '#000000',
  canvas: '#ffffff',
  graphite: '#333333',
  slate: '#666666',
  ash: '#999999',
  fog: '#b3b3b3',
  silver: '#cccccc',
  yes: '#31c431',
  maybe: '#ffae00',
  pass: '#ff0000',
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