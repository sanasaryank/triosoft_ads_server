import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../providers/LanguageProvider';
import { useApi } from '../hooks/useApi';
import { usePagination } from '../hooks/usePagination';
import { getPlacements } from '../api/placementsService';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/Badge';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { IconButtonWithTooltip } from '../components/ui/Tooltip';
import { IconView, IconBarChart } from '../components/ui/Icons';
import { EmptyState, LoadingSpinner } from '../components/ui/States';
import { PlacementCampaignsModal } from './modals/PlacementCampaignsModal';
import type { Placement } from '../types/models';
import { ROUTES } from '../constants/routes';

export function PlacementsPage() {
  const { t, getLocalized } = useLang();
  const navigate = useNavigate();
  const fetchFn = useCallback(() => getPlacements(), []);
  const { data, loading } = useApi(fetchFn);

  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [campaignsFor, setCampaignsFor] = useState<Placement | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        getLocalized(p.name).toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower) ||
        p.cityName.toLowerCase().includes(searchLower) ||
        p.districtName.toLowerCase().includes(searchLower);

      const matchesBlocked =
        blockedFilter === 'all' ||
        (blockedFilter === 'active' && !p.isBlocked) ||
        (blockedFilter === 'blocked' && p.isBlocked);

      const matchesCity = !cityFilter || p.cityName.toLowerCase().includes(cityFilter.toLowerCase());
      const matchesDistrict = !districtFilter || p.districtName.toLowerCase().includes(districtFilter.toLowerCase());

      return matchesSearch && matchesBlocked && matchesCity && matchesDistrict;
    });
  }, [data, search, blockedFilter, cityFilter, districtFilter, getLocalized]);

  const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination(filtered);

  const columns = [
    {
      key: 'id',
      header: t('common.id'),
      render: (row: Placement) => <span className="font-mono text-xs text-gray-400">{row.id}</span>,
    },
    {
      key: 'name',
      header: t('common.name'),
      render: (row: Placement) => <span className="font-medium">{getLocalized(row.name)}</span>,
    },
    {
      key: 'location',
      header: t('placements.location'),
      render: (row: Placement) => `${row.cityName}, ${row.districtName}`,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row: Placement) => (
        <StatusBadge
          isBlocked={row.isBlocked}
          activeLabel={t('common.active')}
          blockedLabel={t('common.blocked')}
        />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row: Placement) => (
        <div className="flex items-center gap-1">
          <IconButtonWithTooltip
            tooltip={t('common.showCampaigns')}
            icon={<IconView />}
            onClick={() => setCampaignsFor(row)}
          />
          <IconButtonWithTooltip
            tooltip={t('common.showStatistics')}
            icon={<IconBarChart />}
            onClick={() => navigate(ROUTES.STATISTICS, { state: { groupBy: 'placement', ids: [row.id] } })}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('placements.title')}</h1>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        blockedFilter={blockedFilter}
        onBlockedFilterChange={setBlockedFilter}
      >
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('placements.city')}</label>
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder={t('placements.filterCity')}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('placements.district')}</label>
          <input
            type="text"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            placeholder={t('placements.filterDistrict')}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </FilterBar>

      {loading ? (
        <LoadingSpinner message={t('common.loading')} />
      ) : filtered.length === 0 && !loading ? (
        <EmptyState message={t('common.empty')} />
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
      {campaignsFor && (
        <PlacementCampaignsModal
          open
          onClose={() => setCampaignsFor(null)}
          placementId={campaignsFor.id}
          placementName={getLocalized(campaignsFor.name)}
        />
      )}
    </div>
  );
}
