import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { apiClient } from '../client';
import type { ApiError } from '../types';

/**
 * Property-Based Tests for API Client
 * Validates: Requirements 1.2, 1.3, 1.4, 6.1, 7.1, 7.2, 7.3
 */

// Mock the token store module
vi.mock('../token-store', () => ({
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

import { getToken } from '../token-store';

const mockedGetToken = vi.mocked(getToken);

describe('API Client Property Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    globalThis.fetch = vi.fn();
    mockedGetToken.mockReturnValue(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Helper to create a successful mock response
  function mockSuccessResponse() {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  /**
   * Property 1: URL Construction
   * For any valid path, URL is `${baseUrl}/api${path}`
   *
   * **Validates: Requirements 1.2, 6.1**
   */
  describe('Property 1: URL Construction', () => {
    // Generator for valid API path segments (starting with /)
    const pathSegmentArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]{0,19}$/);
    const pathArb = fc
      .array(pathSegmentArb, { minLength: 1, maxLength: 5 })
      .map((segments) => '/' + segments.join('/'));

    it('should construct URL as baseUrl + /api + path for any valid path', async () => {
      await fc.assert(
        fc.asyncProperty(pathArb, async (path) => {
          (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
          mockedGetToken.mockReturnValue(null);
          mockSuccessResponse();

          await apiClient({ method: 'GET', path });

          const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
          const expectedUrl = `http://localhost:1337/api${path}`;

          expect(calledUrl).toBe(expectedUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve path structure regardless of segment count', async () => {
      await fc.assert(
        fc.asyncProperty(pathArb, async (path) => {
          (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
          mockedGetToken.mockReturnValue(null);
          mockSuccessResponse();

          await apiClient({ method: 'GET', path });

          const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;

          // URL must start with base + /api
          expect(calledUrl.startsWith('http://localhost:1337/api')).toBe(true);
          // URL after base+/api must equal the path
          const urlPath = calledUrl.replace('http://localhost:1337/api', '');
          expect(urlPath).toBe(path);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Request Header Injection
   * Token presence → Bearer header; body presence → Content-Type header
   *
   * **Validates: Requirements 1.3, 1.4**
   */
  describe('Property 2: Request Header Injection', () => {
    const tokenArb = fc.stringMatching(/^[a-zA-Z0-9]{10,50}$/);

    const bodyArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
    });

    it('should include Bearer token header when token is present', async () => {
      await fc.assert(
        fc.asyncProperty(tokenArb, async (token) => {
          (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
          mockedGetToken.mockReturnValue(token);
          mockSuccessResponse();

          await apiClient({ method: 'GET', path: '/test' });

          const callOptions = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
          expect(callOptions.headers['Authorization']).toBe(`Bearer ${token}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include Authorization header when no token exists', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
          mockedGetToken.mockReturnValue(null);
          mockSuccessResponse();

          await apiClient({ method: 'GET', path: '/test' });

          const callOptions = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
          expect(callOptions.headers['Authorization']).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should include Content-Type header when body is present', async () => {
      await fc.assert(
        fc.asyncProperty(bodyArb, async (body) => {
          (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
          mockedGetToken.mockReturnValue(null);
          mockSuccessResponse();

          await apiClient({ method: 'POST', path: '/test', body });

          const callOptions = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
          expect(callOptions.headers['Content-Type']).toBe('application/json');
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include Content-Type header when no body is present', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(undefined), async () => {
          (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
          mockedGetToken.mockReturnValue(null);
          mockSuccessResponse();

          await apiClient({ method: 'GET', path: '/test' });

          const callOptions = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
          expect(callOptions.headers['Content-Type']).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly combine token and body headers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            hasToken: fc.boolean(),
            hasBody: fc.boolean(),
            token: tokenArb,
            body: bodyArb,
          }),
          async ({ hasToken, hasBody, token, body }) => {
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
            mockedGetToken.mockReturnValue(hasToken ? token : null);
            mockSuccessResponse();

            await apiClient({
              method: hasBody ? 'POST' : 'GET',
              path: '/test',
              body: hasBody ? body : undefined,
            });

            const callOptions = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];

            if (hasToken) {
              expect(callOptions.headers['Authorization']).toBe(`Bearer ${token}`);
            } else {
              expect(callOptions.headers['Authorization']).toBeUndefined();
            }

            if (hasBody) {
              expect(callOptions.headers['Content-Type']).toBe('application/json');
            } else {
              expect(callOptions.headers['Content-Type']).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Error Response Parsing
   * 4xx/5xx with JSON error body → structured ApiError
   *
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  describe('Property 10: Error Response Parsing', () => {
    // Generate error status codes (400-599)
    const errorStatusArb = fc.integer({ min: 400, max: 599 });

    const errorNameArb = fc.stringMatching(/^[a-zA-Z]{3,30}$/);

    const errorMessageArb = fc.stringMatching(/^[a-zA-Z0-9 .,!?]{1,100}$/);

    it('should parse error response into structured ApiError with correct status, name, and message', async () => {
      await fc.assert(
        fc.asyncProperty(
          errorStatusArb,
          errorNameArb,
          errorMessageArb,
          async (status, name, message) => {
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
            mockedGetToken.mockReturnValue(null);

            const errorBody = JSON.stringify({
              error: { status, name, message },
            });

            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
              new Response(errorBody, {
                status,
                headers: { 'Content-Type': 'application/json' },
              })
            );

            try {
              await apiClient({ method: 'GET', path: '/users' });
              expect.fail('Expected apiClient to throw');
            } catch (error) {
              const apiError = error as ApiError;
              expect(apiError.status).toBe(status);
              expect(apiError.name).toBe(name);
              expect(apiError.message).toBe(message);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should parse validation details from 400 responses with details.errors array', async () => {
      const validationErrorArb = fc.record({
        path: fc.array(fc.stringMatching(/^[a-zA-Z]{1,20}$/), { minLength: 1, maxLength: 3 }),
        message: fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/),
      });

      await fc.assert(
        fc.asyncProperty(
          errorNameArb,
          errorMessageArb,
          fc.array(validationErrorArb, { minLength: 1, maxLength: 5 }),
          async (name, message, validationErrors) => {
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
            mockedGetToken.mockReturnValue(null);

            const errorBody = JSON.stringify({
              error: {
                status: 400,
                name,
                message,
                details: {
                  errors: validationErrors,
                },
              },
            });

            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
              new Response(errorBody, {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              })
            );

            try {
              await apiClient({ method: 'POST', path: '/users' });
              expect.fail('Expected apiClient to throw');
            } catch (error) {
              const apiError = error as ApiError;
              expect(apiError.status).toBe(400);
              expect(apiError.name).toBe(name);
              expect(apiError.message).toBe(message);
              expect(apiError.details).toBeDefined();
              expect(apiError.details).toHaveLength(validationErrors.length);

              apiError.details!.forEach((detail, i) => {
                expect(detail.path).toEqual(validationErrors[i].path);
                expect(detail.message).toBe(validationErrors[i].message);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce UnknownError with fallback message for error responses without error object', async () => {
      await fc.assert(
        fc.asyncProperty(errorStatusArb, async (status) => {
          (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
          mockedGetToken.mockReturnValue(null);

          // JSON body but no `error` key
          const errorBody = JSON.stringify({ someOtherField: 'value' });

          (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
            new Response(errorBody, {
              status,
              headers: { 'Content-Type': 'application/json' },
            })
          );

          try {
            await apiClient({ method: 'GET', path: '/users' });
            expect.fail('Expected apiClient to throw');
          } catch (error) {
            const apiError = error as ApiError;
            expect(apiError.status).toBe(status);
            expect(apiError.name).toBe('UnknownError');
            expect(apiError.message).toBe(`Request failed with status ${status}`);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
