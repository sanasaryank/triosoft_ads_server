import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getSlots, blockSlot } from '../api/slotService';
import { getPlatforms } from '../api/platformService';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { IconButtonWithTooltip } from '../components/ui/Tooltip';
import { IconEdit, IconLock, IconUnlock } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { EmptyState, SkeletonCard } from '../components/ui/States';
import { SlotFormModal } from './modals/SlotFormModal';
import type { Slot, SlotType } from '../types/models';

const TYPE_COLORS: Record<SlotType, 'blue' | 'purple' | 'yellow' | 'green'> = {
  MainBig: 'blue',
  MainSmall: 'purple',
  Group: 'yellow',
  Selection: 'green',
};

export function SlotsPage() {
  const { t, getLocalized } = useLang();
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
              <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900">{getLocalized(s.name)}</span>
                  <StatusBadge isBlocked={s.isBlocked} activeLabel={t('common.active')} blockedLabel={t('common.blocked')} />
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant={TYPE_COLORS[s.type]}>{s.type}</Badge>
                  {platformMap[s.platformId] && (
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                      {platformMap[s.platformId]}
                    </span>
                  )}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <div><span className="font-medium">{t('slots.rotationPeriod')}:</span> {s.rotationPeriod}s</div>
                  <div><span className="font-medium">{t('slots.refreshTTL')}:</span> {s.refreshTTL}s</div>
                  <div className="col-span-2">
                    <span className="font-medium">{t('slots.noAdjacentSameAdvertiser')}:</span>{' '}
                    {s.noAdjacentSameAdvertiser ? t('common.yes') : t('common.no')}
                  </div>
                </div>

                {s.description && (
                  <p className="mb-3 text-xs text-gray-500 line-clamp-2">{s.description}</p>
                )}

                <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
                  <IconButtonWithTooltip tooltip={t('common.edit')} icon={<IconEdit />} onClick={() => editModal.open(s.id)} />
                  <IconButtonWithTooltip
                    tooltip={s.isBlocked ? t('common.unblock') : t('common.block')}
                    icon={s.isBlocked ? <IconUnlock /> : <IconLock />}
                    variant={s.isBlocked ? 'success' : 'danger'}
                    onClick={() => execBlock(s.id, !s.isBlocked)}
                    disabled={blockLoading}
                  />
                </div>
              </div>
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

      <SlotFormModal open={createModal.isOpen} onClose={createModal.close} onSuccess={refetch} platforms={platformOptions} />
      <SlotFormModal open={editModal.isOpen} onClose={editModal.close} onSuccess={refetch} slotId={editModal.data ?? undefined} platforms={platformOptions} />
    </div>
  );
}
