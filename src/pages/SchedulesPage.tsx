import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getSchedules, blockSchedule } from '../api/scheduleService';
import { StatusBadge } from '../components/ui/Badge';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { IconButtonWithTooltip } from '../components/ui/Tooltip';
import { IconEdit, IconLock, IconUnlock } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { EmptyState, LoadingSpinner, SkeletonCard } from '../components/ui/States';
import { ScheduleFormModal } from './modals/ScheduleFormModal';
import type { Schedule } from '../types/models';
import type { TranslationKey } from '../i18n/translations';

export function SchedulesPage() {
  const { t, getLocalized } = useLang();
  const fetchFn = useCallback(() => getSchedules(), []);
  const { data, loading, refetch } = useApi(fetchFn);

  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [dayFilter, setDayFilter] = useState('');

  const createModal = useModal();
  const editModal = useModal<string>();

  const { execute: execBlock, loading: blockLoading } = useMutation(
    (id: string, isBlocked: boolean) => blockSchedule(id, isBlocked),
    { onSuccess: () => refetch() },
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      const matchesSearch =
        !search ||
        getLocalized(s.name).toLowerCase().includes(search.toLowerCase()) ||
        s.id?.toLowerCase().includes(search.toLowerCase());

      const matchesBlocked =
        blockedFilter === 'all' ||
        (blockedFilter === 'active' && !s.isBlocked) ||
        (blockedFilter === 'blocked' && s.isBlocked);

      const matchesDay =
        !dayFilter ||
        s.weekSchedule.some((d) => d.enabled && d.day.toLowerCase() === dayFilter.toLowerCase());

      return matchesSearch && matchesBlocked && matchesDay;
    });
  }, [data, search, blockedFilter, dayFilter, getLocalized]);

  const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination<Schedule>(filtered);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('schedules.title')}</h1>
        <Button onClick={() => createModal.open()}>
          {t('common.create')}
        </Button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        blockedFilter={blockedFilter}
        onBlockedFilterChange={setBlockedFilter}
      >
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('schedules.day')}</label>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All days</option>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                getLocalized={getLocalized}
                t={t}
                onEdit={() => editModal.open(s.id)}
                onToggleBlock={() => execBlock(s.id, !s.isBlocked)}
                blockLoading={blockLoading}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <ScheduleFormModal
        open={createModal.isOpen}
        onClose={createModal.close}
        onSuccess={refetch}
      />
      <ScheduleFormModal
        open={editModal.isOpen}
        onClose={editModal.close}
        onSuccess={refetch}
        scheduleId={editModal.data ?? undefined}
      />
    </div>
  );
}

interface ScheduleCardProps {
  schedule: Schedule;
  getLocalized: (v: Schedule['name']) => string;
  t: (key: TranslationKey) => string;
  onEdit: () => void;
  onToggleBlock: () => void;
  blockLoading: boolean;
}

function ScheduleCard({ schedule: s, getLocalized, t, onEdit, onToggleBlock, blockLoading }: ScheduleCardProps) {
  const enabledDays = s.weekSchedule.filter((d) => d.enabled);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: s.color }}
            title={s.color}
          />
          <span className="font-semibold text-gray-900">{getLocalized(s.name)}</span>
        </div>
        <StatusBadge isBlocked={s.isBlocked} activeLabel={t('common.active')} blockedLabel={t('common.blocked')} />
      </div>

      {/* Week schedule preview */}
      <div className="mb-3 flex flex-wrap gap-1">
        {s.weekSchedule.map((d) => (
          <span
            key={d.day}
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              d.enabled ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
            }`}
            title={d.enabled ? `${d.day} ${d.start}:00 – ${d.end}:00` : d.day}
          >
            {d.day}
          </span>
        ))}
      </div>

      {enabledDays.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">
          {enabledDays.length} day{enabledDays.length !== 1 ? 's' : ''} active
        </p>
      )}

      <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
        <IconButtonWithTooltip tooltip={t('common.edit')} icon={<IconEdit />} onClick={onEdit} />
        <IconButtonWithTooltip
          tooltip={s.isBlocked ? t('common.unblock') : t('common.block')}
          icon={s.isBlocked ? <IconUnlock /> : <IconLock />}
          variant={s.isBlocked ? 'success' : 'danger'}
          onClick={onToggleBlock}
          disabled={blockLoading}
        />
      </div>
    </div>
  );
}
