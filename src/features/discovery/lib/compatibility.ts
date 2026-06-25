import { Profile } from '@/features/profile/types';

export interface Compatibility {
  /** 0–100 stylistic match score. */
  score: number;
  /** Emoji reflecting the score band. */
  emoji: string;
  /** 2–3 short human reasons, highest-signal first. */
  reasons: string[];
}

interface WeightedReason {
  weight: number;
  text: string;
}

const sameStr = (a: string | null, b: string | null): boolean => a != null && a === b;
const closeNum = (a: number | null, b: number | null, within: number): boolean =>
  a != null && b != null && Math.abs(a - b) <= within;

interface Rule {
  weight: number;
  matches: (a: Profile, b: Profile) => boolean;
  reason: (a: Profile, b: Profile) => string;
}

// Each satisfied rule adds its weight to the score and contributes a reason.
// Weights also rank reasons so the strongest signals surface first.
const RULES: Rule[] = [
  { weight: 14, matches: (a, b) => sameStr(a.sleep_schedule, b.sleep_schedule), reason: () => 'Similar sleep schedules' },
  { weight: 12, matches: (a, b) => closeNum(a.cleanliness, b.cleanliness, 1), reason: () => 'Similar cleanliness expectations' },
  {
    weight: 11,
    matches: (a, b) => sameStr(a.noise_preference, b.noise_preference),
    reason: (a) => (a.noise_preference === 'need_quiet' ? 'Both prefer quiet study environments' : 'Similar noise preferences'),
  },
  {
    weight: 10,
    matches: (a, b) => closeNum(a.social_level, b.social_level, 1),
    reason: (a, b) => ((a.social_level ?? 0) >= 4 && (b.social_level ?? 0) >= 4 ? 'Both enjoy social activities' : 'Similar social energy'),
  },
  { weight: 9, matches: (a, b) => sameStr(a.guests_frequency, b.guests_frequency), reason: () => 'Similar guest preferences' },
  {
    weight: 8,
    matches: (a, b) => sameStr(a.study_style, b.study_style),
    reason: (a) => (a.study_style === 'mostly_library' ? 'Both study at the library' : 'Similar study styles'),
  },
  { weight: 7, matches: (a, b) => sameStr(a.bedtime, b.bedtime), reason: () => 'Similar bedtimes' },
  { weight: 6, matches: (a, b) => sameStr(a.room_temperature, b.room_temperature), reason: () => 'Similar room temperature' },
  { weight: 6, matches: (a, b) => sameStr(a.smoking, b.smoking), reason: () => 'Aligned on smoking' },
  { weight: 5, matches: (a, b) => sameStr(a.fitness, b.fitness), reason: () => 'Similar fitness habits' },
];

const BASE_SCORE = 45;
const MAX_SCORE = 99;
const INTEREST_POINTS = 3;
const INTEREST_CAP = 15;
const MAJOR_POINTS = 6;

// Deterministic, school-true fillers so there are always at least two reasons.
const FALLBACK_REASONS = ['On the same campus', 'New to campus together', 'Worth saying hi'];

function emojiFor(score: number): string {
  if (score >= 90) return '🔥';
  if (score >= 78) return '✨';
  if (score >= 65) return '😄';
  if (score >= 50) return '🙂';
  return '🤔';
}

function overlap(a: string[] | null, b: string[] | null): string[] {
  if (!a || !b) return [];
  const other = new Set(b);
  return a.filter((x) => other.has(x));
}

/**
 * Stylistic compatibility between the viewer and a candidate. Not a scientific
 * metric — a deterministic, feel-good score (45 base + weighted overlaps, capped
 * at 99) with the top 2–3 reasons surfaced.
 */
export function computeCompatibility(viewer: Profile, candidate: Profile): Compatibility {
  let score = BASE_SCORE;
  const reasons: WeightedReason[] = [];

  for (const rule of RULES) {
    if (rule.matches(viewer, candidate)) {
      score += rule.weight;
      reasons.push({ weight: rule.weight, text: rule.reason(viewer, candidate) });
    }
  }

  const sharedInterests = overlap(viewer.interests, candidate.interests);
  if (sharedInterests.length > 0) {
    score += Math.min(sharedInterests.length * INTEREST_POINTS, INTEREST_CAP);
    reasons.push({
      weight: 9.5,
      text: sharedInterests.length >= 2 ? `${sharedInterests.length} shared interests` : '1 shared interest',
    });
  }

  const sharedMajor = overlap(viewer.majors, candidate.majors)[0];
  if (sharedMajor) {
    score += MAJOR_POINTS;
    reasons.push({ weight: 8.5, text: `Both studying ${sharedMajor}` });
  }

  score = Math.max(0, Math.min(MAX_SCORE, Math.round(score)));

  const ranked = reasons.sort((a, b) => b.weight - a.weight).map((r) => r.text);
  const out = ranked.slice(0, 3);
  for (const fallback of FALLBACK_REASONS) {
    if (out.length >= 2) break;
    if (!out.includes(fallback)) out.push(fallback);
  }

  return { score, emoji: emojiFor(score), reasons: out };
}
