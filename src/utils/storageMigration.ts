/**
 * `persist` only ever looks at its own key, so renaming a store's key orphans
 * whatever the user already had. Move the raw payload across before the store
 * is created; reshaping it is left to the store's own `migrate`.
 */
export function adoptLegacyStorageKey(legacyKey: string, currentKey: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(currentKey) !== null) return;

    const legacy = localStorage.getItem(legacyKey);
    if (legacy === null) return;

    localStorage.setItem(currentKey, legacy);
    localStorage.removeItem(legacyKey);
  } catch {
    // Private mode or a full quota: start fresh rather than break app boot.
  }
}
