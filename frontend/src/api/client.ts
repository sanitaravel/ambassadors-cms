import type { ApiError, ValidationError } from './types';
import { getToken, removeToken } from './token-store';

export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  params?: Record<string, unknown>;
}

const BASE_URL =
  (import.meta.env.VITE_STRAPI_URL as string | undefined) ?? 'http://localhost:1337';

const TIMEOUT_MS = 30_000;

const AUTH_PATHS = ['/auth/local', '/auth/local/register'];

function isAuthEndpoint(path: string): boolean {
  return AUTH_PATHS.some((authPath) => path === authPath || path.startsWith(`${authPath}?`));
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${BASE_URL}/api${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}

function buildHeaders(body?: unknown): Record<string, string> {
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let bodyText: string;

  try {
    bodyText = await response.text();
  } catch {
    return {
      status: response.status,
      name: 'UnknownError',
      message: `Request failed with status ${response.status}`,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    // Non-JSON response body (Requirement 7.6)
    return {
      status: response.status,
      name: 'UnknownError',
      message: 'Server returned an unexpected response format',
    };
  }

  const errorObj =
    typeof json === 'object' && json !== null && 'error' in json
      ? (json as { error: Record<string, unknown> }).error
      : null;

  if (errorObj && typeof errorObj === 'object') {
    const name = typeof errorObj.name === 'string' ? errorObj.name : 'UnknownError';
    const message =
      typeof errorObj.message === 'string' && errorObj.message.length > 0
        ? errorObj.message
        : `Request failed with status ${response.status}`;

    let details: ValidationError[] | undefined;

    if (
      response.status === 400 &&
      errorObj.details &&
      typeof errorObj.details === 'object' &&
      'errors' in (errorObj.details as Record<string, unknown>)
    ) {
      const rawErrors = (errorObj.details as { errors: unknown[] }).errors;
      if (Array.isArray(rawErrors)) {
        details = rawErrors.map((err: unknown) => {
          const e = err as Record<string, unknown>;
          return {
            path: Array.isArray(e.path) ? (e.path as string[]) : [],
            message: typeof e.message === 'string' ? e.message : 'Unknown validation error',
          };
        });
      }
    }

    return { status: response.status, name, message, details };
  }

  // JSON body but no `error` object
  return {
    status: response.status,
    name: 'UnknownError',
    message: `Request failed with status ${response.status}`,
  };
}

export async function apiClient<T>(options: ApiRequestOptions): Promise<T> {
  const { method, path, body, params } = options;

  const url = buildUrl(path, params);
  const headers = buildHeaders(body);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Network error or timeout (Requirement 7.4)
    const isAbort =
      error instanceof DOMException && error.name === 'AbortError';

    const apiError: ApiError = {
      status: 0,
      name: isAbort ? 'TimeoutError' : 'NetworkError',
      message: isAbort
        ? 'Request timed out after 30 seconds'
        : 'A network error occurred. Please check your connection.',
    };

    throw apiError;
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const apiError = await parseErrorResponse(response);

    // On 401 for non-auth endpoints, clear token and dispatch event (Requirement 7.5)
    if (response.status === 401 && !isAuthEndpoint(path)) {
      removeToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    throw apiError;
  }

  // Handle 204 No Content (e.g., DELETE responses)
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data: T = await response.json();
  return data;
}
