import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../auth-context';
import type { ApiError } from '../../api/types';

vi.mock('../../api/auth-service');
vi.mock('../../api/token-store');

import * as authService from '../../api/auth-service';
import * as tokenStore from '../../api/token-store';

const mockGetToken = vi.mocked(tokenStore.getToken);
const mockRemoveToken = vi.mocked(tokenStore.removeToken);
const mockLogin = vi.mocked(authService.login);
const mockGetMe = vi.mocked(authService.getMe);
const mockLogout = vi.mocked(authService.logout);

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

const mockUserWithAmbassadorProfile = {
  ...mockUser,
  ambassador_profile: { focus_area: 'admissions' as const },
  student_profile: null,
  professor_profile: null,
};

const mockUserWithStudentProfile = {
  ...mockUser,
  ambassador_profile: null,
  student_profile: { student_number: 12345, program: 'CS', year_of_study: 2, month_of_study: 3 },
  professor_profile: null,
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Restoration', () => {
    // Req 4.5: No token → isLoading becomes false, isAuthenticated=false, no network requests
    it('sets isAuthenticated=false and isLoading=false when no token exists', async () => {
      mockGetToken.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    // Req 4.1, 4.2: Token exists + getMe returns valid user with profiles → authenticated
    it('restores session when token exists and getMe succeeds', async () => {
      mockGetToken.mockReturnValue('valid-jwt-token');
      mockGetMe.mockResolvedValue(mockUserWithAmbassadorProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUserWithAmbassadorProfile);
      expect(result.current.role).toBe('ambassador');
      expect(result.current.profile).toEqual(mockUserWithAmbassadorProfile.ambassador_profile);
    });

    // Req 4.3: Token exists + getMe returns 401 → token removed, unauthenticated
    it('clears token and sets unauthenticated when getMe returns 401', async () => {
      mockGetToken.mockReturnValue('expired-token');
      const error401: ApiError = { status: 401, name: 'UnauthorizedError', message: 'Invalid token' };
      mockGetMe.mockRejectedValue(error401);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockRemoveToken).toHaveBeenCalled();
    });

    // Req 4.4: Token exists + getMe fails with network error (retries once, then fails)
    it('clears token and sets unauthenticated when getMe fails with network error after retry', async () => {
      mockGetToken.mockReturnValue('some-token');
      const networkError: ApiError = { status: 0, name: 'NetworkError', message: 'Network failure' };
      mockGetMe.mockRejectedValue(networkError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockRemoveToken).toHaveBeenCalled();
      // getMe called twice (initial + one retry)
      expect(mockGetMe).toHaveBeenCalledTimes(2);
    });

    // Req 9.5: isLoading starts true and becomes false regardless of outcome
    it('isLoading starts true and becomes false on successful restoration', async () => {
      mockGetToken.mockReturnValue('valid-token');
      mockGetMe.mockResolvedValue(mockUserWithStudentProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('isLoading starts true and becomes false on failed restoration', async () => {
      mockGetToken.mockReturnValue('bad-token');
      const error: ApiError = { status: 500, name: 'InternalError', message: 'Server error' };
      mockGetMe.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Login flow', () => {
    // Req 9.3: Successful login → auth service login called, then getMe called, user/role/profile/isAuthenticated set
    it('authenticates user on successful login', async () => {
      mockGetToken.mockReturnValue(null);
      mockLogin.mockResolvedValue({ jwt: 'new-token', user: mockUser });
      mockGetMe.mockResolvedValue(mockUserWithStudentProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ identifier: 'test@example.com', password: 'password123' });
      });

      expect(mockLogin).toHaveBeenCalledWith({ identifier: 'test@example.com', password: 'password123' });
      expect(mockGetMe).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUserWithStudentProfile);
      expect(result.current.role).toBe('student');
      expect(result.current.profile).toEqual(mockUserWithStudentProfile.student_profile);
      expect(result.current.error).toBeNull();
    });

    // Req 9.6: Failed login → error set, isAuthenticated=false, user=null
    it('sets error on failed login', async () => {
      mockGetToken.mockReturnValue(null);
      const loginError: ApiError = { status: 400, name: 'ValidationError', message: 'Invalid credentials' };
      mockLogin.mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ identifier: 'bad@example.com', password: 'wrong' });
      });

      expect(result.current.error).toEqual(loginError);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Logout flow', () => {
    // Req 9.4: Logout → auth service logout called, user=null, role=null, isAuthenticated=false, error=null
    it('clears state on logout', async () => {
      mockGetToken.mockReturnValue('valid-token');
      mockGetMe.mockResolvedValue(mockUserWithAmbassadorProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useAuth() outside provider', () => {
    // Req 9.8: Calling useAuth() without AuthProvider → throws Error
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for the expected error
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      spy.mockRestore();
    });
  });

  describe('auth:expired event handling', () => {
    // Req 9.7 / Req 7.5: Dispatching auth:expired → clears user, role, profile, sets isAuthenticated=false
    it('clears auth state when auth:expired event is dispatched', async () => {
      mockGetToken.mockReturnValue('valid-token');
      mockGetMe.mockResolvedValue(mockUserWithStudentProfile);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
