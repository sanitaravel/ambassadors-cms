import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';

import { login, getMe } from '../../api/auth-service';
import { createClub, approveClub } from '../../api/club-service';
import { createEvent } from '../../api/event-service';
import { getToken, setToken, removeToken } from '../../api/token-store';
import { apiClient } from '../../api/client';

const BASE_URL = 'http://localhost:1337/api';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

beforeEach(() => {
  localStorage.clear();
});

describe('Full login → profile fetch → role assignment flow', () => {
  it('stores JWT on login, then fetches profile with ambassador role populated', async () => {
    const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token';
    const mockUser = { id: 1, username: 'testuser', email: 'test@srh.de' };

    server.use(
      http.post(`${BASE_URL}/auth/local`, async () => {
        return HttpResponse.json({ jwt: mockJwt, user: mockUser });
      }),
      http.get(`${BASE_URL}/users/me`, async ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        expect(authHeader).toBe(`Bearer ${mockJwt}`);

        return HttpResponse.json({
          id: 1,
          username: 'testuser',
          email: 'test@srh.de',
          ambassador_profile: { id: 10, documentId: 'amb-1', focus_area: 'Academic' },
          student_profile: null,
          professor_profile: null,
        });
      }),
    );

    // Step 1: Login
    const authResponse = await login({ identifier: 'test@srh.de', password: 'pass123' });
    expect(authResponse.jwt).toBe(mockJwt);
    expect(authResponse.user).toEqual(mockUser);

    // Verify JWT is stored
    expect(getToken()).toBe(mockJwt);

    // Step 2: Fetch profile with populated relations
    const profile = await getMe(['ambassador_profile', 'student_profile', 'professor_profile']);
    expect(profile.ambassador_profile).toBeTruthy();
    expect(profile.ambassador_profile!.focus_area).toBe('Academic');
    expect(profile.student_profile).toBeNull();
    expect(profile.professor_profile).toBeNull();
  });
});

describe('Club creation → pending state', () => {
  it('wraps data in { data } envelope and returns unwrapped entity', async () => {
    const mockJwt = 'club-test-token';
    setToken(mockJwt);

    let capturedBody: unknown;

    server.use(
      http.post(`${BASE_URL}/activity-clubs`, async ({ request }) => {
        capturedBody = await request.json();

        return HttpResponse.json({
          data: {
            id: 5,
            documentId: 'club-abc123',
            name: 'Chess Club',
            description: undefined,
            users_permissions_user: { id: 42 },
          },
          meta: {},
        });
      }),
    );

    const result = await createClub({ name: 'Chess Club' }, 42);

    // Verify the request body was wrapped in { data: ... }
    expect(capturedBody).toEqual({
      data: {
        name: 'Chess Club',
        description: undefined,
        users_permissions_user: 42,
      },
    });

    // Verify the response is unwrapped (returns data, not { data, meta })
    expect(result.id).toBe(5);
    expect(result.documentId).toBe('club-abc123');
    expect(result.name).toBe('Chess Club');
  });
});

describe('Event creation with datetime validation rejection', () => {
  it('throws ApiError without network request when ends_at <= starts_at', async () => {
    setToken('some-token');

    // Set up a handler that should NOT be called
    let networkRequestMade = false;
    server.use(
      http.post(`${BASE_URL}/events`, async () => {
        networkRequestMade = true;
        return HttpResponse.json({ data: {}, meta: {} });
      }),
    );

    // ends_at is before starts_at
    await expect(
      createEvent({
        title: 'Invalid Event',
        starts_at: '2025-03-15T14:00:00.000Z',
        ends_at: '2025-03-15T12:00:00.000Z',
        creator: 1,
      }),
    ).rejects.toMatchObject({
      status: 400,
      name: 'ValidationError',
      message: 'End time must be after start time',
      details: [{ path: ['ends_at'], message: 'End time must be after start time' }],
    });

    expect(networkRequestMade).toBe(false);
  });

  it('throws ApiError when ends_at equals starts_at', async () => {
    setToken('some-token');

    let networkRequestMade = false;
    server.use(
      http.post(`${BASE_URL}/events`, async () => {
        networkRequestMade = true;
        return HttpResponse.json({ data: {}, meta: {} });
      }),
    );

    await expect(
      createEvent({
        title: 'Same Time Event',
        starts_at: '2025-03-15T14:00:00.000Z',
        ends_at: '2025-03-15T14:00:00.000Z',
        creator: 1,
      }),
    ).rejects.toMatchObject({
      status: 400,
      name: 'ValidationError',
    });

    expect(networkRequestMade).toBe(false);
  });
});

describe('Ambassador approval flow', () => {
  it('POSTs to correct publish endpoint for club approval', async () => {
    const mockJwt = 'admin-token';
    setToken(mockJwt);

    const documentId = 'club-doc-xyz';
    let capturedMethod: string | undefined;
    let capturedUrl: string | undefined;

    server.use(
      http.post(`${BASE_URL}/activity-clubs/${documentId}/actions/publish`, async ({ request }) => {
        capturedMethod = request.method;
        capturedUrl = request.url;

        return HttpResponse.json({
          data: {
            id: 5,
            documentId,
            name: 'Approved Club',
          },
          meta: {},
        });
      }),
    );

    const result = await approveClub(documentId);

    expect(capturedMethod).toBe('POST');
    expect(capturedUrl).toBe(`${BASE_URL}/activity-clubs/${documentId}/actions/publish`);
    expect(result.documentId).toBe(documentId);
    expect(result.name).toBe('Approved Club');
  });
});

describe('401 global interceptor clears session', () => {
  it('removes token and dispatches auth:expired on 401 for non-auth endpoints', async () => {
    setToken('expired-token');

    // Spy on the auth:expired custom event
    const authExpiredHandler = vi.fn();
    window.addEventListener('auth:expired', authExpiredHandler);

    server.use(
      http.get(`${BASE_URL}/users/me`, async () => {
        return HttpResponse.json(
          { error: { status: 401, name: 'UnauthorizedError', message: 'Invalid token' } },
          { status: 401 },
        );
      }),
    );

    // Make a request that will get 401
    await expect(
      apiClient({ method: 'GET', path: '/users/me' }),
    ).rejects.toMatchObject({
      status: 401,
      name: 'UnauthorizedError',
    });

    // Verify token was removed
    expect(getToken()).toBeNull();

    // Verify auth:expired event was dispatched
    expect(authExpiredHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener('auth:expired', authExpiredHandler);
  });

  it('does NOT clear token on 401 for auth endpoints', async () => {
    setToken('some-token');

    const authExpiredHandler = vi.fn();
    window.addEventListener('auth:expired', authExpiredHandler);

    server.use(
      http.post(`${BASE_URL}/auth/local`, async () => {
        return HttpResponse.json(
          { error: { status: 401, name: 'UnauthorizedError', message: 'Invalid credentials' } },
          { status: 401 },
        );
      }),
    );

    await expect(
      apiClient({ method: 'POST', path: '/auth/local', body: { identifier: 'x', password: 'y' } }),
    ).rejects.toMatchObject({
      status: 401,
    });

    // Token should still be present (auth endpoint exception)
    expect(getToken()).toBe('some-token');

    // auth:expired should NOT be dispatched for auth endpoints
    expect(authExpiredHandler).not.toHaveBeenCalled();

    window.removeEventListener('auth:expired', authExpiredHandler);
  });
});
