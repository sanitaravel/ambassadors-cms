import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiMutation } from '../use-api-mutation';
import type { ApiError } from '../../api/types';

describe('useApiMutation', () => {
  // Requirement 8.6: accepts mutation fn, returns { mutate, reset, data, isLoading, error, isSuccess }
  it('returns the expected shape', () => {
    const mutationFn = vi.fn(() => Promise.resolve('result'));
    const { result } = renderHook(() => useApiMutation(mutationFn));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('reset');
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  // Requirement 8.6: initial idle state
  it('starts in idle state (not loading, no data, no error)', () => {
    const mutationFn = vi.fn(() => Promise.resolve('result'));
    const { result } = renderHook(() => useApiMutation(mutationFn));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  // Requirement 8.7: mutate sets isLoading=true, error=null, invokes mutation, updates state on resolve
  it('transitions through loading to success on mutate resolve', async () => {
    const mutationFn = vi.fn((input: { name: string }) =>
      Promise.resolve({ id: 1, name: input.name })
    );
    const { result } = renderHook(() => useApiMutation(mutationFn));

    let mutatePromise: Promise<unknown>;
    act(() => {
      mutatePromise = result.current.mutate({ name: 'Test' });
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mutationFn).toHaveBeenCalledWith({ name: 'Test' });

    await expect(mutatePromise!).resolves.toEqual({ id: 1, name: 'Test' });
  });

  // Requirement 8.7: mutate updates state on reject
  it('transitions through loading to error on mutate reject', async () => {
    const apiError: ApiError = {
      status: 400,
      name: 'ValidationError',
      message: 'Invalid data',
      details: [{ path: ['name'], message: 'Required' }],
    };
    const mutationFn = vi.fn(() => Promise.reject(apiError));
    const { result } = renderHook(() => useApiMutation(mutationFn));

    await act(async () => {
      try {
        await result.current.mutate({ name: '' });
      } catch {
        // expected rejection
      }
    });

    expect(result.current.error).toEqual(apiError);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  // Requirement 8.7: mutate clears previous error on new call
  it('clears previous error when mutate is called again', async () => {
    const apiError: ApiError = {
      status: 400,
      name: 'ValidationError',
      message: 'Invalid data',
    };
    let callCount = 0;
    const mutationFn = vi.fn((input: string) => {
      callCount++;
      if (callCount === 1) return Promise.reject(apiError);
      return Promise.resolve(input.toUpperCase());
    });

    const { result } = renderHook(() => useApiMutation(mutationFn));

    // First call — fails
    await act(async () => {
      try {
        await result.current.mutate('bad');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toEqual(apiError);

    // Second call — succeeds and clears error
    act(() => {
      result.current.mutate('good');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe('GOOD');
    expect(result.current.isSuccess).toBe(true);
  });

  // Requirement 8.6: reset restores initial state
  it('reset restores idle state after success', async () => {
    const mutationFn = vi.fn(() => Promise.resolve({ id: 1 }));
    const { result } = renderHook(() => useApiMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  // Requirement 8.6: reset restores initial state after error
  it('reset restores idle state after error', async () => {
    const apiError: ApiError = {
      status: 500,
      name: 'ServerError',
      message: 'Oops',
    };
    const mutationFn = vi.fn(() => Promise.reject(apiError));
    const { result } = renderHook(() => useApiMutation(mutationFn));

    await act(async () => {
      try {
        await result.current.mutate({});
      } catch {
        // expected
      }
    });

    expect(result.current.error).toEqual(apiError);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  // Requirement 8.8: prevents state updates after unmount
  it('does not update state after unmount', async () => {
    let resolve: (value: string) => void;
    const mutationFn = vi.fn(
      () => new Promise<string>((res) => { resolve = res; })
    );

    const { result, unmount } = renderHook(() => useApiMutation(mutationFn));

    act(() => {
      result.current.mutate('data');
    });

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
