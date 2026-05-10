// Statistics module types

// ── Core groupBy types ────────────────────────────────────────────────────────

/**
 * Legacy 3-value type kept for backward-compatible configs
 * (GROUP_BY_OPTIONS, GROUP_BY_LABEL_KEYS, entityConfig switch).
 */
export type GroupBy = 'advertiser' | 'campaign' | 'placement';

/** Full set of all supported groupBy / sourceBy dimensions. */
export type StatisticsGroupBy =
  | 'advertiser'
  | 'campaign'
  | 'placement'
  | 'slot'
  | 'creative'
  | 'os'
  | 'osVersion'
  | 'browser'
  | 'browserVersion'
  | 'device'
  | 'deviceType'
  | 'screen'
  | 'screenSize'
  | 'screenSizeBucket'
  | 'country'
  | 'region'
  | 'city'
  | 'timezone'
  | 'language'
  | 'adFormat'
  | 'adSize'
  | 'ignoredReason';

// ── Query mode ────────────────────────────────────────────────────────────────

/** 'direct': ids belong to groupBy.  'relationship': ids belong to sourceBy. */
export type StatisticsQueryMode = 'direct' | 'relationship';

// ── Relationship types ────────────────────────────────────────────────────────

export type StatisticsRelation =
  | 'placement->slots'
  | 'placement->campaigns'
  | 'slot->placements'
  | 'slot->campaigns'
  | 'campaign->placements'
  | 'campaign->slots';

// ── Mode / interval ───────────────────────────────────────────────────────────

export type StatsMode = 'aggregated' | 'hour' | 'minute';
export type StatsInterval = 'hour' | 'minute';

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface StatMetrics {
  // Core interaction/billing metrics — always present in existing API responses
  impressions: number;
  clicks: number;
  billableImpressions: number;
  billableClicks: number;
  ignored: number;
  cost: number;

  // Delivery metrics — optional; absent in older API responses
  requests?: number;
  filledRequests?: number;
  emptyRequests?: number;
  noFill?: number;
  errors?: number;
  timeouts?: number;

  // Performance metrics — optional
  avgResponseTimeMs?: number;
  maxResponseTimeMs?: number;

  // Derived KPI metrics — optional; server-computed or client-derived
  ctr?: number;
  billableCtr?: number;
  cpc?: number;
  cpm?: number;
  billableCpm?: number;
  fillRate?: number;
  errorRate?: number;
  ignoredRate?: number;
  billableRate?: number;
}

// ── Row / response types ──────────────────────────────────────────────────────

export interface AggregatedRow extends StatMetrics {
  id: string;
}

export interface TimeSeriesPoint extends StatMetrics {
  ts: number;
}

export interface TimeSeriesRow {
  id: string;
  points: TimeSeriesPoint[];
}

export interface AggregatedResponse {
  ok: true;
  groupBy: StatisticsGroupBy;
  start: number;
  end: number;
  rows: AggregatedRow[];
}

export interface TimeSeriesResponse {
  ok: true;
  groupBy: StatisticsGroupBy;
  interval: StatsInterval;
  bucketSec: number;
  start: number;
  end: number;
  rows: TimeSeriesRow[];
}

export type StatsResponse = AggregatedResponse | TimeSeriesResponse;

// ── Request type ──────────────────────────────────────────────────────────────

export interface StatsRequest {
  groupBy: StatisticsGroupBy;
  start: number;
  end: number;
  ids: string[];
  interval?: StatsInterval;
  /** Present only in relationship mode — the entity type the ids belong to. */
  sourceBy?: StatisticsGroupBy;
}

// ── Page state ────────────────────────────────────────────────────────────────

export interface StatisticsPageState {
  queryMode: StatisticsQueryMode;
  groupBy: StatisticsGroupBy;
  /** Only in relationship mode: the entity type whose ids are in `ids`. */
  sourceBy?: StatisticsGroupBy;
  /** Only in relationship mode. */
  relation?: StatisticsRelation;
  mode: StatsMode;
  start: string; // datetime-local value: "YYYY-MM-DDTHH:mm"
  end: string;   // datetime-local value: "YYYY-MM-DDTHH:mm"
  ids: string[];
}

// ── Navigation state ──────────────────────────────────────────────────────────

/** Passed via React Router location.state when navigating from a row. */
export interface StatisticsNavState {
  groupBy: StatisticsGroupBy;
  ids: string[];
  queryMode?: StatisticsQueryMode;
  relation?: StatisticsRelation;
  sourceBy?: StatisticsGroupBy;
}

// ── Validation ────────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string; field?: string };

// ── Type guards ───────────────────────────────────────────────────────────────

export function isTimeSeriesResponse(r: StatsResponse): r is TimeSeriesResponse {
  return 'interval' in r;
}
