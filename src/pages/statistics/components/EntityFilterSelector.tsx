import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLang } from '../../../providers/LanguageProvider';

export interface FilterOption {
  id: string;
  label: string;
}

interface EntityFilterSelectorProps {
  options: FilterOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function EntityFilterSelector({
  options,
  selected,
  onChange,
  loading,
  disabled,
  placeholder,
}: EntityFilterSelectorProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const filteredIds = filtered.map((o) => o.id);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = useCallback(() => {
    const newSet = new Set([...selected, ...filteredIds]);
    onChange(Array.from(newSet));
  }, [selected, filteredIds, onChange]);

  const deselectAll = useCallback(() => {
    const filteredSet = new Set(filteredIds);
    onChange(selected.filter((id) => !filteredSet.has(id)));
  }, [selected, filteredIds, onChange]);

  const label =
    selected.length === 0
      ? (placeholder ?? t('stats.filterPlaceholder'))
      : selected.length === 1
      ? (options.find((o) => o.id === selected[0])?.label ?? selected[0])
      : `${selected.length} ${t('stats.selected')}`;

  return (
    <div ref={containerRef} className="relative min-w-[220px]">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className="truncate">{loading ? t('common.loading') : label}</span>
        <svg className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[260px] rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('stats.searchFilter')}
              className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Select all / Deselect all */}
          <div className="flex items-center gap-2 border-b border-gray-100 px-2 py-1.5">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-medium text-primary-600 hover:text-primary-800"
            >
              {t('stats.selectAll')}
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              {t('stats.deselectAll')}
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                {t('stats.noFilterItems')}
              </div>
            ) : (
              filtered.map((option) => {
                const checked = selected.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="truncate text-gray-700">{option.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
