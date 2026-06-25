import { notificationCopy } from '@/features/notifications/lib/notification-copy';

describe('notificationCopy', () => {
  it('message uses the preview as subtitle, actor as title', () => {
    expect(notificationCopy('message', 'Mia', 'see you at 5?')).toEqual({ title: 'Mia', subtitle: 'see you at 5?' });
    expect(notificationCopy('message', 'Mia', null).subtitle).toBe('Sent you a message');
  });

  it('match reads as a connection', () => {
    expect(notificationCopy('match', 'Mia', null)).toEqual({ title: 'You matched with Mia', subtitle: 'Say hi 👋' });
  });

  it('request has no subtitle (Accept/Decline render instead)', () => {
    expect(notificationCopy('request', 'Mia', null)).toEqual({ title: 'Mia wants to connect', subtitle: null });
  });

  it('reaction shows the emoji preview', () => {
    expect(notificationCopy('reaction', 'Mia', '🔥').subtitle).toBe('Reacted 🔥 to your message');
    expect(notificationCopy('reaction', 'Mia', null).subtitle).toBe('Reacted ❤️ to your message');
  });

  it('falls back to "Someone" when the name is missing', () => {
    expect(notificationCopy('request', null, null).title).toBe('Someone wants to connect');
  });
});
