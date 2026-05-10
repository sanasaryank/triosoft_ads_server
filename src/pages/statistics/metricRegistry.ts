/**
 * Central metric registry.
 *
 * All cards, charts, aggregation helpers, and formatters should derive their
 * metric lists from this registry rather than maintaining local arrays.
 */

// ── Core types ────────────────────────────────────────────────────────────────

export type StatisticsMetricKey =
  // Delivery
  | 'requests'
  | 'filledRequests'
  | 'emptyRequests'
  | 'noFill'
  | 'errors'
  | 'timeouts'
  // Interaction / billing
  | 'impressions'
  | 'clicks'
  | 'billableImpressions'
  | 'billableClicks'
  | 'ignored'
  | 'cost'
  // Performance
  | 'avgResponseTimeMs'
  | 'maxResponseTimeMs'
  // Derived KPIs
  | 'ctr'
  | 'billableCtr'
  | 'cpc'
  | 'cpm'
  | 'billableCpm'
  | 'fillRate'
  | 'errorRate'
  | 'ignoredRate'
  | 'billableRate';

/** How a metric value should be formatted for display. */
export type MetricType = 'count' | 'money' | 'ratio' | 'milliseconds';

/** Which chart group a metric belongs to. */
export type ChartGroup = 'delivery' | 'interaction' | 'cost' | 'performance' | 'kpi';

/** How a metric should be aggregated when summing rows or time-series points. */
export type AggregateStrategy =
  | 'sum'   // simple addition
  | 'max'   // take the maximum (e.g. maxResponseTimeMs)
  | 'skip'  // cannot be aggregated directly; must be derived (KPIs, avgResponseTimeMs)
  ;

