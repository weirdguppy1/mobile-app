export type TabDirection = 'forward' | 'back';

/**
 * Which way the screen transition should slide when moving between tabs.
 * Moving to a later tab (or staying) reads as "forward"; an earlier tab is
 * "back" — so the motion mirrors the tab order left→right.
 */
export function tabDirection(fromIndex: number, toIndex: number): TabDirection {
  return toIndex >= fromIndex ? 'forward' : 'back';
}
