import React from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { Select } from './FormFields';

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  blockedFilter: 'all' | 'active' | 'blocked';
  onBlockedFilterChange: (v: 'all' | 'active' | 'blocked') => void;
  children?: React.ReactNode; // Extra filters
}

export function FilterBar({ search, onSearchChange, blockedFilter, onBlockedFilterChange, children }: FilterBarProps) {
  const { t } = useLang();

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t('common.search')}</label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('common.search') + '...'}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="min-w-[140px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t('common.status')}</label>
        <select
          value={blockedFilter}
          onChange={(e) => onBlockedFilterChange(e.target.value as 'all' | 'active' | 'blocked')}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">{t('common.all')}</option>
          <option value="active">{t('common.active')}</option>
          <option value="blocked">{t('common.blocked')}</option>
        </select>
      </div>
      {children}
    </div>
  );
}
