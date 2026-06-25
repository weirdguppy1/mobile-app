import { Text, View } from 'react-native';

import { type TabConfig } from '@/features/navigation/config/tabs';
import { NAV_BAR_MIN_INSET } from '@/features/navigation/lib/use-nav-bar-height';
import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface NavBarProps {
  tabs: readonly TabConfig[];
  /** Route name of the active tab. */
  activeName: string;
  onPressTab: (name: string) => void;
  /** Bottom safe-area inset, reserved below the buttons. */
  bottomInset?: number;
  /** Unread-style counts keyed by tab name; a positive value shows a badge. */
  badges?: Record<string, number>;
}

/**
 * Presentational bottom nav: evenly spaced icon+label buttons on a translucent,
 * top-rounded surface. The active tab reads in ink + bold; the rest are muted
 * (DESIGN.md — ink/canvas chrome, mono-weight icons). Pure UI so it can be
 * previewed in the dev playground; the BottomNav adapter wires it to the router.
 */
export function NavBar({ tabs, activeName, onPressTab, bottomInset = 0, badges }: NavBarProps) {
  return (
    <View
      className="flex-row rounded-t-3xl px-2 pt-2"
      style={{
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingBottom: Math.max(bottomInset, NAV_BAR_MIN_INSET),
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
      }}>
      {tabs.map((tab) => {
        const active = tab.name === activeName;
        const Icon = tab.icon;
        const badge = badges?.[tab.name] ?? 0;
        return (
          <PressScale
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={badge > 0 ? `${tab.label}, ${badge} unread` : tab.label}
            onPress={() => onPressTab(tab.name)}
            className="flex-1 items-center gap-1 py-2">
            <View>
              <Icon size={22} color={active ? Brand.ink : Brand.ash} strokeWidth={active ? 2.5 : 2} />
              {badge > 0 ? (
                <View
                  className="absolute -right-2.5 -top-1.5 items-center justify-center rounded-full bg-ink px-1"
                  style={{ minWidth: 16, height: 16 }}>
                  <Text className="font-semibold text-canvas" style={{ fontSize: 10 }}>
                    {badge > 9 ? '9+' : badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className={active ? 'prose-caption font-semibold text-ink' : 'prose-caption text-ash'}>
              {tab.label}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
