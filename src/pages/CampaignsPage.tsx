import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getCampaigns, blockCampaign } from '../api/campaignService';
import { getAdvertisers } from '../api/advertiserService';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/Badge';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { IconButtonWithTooltip } from '../components/ui/Tooltip';
import { IconEdit, IconLock, IconUnlock, IconBarChart } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/States';
import { CampaignFormModal } from './modals/CampaignFormModal';
import type { Campaign } from '../types/models';
import { ROUTES } from '../constants/routes';

export function CampaignsPage() {
  const { t, getLocalized } = useLang();
  const navigate = useNavigate();

  const fetchCampaigns = useCallback(() => getCampaigns(), []);
  const fetchAdvertisers = useCallback(() => getAdvertisers(), []);

  const { data, loading, refetch } = useApi(fetchCampaigns);
  const { data: advertisersData } = useApi(fetchAdvertisers);

  const advertiserMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (advertisersData) {
      advertisersData.forEach((a) => { map[a.id] = getLocalized(a.name); });
    }
    return map;
  }, [advertisersData, getLocalized]);

  const advertiserOptions = useMemo(() => {
    if (!advertisersData) return [];
    return advertisersData.map((a) => ({ id: a.id, label: getLocalized(a.name) }));
  }, [advertisersData, getLocalized]);

  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [advertiserFilter, setAdvertiserFilter] = useState('');
  const [pricingModelFilter, setPricingModelFilter] = useState('');

  const createModal = useModal();
  const editModal = useModal<string>();

  const { execute: execBlock, loading: blockLoading } = useMutation(
    (id: string, isBlocked: boolean) => blockCampaign(id, isBlocked),
    { onSuccess: () => refetch() },
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => {
      const matchesSearch =
        !search ||
        getLocalized(c.name).toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());

      const matchesBlocked =
        blockedFilter === 'all' ||
        (blockedFilter === 'active' && !c.isBlocked) ||
        (blockedFilter === 'blocked' && c.isBlocked);

      const matchesAdvertiser = !advertiserFilter || c.advertiserId === advertiserFilter;
      const matchesPricing = !pricingModelFilter || c.pricingModel === pricingModelFilter;

      return matchesSearch && matchesBlocked && matchesAdvertiser && matchesPricing;
    });
  }, [data, search, blockedFilter, advertiserFilter, pricingModelFilter, getLocalized]);

  const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination<Campaign>(filtered);

  const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleDateString() : '—';

  const columns = [
    {
      key: 'advertiser',
      header: t('campaigns.advertiser'),
      render: (row: Campaign) => <span className="text-gray-600 text-sm">{advertiserMap[row.advertiserId] ?? row.advertiserId}</span>,
    },
    {
      key: 'name',
      header: t('common.name'),
      render: (row: Campaign) => <span className="font-medium">{getLocalized(row.name)}</span>,
    },
    {
      key: 'dates',
      header: `${t('campaigns.startDate')} / ${t('campaigns.endDate')}`,
      render: (row: Campaign) => <span className="text-xs text-gray-500">{formatDate(row.startDate)} – {formatDate(row.endDate)}</span>,
    },
    {
      key: 'pricing',
      header: t('campaigns.pricingModel'),
      render: (row: Campaign) => <span className="text-xs font-mono">{row.pricingModel}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row: Campaign) => (
        <StatusBadge isBlocked={row.isBlocked} activeLabel={t('common.active')} blockedLabel={t('common.blocked')} />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row: Campaign) => (
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
            onClick={() => navigate(ROUTES.STATISTICS, { state: { groupBy: 'campaign', ids: [row.id] } })}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('campaigns.title')}</h1>
        <Button onClick={() => createModal.open()}>{t('common.create')}</Button>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} blockedFilter={blockedFilter} onBlockedFilterChange={setBlockedFilter}>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('campaigns.allAdvertisers')}</label>
          <select
            value={advertiserFilter}
            onChange={(e) => setAdvertiserFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('campaigns.allAdvertisers')}</option>
            {advertiserOptions.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('campaigns.pricingModel')}</label>
          <select
            value={pricingModelFilter}
            onChange={(e) => setPricingModelFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All</option>
            {['CPM', 'CPC', 'CPA', 'CPV'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <LoadingSpinner message={t('common.loading')} />
      ) : (
        <>
          <DataTable columns={columns} rows={paginatedItems} getRowKey={(row) => row.id} emptyMessage={t('common.empty')} />
          <Pagination page={page} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      <CampaignFormModal
        open={createModal.isOpen}
        onClose={createModal.close}
        onSuccess={refetch}
        advertisers={advertiserOptions}
      />
      <CampaignFormModal
        open={editModal.isOpen}
        onClose={editModal.close}
        onSuccess={refetch}
        campaignId={editModal.data ?? undefined}
        advertisers={advertiserOptions}
      />
    </div>
  );
}