export interface MetricConfig {
  key: StatisticsMetricKey;
  /** i18n translation key (e.g. 'stats.impressions') */
  labelKey: string;
  type: MetricType;
  chartGroup: ChartGroup;
  aggregateStrategy: AggregateStrategy;
  /** Whether this metric appears on stat cards. */
  cardVisible: boolean;
  /** Whether this metric appears in charts. */
  chartVisible: boolean;
  /** Chart line / card accent color. */
  color: string;
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const METRIC_REGISTRY: Record<StatisticsMetricKey, MetricConfig> = {
  // ── Delivery ─────────────────────────────────────────────────────────────
  requests: {
    key: 'requests',
    labelKey: 'stats.requests',
    type: 'count',
    chartGroup: 'delivery',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#06b6d4', // cyan-500
  },
  filledRequests: {
    key: 'filledRequests',
    labelKey: 'stats.filledRequests',
    type: 'count',
    chartGroup: 'delivery',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#10b981', // emerald-500
  },
  emptyRequests: {
    key: 'emptyRequests',
    labelKey: 'stats.emptyRequests',
    type: 'count',
    chartGroup: 'delivery',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#f97316', // orange-500
  },
  noFill: {
    key: 'noFill',
    labelKey: 'stats.noFill',
    type: 'count',
    chartGroup: 'delivery',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#eab308', // yellow-500
  },
  errors: {
    key: 'errors',
    labelKey: 'stats.errors',
    type: 'count',
    chartGroup: 'delivery',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#ef4444', // red-500
  },
  timeouts: {
    key: 'timeouts',
    labelKey: 'stats.timeouts',
    type: 'count',
    chartGroup: 'delivery',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#f43f5e', // rose-500
  },

  // ── Interaction / billing ─────────────────────────────────────────────────
  impressions: {
    key: 'impressions',
    labelKey: 'stats.impressions',
    type: 'count',
    chartGroup: 'interaction',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#9977FF', // primary brand
  },
  clicks: {
    key: 'clicks',
    labelKey: 'stats.clicks',
    type: 'count',
    chartGroup: 'interaction',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#22c55e', // green-500
  },
  billableImpressions: {
    key: 'billableImpressions',
    labelKey: 'stats.billableImpressions',
    type: 'count',
    chartGroup: 'interaction',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#3b82f6', // blue-500
  },
  billableClicks: {
    key: 'billableClicks',
    labelKey: 'stats.billableClicks',
    type: 'count',
    chartGroup: 'interaction',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#f59e0b', // amber-500
  },
  ignored: {
    key: 'ignored',
    labelKey: 'stats.ignored',
    type: 'count',
    chartGroup: 'interaction',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#ef4444', // red-500
  },
  cost: {
    key: 'cost',
    labelKey: 'stats.cost',
    type: 'money',
    chartGroup: 'cost',
    aggregateStrategy: 'sum',
    cardVisible: true,
    chartVisible: true,
    color: '#8b5cf6', // violet-500
  },

  // ── Performance ───────────────────────────────────────────────────────────
  avgResponseTimeMs: {
    key: 'avgResponseTimeMs',
    labelKey: 'stats.avgResponseTimeMs',
    type: 'milliseconds',
    chartGroup: 'performance',
    // Cannot be averaged across rows without weighting — skip in aggregation.
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#f97316', // orange-500
  },
  maxResponseTimeMs: {
    key: 'maxResponseTimeMs',
    labelKey: 'stats.maxResponseTimeMs',
    type: 'milliseconds',
    chartGroup: 'performance',
    aggregateStrategy: 'max',
    cardVisible: true,
    chartVisible: true,
    color: '#dc2626', // red-600
  },

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  ctr: {
    key: 'ctr',
    labelKey: 'stats.ctr',
    type: 'ratio',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#0ea5e9', // sky-500
  },
  billableCtr: {
    key: 'billableCtr',
    labelKey: 'stats.billableCtr',
    type: 'ratio',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#6366f1', // indigo-500
  },
  cpc: {
    key: 'cpc',
    labelKey: 'stats.cpc',
    type: 'money',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#d946ef', // fuchsia-500
  },
  cpm: {
    key: 'cpm',
    labelKey: 'stats.cpm',
    type: 'money',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#8b5cf6', // violet-500
  },
  billableCpm: {
    key: 'billableCpm',
    labelKey: 'stats.billableCpm',
    type: 'money',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#a78bfa', // violet-400
  },
  fillRate: {
    key: 'fillRate',
    labelKey: 'stats.fillRate',
    type: 'ratio',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#10b981', // emerald-500
  },
  errorRate: {
    key: 'errorRate',
    labelKey: 'stats.errorRate',
    type: 'ratio',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#ef4444', // red-500
  },
  ignoredRate: {
    key: 'ignoredRate',
    labelKey: 'stats.ignoredRate',
    type: 'ratio',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#f59e0b', // amber-500
  },
  billableRate: {
    key: 'billableRate',
    labelKey: 'stats.billableRate',
    type: 'ratio',
    chartGroup: 'kpi',
    aggregateStrategy: 'skip',
    cardVisible: true,
    chartVisible: true,
    color: '#3b82f6', // blue-500
  },
};

// ── Chart group config ────────────────────────────────────────────────────────

/** Render order for chart groups. */
export const CHART_GROUP_ORDER: ChartGroup[] = [
  'delivery',
  'interaction',
  'cost',
  'performance',
  'kpi',
];

/** Metrics belonging to each chart group, in display order. */
export const CHART_GROUP_METRICS: Record<ChartGroup, StatisticsMetricKey[]> = {
  delivery:    ['requests', 'filledRequests', 'emptyRequests', 'noFill', 'errors', 'timeouts'],
  interaction: ['impressions', 'clicks', 'billableImpressions', 'billableClicks', 'ignored'],
  cost:        ['cost'],
  performance: ['avgResponseTimeMs', 'maxResponseTimeMs'],
  kpi:         ['ctr', 'billableCtr', 'cpc', 'cpm', 'billableCpm', 'fillRate', 'errorRate', 'ignoredRate', 'billableRate'],
};

// ── Convenience accessors ─────────────────────────────────────────────────────

export function getMetricConfig(key: StatisticsMetricKey): MetricConfig {
  return METRIC_REGISTRY[key];
}

/** All metrics visible on stat cards, in registry definition order. */
export const CARD_METRICS: MetricConfig[] = Object.values(METRIC_REGISTRY).filter(
  (m) => m.cardVisible,
);

/** All metrics visible in charts, in registry definition order. */
export const CHART_METRICS: MetricConfig[] = Object.values(METRIC_REGISTRY).filter(
  (m) => m.chartVisible,
);

/** All summable metrics (aggregateStrategy === 'sum'). */
export const SUMMABLE_METRICS: StatisticsMetricKey[] = (
  Object.keys(METRIC_REGISTRY) as StatisticsMetricKey[]
).filter((k) => METRIC_REGISTRY[k].aggregateStrategy === 'sum');

/** Metrics that should use Math.max when aggregating. */
export const MAX_AGGREGATE_METRICS: StatisticsMetricKey[] = (
  Object.keys(METRIC_REGISTRY) as StatisticsMetricKey[]
).filter((k) => METRIC_REGISTRY[k].aggregateStrategy === 'max');

/**
 * Returns MetricConfig entries for a given chart group in display order.
 */
export function getChartGroupMetrics(group: ChartGroup): MetricConfig[] {
  return CHART_GROUP_METRICS[group].map((k) => METRIC_REGISTRY[k]);
}
