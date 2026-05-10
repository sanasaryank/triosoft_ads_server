import type {
  AggregatedRow,
  StatMetrics,
  StatisticsPageState,
  StatsRequest,
  TimeSeriesPoint,
  TimeSeriesRow,
  ValidationResult,
} from './types';
import type { MetricType } from './metricRegistry';
import {
  INTERVAL_BY_MODE,
  GROUPBY_IS_FILTERABLE,
  STATISTICS_GROUPBY_ALL,
  RELATION_CONFIG,
  STATISTICS_RELATION_ALL,
} from './constants';

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Format a Date as a datetime-local input value ("YYYY-MM-DDTHH:mm") */
export function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse a datetime-local string to a Unix timestamp (seconds) */
export function datetimeLocalToUnix(s: string): number {
  return Math.floor(new Date(s).getTime() / 1000);
}

// Start-of-day / end-of-day for preset ranges
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 0);
}

export function todayRange(): { start: string; end: string } {
  const now = new Date();
  return { start: toDatetimeLocal(startOfDay(now)), end: toDatetimeLocal(now) };
}

export function yesterdayRange(): { start: string; end: string } {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return { start: toDatetimeLocal(startOfDay(yesterday)), end: toDatetimeLocal(endOfDay(yesterday)) };
}

export function last7DaysRange(): { start: string; end: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  return { start: toDatetimeLocal(startOfDay(from)), end: toDatetimeLocal(now) };
}

// ── Request helpers ───────────────────────────────────────────────────────────

export function buildStatisticsRequest(state: StatisticsPageState): StatsRequest {
  const interval = INTERVAL_BY_MODE[state.mode];
  const req: StatsRequest = {
    groupBy: state.groupBy,
    start: datetimeLocalToUnix(state.start),
    end: datetimeLocalToUnix(state.end),
    ids: state.ids,
  };
  if (interval) req.interval = interval;
  // Include sourceBy only in relationship mode
  if (state.queryMode === 'relationship' && state.sourceBy) {
    req.sourceBy = state.sourceBy;
  }
  return req;
}

/**
 * Validate a StatisticsPageState before submitting.
 * Returns ValidationResult: { ok: true } or { ok: false; message: string; field?: string }.
 * The `message` field is an i18n key suitable for passing to t().
 */
export function validateStatisticsState(state: StatisticsPageState): ValidationResult {
  // Date presence
  if (!state.start) return { ok: false, message: 'stats.errorNoStart', field: 'start' };
  if (!state.end)   return { ok: false, message: 'stats.errorNoEnd',   field: 'end'   };

  const startMs = new Date(state.start).getTime();
  const endMs   = new Date(state.end).getTime();

  if (isNaN(startMs) || isNaN(endMs)) {
    return { ok: false, message: 'stats.errorInvalidDate', field: 'start' };
  }
  if (startMs > endMs) {
    return { ok: false, message: 'stats.errorStartAfterEnd', field: 'start' };
  }
  if (endMs > Date.now()) {
    return { ok: false, message: 'stats.errorFutureEnd', field: 'end' };
  }

  // groupBy validity
  if (!(STATISTICS_GROUPBY_ALL as string[]).includes(state.groupBy)) {
    return { ok: false, message: 'stats.errorInvalidGrouping' };
  }

  // Entity filter requirement (only for filterable groupBys)
  if (GROUPBY_IS_FILTERABLE[state.groupBy] && state.ids.length === 0) {
    return { ok: false, message: 'stats.validationEmpty', field: 'ids' };
  }

  // Relationship mode extra validation
  if (state.queryMode === 'relationship') {
    if (!state.relation || !(STATISTICS_RELATION_ALL as string[]).includes(state.relation)) {
      return { ok: false, message: 'stats.errorInvalidGrouping' };
    }
    const relConf = RELATION_CONFIG[state.relation];
    if (state.sourceBy !== relConf.sourceBy || state.groupBy !== relConf.groupBy) {
      return { ok: false, message: 'stats.errorInvalidGrouping' };
    }
  }

  return { ok: true };
}

