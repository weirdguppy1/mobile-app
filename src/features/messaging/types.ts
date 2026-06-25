import { Database } from '@/types/database';

export type Match = Database['public']['Tables']['matches']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageReaction = Database['public']['Tables']['message_reactions']['Row'];

/** Minimal info to show the other person in a list row / thread header. */
export interface PeerSummary {
  id: string;
  firstName: string | null;
  avatarUrl: string | null;
}

/** One row in the conversations list. */
export interface Conversation {
  match: Match;
  peer: PeerSummary;
  lastMessage: Message | null;
  unread: number;
}

/** A message with its reactions attached, for rendering in the thread. */
export interface MessageWithReactions extends Message {
  reactions: MessageReaction[];
}

/** The fixed reaction palette offered by the long-press bar. */
export const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '😮'] as const;
