import { post } from './client';
import type { StatsRequest, StatsResponse } from '../pages/statistics/types';

/**
 * POST /statistics
 * Throws if response.ok is false or network/HTTP error occurs.
 */
export async function getStatistics(request: StatsRequest): Promise<StatsResponse> {
  const response = await post<StatsResponse & { ok: boolean }>('/statistics', request);
  if (!response.ok) {
    const err = new Error('stats.loadFailed');
    throw err;
  }
  return response as StatsResponse;
}
