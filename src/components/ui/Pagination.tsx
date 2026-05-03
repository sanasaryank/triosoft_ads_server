import React from 'react';
import clsx from 'clsx';
import { useLang } from '../../providers/LanguageProvider';
import { IconChevronLeft, IconChevronRight } from './Icons';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

const PAGE_SIZES = [10, 20, 50, 100];

export function Pagination({ page, pageSize, totalPages, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  const { t } = useLang();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>{t('common.perPage')}:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span>
          {t('common.page')} {page} {t('common.of')} {totalPages} ({totalItems})
        </span>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={clsx(
            'rounded p-1 transition-colors',
            page <= 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100',
          )}
          aria-label="Previous page"
        >
          <IconChevronLeft />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={clsx(
            'rounded p-1 transition-colors',
            page >= totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100',
          )}
          aria-label="Next page"
        >
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
}
