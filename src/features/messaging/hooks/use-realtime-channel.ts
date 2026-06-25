import { type RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useId, useRef } from 'react';

import { supabase } from '@/lib/supabase';

interface UseRealtimeChannelOptions {
  /**
   * Keep the exact topic. Required for broadcast, where peers must share the topic
   * to exchange events. Default false: a per-instance suffix is appended so each
   * subscriber gets its OWN channel. Supabase reuses channels by topic, and adding
   * postgres_changes/presence to an already-subscribed channel throws — which
   * happens when two screens (or a Fast-Refresh re-run) share a topic.
   */
  staticTopic?: boolean;
}

/**
 * Subscribe to a realtime channel for the lifetime of a screen. Re-subscribes when
 * `channelName` changes and removes the channel on unmount. `configure` attaches
 * `.on(...)` handlers; it's read from a ref so changing closures don't churn the
 * subscription. Returns a ref to the live channel so the caller can `.send()`
 * broadcasts. `self:false` keeps own broadcasts from echoing back.
 */
export function useRealtimeChannel(
  channelName: string | null,
  configure: (channel: RealtimeChannel) => void,
  { staticTopic = false }: UseRealtimeChannelOptions = {},
) {
  const instanceId = useId();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const configureRef = useRef(configure);
  configureRef.current = configure;

  useEffect(() => {
    if (!channelName) {
      channelRef.current = null;
      return;
    }
    const topic = staticTopic ? channelName : `${channelName}:${instanceId}`;
    const channel = supabase.channel(topic, { config: { broadcast: { self: false } } });
    configureRef.current(channel);
    channel.subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [channelName, staticTopic, instanceId]);

  return channelRef;
}
