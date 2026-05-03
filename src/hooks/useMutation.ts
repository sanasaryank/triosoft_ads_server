import { useState, useCallback } from 'react';
import { normalizeError } from '../api/client';
import { useErrorModal } from '../providers/ErrorModalProvider';
import type { AppError } from '../types/common';

interface UseMutationReturn<TArgs extends unknown[], TResult> {
  execute: (...args: TArgs) => Promise<TResult | null>;
  loading: boolean;
  error: AppError | null;
}

/**
 * Hook for mutation operations (create, update, block, etc.).
 * Returns execute function, loading state, and error.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: { onSuccess?: (result: TResult) => void },
): UseMutationReturn<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const { pushError } = useErrorModal();

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        pushError(normalized);
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  );

  return { execute, loading, error };
}
