import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, removeToken } from '../token-store';

describe('Token Store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setToken('my-jwt-token');
    expect(getToken()).toBe('my-jwt-token');
  });

  it('uses the correct localStorage key', () => {
    setToken('test-token');
    expect(localStorage.getItem('strapi_jwt')).toBe('test-token');
  });

  it('removes the token', () => {
    setToken('to-be-removed');
    removeToken();
    expect(getToken()).toBeNull();
  });

  it('overwrites an existing token', () => {
    setToken('first-token');
    setToken('second-token');
    expect(getToken()).toBe('second-token');
  });
});
