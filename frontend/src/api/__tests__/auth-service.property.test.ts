import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ApiError } from '../types';

/**
 * Property-Based Tests for Auth Service
 * Validates: Requirements 2.2, 2.3, 2.6, 3.2, 3.3
 */

// Mock the client module
vi.mock('../client', () => ({
  apiClient: vi.fn(),
}));

// Mock the token-store module
vi.mock('../token-store', () => ({
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

import { apiClient } from '../client';
import { setToken } from '../token-store';
import { login, register } from '../auth-service';

const mockedApiClient = vi.mocked(apiClient);
const mockedSetToken = vi.mocked(setToken);

describe('Auth Service Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 3: Token Storage on Authentication Success
   * For any successful authentication response containing a `jwt` field with a
   * non-empty string value, the Token Store SHALL contain that exact JWT string
   * after the operation completes.
   *
   * **Validates: Requirements 2.2, 3.2**
   */
  describe('Property 3: Token Storage on Authentication Success', () => {
    const jwtArb = fc.string({ minLength: 1, maxLength: 200 });

    const userArb = fc.record({
      id: fc.nat(),
      username: fc.string({ minLength: 1, maxLength: 50 }),
      email: fc.string({ minLength: 1, maxLength: 50 }),
    });

    it('login stores JWT in Token Store on successful auth response', async () => {
      await fc.assert(
        fc.asyncProperty(jwtArb, userArb, async (jwt, user) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue({ jwt, user });

          await login({ identifier: 'test@example.com', password: 'password123' });

          expect(mockedSetToken).toHaveBeenCalledOnce();
          expect(mockedSetToken).toHaveBeenCalledWith(jwt);
        }),
        { numRuns: 100 }
      );
    });

    it('register stores JWT in Token Store on successful auth response', async () => {
      await fc.assert(
        fc.asyncProperty(jwtArb, userArb, async (jwt, user) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue({ jwt, user });

          await register({ username: 'testuser', email: 'test@example.com', password: 'password123' });

          expect(mockedSetToken).toHaveBeenCalledOnce();
          expect(mockedSetToken).toHaveBeenCalledWith(jwt);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: User Extraction from Authentication Response
   * For any successful authentication response containing a `user` object with
   * `id`, `username`, and `email` fields, the Auth Service SHALL return an object
   * containing those exact field values without loss or mutation.
   *
   * **Validates: Requirements 2.3, 3.3**
   */
  describe('Property 4: User Extraction from Authentication Response', () => {
    const jwtArb = fc.string({ minLength: 1, maxLength: 200 });

    const userArb = fc.record({
      id: fc.nat(),
      username: fc.string({ minLength: 1, maxLength: 50 }),
      email: fc.string({ minLength: 1, maxLength: 50 }),
    });

    it('login preserves user fields without mutation', async () => {
      await fc.assert(
        fc.asyncProperty(jwtArb, userArb, async (jwt, user) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue({ jwt, user });

          const result = await login({ identifier: 'test@example.com', password: 'password123' });

          expect(result.user.id).toBe(user.id);
          expect(result.user.username).toBe(user.username);
          expect(result.user.email).toBe(user.email);
        }),
        { numRuns: 100 }
      );
    });

    it('register preserves user fields without mutation', async () => {
      await fc.assert(
        fc.asyncProperty(jwtArb, userArb, async (jwt, user) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue({ jwt, user });

          const result = await register({ username: 'testuser', email: 'test@example.com', password: 'password123' });

          expect(result.user.id).toBe(user.id);
          expect(result.user.username).toBe(user.username);
          expect(result.user.email).toBe(user.email);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Malformed Authentication Response Detection
   * For any response object that is missing the `jwt` field OR the `user` field
   * (or both), the Auth Service SHALL return an ApiError rather than attempting
   * to proceed with authentication.
   *
   * **Validates: Requirements 2.6**
   */
  describe('Property 5: Malformed Authentication Response Detection', () => {
    const missingJwtArb = fc.record({
      user: fc.record({
        id: fc.nat(),
        username: fc.string({ minLength: 1, maxLength: 50 }),
        email: fc.string({ minLength: 1, maxLength: 50 }),
      }),
    });

    const missingUserArb = fc.record({
      jwt: fc.string({ minLength: 1, maxLength: 200 }),
    });

    const missingBothArb = fc.record({
      someField: fc.string(),
    });

    const emptyJwtArb = fc.record({
      jwt: fc.constant(''),
      user: fc.record({
        id: fc.nat(),
        username: fc.string({ minLength: 1, maxLength: 50 }),
        email: fc.string({ minLength: 1, maxLength: 50 }),
      }),
    });

    const nullUserArb = fc.record({
      jwt: fc.string({ minLength: 1, maxLength: 200 }),
      user: fc.constant(null),
    });

    it('login throws ApiError when jwt is missing from response', async () => {
      await fc.assert(
        fc.asyncProperty(missingJwtArb, async (response) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue(response);

          try {
            await login({ identifier: 'test@example.com', password: 'password123' });
            expect.fail('Expected login to throw');
          } catch (error) {
            const apiError = error as ApiError;
            expect(apiError.status).toBe(0);
            expect(apiError.name).toBe('UnexpectedResponseError');
            expect(apiError.message).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('login throws ApiError when user is missing from response', async () => {
      await fc.assert(
        fc.asyncProperty(missingUserArb, async (response) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue(response);

          try {
            await login({ identifier: 'test@example.com', password: 'password123' });
            expect.fail('Expected login to throw');
          } catch (error) {
            const apiError = error as ApiError;
            expect(apiError.status).toBe(0);
            expect(apiError.name).toBe('UnexpectedResponseError');
            expect(apiError.message).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('login throws ApiError when both jwt and user are missing', async () => {
      await fc.assert(
        fc.asyncProperty(missingBothArb, async (response) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue(response);

          try {
            await login({ identifier: 'test@example.com', password: 'password123' });
            expect.fail('Expected login to throw');
          } catch (error) {
            const apiError = error as ApiError;
            expect(apiError.status).toBe(0);
            expect(apiError.name).toBe('UnexpectedResponseError');
            expect(apiError.message).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('login throws ApiError when jwt is empty string', async () => {
      await fc.assert(
        fc.asyncProperty(emptyJwtArb, async (response) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue(response);

          try {
            await login({ identifier: 'test@example.com', password: 'password123' });
            expect.fail('Expected login to throw');
          } catch (error) {
            const apiError = error as ApiError;
            expect(apiError.status).toBe(0);
            expect(apiError.name).toBe('UnexpectedResponseError');
            expect(apiError.message).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('login throws ApiError when user is null', async () => {
      await fc.assert(
        fc.asyncProperty(nullUserArb, async (response) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue(response);

          try {
            await login({ identifier: 'test@example.com', password: 'password123' });
            expect.fail('Expected login to throw');
          } catch (error) {
            const apiError = error as ApiError;
            expect(apiError.status).toBe(0);
            expect(apiError.name).toBe('UnexpectedResponseError');
            expect(apiError.message).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('register throws ApiError when response is malformed', async () => {
      const malformedResponseArb = fc.oneof(
        missingJwtArb,
        missingUserArb,
        missingBothArb,
        emptyJwtArb,
        nullUserArb,
      );

      await fc.assert(
        fc.asyncProperty(malformedResponseArb, async (response) => {
          vi.clearAllMocks();
          mockedApiClient.mockResolvedValue(response);

          try {
            await register({ username: 'testuser', email: 'test@example.com', password: 'password123' });
            expect.fail('Expected register to throw');
          } catch (error) {
            const apiError = error as ApiError;
            expect(apiError.status).toBe(0);
            expect(apiError.name).toBe('UnexpectedResponseError');
            expect(apiError.message).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
