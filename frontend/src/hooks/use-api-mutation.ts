import { useState, useCallback, useRef, useEffect } from 'react';
import type { ApiError } from '../api/types';
import type { RequestState } from './use-api-query';

export function useApiMutation<TRequest, TResponse>(
  mutationFn: (data: TRequest) => Promise<TResponse>
): RequestState<TResponse> & { mutate: (data: TRequest) => Promise<TResponse>; reset: () => void } {
  const [data, setData] = useState<TResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mountedRef = useRef(true);
  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback((requestData: TRequest): Promise<TResponse> => {
    setIsLoading(true);
    setError(null);

    return mutationFnRef.current(requestData)
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
          setIsSuccess(true);
        }
        return result;
      })
      .catch((err: ApiError) => {
        if (mountedRef.current) {
          setError(err);
          setIsLoading(false);
          setIsSuccess(false);
        }
        throw err;
      });
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
    setIsSuccess(false);
  }, []);

  return { data, isLoading, error, isSuccess, mutate, reset };
}
