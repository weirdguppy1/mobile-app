import { Database } from '@/types/database';

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationType = Notification['type'];

/** A notification enriched with the actor's display info (name + avatar). */
export interface NotificationItem extends Notification {
  actor: { id: string; firstName: string | null; avatarUrl: string | null };
}
