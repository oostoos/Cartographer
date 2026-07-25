const DEFAULT_MAX_INITIALS = 2;

/** Uppercase initials from a name's first `maxInitials` words, e.g. "Austin Shank" -> "AS". Returns "" for a blank name. */
export function getInitials(name: string, maxInitials: number = DEFAULT_MAX_INITIALS): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxInitials)
    .map((word) => word[0].toUpperCase())
    .join("");
}
