import { Text, View } from 'react-native';

import { Button } from '@/shared/components';

interface DiscoveryEmptyStateProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Shown when the browse feed is exhausted: nobody new to request right now. */
export function DiscoveryEmptyState({ onRefresh, refreshing }: DiscoveryEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-10">
      <Text className="prose-display text-center text-ink">You're all caught up</Text>
      <Text className="prose-subtitle text-center">
        No new roommates to browse right now. New students join all the time — check back soon.
      </Text>
      {onRefresh ? (
        <View className="pt-2">
          <Button variant="ghost" onPress={onRefresh} loading={refreshing}>
            Check again
          </Button>
        </View>
      ) : null}
    </View>
  );
}
