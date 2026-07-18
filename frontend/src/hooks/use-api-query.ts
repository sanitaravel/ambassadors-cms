import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiError } from '../api/types';

export interface RequestState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
}

export function useApiQuery<T>(fetcher: () => Promise<T>): RequestState<T> & { refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetcherRef.current()
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
          setIsSuccess(true);
        }
      })
      .catch((err: ApiError) => {
        if (mountedRef.current) {
          setError(err);
          setIsLoading(false);
          setIsSuccess(false);
        }
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    execute();

    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return { data, isLoading, error, isSuccess, refetch };
}
