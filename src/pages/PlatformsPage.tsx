import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getPlatforms, blockPlatform } from '../api/platformService';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { CardGrid } from '../components/ui/CardGrid';
import { PlatformCard } from '../components/cards/PlatformCard';
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
        {paginatedItems.map((p) => (
          <PlatformCard
            key={p.id}
            platform={p}
            onEdit={() => editModal.open(p.id)}
            onToggleBlock={() => execBlock(p.id, !p.isBlocked)}
            blockLoading={blockLoading}
          />
        ))}
      </CardGrid>

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