/**
 * @deprecated Use validateStatisticsState which returns a structured ValidationResult.
 * Kept for any callers that consumed the old string | null contract.
 */
export function validateStatisticsRequest(state: StatisticsPageState): string | null {
  const result = validateStatisticsState(state);
  return result.ok ? null : result.message;
}

// ── Aggregation helpers ───────────────────────────────────────────────────────

const EMPTY_METRICS: StatMetrics = {
  impressions: 0,
  clicks: 0,
  billableImpressions: 0,
  billableClicks: 0,
  ignored: 0,
  cost: 0,
};

// Sum two optional numbers; undefined only when both inputs are undefined.
function addOpt(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0);
}

// Take max of two optional numbers; undefined only when both inputs are undefined.
function maxOpt(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined && b === undefined ? undefined : Math.max(a ?? 0, b ?? 0);
}

/** Safe division — returns 0 when denominator is 0 or undefined. */
function safeDivide(numerator: number, denominator: number | undefined): number {
  return !denominator ? 0 : numerator / denominator;
}

/**
 * Compute derived KPI metrics from already-summed base metrics.
 * Returns only the KPI fields; spread into the aggregated result.
 * All divisions are zero-safe.
 */
export function computeDerivedKpis(m: StatMetrics): Partial<StatMetrics> {
  return {
    ctr:          safeDivide(m.clicks,              m.impressions),
    billableCtr:  safeDivide(m.billableClicks,      m.billableImpressions),
    cpc:          safeDivide(m.cost,                m.clicks),
    cpm:          safeDivide(m.cost,                m.impressions) * 1000,
    billableCpm:  safeDivide(m.cost,                m.billableImpressions) * 1000,
    fillRate:     m.requests !== undefined ? safeDivide(m.filledRequests ?? 0, m.requests) : undefined,
    errorRate:    m.requests !== undefined ? safeDivide(m.errors    ?? 0, m.requests)      : undefined,
    ignoredRate:  safeDivide(m.ignored,             m.impressions),
    billableRate: safeDivide(m.billableImpressions, m.impressions),
  };
}

/**
 * Add two StatMetrics objects field by field.
 * - Required fields (6 original): always summed.
 * - Optional delivery fields: summed when at least one side is defined.
 * - maxResponseTimeMs: takes the maximum.
 * - avgResponseTimeMs: skipped (cannot be averaged reliably).
 * - Derived KPIs: skipped here; call computeDerivedKpis after aggregation.
 */
export function addMetrics(a: StatMetrics, b: StatMetrics): StatMetrics {
  return {
    // Required core metrics
    impressions:          a.impressions          + b.impressions,
    clicks:               a.clicks               + b.clicks,
    billableImpressions:  a.billableImpressions  + b.billableImpressions,
    billableClicks:       a.billableClicks        + b.billableClicks,
    ignored:              a.ignored              + b.ignored,
    cost:                 a.cost                 + b.cost,
    // Optional delivery metrics
    requests:         addOpt(a.requests,         b.requests),
    filledRequests:   addOpt(a.filledRequests,   b.filledRequests),
    emptyRequests:    addOpt(a.emptyRequests,     b.emptyRequests),
    noFill:           addOpt(a.noFill,            b.noFill),
    errors:           addOpt(a.errors,            b.errors),
    timeouts:         addOpt(a.timeouts,          b.timeouts),
    // Performance: max, not sum; avg is dropped
    maxResponseTimeMs: maxOpt(a.maxResponseTimeMs, b.maxResponseTimeMs),
    avgResponseTimeMs:  undefined, // cannot average reliably — left for server
    // Derived KPIs are skipped here and recomputed after full aggregation
    ctr:          undefined,
    billableCtr:  undefined,
    cpc:          undefined,
    cpm:          undefined,
    billableCpm:  undefined,
    fillRate:     undefined,
    errorRate:    undefined,
    ignoredRate:  undefined,
    billableRate: undefined,
  };
}

