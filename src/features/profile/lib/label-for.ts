interface LabeledOption {
  value: string;
  label: string;
}

/** Map a stored enum value to its human label via an options list (e.g. SLEEP_SCHEDULE).
 *  Returns '' for null/undefined, and falls back to the raw value if unmatched. */
export function labelFor(options: readonly LabeledOption[], value: string | null | undefined): string {
  if (value == null || value === '') return '';
  return options.find((o) => o.value === value)?.label ?? value;
}
