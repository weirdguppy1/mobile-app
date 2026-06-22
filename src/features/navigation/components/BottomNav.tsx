import { Tabs } from 'expo-router';

import { TABS } from '@/features/navigation/config/tabs';
import { tabDirection } from '@/features/navigation/lib/tab-direction';
import { useTabNavStore } from '@/features/navigation/store/tab-nav-store';
import { NavBar } from '@/features/navigation/components/NavBar';

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

  const activeRouteName = state.routes[state.index]?.name ?? TABS[0].name;
  const activeTabIndex = TABS.findIndex((t) => t.name === activeRouteName);

  const onPressTab = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;

    const isActive = route.key === state.routes[state.index]?.key;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (isActive || event.defaultPrevented) return;

    setDirection(tabDirection(activeTabIndex, TABS.findIndex((t) => t.name === name)));
    navigation.navigate(route.name);
  };

  return (
    <NavBar tabs={TABS} activeName={activeRouteName} onPressTab={onPressTab} bottomInset={insets.bottom} />
  );
}
