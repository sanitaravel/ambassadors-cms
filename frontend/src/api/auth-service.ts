import type { ApiError } from './types';
import type {
  StrapiUser,
  AmbassadorProfile,
  StudentProfile,
  ProfessorProfile,
} from './content-types';
import { apiClient } from './client';
import { setToken, removeToken } from './token-store';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  jwt: string;
  user: StrapiUser;
}

export interface UserProfiles {
  ambassador_profile?: AmbassadorProfile | null;
  student_profile?: StudentProfile | null;
  professor_profile?: ProfessorProfile | null;
}

/**
 * Validates that an auth response contains the required jwt and user fields.
 * Throws an ApiError if the response is malformed.
 */
function validateAuthResponse(data: unknown): AuthResponse {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('jwt' in data) ||
    !('user' in data)
  ) {
    const error: ApiError = {
      status: 0,
      name: 'UnexpectedResponseError',
      message: 'Authentication response is missing required jwt or user fields',
    };
    throw error;
  }

  const response = data as Record<string, unknown>;

  if (typeof response.jwt !== 'string' || response.jwt.length === 0) {
    const error: ApiError = {
      status: 0,
      name: 'UnexpectedResponseError',
      message: 'Authentication response is missing required jwt or user fields',
    };
    throw error;
  }

  if (typeof response.user !== 'object' || response.user === null) {
    const error: ApiError = {
      status: 0,
      name: 'UnexpectedResponseError',
      message: 'Authentication response is missing required jwt or user fields',
    };
    throw error;
  }

  return {
    jwt: response.jwt as string,
    user: response.user as StrapiUser,
  };
}

/**
 * Logs in a user with identifier (email or username) and password.
 * Stores JWT in Token Store on success.
 * Throws ApiError on failure or malformed response.
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const rawResponse = await apiClient<unknown>({
    method: 'POST',
    path: '/auth/local',
    body: {
      identifier: credentials.identifier,
      password: credentials.password,
    },
  });

  const authResponse = validateAuthResponse(rawResponse);
  setToken(authResponse.jwt);
  return authResponse;
}

/**
 * Registers a new user with username, email, and password.
 * Stores JWT in Token Store on success.
 * Throws ApiError on failure or malformed response.
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const rawResponse = await apiClient<unknown>({
    method: 'POST',
    path: '/auth/local/register',
    body: {
      username: data.username,
      email: data.email,
      password: data.password,
    },
  });

  const authResponse = validateAuthResponse(rawResponse);
  setToken(authResponse.jwt);
  return authResponse;
}

/**
 * Fetches the current authenticated user's profile.
 * Optionally populates relations (e.g., profile types for role determination).
 */
export async function getMe(populate?: string[]): Promise<StrapiUser & UserProfiles> {
  const params: Record<string, unknown> = {};

  if (populate && populate.length > 0) {
    // Strapi 5 expects populate as indexed params: populate[0]=x&populate[1]=y
    populate.forEach((field, index) => {
      params[`populate[${index}]`] = field;
    });
  }

  return apiClient<StrapiUser & UserProfiles>({
    method: 'GET',
    path: '/users/me',
    params: Object.keys(params).length > 0 ? params : undefined,
  });
}

/**
 * Logs out the current user by removing the JWT from Token Store.
 */
export function logout(): void {
  removeToken();
}
