const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDate = (input: string | Date): Date => (typeof input === 'string' ? new Date(input) : input);
const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** Clock time for a message bubble, e.g. "2:45 PM". */
export function messageTime(input: string | Date): string {
  const d = toDate(input);
  const minutes = d.getMinutes();
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  const hour12 = d.getHours() % 12 || 12;
  return `${hour12}:${pad2(minutes)} ${ampm}`;
}

/** Compact relative stamp for a conversation row: "now", "5m", "2h", "Mon", "Jun 3". */
export function conversationTime(input: string | Date, now: Date = new Date()): string {
  const d = toDate(input);
  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return DAY_NAMES[d.getDay()];
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}
