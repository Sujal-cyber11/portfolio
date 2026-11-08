export interface PlaceholderAware {
  placeholder?: boolean;
}

export function shouldShowEntry(
  entry: PlaceholderAware,
  isProduction: boolean,
): boolean {
  return !isProduction || entry.placeholder !== true;
}

export function filterVisibleEntries<T extends PlaceholderAware>(
  entries: readonly T[],
  isProduction: boolean,
): T[] {
  return entries.filter((entry) => shouldShowEntry(entry, isProduction));
}
