import { useState, useCallback } from 'react';
import { getStatistics } from '../../api/statisticsService';
import {
  buildStatisticsRequest,
  validateStatisticsState,
  normalizeStatsError,
  todayRange,
} from './utils';
import type { StatisticsPageState, StatsResponse, StatisticsNavState } from './types';

interface UseStatisticsReturn {
  state: StatisticsPageState;
  setState: React.Dispatch<React.SetStateAction<StatisticsPageState>>;
  statsData: StatsResponse | null;
  loading: boolean;
  error: string | null;
  validationError: string | null;
  load: () => Promise<void>;
}

function buildInitialState(navState: StatisticsNavState | null): StatisticsPageState {
  const { start, end } = todayRange();
  return {
    queryMode: navState?.queryMode ?? 'direct',
    groupBy:   navState?.groupBy  ?? 'advertiser',
    relation:  navState?.relation,
    sourceBy:  navState?.sourceBy,
    mode:      'aggregated',
    start,
    end,
    ids: navState?.ids ?? [],
  };
}

export function useStatistics(navState: StatisticsNavState | null): UseStatisticsReturn {
  const [state, setState] = useState<StatisticsPageState>(() => buildInitialState(navState));
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const validation = validateStatisticsState(state);
    if (!validation.ok) {
      setValidationError(validation.message);
      return;
    }
    setValidationError(null);
    setLoading(true);
    setError(null);

    try {
      const request = buildStatisticsRequest(state);
      const data = await getStatistics(request);
      setStatsData(data);
    } catch (err) {
      setError(normalizeStatsError(err));
    } finally {
      setLoading(false);
    }
  }, [state]);

  return { state, setState, statsData, loading, error, validationError, load };
}
