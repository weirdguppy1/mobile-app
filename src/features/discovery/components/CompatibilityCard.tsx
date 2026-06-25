import { ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Brand } from '@/constants/theme';
import { Compatibility } from '@/features/discovery/lib/compatibility';
import { PressScale } from '@/shared/components';

const COUNT_UP_MS = 900;

/** Counts from 0 → target once on mount (easeOutCubic). Since the discovery card
 *  remounts per candidate, this runs exactly once each time a profile enters view. */
function useCountUp(target: number, duration = COUNT_UP_MS): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/** Compact compatibility readout: emoji + animated score on one line, with a
 *  "How so?" toggle that expands the reasons. Chrome stays monochrome (DESIGN.md). */
export function CompatibilityCard({ compatibility }: { compatibility: Compatibility }) {
  const { score, emoji, reasons } = compatibility;
  const display = useCountUp(score);
  const [open, setOpen] = useState(false);
  const chevron = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${chevron.value * 180}deg` }] }));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    chevron.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  return (
    <Animated.View layout={LinearTransition.duration(220)} className="card border-continuous shadow-card gap-3 px-5 py-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl">{emoji}</Text>
        <Text className="font-display text-2xl tracking-tight text-ink">{display}%</Text>
        <Text className="prose-footnote text-graphite">compatible</Text>
        <View className="flex-1" />
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={open ? 'Hide reasons' : 'See why you are compatible'}
          hitSlop={8}
          onPress={toggle}
          className="flex-row items-center gap-1">
          <Text className="prose-caption font-semibold text-slate">{open ? 'Hide' : 'How so?'}</Text>
          <Animated.View style={chevronStyle}>
            <ChevronDown size={14} color={Brand.slate} strokeWidth={2.5} />
          </Animated.View>
        </PressScale>
      </View>

      {open ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          className="flex-row flex-wrap gap-2">
          {reasons.map((reason) => (
            <View key={reason} className="rounded-full bg-wash px-3 py-1.5">
              <Text className="prose-caption text-graphite">{reason}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
