import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text,
  useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { fetchMatchPeer } from '@/features/messaging/api';
import { ChatComposer } from '@/features/messaging/components/ChatComposer';
import { ChatHeader } from '@/features/messaging/components/ChatHeader';
import { type BubbleRect, MessageBubble } from '@/features/messaging/components/MessageBubble';
import { ReactionBar } from '@/features/messaging/components/ReactionBar';
import { messagingKeys } from '@/features/messaging/hooks/use-conversations';
import { useMarkRead, useReactionMutations, useSendMessage, useThread } from '@/features/messaging/hooks/use-messages';
import { useRealtimeChannel } from '@/features/messaging/hooks/use-realtime-channel';
import { applyReaction, removeReaction, upsertMessage } from '@/features/messaging/lib/thread-cache';
import { Message, MessageReaction, MessageWithReactions } from '@/features/messaging/types';
import { useCurrentUserId } from '@/features/profile/hooks/use-profile';

const TYPING_THROTTLE_MS = 1800;
const TYPING_CLEAR_MS = 3000;

export default function ChatThreadScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userId = useCurrentUserId() as string;
  const qc = useQueryClient();
  const key = messagingKeys.thread(matchId);

  const { data: messages, isLoading } = useThread(matchId);
  const peerQuery = useQuery({
    queryKey: ['match-peer', matchId, userId],
    queryFn: () => fetchMatchPeer(matchId, userId),
    enabled: !!matchId && !!userId,
  });
  const send = useSendMessage(matchId);
  const markRead = useMarkRead(matchId);
  const reactions = useReactionMutations(matchId);

  const [peerTyping, setPeerTyping] = useState(false);
  const [reacting, setReacting] = useState<{ message: MessageWithReactions; rect: BubbleRect } | null>(null);

  const listRef = useRef<FlashListRef<MessageWithReactions>>(null);
  const freshIds = useRef<Set<string>>(new Set()); // peer messages that just arrived live → animate in once
  const lastTypingSent = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markReadRef = useRef(() => markRead.mutate());
  markReadRef.current = () => markRead.mutate();

  // Mark the peer's messages read on open.
  useEffect(() => {
    if (matchId) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Keep the latest message in view.
  useEffect(() => {
    if (messages?.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages?.length]);

  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  // One realtime channel for the thread: live messages, read updates, reactions, typing.
  const channelRef = useRealtimeChannel(matchId ? `thread:${matchId}` : null, (channel) => {
    const f = `match_id=eq.${matchId}`;
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: f }, (p) => {
        const row = p.new as Message;
        // Flag the peer's incoming messages so the bubble animates in (our own
        // sends already appear instantly via the optimistic update).
        if (row.sender_id !== userId) {
          freshIds.current.add(row.id);
          markReadRef.current();
        }
        qc.setQueryData<MessageWithReactions[]>(key, (old = []) => upsertMessage(old, row));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: f }, (p) => {
        qc.setQueryData<MessageWithReactions[]>(key, (old = []) => upsertMessage(old, p.new as Message));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions', filter: f }, (p) => {
        qc.setQueryData<MessageWithReactions[]>(key, (old = []) => applyReaction(old, p.new as MessageReaction));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'message_reactions', filter: f }, (p) => {
        qc.setQueryData<MessageWithReactions[]>(key, (old = []) => applyReaction(old, p.new as MessageReaction));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions', filter: f }, (p) => {
        const old = p.old as Partial<MessageReaction>;
        if (old.message_id && old.user_id) {
          qc.setQueryData<MessageWithReactions[]>(key, (list = []) => removeReaction(list, old.message_id!, old.user_id!));
        }
      })
      .on('broadcast', { event: 'typing' }, () => {
        setPeerTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setPeerTyping(false), TYPING_CLEAR_MS);
      });
  });

  const consumeFresh = useCallback((id: string) => {
    if (!freshIds.current.has(id)) return false;
    freshIds.current.delete(id);
    return true;
  }, []);

  const onTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
    lastTypingSent.current = now;
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: {} });
  };

  const lastOwnId = useMemo(() => {
    for (let i = (messages?.length ?? 0) - 1; i >= 0; i -= 1) {
      if (messages![i].sender_id === userId) return messages![i].id;
    }
    return null;
  }, [messages, userId]);

  const onPickReaction = (emoji: string) => {
    if (!reacting) return;
    const mine = reacting.message.reactions.find((r) => r.user_id === userId)?.emoji ?? null;
    if (mine === emoji) reactions.clear.mutate({ messageId: reacting.message.id });
    else reactions.set.mutate({ messageId: reacting.message.id, emoji });
    setReacting(null);
  };

  const myReactionEmoji = reacting?.message.reactions.find((r) => r.user_id === userId)?.emoji ?? null;
  const BAR_WIDTH = 224;
  const barTop = reacting ? Math.max(reacting.rect.y - 56, insets.top + 8) : 0;
  const barLeft = reacting
    ? Math.min(Math.max(reacting.rect.x + reacting.rect.width / 2 - BAR_WIDTH / 2, 8), width - BAR_WIDTH - 8)
    : 0;

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <ChatHeader peer={peerQuery.data ?? null} onBack={() => router.back()} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View className="flex-1">
            {isLoading ? (
              <View className="flex-1 items-center justify-center"><ActivityIndicator color={Brand.ink} /></View>
            ) : (
              <FlashList
                ref={listRef}
                data={messages ?? []}
                keyExtractor={(m) => m.id}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    isMine={item.sender_id === userId}
                    myUserId={userId}
                    isLastOwn={item.id === lastOwnId}
                    onLongPress={(message, rect) => setReacting({ message, rect })}
                    consumeFresh={consumeFresh}
                  />
                )}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
            {peerTyping ? (
              <Text className="prose-caption px-5 pb-1 text-ash">
                {peerQuery.data?.firstName ?? 'They'} is typing…
              </Text>
            ) : null}
          </View>
          <ChatComposer onSend={(text) => send.mutate(text)} onTyping={onTyping} />
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal transparent visible={!!reacting} animationType="none" onRequestClose={() => setReacting(null)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setReacting(null)}>
          {reacting ? (
            <View style={{ position: 'absolute', top: barTop, left: barLeft, width: BAR_WIDTH, alignItems: 'center' }}>
              <ReactionBar selected={myReactionEmoji} onPick={onPickReaction} />
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
