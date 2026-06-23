/** Whitespace-delimited word count. Empty / whitespace-only → 0. */
export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
