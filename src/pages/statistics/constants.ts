import type {
  GroupBy,
  StatisticsGroupBy,
  StatisticsRelation,
  StatsInterval,
  StatsMode,
  StatMetrics,
} from './types';

// ── Metric definitions ────────────────────────────────────────────────────────
// Single source of truth for metric keys, labels, and colors.

export interface MetricDef {
  key: keyof StatMetrics;
  labelKey: string; // i18n translation key
  color: string;
}

export const COUNT_METRICS: MetricDef[] = [
  { key: 'impressions',        labelKey: 'stats.impressions',        color: '#9977FF' },
  { key: 'clicks',             labelKey: 'stats.clicks',             color: '#22c55e' },
  { key: 'billableImpressions',labelKey: 'stats.billableImpressions', color: '#3b82f6' },
  { key: 'billableClicks',     labelKey: 'stats.billableClicks',     color: '#f59e0b' },
  { key: 'ignored',            labelKey: 'stats.ignored',            color: '#ef4444' },
];

export const COST_METRIC: MetricDef = {
  key: 'cost',
  labelKey: 'stats.cost',
  color: '#8b5cf6',
};

// All metrics in order (used for cards)
export const ALL_METRICS: MetricDef[] = [...COUNT_METRICS, COST_METRIC];

// ── Selector options ──────────────────────────────────────────────────────────

export const GROUP_BY_OPTIONS: GroupBy[] = ['advertiser', 'campaign', 'placement'];

export const STATISTICS_MODE_OPTIONS: StatsMode[] = ['aggregated', 'hour', 'minute'];

export const INTERVAL_BY_MODE: Record<StatsMode, StatsInterval | undefined> = {
  aggregated: undefined,
  hour: 'hour',
  minute: 'minute',
};

// i18n label keys for each groupBy value
export const GROUP_BY_LABEL_KEYS: Record<GroupBy, string> = {
  advertiser: 'stats.groupByAdvertiser',
  campaign:   'stats.groupByCampaign',
  placement:  'stats.groupByPlacement',
};

// i18n label keys for each mode value
export const MODE_LABEL_KEYS: Record<StatsMode, string> = {
  aggregated: 'stats.modeAggregated',
  hour:       'stats.modeByHour',
  minute:     'stats.modeByMinute',
};

// ── Extended groupBy config ───────────────────────────────────────────────────

/** All supported groupBy / sourceBy dimensions, in display order. */
export const STATISTICS_GROUPBY_ALL: StatisticsGroupBy[] = [
  // Entity-backed
  'advertiser',
  'campaign',
  'placement',
  'slot',
  'creative',
  // Technical dimensions
  'os',
  'osVersion',
  'browser',
  'browserVersion',
  'device',
  'deviceType',
  'screen',
  'screenSize',
  'screenSizeBucket',
  // Geo / locale dimensions
  'country',
  'region',
  'city',
  'timezone',
  'language',
  // Ad format dimensions
  'adFormat',
  'adSize',
  // Operational dimensions
  'ignoredReason',
];

/**
 * Whether a groupBy dimension has a selectable id-based filter.
 * true  → show EntityFilterSelector; ids must not be empty.
 * false → no filter; send request without ids (or with ids=[]).
 */
export const GROUPBY_IS_FILTERABLE: Record<StatisticsGroupBy, boolean> = {
  advertiser:      true,
  campaign:        true,
  placement:       true,
  slot:            true,
  creative:        true,
  os:              false,
  osVersion:       false,
  browser:         false,
  browserVersion:  false,
  device:          false,
  deviceType:      false,
  screen:          false,
  screenSize:      false,
  screenSizeBucket:false,
  country:         false,
  region:          false,
  city:            false,
  timezone:        false,
  language:        false,
  adFormat:        false,
  adSize:          false,
  ignoredReason:   false,
};

/**
 * Data source type for each groupBy dimension.
 * 'entityList' — loaded from a backend list endpoint (advertisers, campaigns, …)
 * 'enum'       — fixed set of known values (no backend call needed)
 * 'dynamic'    — values come from backend dimension data or result rows
 */