/** Sum all rows into a single totals object including derived KPIs. */
export function aggregateRows(rows: AggregatedRow[]): StatMetrics {
  const sum = rows.reduce((acc, row) => addMetrics(acc, row), { ...EMPTY_METRICS });
  return { ...sum, ...computeDerivedKpis(sum) };
}

/**
 * Merge multiple time-series rows: points with the same ts are summed.
 * Derived KPIs are recomputed after summing each time bucket.
 * Points are sorted ascending by ts.
 */
export function aggregateTimeSeriesRows(rows: TimeSeriesRow[]): TimeSeriesPoint[] {
  const map = new Map<number, StatMetrics>();
  for (const row of rows) {
    for (const pt of row.points) {
      const existing = map.get(pt.ts) ?? { ...EMPTY_METRICS };
      map.set(pt.ts, addMetrics(existing, pt));
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, metrics]) => ({ ts, ...metrics, ...computeDerivedKpis(metrics) }));
}

// ── Error helpers ─────────────────────────────────────────────────────────────

/**
 * Normalise any thrown value to a user-friendly i18n key.
 * Uses the shared normalizeError from the API client when available,
 * then maps to a stats-specific key so callers can t() it.
 */
export function normalizeStatsError(err: unknown): string {
  if (err instanceof Error) {
    // Validation errors thrown with explicit message keys
    if (err.message.startsWith('stats.')) return err.message;
    return 'stats.loadFailed';
  }
  return 'stats.loadFailed';
}

// ── Metric formatting ─────────────────────────────────────────────────────────

/**
 * Format a statistics metric value for display.
 *
 * Formatting rules:
 * - count:        integer-style with locale thousands separator
 * - money:        2 decimal places
 * - ratio:        multiply by 100, 2 decimal places, "%" suffix
 *                 (backend ratios are 0–1, e.g. ctr=0.05 means 5%)
 * - milliseconds: 1 decimal place, " ms" suffix
 *
 * Returns "—" for undefined/null values.
 */
export function formatStatisticsMetricValue(
  type: MetricType,
  value: number | undefined | null,
): string {
  if (value === undefined || value === null) return '—';
  switch (type) {
    case 'count':
      return Math.round(value).toLocaleString();
    case 'money':
      return value.toFixed(2);
    case 'ratio':
      return (value * 100).toFixed(2) + '%';
    case 'milliseconds':
      return value.toFixed(1) + ' ms';
  }
}

// ── KPI fill helper ───────────────────────────────────────────────────────────

/**
 * Fill any missing KPI metrics in a metrics object from its base metrics.
 * Backend-provided KPI values are preserved; only missing/undefined KPIs
 * are filled in using the shared KPI formulas.
 *
 * Use this for individual row/point data where the backend may only provide
 * partial KPI coverage. Do NOT use for aggregated totals — those use
 * aggregateRows() which calls computeDerivedKpis() on the full sum.
 */
export function fillMissingKpis(m: StatMetrics): StatMetrics {
  const derived = computeDerivedKpis(m);
  return {
    ...m,
    ctr:          m.ctr          ?? derived.ctr,
    billableCtr:  m.billableCtr  ?? derived.billableCtr,
    cpc:          m.cpc          ?? derived.cpc,
    cpm:          m.cpm          ?? derived.cpm,
    billableCpm:  m.billableCpm  ?? derived.billableCpm,
    fillRate:     m.fillRate     ?? derived.fillRate,
    errorRate:    m.errorRate    ?? derived.errorRate,
    ignoredRate:  m.ignoredRate  ?? derived.ignoredRate,
    billableRate: m.billableRate ?? derived.billableRate,
  };
}
