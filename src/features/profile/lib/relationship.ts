/** Your relationship to another user, which drives the profile page's action bar. */
export type RelationshipState =
  | 'self'
  | 'matched'
  | 'incoming_request'
  | 'outgoing_request'
  | 'blocked'
  | 'none';

export interface Relationship {
  state: RelationshipState;
  /** Present only when `state === 'matched'`. */
  matchId?: string;
  /** ISO timestamp of the match, present only when `state === 'matched'`. */
  matchedAt?: string;
}

export interface RelationshipInputs {
  meId: string;
  userId: string;
  /** A match row between the pair, if one exists. */
  match: { id: string; created_at: string } | null;
  /** A like I sent to them exists. */
  iLiked: boolean;
  /** A like they sent to me exists. */
  theyLiked: boolean;
  /** I blocked them. */
  iBlocked: boolean;
  /** They blocked me (usually unobservable — their profile is hidden — kept for completeness). */
  theyBlocked: boolean;
}

/** Pure derivation of the relationship from raw query results. Precedence matters:
 *  self → blocked → matched → incoming/outgoing request → none. A match always wins
 *  over the underlying reciprocal likes that created it. */
export function relationshipState(input: RelationshipInputs): Relationship {
  const { meId, userId, match, iLiked, theyLiked, iBlocked, theyBlocked } = input;

  if (meId === userId) return { state: 'self' };
  if (iBlocked || theyBlocked) return { state: 'blocked' };
  if (match) return { state: 'matched', matchId: match.id, matchedAt: match.created_at };
  if (theyLiked && !iLiked) return { state: 'incoming_request' };
  if (iLiked && !theyLiked) return { state: 'outgoing_request' };
  return { state: 'none' };
}
