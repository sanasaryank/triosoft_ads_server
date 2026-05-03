import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { AppError } from '../types/common';

interface ErrorModalContextValue {
  errors: AppError[];
  pushError: (error: AppError) => void;
  dismissCurrent: () => void;
}

const ErrorModalContext = createContext<ErrorModalContextValue | null>(null);

export function ErrorModalProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const pushError = useCallback((error: AppError) => {
    setErrors((prev) => [...prev, error]);
  }, []);

  const dismissCurrent = useCallback(() => {
    setErrors((prev) => prev.slice(1));
  }, []);

  const value = useMemo(
    () => ({ errors, pushError, dismissCurrent }),
    [errors, pushError, dismissCurrent],
  );

  return <ErrorModalContext.Provider value={value}>{children}</ErrorModalContext.Provider>;
}

export function useErrorModal(): ErrorModalContextValue {
  const ctx = useContext(ErrorModalContext);
  if (!ctx) throw new Error('useErrorModal must be used within ErrorModalProvider');
  return ctx;
}
