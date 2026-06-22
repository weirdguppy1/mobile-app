import { Text, View } from 'react-native';

import { type TabConfig } from '@/features/navigation/config/tabs';
import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

interface NavBarProps {
  tabs: readonly TabConfig[];
  /** Route name of the active tab. */
  activeName: string;
  onPressTab: (name: string) => void;
  /** Bottom safe-area inset, reserved below the buttons. */
  bottomInset?: number;
}

/**
 * Presentational bottom nav: evenly spaced icon+label buttons on a translucent,
 * top-rounded surface. The active tab reads in ink + bold; the rest are muted
 * (DESIGN.md — ink/canvas chrome, mono-weight icons). Pure UI so it can be
 * previewed in the dev playground; the BottomNav adapter wires it to the router.
 */
export function NavBar({ tabs, activeName, onPressTab, bottomInset = 0 }: NavBarProps) {
  return (
    <View
      className="flex-row rounded-t-3xl px-2 pt-2"
      style={{
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingBottom: bottomInset || 8,
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
      }}>
      {tabs.map((tab) => {
        const active = tab.name === activeName;
        const Icon = tab.icon;
        return (
          <PressScale
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => onPressTab(tab.name)}
            className="flex-1 items-center gap-1 py-2">
            <Icon size={22} color={active ? Brand.ink : Brand.ash} strokeWidth={active ? 2.5 : 2} />
            <Text className={active ? 'prose-caption font-semibold text-ink' : 'prose-caption text-ash'}>
              {tab.label}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
