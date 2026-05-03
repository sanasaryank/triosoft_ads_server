import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getCreatives, blockCreative } from '../api/creativeService';
import { getCampaigns } from '../api/campaignService';
import { getAdvertisers } from '../api/advertiserService';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { CardGrid } from '../components/ui/CardGrid';
import { CreativeCard } from '../components/cards/CreativeCard';
import { CreativeFormModal } from './modals/CreativeFormModal';
import type { Creative } from '../types/models';

export function CreativesPage() {
  const { t, getLocalized } = useLang();

  const fetchCreatives = useCallback(() => getCreatives(), []);
  const fetchCampaigns = useCallback(() => getCampaigns(), []);
  const fetchAdvertisers = useCallback(() => getAdvertisers(), []);

  const { data, loading, refetch } = useApi(fetchCreatives);
  const { data: campaignsData } = useApi(fetchCampaigns);
  const { data: advertisersData } = useApi(fetchAdvertisers);

  const campaignMap = useMemo(() => {
    const map: Record<string, { name: string; advertiserId: string }> = {};
    if (campaignsData) campaignsData.forEach((c) => { map[c.id] = { name: getLocalized(c.name), advertiserId: c.advertiserId }; });
    return map;
  }, [campaignsData, getLocalized]);

  const advertiserMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (advertisersData) advertisersData.forEach((a) => { map[a.id] = getLocalized(a.name); });
    return map;
  }, [advertisersData, getLocalized]);

  const campaignOptions = useMemo(() => {
    if (!campaignsData) return [];
    return campaignsData.map((c) => ({ id: c.id, label: getLocalized(c.name) }));
  }, [campaignsData, getLocalized]);

  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [campaignFilter, setCampaignFilter] = useState('');

  const createModal = useModal();
  const editModal = useModal<string>();

  const { execute: execBlock, loading: blockLoading } = useMutation(
    (id: string, isBlocked: boolean) => blockCreative(id, isBlocked),
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

      const matchesCampaign = !campaignFilter || c.campaignId === campaignFilter;

      return matchesSearch && matchesBlocked && matchesCampaign;
    });
  }, [data, search, blockedFilter, campaignFilter, getLocalized]);

  const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination<Creative>(filtered);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('creatives.title')}</h1>
        <Button onClick={() => createModal.open()}>{t('common.create')}</Button>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} blockedFilter={blockedFilter} onBlockedFilterChange={setBlockedFilter}>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('creatives.campaign')}</label>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All campaigns</option>
            {campaignOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </FilterBar>

      <CardGrid
        loading={loading}
        empty={filtered.length === 0}
        emptyMessage={t('common.empty')}
        pagination={
          <Pagination page={page} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        }
      >
        {paginatedItems.map((c) => {
          const campaign = campaignMap[c.campaignId];
          const advertiserName = campaign ? advertiserMap[campaign.advertiserId] : undefined;
          return (
            <CreativeCard
              key={c.id}
              creative={c}
              campaignName={campaign?.name}
              advertiserName={advertiserName}
              onEdit={() => editModal.open(c.id)}
              onToggleBlock={() => execBlock(c.id, !c.isBlocked)}
              blockLoading={blockLoading}
            />
          );
        })}
      </CardGrid>

      <CreativeFormModal open={createModal.isOpen} onClose={createModal.close} onSuccess={refetch} campaigns={campaignOptions} />
      <CreativeFormModal open={editModal.isOpen} onClose={editModal.close} onSuccess={refetch} creativeId={editModal.data ?? undefined} campaigns={campaignOptions} />
    </div>
  );
}
