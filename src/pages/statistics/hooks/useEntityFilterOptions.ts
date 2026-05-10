/**
 * useEntityFilterOptions
 *
 * Resolves the dynamic filter options and getName resolver for the Statistics
 * page based on the currently active "filter dimension" (filterBy).
 *
 * In direct mode     → filterBy === groupBy
 * In relationship mode → filterBy === sourceBy
 *
 * All list fetches happen unconditionally so hooks are never called
 * conditionally; data is selected by filterBy at render time.
 */
import { useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import { getAdvertisers } from '../../../api/advertiserService';
import { getCampaigns } from '../../../api/campaignService';
import { getPlacements } from '../../../api/placementsService';
import { getSlots } from '../../../api/slotService';
import { getCreatives } from '../../../api/creativeService';
import { useLang } from '../../../providers/LanguageProvider';
import type { StatisticsGroupBy } from '../types';
import type { FilterOption } from '../components/EntityFilterSelector';

export interface EntityFilterOptions {
  options: FilterOption[];
  loading: boolean;
  getName: (id: string) => string;
}

export function useEntityFilterOptions(filterBy: StatisticsGroupBy): EntityFilterOptions {
  const { getLocalized } = useLang();

  const fetchAdvertisers = useCallback(() => getAdvertisers(), []);
  const fetchCampaigns   = useCallback(() => getCampaigns(),   []);
  const fetchPlacements  = useCallback(() => getPlacements(),  []);
  const fetchSlots       = useCallback(() => getSlots(),       []);
  const fetchCreatives   = useCallback(() => getCreatives(),   []);

  const { data: advertisers, loading: loadingAdv  } = useApi(fetchAdvertisers, { silent: true });
  const { data: campaigns,   loading: loadingCamp } = useApi(fetchCampaigns,   { silent: true });
  const { data: placements,  loading: loadingPlac } = useApi(fetchPlacements,  { silent: true });
  const { data: slots,       loading: loadingSlot  } = useApi(fetchSlots,       { silent: true });
  const { data: creatives,   loading: loadingCrea  } = useApi(fetchCreatives,   { silent: true });

  return useMemo<EntityFilterOptions>(() => {
    switch (filterBy) {
      case 'advertiser':
        return {
          options: (advertisers ?? []).map((a) => ({ id: a.id, label: getLocalized(a.name) })),
          loading: loadingAdv,
          getName: (id) => getLocalized(advertisers?.find((a) => a.id === id)?.name) || id,
        };
      case 'campaign':
        return {
          options: (campaigns ?? []).map((c) => ({ id: c.id, label: getLocalized(c.name) })),
          loading: loadingCamp,
          getName: (id) => getLocalized(campaigns?.find((c) => c.id === id)?.name) || id,
        };
      case 'placement':
        return {
          options: (placements ?? []).map((p) => ({ id: p.id, label: getLocalized(p.name) })),
          loading: loadingPlac,
          getName: (id) => getLocalized(placements?.find((p) => p.id === id)?.name) || id,
        };
      case 'slot':
        return {
          options: (slots ?? []).map((s) => ({ id: s.id, label: getLocalized(s.name) })),
          loading: loadingSlot,
          getName: (id) => getLocalized(slots?.find((s) => s.id === id)?.name) || id,
        };
      case 'creative':
        return {
          options: (creatives ?? []).map((c) => ({ id: c.id, label: getLocalized(c.name) })),
          loading: loadingCrea,
          getName: (id) => getLocalized(creatives?.find((c) => c.id === id)?.name) || id,
        };
      default:
        // Dimension groupBys (os, browser, country, etc.) have no entity list yet.
        // Filter is hidden for non-filterable dimensions; return empty for safety.
        return { options: [], loading: false, getName: (id: string) => id };
    }
  }, [
    filterBy,
    advertisers, loadingAdv,
    campaigns,   loadingCamp,
    placements,  loadingPlac,
    slots,       loadingSlot,
    creatives,   loadingCrea,
    getLocalized,
  ]);
}
