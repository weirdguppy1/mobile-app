import { type RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';

/**
 * Subscribe to a realtime channel for the lifetime of a screen. Re-subscribes when
 * `channelName` changes (e.g. per thread) and removes the channel on unmount.
 * `configure` attaches `.on(...)` handlers; it's read from a ref so changing
 * closures don't churn the subscription. Returns a ref to the live channel so the
 * caller can `.send()` broadcasts (e.g. typing). `self:false` keeps own broadcasts
 * from echoing back.
 */
export function useRealtimeChannel(
  channelName: string | null,
  configure: (channel: RealtimeChannel) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const configureRef = useRef(configure);
  configureRef.current = configure;

  useEffect(() => {
    if (!channelName) {
      channelRef.current = null;
      return;
    }
    const channel = supabase.channel(channelName, { config: { broadcast: { self: false } } });
    configureRef.current(channel);
    channel.subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [channelName]);

  return channelRef;
}
