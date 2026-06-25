import { NotificationType } from '@/features/notifications/types';

export interface NotificationCopy {
  title: string;
  /** Secondary line; null for requests (which render Accept/Decline instead). */
  subtitle: string | null;
}

/** Display copy for a notification row, given the actor's name + any preview
 *  (message snippet or reaction emoji). Pure, so it's unit-testable. */
export function notificationCopy(
  type: NotificationType,
  actorName: string | null,
  preview: string | null,
): NotificationCopy {
  const name = actorName ?? 'Someone';
  switch (type) {
    case 'message':
      return { title: name, subtitle: preview ?? 'Sent you a message' };
    case 'match':
      return { title: `You matched with ${name}`, subtitle: 'Say hi 👋' };
    case 'request':
      return { title: `${name} wants to connect`, subtitle: null };
    case 'reaction':
      return { title: name, subtitle: `Reacted ${preview ?? '❤️'} to your message` };
  }
}
