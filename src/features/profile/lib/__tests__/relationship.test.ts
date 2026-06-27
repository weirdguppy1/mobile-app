import { relationshipState, RelationshipInputs } from '@/features/profile/lib/relationship';

const base: RelationshipInputs = {
  meId: 'me',
  userId: 'them',
  match: null,
  iLiked: false,
  theyLiked: false,
  iBlocked: false,
  theyBlocked: false,
};
const make = (o: Partial<RelationshipInputs>): RelationshipInputs => ({ ...base, ...o });

describe('relationshipState', () => {
  it('returns self when viewing your own id', () => {
    expect(relationshipState(make({ userId: 'me' }))).toEqual({ state: 'self' });
  });

  it('self wins even if other signals are present', () => {
    expect(relationshipState(make({ userId: 'me', match: { id: 'm', created_at: 't' }, iBlocked: true })))
      .toEqual({ state: 'self' });
  });

  it('blocked when I blocked them', () => {
    expect(relationshipState(make({ iBlocked: true }))).toEqual({ state: 'blocked' });
  });

  it('blocked when they blocked me', () => {
    expect(relationshipState(make({ theyBlocked: true }))).toEqual({ state: 'blocked' });
  });

  it('block wins over an existing match', () => {
    expect(relationshipState(make({ iBlocked: true, match: { id: 'm', created_at: 't' } })))
      .toEqual({ state: 'blocked' });
  });

  it('matched returns matchId and matchedAt', () => {
    expect(relationshipState(make({ match: { id: 'm1', created_at: '2026-01-02T00:00:00Z' } })))
      .toEqual({ state: 'matched', matchId: 'm1', matchedAt: '2026-01-02T00:00:00Z' });
  });

  it('match wins over the reciprocal likes that created it', () => {
    expect(relationshipState(make({ match: { id: 'm1', created_at: 't' }, iLiked: true, theyLiked: true })))
      .toEqual({ state: 'matched', matchId: 'm1', matchedAt: 't' });
  });

  it('incoming_request when they liked me and I have not liked back', () => {
    expect(relationshipState(make({ theyLiked: true }))).toEqual({ state: 'incoming_request' });
  });

  it('outgoing_request when I liked them and they have not liked back', () => {
    expect(relationshipState(make({ iLiked: true }))).toEqual({ state: 'outgoing_request' });
  });

  it('none when there is no connection', () => {
    expect(relationshipState(base)).toEqual({ state: 'none' });
  });
});
