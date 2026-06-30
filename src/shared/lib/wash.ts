import { DiscoverWashes, type DiscoverWash } from '@/constants/theme';

/** Stable index into DiscoverWashes from a profile id (FNV-ish string hash). */
export function washIndexForId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % DiscoverWashes.length;
}

/** The ambient wash for a given profile id — same id ⇒ same wash. */
export function washForId(id: string): DiscoverWash {
  return DiscoverWashes[washIndexForId(id)];
}
