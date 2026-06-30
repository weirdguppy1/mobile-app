import { DiscoverWashes, type DiscoverWash } from '@/constants/theme';

/** A randomly chosen ambient wash from the pool. Discover picks a fresh one each
 *  time a new profile is presented, so browsing feels lively and every user gets
 *  a different color wash (see discover.tsx). */
export function randomWash(): DiscoverWash {
  return DiscoverWashes[Math.floor(Math.random() * DiscoverWashes.length)];
}
