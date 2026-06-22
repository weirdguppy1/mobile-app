export type Direction = 'forward' | 'back';
export type Variant = 'question' | 'section';

const DISTANCE = 44;

/** Pure motion parameters for a transition — kept free of reanimated/expo-blur
 *  imports so it can be unit-tested without native mocks.
 *  question = directional slide + fade (eased, no spring).
 *  section  = heavier scale + fade-through, longer, no slide (chapter break). */
export function transitionParams(variant: Variant, direction: Direction, reduced: boolean) {
  if (reduced) {
    return { enterFrom: { x: 0, scale: 1 }, exitTo: { x: 0, scale: 1 }, enterMs: 140, exitMs: 110 };
  }
  if (variant === 'section') {
    return { enterFrom: { x: 0, scale: 0.92 }, exitTo: { x: 0, scale: 1.04 }, enterMs: 380, exitMs: 300 };
  }
  const sign = direction === 'forward' ? 1 : -1;
  return {
    enterFrom: { x: sign * DISTANCE, scale: 1 },
    exitTo: { x: (direction === 'forward' ? -1 : 1) * DISTANCE, scale: 1 },
    enterMs: direction === 'forward' ? 230 : 270,
    exitMs: direction === 'forward' ? 190 : 230,
  };
}
