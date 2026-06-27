import { Linking, View } from 'react-native';

import { SocialIcon } from '@/features/profile/components/SocialIcon';
import { buildSocialLinks } from '@/features/profile/lib/social-links';
import { Profile } from '@/features/profile/types';
import { PressScale } from '@/shared/components';

const LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  snapchat: 'Snapchat',
};

/** A row of tappable brand-coloured social badges (Instagram / LinkedIn / Snapchat).
 *  Renders only the links the user set; nothing if none. Each opens the profile via the
 *  system browser or the installed app. */
export function SocialsBar({ profile }: { profile: Profile }) {
  const links = buildSocialLinks(profile);
  if (links.length === 0) return null;

  return (
    <View className="flex-row gap-3">
      {links.map((link) => (
        <PressScale
          key={link.key}
          accessibilityRole="link"
          accessibilityLabel={LABELS[link.key]}
          hitSlop={8}
          onPress={() => Linking.openURL(link.url).catch(() => {})}>
          <SocialIcon name={link.key} size={44} />
        </PressScale>
      ))}
    </View>
  );
}
