const DEFAULT_MAX_LENGTH = 20;

/**
 * Truncates a username to the specified max length, appending "..." if truncated.
 * If the username is already within the limit, it is returned unchanged.
 */
export function truncateUsername(username: string, maxLength: number = DEFAULT_MAX_LENGTH): string {
  if (username.length > maxLength) {
    return username.slice(0, maxLength) + '...';
  }
  return username;
}
