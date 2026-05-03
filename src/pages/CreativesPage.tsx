import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { useModal } from '../hooks/useModal';
import { useMutation } from '../hooks/useMutation';
import { getCreatives, blockCreative } from '../api/creativeService';
import { getCampaigns } from '../api/campaignService';
import { getAdvertisers } from '../api/advertiserService';
import { StatusBadge } from '../components/ui/Badge';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { IconButtonWithTooltip } from '../components/ui/Tooltip';
import { IconEdit, IconLock, IconUnlock } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { EmptyState, SkeletonCard } from '../components/ui/States';
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((c) => {
              const campaign = campaignMap[c.campaignId];
              const advertiserName = campaign ? advertiserMap[campaign.advertiserId] : undefined;
              return (
                <div key={c.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Sandboxed preview */}
                  {c.dataUrl ? (
                    <div className="border-b border-gray-100 bg-gray-50" style={{ height: c.previewHeight ? Math.min(c.previewHeight, 200) : 120 }}>
                      <iframe
                        sandbox=""
                        srcDoc={c.dataUrl}
                        title={getLocalized(c.name)}
                        className="w-full h-full"
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-gray-100 h-24 text-gray-400 text-xs">No preview</div>
                  )}

                  <div className="p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{getLocalized(c.name)}</span>
                      <StatusBadge isBlocked={c.isBlocked} activeLabel={t('common.active')} blockedLabel={t('common.blocked')} />
                    </div>

                    {advertiserName && <p className="text-xs text-gray-400 mb-0.5">{advertiserName}</p>}
                    {campaign && <p className="text-xs text-gray-500 mb-2 truncate">{campaign.name}</p>}

                    <div className="text-xs text-gray-400 mb-3">
                      {c.previewWidth}×{c.previewHeight}px
                    </div>

                    <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
                      <IconButtonWithTooltip tooltip={t('common.edit')} icon={<IconEdit />} onClick={() => editModal.open(c.id)} />
                      <IconButtonWithTooltip
                        tooltip={c.isBlocked ? t('common.unblock') : t('common.block')}
                        icon={c.isBlocked ? <IconUnlock /> : <IconLock />}
                        variant={c.isBlocked ? 'success' : 'danger'}
                        onClick={() => execBlock(c.id, !c.isBlocked)}
                        disabled={blockLoading}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      <CreativeFormModal open={createModal.isOpen} onClose={createModal.close} onSuccess={refetch} campaigns={campaignOptions} />
      <CreativeFormModal open={editModal.isOpen} onClose={editModal.close} onSuccess={refetch} creativeId={editModal.data ?? undefined} campaigns={campaignOptions} />
    </div>
  );
}
