import { conversationTime, messageTime } from '@/shared/utils/format-time';

describe('messageTime', () => {
  it('formats 12-hour clock with AM/PM and zero-padded minutes', () => {
    expect(messageTime(new Date(2024, 0, 1, 14, 45))).toBe('2:45 PM');
    expect(messageTime(new Date(2024, 0, 1, 0, 5))).toBe('12:05 AM');
    expect(messageTime(new Date(2024, 0, 1, 12, 0))).toBe('12:00 PM');
    expect(messageTime(new Date(2024, 0, 1, 9, 30))).toBe('9:30 AM');
  });
});

describe('conversationTime', () => {
  const now = new Date(2024, 0, 10, 12, 0, 0);

  it('returns "now" under a minute', () => {
    expect(conversationTime(new Date(2024, 0, 10, 11, 59, 30), now)).toBe('now');
  });

  it('returns minutes, then hours', () => {
    expect(conversationTime(new Date(2024, 0, 10, 11, 55), now)).toBe('5m');
    expect(conversationTime(new Date(2024, 0, 10, 9, 0), now)).toBe('3h');
  });

  it('returns weekday within a week', () => {
    expect(conversationTime(new Date(2024, 0, 8, 12, 0), now)).toBe('Mon'); // Jan 8 2024 is a Monday
  });

  it('returns "Mon D" beyond a week', () => {
    expect(conversationTime(new Date(2023, 11, 25, 12, 0), now)).toBe('Dec 25');
  });
});
