import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getAdvertisers, blockAdvertiser } from '../api/advertiserService';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/Badge';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { IconButtonWithTooltip } from '../components/ui/Tooltip';
import { IconEdit, IconLock, IconUnlock, IconBarChart } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { EmptyState, LoadingSpinner } from '../components/ui/States';
import { AdvertiserFormModal } from './modals/AdvertiserFormModal';
import type { Advertiser } from '../types/models';
import { ROUTES } from '../constants/routes';

export function AdvertisersPage() {
  const { t, getLocalized } = useLang();
  const navigate = useNavigate();
  const fetchFn = useCallback(() => getAdvertisers(), []);
  const { data, loading, refetch } = useApi(fetchFn);

  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const createModal = useModal();
  const editModal = useModal<string>();

  const { execute: execBlock, loading: blockLoading } = useMutation(
    (id: string, isBlocked: boolean) => blockAdvertiser(id, isBlocked),
    { onSuccess: () => refetch() },
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((a) => {
      const matchesSearch =
        !search ||
        getLocalized(a.name).toLowerCase().includes(search.toLowerCase()) ||
        a.TIN.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase());

      const matchesBlocked =
        blockedFilter === 'all' ||
        (blockedFilter === 'active' && !a.isBlocked) ||
        (blockedFilter === 'blocked' && a.isBlocked);

      return matchesSearch && matchesBlocked;
    });
  }, [data, search, blockedFilter, getLocalized]);

  const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination<Advertiser>(filtered);

  const columns = [
    {
      key: 'name',
      header: t('common.name'),
      render: (row: Advertiser) => <span className="font-medium">{getLocalized(row.name)}</span>,
    },
    {
      key: 'tin',
      header: t('advertisers.tin'),
      render: (row: Advertiser) => <span className="font-mono text-xs">{row.TIN}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row: Advertiser) => (
        <StatusBadge isBlocked={row.isBlocked} activeLabel={t('common.active')} blockedLabel={t('common.blocked')} />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row: Advertiser) => (
        <div className="flex items-center gap-1">
          <IconButtonWithTooltip tooltip={t('common.edit')} icon={<IconEdit />} onClick={() => editModal.open(row.id)} />
          <IconButtonWithTooltip
            tooltip={row.isBlocked ? t('common.unblock') : t('common.block')}
            icon={row.isBlocked ? <IconUnlock /> : <IconLock />}
            variant={row.isBlocked ? 'success' : 'danger'}
            onClick={() => execBlock(row.id, !row.isBlocked)}
            disabled={blockLoading}
          />
          <IconButtonWithTooltip
            tooltip={t('common.showStatistics')}
            icon={<IconBarChart />}
            onClick={() => navigate(ROUTES.STATISTICS, { state: { groupBy: 'advertiser', ids: [row.id] } })}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('advertisers.title')}</h1>
        <Button onClick={() => createModal.open()}>{t('common.create')}</Button>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} blockedFilter={blockedFilter} onBlockedFilterChange={setBlockedFilter} />

      {loading ? (
        <LoadingSpinner message={t('common.loading')} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={paginatedItems}
            getRowKey={(row) => row.id}
            emptyMessage={t('common.empty')}
          />
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

      <AdvertiserFormModal open={createModal.isOpen} onClose={createModal.close} onSuccess={refetch} />
      <AdvertiserFormModal open={editModal.isOpen} onClose={editModal.close} onSuccess={refetch} advertiserId={editModal.data ?? undefined} />
    </div>
  );
}
