import type { MeshVariant } from '@/constants/theme';

export interface RoommateCard {
  id: string;
  name: string;
  /** Single-letter monogram shown on the gradient "photo". */
  monogram: string;
  /** Short year · major · vibe line, e.g. "'28 · CS · night owl". */
  meta: string;
  wash: Extract<MeshVariant, 'warm' | 'cool' | 'mint'>;
  /** Resting rotation of the polaroid, in degrees. */
  rotate: number;
  /** Resting offset from the stack center, in px. */
  offsetX: number;
  offsetY: number;
  scale: number;
}

/**
 * Mock roommates for the welcome stack. Three is the sweet spot — enough to read
 * as "a pile of potential people," few enough to stay composed.
 */
export const WELCOME_CARDS: RoommateCard[] = [
  {
    id: 'jordan',
    name: 'Jordan',
    monogram: 'J',
    meta: "'27 · Design · early bird",
    wash: 'cool',
    rotate: -11,
    offsetX: -76,
    offsetY: 18,
    scale: 0.92,
  },
  {
    id: 'priya',
    name: 'Priya',
    monogram: 'P',
    meta: "'28 · Bio · tidy & social",
    wash: 'mint',
    rotate: 9,
    offsetX: 78,
    offsetY: 10,
    scale: 0.94,
  },
  {
    id: 'maya',
    name: 'Maya',
    monogram: 'M',
    meta: "'28 · CS · night owl",
    wash: 'warm',
    rotate: -3,
    offsetX: 0,
    offsetY: -8,
    scale: 1,
  },
];
