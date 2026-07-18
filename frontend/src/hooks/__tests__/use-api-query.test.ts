import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiQuery } from '../use-api-query';
import type { ApiError } from '../../api/types';
import { describe, expect, it, vi } from 'vitest';

describe('useApiQuery', () => {
  // Requirement 8.1: accepts fetcher function, returns { data, isLoading, error, isSuccess, refetch }
  it('returns the expected shape', () => {
    const fetcher = () => new Promise<string>(() => {});
    const { result } = renderHook(() => useApiQuery(fetcher));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('refetch');
    expect(typeof result.current.refetch).toBe('function');
  });

  // Requirement 8.2: initial state is data=null, isLoading=true, error=null, isSuccess=false
  it('has correct initial state', () => {
    const fetcher = () => new Promise<string>(() => {});
    const { result } = renderHook(() => useApiQuery(fetcher));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  // Requirement 8.2: fetcher is invoked immediately on mount
  it('invokes fetcher immediately on mount', () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {}));
    renderHook(() => useApiQuery(fetcher));

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  // Requirement 8.3: on success: data=response, isLoading=false, isSuccess=true
  it('transitions to success state when fetcher resolves', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ id: 1, name: 'Test' }));
    const { result } = renderHook(() => useApiQuery(fetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  // Requirement 8.4: on failure: error=ApiError, isLoading=false, isSuccess=false
  it('transitions to error state when fetcher rejects', async () => {
    const apiError: ApiError = {
      status: 404,
      name: 'NotFoundError',
      message: 'Resource not found',
    };
    const fetcher = vi.fn(() => Promise.reject(apiError));
    const { result } = renderHook(() => useApiQuery(fetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(apiError);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeNull();
  });

  // Requirement 8.5: refetch resets isLoading=true, error=null, re-invokes fetcher
  it('refetch resets loading state and re-invokes fetcher', async () => {
    let callCount = 0;
    const fetcher = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve('first');
      }
      return Promise.resolve('second');
    });

    const { result } = renderHook(() => useApiQuery(fetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.data).toBe('first');

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe('second');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  // Requirement 8.5: refetch clears previous error
  it('refetch clears previous error and resets to loading', async () => {
    const apiError: ApiError = {
      status: 500,
      name: 'InternalError',
      message: 'Server error',
    };
    let callCount = 0;
    const fetcher = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(apiError);
      }
      return Promise.resolve('recovered');
    });

    const { result } = renderHook(() => useApiQuery(fetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toEqual(apiError);

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe('recovered');
    expect(result.current.isSuccess).toBe(true);
  });

  // Requirement 8.8: prevents state updates after unmount
  it('does not update state after unmount', async () => {
    let resolve: (value: string) => void;
    const fetcher = vi.fn(
      () => new Promise<string>((res) => { resolve = res; })
    );

    const { result, unmount } = renderHook(() => useApiQuery(fetcher));

    expect(result.current.isLoading).toBe(true);

    unmount();

    // Resolve after unmount — should not cause state update or error
    await act(async () => {
      resolve!('late result');
      await Promise.resolve();
    });

    // The hook was unmounted, so result.current reflects last state before unmount
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });
});
