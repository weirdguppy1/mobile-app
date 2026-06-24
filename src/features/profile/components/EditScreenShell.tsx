import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { PressScale } from '@/shared/components';

/** Chrome for a pushed profile editor: back header + body + optional pinned footer. */
export function EditScreenShell({ title, footer, children }: { title: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
          <PressScale accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
            <ChevronLeft size={26} color={Brand.ink} strokeWidth={2} />
          </PressScale>
          <Text className="prose-button text-ink">{title}</Text>
        </View>
        <View className="flex-1">{children}</View>
        {footer ? <View className="px-6 pb-2 pt-2">{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}
