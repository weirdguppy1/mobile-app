import { useRef } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '@/features/messaging/components/Avatar';
import { notificationCopy } from '@/features/notifications/lib/notification-copy';
import { NotificationItem } from '@/features/notifications/types';
import { conversationTime } from '@/shared/utils/format-time';
import { PressScale } from '@/shared/components';

interface NotificationRowProps {
  item: NotificationItem;
  /** Open the related thread (message / match / reaction). */
  onOpen: (item: NotificationItem) => void;
  /** Accept a request; passes the button's screen-centre so the celebration expands from it. */
  onAccept: (item: NotificationItem, origin: { x: number; y: number }) => void;
  onDecline: (item: NotificationItem) => void;
  disabled?: boolean;
}

export function NotificationRow({ item, onOpen, onAccept, onDecline, disabled }: NotificationRowProps) {
  const copy = notificationCopy(item.type, item.actor.firstName, item.preview);
  const acceptRef = useRef<View>(null);

  const handleAccept = () => {
    acceptRef.current?.measureInWindow((x, y, w, h) => onAccept(item, { x: x + w / 2, y: y + h / 2 }));
  };

  const content = (
    <View className="flex-row items-center gap-3 px-6 py-3">
      <Avatar uri={item.actor.avatarUrl} name={item.actor.firstName} size={48} />
      <View className="flex-1 gap-1">
        <Text className="prose-footnote font-semibold text-ink" numberOfLines={1}>{copy.title}</Text>
        {copy.subtitle ? (
          <Text className="prose-caption text-slate" numberOfLines={1}>{copy.subtitle}</Text>
        ) : null}

        {item.type === 'request' ? (
          <View className="flex-row gap-2 pt-1">
            <View ref={acceptRef} collapsable={false}>
              <PressScale
                accessibilityRole="button"
                accessibilityLabel={`Accept ${item.actor.firstName ?? 'request'}`}
                disabled={disabled}
                onPress={handleAccept}
                className={`rounded-full bg-ink px-5 py-2 ${disabled ? 'button-disabled' : ''}`}>
                <Text className="prose-footnote font-semibold text-canvas">Accept</Text>
              </PressScale>
            </View>
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={`Decline ${item.actor.firstName ?? 'request'}`}
              disabled={disabled}
              onPress={() => onDecline(item)}
              className="rounded-full border border-silver px-5 py-2">
              <Text className="prose-footnote text-graphite">Decline</Text>
            </PressScale>
          </View>
        ) : null}
      </View>

      <View className="items-end gap-1">
        <Text className="prose-caption text-ash">{conversationTime(item.created_at)}</Text>
        {!item.read ? <View className="h-2 w-2 rounded-full bg-ink" /> : null}
      </View>
    </View>
  );

  // Requests act via their buttons; everything else opens the thread on tap.
  if (item.type === 'request') return content;
  return (
    <PressScale accessibilityRole="button" onPress={() => onOpen(item)}>
      {content}
    </PressScale>
  );
}
