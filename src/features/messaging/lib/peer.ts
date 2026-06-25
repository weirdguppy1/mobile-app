import { Match } from '@/features/messaging/types';

/** The other participant in a match (matches store a canonical user_a < user_b). */
export function peerId(match: Pick<Match, 'user_a' | 'user_b'>, me: string): string {
  return match.user_a === me ? match.user_b : match.user_a;
}
