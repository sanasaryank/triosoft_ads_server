import { useState, useEffect, useCallback } from 'react';
import { normalizeError } from '../api/client';
import { useErrorModal } from '../providers/ErrorModalProvider';
import type { AppError } from '../types/common';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

/**
 * Generic hook to fetch data from a service function.
 * Automatically pushes errors to the global error modal.
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  options?: { silent?: boolean },
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const { pushError } = useErrorModal();
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const normalized = normalizeError(err);
          setError(normalized);
          if (!options?.silent) pushError(normalized);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // fetchFn identity changes break this if not memoized — callers should use useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, loading, error, refetch };
}
