import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MessageReaction, MessageWithReactions } from '@/features/messaging/types';
import { PressScale } from '@/shared/components';

/** Screen-space rect of a bubble, used to anchor the reaction picker to it. */
export interface BubbleRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MessageBubbleProps {
  message: MessageWithReactions;
  isMine: boolean;
  myUserId: string;
  /** When true (last message I sent), show the Sent/Read receipt. */
  isLastOwn: boolean;
  onLongPress: (message: MessageWithReactions, rect: BubbleRect) => void;
  /** Returns true (once) if this message just arrived live, so it animates in.
   *  Recycling-safe: keyed off message.id, consumed by the caller. */
  consumeFresh?: (id: string) => boolean;
}

interface ReactionTally {
  emoji: string;
  count: number;
  mine: boolean;
}

function tally(reactions: MessageReaction[], myUserId: string): ReactionTally[] {
  const map = new Map<string, ReactionTally>();
  for (const r of reactions) {
    const cur = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    cur.count += 1;
    if (r.user_id === myUserId) cur.mine = true;
    map.set(r.emoji, cur);
  }
  return [...map.values()];
}

export function MessageBubble({ message, isMine, myUserId, isLastOwn, onLongPress, consumeFresh }: MessageBubbleProps) {
  const reactions = tally(message.reactions, myUserId);
  const ref = useRef<View>(null);
  const reduced = useReducedMotion();
  const appear = useSharedValue(1); // 1 = settled; historical/recycled bubbles render in place

  // Animate in only when this id is flagged fresh (a just-arrived live message).
  // Keyed on message.id so a recycled cell re-evaluates for its new message.
  useEffect(() => {
    if (reduced) return;
    if (consumeFresh?.(message.id)) {
      appear.value = 0;
      appear.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    }
  }, [message.id, consumeFresh, reduced, appear]);

  const handleLongPress = () => {
    ref.current?.measureInWindow((x, y, width, height) => onLongPress(message, { x, y, width, height }));
  };

  const appearStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ translateY: (1 - appear.value) * 8 }, { scale: 0.97 + appear.value * 0.03 }],
  }));

  return (
    <Animated.View style={appearStyle} className={`px-4 py-1 ${isMine ? 'items-end' : 'items-start'}`}>
      {/* collapsable={false} keeps the node measurable on Android */}
      <View ref={ref} collapsable={false} className="max-w-[80%]">
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Message — long-press to react"
          delayLongPress={220}
          onLongPress={handleLongPress}
          className={`rounded-2xl px-4 py-2.5 ${isMine ? 'bg-sent' : 'bg-surface'}`}>
          <Text className="prose-body text-ink">{message.body}</Text>
        </PressScale>
      </View>

      {reactions.length ? (
        <View className={`-mt-1 flex-row gap-1 ${isMine ? 'pr-1' : 'pl-1'}`}>
          {reactions.map((r) => (
            <View
              key={r.emoji}
              className={`flex-row items-center gap-0.5 rounded-full border bg-surface px-1.5 py-0.5 ${r.mine ? 'border-ink' : 'border-silver'}`}>
              <Text style={{ fontSize: 11 }}>{r.emoji}</Text>
              {r.count > 1 ? <Text className="prose-caption text-slate">{r.count}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {isMine && isLastOwn ? (
        <Text className="prose-caption pr-1 pt-0.5 text-ash">{message.read_at ? 'Read' : 'Sent'}</Text>
      ) : null}
    </Animated.View>
  );
}
