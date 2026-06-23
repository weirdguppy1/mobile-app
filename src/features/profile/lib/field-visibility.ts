/** Per-field profile visibility, backed by profiles.hidden_fields (an array of
 *  field ids the user hides from other people). Default = visible (not listed). */

export function isFieldHidden(hiddenFields: string[], id: string): boolean {
  return hiddenFields.includes(id);
}

/** Return the next hidden_fields set after toggling one field's visibility. */
export function toggleHidden(hiddenFields: string[], id: string, visible: boolean): string[] {
  const set = new Set(hiddenFields);
  if (visible) set.delete(id);
  else set.add(id);
  return Array.from(set);
}
