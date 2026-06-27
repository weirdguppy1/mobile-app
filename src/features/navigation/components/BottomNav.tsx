import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TABS } from '@/features/navigation/config/tabs';
import { tabDirection } from '@/features/navigation/lib/tab-direction';
import { useTabNavStore } from '@/features/navigation/store/tab-nav-store';
import { NavBar } from '@/features/navigation/components/NavBar';
import { useConversationsRealtime, useUnreadCount } from '@/features/messaging/hooks/use-conversations';
import { useNotificationsRealtime, useUnreadActivityCount } from '@/features/notifications/hooks/use-notifications';

// The props expo-router hands a custom `tabBar`, derived from the Tabs
// component so we don't deep-import the vendored react-navigation types.
type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Adapter between expo-router's tab navigator and the presentational NavBar:
 * resolves the active route, records the slide direction for TabTransition, and
 * dispatches navigation using the canonical `tabPress` event pattern.
 */
export function BottomNav({ state, navigation, insets }: TabBarProps) {
  const setDirection = useTabNavStore((s) => s.setDirection);

  // Mounted app-wide here (the tab bar lives for the whole authenticated session), so
  // the Messages badge stays live from any tab. The badge sums unread messages and
  // unread activity (requests / matches / reactions) without double-counting messages.
  useConversationsRealtime();
  useNotificationsRealtime();
  const messagesBadge = useUnreadCount() + useUnreadActivityCount();

  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name ?? TABS[0].name;
  const activeTabIndex = TABS.findIndex((t) => t.name === activeRouteName);

  // Hide the bar when the active tab's nested stack is pushed past its root
  // (e.g. a profile edit/settings screen), so it doesn't float over those forms.
  if ((activeRoute?.state?.index ?? 0) > 0) return null;

  const onPressTab = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;

    const isActive = route.key === state.routes[state.index]?.key;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (isActive || event.defaultPrevented) return;

    setDirection(tabDirection(activeTabIndex, TABS.findIndex((t) => t.name === name)));
    navigation.navigate(route.name);
  };

  // Absolutely positioned so the navigator reserves no layout space for it —
  // the scene fills the full height and flows behind the bar (immersive overlay).
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <NavBar
        tabs={TABS}
        activeName={activeRouteName}
        onPressTab={onPressTab}
        bottomInset={insets.bottom}
        badges={{ messages: messagesBadge }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
