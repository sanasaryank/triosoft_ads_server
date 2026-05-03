import { useState, useMemo, useEffect } from 'react';

interface UsePaginationOptions {
  defaultPageSize?: number;
}

interface UsePaginationReturn<T> {
  paginatedItems: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  resetPage: () => void;
}

export function usePagination<T>(
  items: T[],
  options?: UsePaginationOptions,
): UsePaginationReturn<T> {
  const defaultPageSize = options?.defaultPageSize ?? 20;
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  // Reset to page 1 when items change (i.e. filter changed)
  useEffect(() => {
    setPageState(1);
  }, [items.length]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page if items shrink
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const setPage = (p: number) => setPageState(Math.max(1, Math.min(p, totalPages)));
  const setPageSize = (s: number) => {
    setPageSizeState(s);
    setPageState(1);
  };
  const resetPage = () => setPageState(1);

  return {
    paginatedItems,
    page: safePage,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
    resetPage,
  };
}
