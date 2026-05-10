/**
 * Shared entity label resolver for the Statistics module.
 *
 * Resolves a groupBy dimension + row id to a human-readable label.
 * Falls back to the raw id string so rendering never blocks on missing data.
 */
import type { StatisticsGroupBy } from './types';
import type { Advertiser, Campaign, Placement, Slot, Creative } from '../../types/models';
import type { Translation } from '../../types/common';

// ── Context shape ─────────────────────────────────────────────────────────────

/**
 * Holds all entity lists currently loaded in the Statistics page.
 * All fields are optional — the resolver gracefully falls back to the raw id
 * when a list has not been fetched yet.
 */
export interface StatisticsEntityContext {
  advertisers?: Advertiser[];
  campaigns?:   Campaign[];
  placements?:  Placement[];
  slots?:       Slot[];
  creatives?:   Creative[];
}

// ── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Resolve a statistics row id to a display label for the given groupBy dimension.
 *
 * @param groupBy   - The groupBy dimension of the statistics response row.
 * @param id        - The row id returned by the backend.
 * @param context   - Loaded entity lists (advertisers, campaigns, …).
 * @param getLocalized - `getLocalized` from `useLang()` to handle Translation objects.
 * @returns         - Human-readable label, or the raw id if no label is found.
 */
export function resolveStatisticsEntityLabel(
  groupBy: StatisticsGroupBy,
  id: string,
  context: StatisticsEntityContext,
  getLocalized: (t: Translation | undefined | null) => string,
): string {
  switch (groupBy) {
    case 'advertiser': {
      const item = context.advertisers?.find((x) => x.id === id);
      return (item && getLocalized(item.name)) || id;
    }
    case 'campaign': {
      const item = context.campaigns?.find((x) => x.id === id);
      return (item && getLocalized(item.name)) || id;
    }
    case 'placement': {
      const item = context.placements?.find((x) => x.id === id);
      return (item && getLocalized(item.name)) || id;
    }
    case 'slot': {
      const item = context.slots?.find((x) => x.id === id);
      return (item && getLocalized(item.name)) || id;
    }
    case 'creative': {
      const item = context.creatives?.find((x) => x.id === id);
      return (item && getLocalized(item.name)) || id;
    }
    // Dimension groupBys: return the id as-is.
    // Step 3 may add human-friendly mapping for os/browser/country/language etc.
    default:
      return id;
  }
}

/**
 * Build a getName function bound to a specific groupBy and context.
 * Useful as a drop-in replacement for the inline lambdas in StatisticsPage.
 */
export function buildEntityNameResolver(
  groupBy: StatisticsGroupBy,
  context: StatisticsEntityContext,
  getLocalized: (t: Translation | undefined | null) => string,
): (id: string) => string {
  return (id: string) => resolveStatisticsEntityLabel(groupBy, id, context, getLocalized);
}
