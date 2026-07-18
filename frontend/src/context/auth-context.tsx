import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ApiError } from '../api/types';
import type {
  StrapiUser,
  AmbassadorProfile,
  StudentProfile,
  ProfessorProfile,
} from '../api/content-types';
import type {
  LoginCredentials,
  RegisterData,
  UserProfiles,
} from '../api/auth-service';
import * as authService from '../api/auth-service';
import { getToken, removeToken } from '../api/token-store';

export type UserRole = 'student' | 'ambassador' | 'professor' | null;

export interface AuthContextValue {
  user: StrapiUser | null;
  role: UserRole;
  profile: StudentProfile | AmbassadorProfile | ProfessorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_POPULATE = ['ambassador_profile', 'student_profile', 'professor_profile'];

/**
 * Determines user role from profile relations.
 * Priority: ambassador > student > professor > null
 */
export function determineRole(profiles: UserProfiles): UserRole {
  if (profiles.ambassador_profile != null) {
    return 'ambassador';
  }
  if (profiles.student_profile != null) {
    return 'student';
  }
  if (profiles.professor_profile != null) {
    return 'professor';
  }
  return null;
}

/**
 * Extracts the active profile data based on determined role.
 */
function extractProfile(
  profiles: UserProfiles,
  role: UserRole,
): StudentProfile | AmbassadorProfile | ProfessorProfile | null {
  switch (role) {
    case 'ambassador':
      return profiles.ambassador_profile ?? null;
    case 'student':
      return profiles.student_profile ?? null;
    case 'professor':
      return profiles.professor_profile ?? null;
    default:
      return null;
  }
}

/**
 * Fetches user profile with retry logic.
 * Retries once on network/non-401 errors, then falls back to role=null.
 */
async function fetchProfileWithRetry(): Promise<{
  user: StrapiUser & UserProfiles;
  role: UserRole;
  profile: StudentProfile | AmbassadorProfile | ProfessorProfile | null;
} | { error: ApiError; is401: boolean }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const userData = await authService.getMe(PROFILE_POPULATE);
      const role = determineRole(userData);
      const profile = extractProfile(userData, role);
      return { user: userData, role, profile };
    } catch (err: unknown) {
      const apiError = err as ApiError;
      // On 401, don't retry — it's an auth issue
      if (apiError.status === 401) {
        return { error: apiError, is401: true };
      }
      // On first attempt with non-401 error, retry
      if (attempt === 0) {
        continue;
      }
      // Second attempt failed: return error indicating profile couldn't load
      return { error: apiError, is401: false };
    }
  }
  // Should not reach here, but satisfy TypeScript
  return {
    error: { status: 0, name: 'NetworkError', message: 'Profile could not be loaded' },
    is401: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StrapiUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<StudentProfile | AmbassadorProfile | ProfessorProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  // Session restoration on mount
  useEffect(() => {
    mountedRef.current = true;

    async function restoreSession() {
      const token = getToken();

      if (!token) {
        // No token: unauthenticated without network requests (Req 4.5)
        if (mountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      // Token exists: validate session (Req 4.2)
      const result = await fetchProfileWithRetry();

      if (!mountedRef.current) return;

      if ('error' in result) {
        // Both 401 and non-401 errors during session restoration:
        // remove token and set unauthenticated (Req 4.3, 4.4)
        removeToken();
        setUser(null);
        setRole(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Success: set authenticated state
      setUser(result.user);
      setRole(result.role);
      setProfile(result.profile);
      setIsAuthenticated(true);
      setIsLoading(false);
    }

    restoreSession();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for auth:expired event for global 401 logout
  useEffect(() => {
    function handleAuthExpired() {
      if (!mountedRef.current) return;
      setUser(null);
      setRole(null);
      setProfile(null);
      setIsAuthenticated(false);
      setError(null);
    }

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setError(null);
    try {
      await authService.login(credentials);

      // After login success, fetch profile with populate
      const result = await fetchProfileWithRetry();

      if (!mountedRef.current) return;

      if ('error' in result) {
        if (result.is401) {
          // Unexpected 401 after just logging in — clear everything
          removeToken();
          setUser(null);
          setRole(null);
          setProfile(null);
          setIsAuthenticated(false);
          setError(result.error);
          return;
        }
        // Non-401 failure after retry: authenticated with role=null (Req 10.7)
        // We need the base user data — fetch it from the login response isn't stored,
        // so we try getMe without populate as a fallback
        try {
          const basicUser = await authService.getMe();
          if (!mountedRef.current) return;
          setUser(basicUser);
        } catch {
          // If even basic getMe fails, we still set authenticated with null user info
          if (!mountedRef.current) return;
          setUser(null);
        }
        setRole(null);
        setProfile(null);
        setIsAuthenticated(true);
        setError(result.error);
        return;
      }

      setUser(result.user);
      setRole(result.role);
      setProfile(result.profile);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const apiError = err as ApiError;
      setError(apiError);
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setProfile(null);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    try {
      await authService.register(data);

      // After register success, fetch profile with populate
      const result = await fetchProfileWithRetry();

      if (!mountedRef.current) return;

      if ('error' in result) {
        if (result.is401) {
          removeToken();
          setUser(null);
          setRole(null);
          setProfile(null);
          setIsAuthenticated(false);
          setError(result.error);
          return;
        }
        // Non-401 failure: authenticated with role=null (Req 10.7)
        try {
          const basicUser = await authService.getMe();
          if (!mountedRef.current) return;
          setUser(basicUser);
        } catch {
          if (!mountedRef.current) return;
          setUser(null);
        }
        setRole(null);
        setProfile(null);
        setIsAuthenticated(true);
        setError(result.error);
        return;
      }

      setUser(result.user);
      setRole(result.role);
      setProfile(result.profile);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const apiError = err as ApiError;
      setError(apiError);
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setProfile(null);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setRole(null);
    setProfile(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    role,
    profile,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context. Throws if used outside AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
