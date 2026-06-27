import { useMutation, useQueryClient } from '@tanstack/react-query';

import { acceptRequest } from '@/features/notifications/api';
import { messagingKeys } from '@/features/messaging/hooks/use-conversations';
import { notificationKeys } from '@/features/notifications/hooks/use-notifications';
import { blockUser, declineRequestFrom, reportUser, unmatchUser } from '@/features/profile/api';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';
import { userProfileKeys } from '@/features/profile/hooks/use-user-profile';

/** Relationship-changing actions for a viewed profile (accept/decline a request,
 *  unmatch, block, report). Each refreshes the relationship + the lists it touches. */
export function useProfileActions(userId: string) {
  const meId = useCurrentUserId() as string;
  const qc = useQueryClient();

  const refreshRelationship = () => {
    qc.invalidateQueries({ queryKey: userProfileKeys.relationship(meId, userId) });
    qc.invalidateQueries({ queryKey: messagingKeys.conversations(meId) });
    qc.invalidateQueries({ queryKey: notificationKeys.list(meId) });
  };

  const accept = useMutation({
    mutationFn: () => acceptRequest(meId, userId),
    onSuccess: refreshRelationship,
  });

  const decline = useMutation({
    mutationFn: () => declineRequestFrom(meId, userId),
    onSuccess: refreshRelationship,
  });

  const unmatch = useMutation({
    mutationFn: (matchId: string) => unmatchUser(matchId),
    onSuccess: refreshRelationship,
  });

  const block = useMutation({
    mutationFn: () => blockUser(meId, userId),
    onSuccess: () => {
      refreshRelationship();
      // The blocked user becomes invisible (can_view_profile) — drop their cached profile.
      qc.invalidateQueries({ queryKey: userProfileKeys.profile(userId) });
    },
  });

  const report = useMutation({
    mutationFn: (reason: string) => reportUser(meId, userId, reason),
  });

  return { accept, decline, unmatch, block, report };
}
