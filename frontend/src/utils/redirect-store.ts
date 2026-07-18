const REDIRECT_KEY = 'ambassador_redirect_path';

/**
 * Stores the given path in localStorage so the user can be redirected
 * back to it after authentication.
 */
export function storeRedirectPath(path: string): void {
  localStorage.setItem(REDIRECT_KEY, path);
}

/**
 * Retrieves the stored redirect path, or null if none is stored.
 */
export function getRedirectPath(): string | null {
  return localStorage.getItem(REDIRECT_KEY);
}

/**
 * Removes the stored redirect path from localStorage.
 */
export function clearRedirectPath(): void {
  localStorage.removeItem(REDIRECT_KEY);
}
