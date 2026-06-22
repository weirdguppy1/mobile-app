import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Content height of the floating bottom nav (excludes the safe-area inset). */
export const NAV_BAR_HEIGHT = 66;

/** Minimum bottom padding inside the bar when there's no home-indicator inset. */
export const NAV_BAR_MIN_INSET = 8;

/**
 * Total vertical space the floating nav occupies (content + bottom safe inset).
 * The nav overlays the screen, so any screen with interactive elements near the
 * bottom should reserve this much paddingBottom to keep them clear of the bar.
 */
export function useNavBarHeight() {
  const insets = useSafeAreaInsets();
  return NAV_BAR_HEIGHT + Math.max(insets.bottom, NAV_BAR_MIN_INSET);
}
