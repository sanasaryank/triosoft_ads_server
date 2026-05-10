import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getSlots, blockSlot } from '../api/slotService';
import { getPlatforms } from '../api/platformService';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { CardGrid } from '../components/ui/CardGrid';
import { SlotCard } from '../components/cards/SlotCard';
import { SlotFormModal } from './modals/SlotFormModal';
import { ROUTES } from '../constants/routes';
import type { Slot } from '../types/models';

export function SlotsPage() {
  const { t, getLocalized } = useLang();
  const navigate = useNavigate();
  const fetchFn = useCallback(() => getSlots(), []);
  const fetchPlatformsFn = useCallback(() => getPlatforms(), []);
  const { data, loading, refetch } = useApi(fetchFn);
  const { data: platformsData } = useApi(fetchPlatformsFn);

  const platformMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (platformsData) platformsData.forEach((p) => { map[p.id] = getLocalized(p.name); });
    return map;
  }, [platformsData, getLocalized]);

  const platformOptions = useMemo(
    () => (platformsData ?? []).map((p) => ({ id: p.id, label: getLocalized(p.name) })),
    [platformsData, getLocalized],
  );

  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [platformFilter, setPlatformFilter] = useState('');

  const createModal = useModal();
  const editModal = useModal<string>();

  const { execute: execBlock, loading: blockLoading } = useMutation(
    (id: string, isBlocked: boolean) => blockSlot(id, isBlocked),
    { onSuccess: () => refetch() },
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      const matchesSearch =
        !search ||
        getLocalized(s.name).toLowerCase().includes(search.toLowerCase()) ||
        (s.id ?? '').toLowerCase().includes(search.toLowerCase());

      const matchesBlocked =
        blockedFilter === 'all' ||
        (blockedFilter === 'active' && !s.isBlocked) ||
        (blockedFilter === 'blocked' && s.isBlocked);

      const matchesPlatform = !platformFilter || s.platformId === platformFilter;

      return matchesSearch && matchesBlocked && matchesPlatform;
    });
  }, [data, search, blockedFilter, platformFilter, getLocalized]);

  const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination<Slot>(filtered);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('slots.title')}</h1>
        <Button onClick={() => createModal.open()}>{t('common.create')}</Button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        blockedFilter={blockedFilter}
        onBlockedFilterChange={setBlockedFilter}
      >
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('slots.filterPlatform')}</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('slots.allPlatforms')}</option>
            {platformOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
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
          <SlotCard
            key={s.id}
            slot={s}
            platformName={platformMap[s.platformId]}
            onEdit={() => editModal.open(s.id)}
            onToggleBlock={() => execBlock(s.id, !s.isBlocked)}
            onStats={() => navigate(ROUTES.STATISTICS, { state: { queryMode: 'direct', groupBy: 'slot', ids: [s.id] } })}
            blockLoading={blockLoading}
          />
        ))}
      </CardGrid>

      <SlotFormModal open={createModal.isOpen} onClose={createModal.close} onSuccess={refetch} platforms={platformOptions} />
      <SlotFormModal open={editModal.isOpen} onClose={editModal.close} onSuccess={refetch} slotId={editModal.data ?? undefined} platforms={platformOptions} />
    </div>
  );
}
