import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { Avatar } from '@/features/messaging/components/Avatar';
import { PeerSummary } from '@/features/messaging/types';
import { PressScale } from '@/shared/components';

interface ChatHeaderProps {
  peer: PeerSummary | null;
  onBack: () => void;
}

export function ChatHeader({ peer, onBack }: ChatHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-3 pb-2 pt-1">
      <PressScale accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={onBack}>
        <ChevronLeft size={26} color={Brand.ink} strokeWidth={2} />
      </PressScale>
      <Avatar uri={peer?.avatarUrl ?? null} name={peer?.firstName ?? null} size={36} />
      <Text className="prose-button text-ink">{peer?.firstName ?? 'Chat'}</Text>
    </View>
  );
}
