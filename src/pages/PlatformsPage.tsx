import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getPlatforms, blockPlatform } from '../api/platformService';
import { StatusBadge } from '../components/ui/Badge';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { IconButtonWithTooltip } from '../components/ui/Tooltip';
import { IconEdit, IconLock, IconUnlock } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { EmptyState, SkeletonCard } from '../components/ui/States';
import { PlatformFormModal } from './modals/PlatformFormModal';
import type { Platform } from '../types/models';

export function PlatformsPage() {
  const { t, getLocalized } = useLang();
  const fetchFn = useCallback(() => getPlatforms(), []);
  const { data, loading, refetch } = useApi(fetchFn);

  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const createModal = useModal();
  const editModal = useModal<string>();

  const { execute: execBlock, loading: blockLoading } = useMutation(
    (id: string, isBlocked: boolean) => blockPlatform(id, isBlocked),
    { onSuccess: () => refetch() },
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      const matchesSearch =
        !search ||
        getLocalized(p.name).toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());

      const matchesBlocked =
        blockedFilter === 'all' ||
        (blockedFilter === 'active' && !p.isBlocked) ||
        (blockedFilter === 'blocked' && p.isBlocked);

      return matchesSearch && matchesBlocked;
    });
  }, [data, search, blockedFilter, getLocalized]);

  const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } =
    usePagination<Platform>(filtered);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('platforms.title')}</h1>
        <Button onClick={() => createModal.open()}>{t('common.create')}</Button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        blockedFilter={blockedFilter}
        onBlockedFilterChange={setBlockedFilter}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((p) => (
              <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900">{getLocalized(p.name)}</span>
                  <StatusBadge isBlocked={p.isBlocked} activeLabel={t('common.active')} blockedLabel={t('common.blocked')} />
                </div>

                {p.description && (
                  <p className="mb-3 text-xs text-gray-500 line-clamp-2">{p.description}</p>
                )}

                <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
                  <IconButtonWithTooltip tooltip={t('common.edit')} icon={<IconEdit />} onClick={() => editModal.open(p.id)} />
                  <IconButtonWithTooltip
                    tooltip={p.isBlocked ? t('common.unblock') : t('common.block')}
                    icon={p.isBlocked ? <IconUnlock /> : <IconLock />}
                    variant={p.isBlocked ? 'success' : 'danger'}
                    onClick={() => execBlock(p.id, !p.isBlocked)}
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

      <PlatformFormModal open={createModal.isOpen} onClose={createModal.close} onSuccess={refetch} />
      <PlatformFormModal
        open={editModal.isOpen}
        onClose={editModal.close}
        onSuccess={refetch}
        platformId={editModal.data ?? undefined}
      />
    </div>
  );
}