export type GroupBySourceType = 'entityList' | 'enum' | 'dynamic';

export const GROUPBY_SOURCE_TYPE: Record<StatisticsGroupBy, GroupBySourceType> = {
  advertiser:       'entityList',
  campaign:         'entityList',
  placement:        'entityList',
  slot:             'entityList',
  creative:         'entityList',
  deviceType:       'enum',
  ignoredReason:    'enum',
  os:               'dynamic',
  osVersion:        'dynamic',
  browser:          'dynamic',
  browserVersion:   'dynamic',
  device:           'dynamic',
  screen:           'dynamic',
  screenSize:       'dynamic',
  screenSizeBucket: 'dynamic',
  country:          'dynamic',
  region:           'dynamic',
  city:             'dynamic',
  timezone:         'dynamic',
  language:         'dynamic',
  adFormat:         'dynamic',
  adSize:           'dynamic',
};

/** i18n label keys for all 22 groupBy dimensions. */
export const STATISTICS_GROUPBY_LABEL_KEYS: Record<StatisticsGroupBy, string> = {
  // Reuse existing keys for backward compat
  advertiser:       'stats.groupByAdvertiser',
  campaign:         'stats.groupByCampaign',
  placement:        'stats.groupByPlacement',
  // New entity-backed
  slot:             'stats.groupBySlot',
  creative:         'stats.groupByCreative',
  // Technical dimensions
  os:               'stats.groupByOs',
  osVersion:        'stats.groupByOsVersion',
  browser:          'stats.groupByBrowser',
  browserVersion:   'stats.groupByBrowserVersion',
  device:           'stats.groupByDevice',
  deviceType:       'stats.groupByDeviceType',
  screen:           'stats.groupByScreen',
  screenSize:       'stats.groupByScreenSize',
  screenSizeBucket: 'stats.groupByScreenSizeBucket',
  // Geo / locale
  country:          'stats.groupByCountry',
  region:           'stats.groupByRegion',
  city:             'stats.groupByCity',
  timezone:         'stats.groupByTimezone',
  language:         'stats.groupByLanguage',
  // Ad format
  adFormat:         'stats.groupByAdFormat',
  adSize:           'stats.groupByAdSize',
  // Operational
  ignoredReason:    'stats.groupByIgnoredReason',
};

// ── Relation config ───────────────────────────────────────────────────────────

export interface RelationConfig {
  /** i18n key for the relation label */
  labelKey: string;
  /** The entity type whose ids are in the request `ids` array */
  sourceBy: StatisticsGroupBy;
  /** The entity type being grouped in the response rows */
  groupBy: StatisticsGroupBy;
}

export const RELATION_CONFIG: Record<StatisticsRelation, RelationConfig> = {
  'placement->slots':    { labelKey: 'stats.relationPlacementToSlots',    sourceBy: 'placement', groupBy: 'slot'      },
  'placement->campaigns':{ labelKey: 'stats.relationPlacementToCampaigns',sourceBy: 'placement', groupBy: 'campaign'  },
  'slot->placements':    { labelKey: 'stats.relationSlotToPlacements',    sourceBy: 'slot',      groupBy: 'placement' },
  'slot->campaigns':     { labelKey: 'stats.relationSlotToCampaigns',     sourceBy: 'slot',      groupBy: 'campaign'  },
  'campaign->placements':{ labelKey: 'stats.relationCampaignToPlacements',sourceBy: 'campaign',  groupBy: 'placement' },
  'campaign->slots':     { labelKey: 'stats.relationCampaignToSlots',     sourceBy: 'campaign',  groupBy: 'slot'      },
};

export const STATISTICS_RELATION_ALL: StatisticsRelation[] = [
  'placement->slots',
  'placement->campaigns',
  'slot->placements',
  'slot->campaigns',
  'campaign->placements',
  'campaign->slots',
];
