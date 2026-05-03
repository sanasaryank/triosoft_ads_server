import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getSchedules, blockSchedule } from '../api/scheduleService';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { CardGrid } from '../components/ui/CardGrid';
import { ScheduleCard } from '../components/cards/ScheduleCard';
import { ScheduleFormModal } from './modals/ScheduleFormModal';
import type { Schedule } from '../types/models';

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

      <CardGrid
        loading={loading}
        empty={filtered.length === 0}
        emptyMessage={t('common.empty')}
        pagination={
          <Pagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      >
        {paginatedItems.map((s) => (
          <ScheduleCard
            key={s.id}
            schedule={s}
            onEdit={() => editModal.open(s.id)}
            onToggleBlock={() => execBlock(s.id, !s.isBlocked)}
            blockLoading={blockLoading}
          />
        ))}
      </CardGrid>

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
