/** Pure helpers for building the browse-feed exclude set. Kept side-effect-free
 *  so the feed-filtering logic is unit-testable without Supabase. */

export interface MatchPair {
  user_a: string;
  user_b: string;
}

/** The other participant in a canonical match pair (user_a < user_b). */
export function otherUserId(match: MatchPair, me: string): string {
  return match.user_a === me ? match.user_b : match.user_a;
}

export interface ExcludeInput {
  me: string;
  /** likee_ids I've already requested. */
  sent: string[];
  /** liker_ids who've requested me (they belong in the inbox, not browse). */
  received: string[];
  /** passee_ids I've skipped/declined. */
  passed: string[];
  /** matches I'm part of. */
  matches: MatchPair[];
}

/** Everyone the browse feed must not surface: me + anyone I've already touched. */
export function collectExcludeIds({ me, sent, received, passed, matches }: ExcludeInput): Set<string> {
  return new Set<string>([
    me,
    ...sent,
    ...received,
    ...passed,
    ...matches.map((m) => otherUserId(m, me)),
  ]);
}
