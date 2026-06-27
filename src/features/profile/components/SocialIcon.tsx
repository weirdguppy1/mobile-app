import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { SocialKey } from '@/features/profile/lib/social-links';

interface SocialIconProps {
  name: SocialKey;
  size?: number;
}

// Per-brand badge background + the glyph colour that reads on it. Instagram uses its
// signature corner-to-corner gradient; Snapchat is yellow, so its ghost is dark for
// legibility (white-on-yellow washes out at this size).
const FOREGROUND: Record<SocialKey, string> = {
  instagram: '#ffffff',
  linkedin: '#ffffff',
  snapchat: '#1a1a1a',
};

/** Brand-coloured social badge (circular). Drawn entirely in SVG — a coloured disc
 *  plus the white/dark glyph — so the gradient and fills travel with the icon.
 *  lucide-react-native dropped its brand icons, so these are inlined here. */
export function SocialIcon({ name, size = 44 }: SocialIconProps) {
  const fg = FOREGROUND[name];
  const stroke = {
    stroke: fg,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  // Glyphs are authored in a 24×24 box; inset them inside the 24-unit badge disc.
  const glyphTransform = 'translate(4 4) scale(0.6667)';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="igGrad" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#FEDA75" />
          <Stop offset="0.25" stopColor="#FA7E1E" />
          <Stop offset="0.5" stopColor="#D62976" />
          <Stop offset="0.75" stopColor="#962FBF" />
          <Stop offset="1" stopColor="#4F5BD5" />
        </LinearGradient>
      </Defs>

      <Circle
        cx={12}
        cy={12}
        r={12}
        fill={name === 'instagram' ? 'url(#igGrad)' : name === 'linkedin' ? '#0A66C2' : '#FFFC00'}
      />

      <G transform={glyphTransform}>
        {name === 'instagram' ? (
          <>
            <Rect x={2} y={2} width={20} height={20} rx={5} ry={5} {...stroke} />
            <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" {...stroke} />
            <Line x1={17.5} y1={6.5} x2={17.51} y2={6.5} {...stroke} />
          </>
        ) : null}
        {name === 'linkedin' ? (
          <>
            <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" {...stroke} />
            <Rect x={2} y={9} width={4} height={12} {...stroke} />
            <Circle cx={4} cy={4} r={2} {...stroke} />
          </>
        ) : null}
        {name === 'snapchat' ? (
          <>
            <Path d="M9 10h.01" {...stroke} />
            <Path d="M15 10h.01" {...stroke} />
            <Path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" {...stroke} />
          </>
        ) : null}
      </G>
    </Svg>
  );
}
