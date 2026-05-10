import React from 'react';
import { useLang } from '../../../providers/LanguageProvider';
import {
  CHART_GROUP_ORDER,
  CHART_GROUP_METRICS,
  getMetricConfig,
} from '../metricRegistry';
import { formatStatisticsMetricValue, fillMissingKpis } from '../utils';
import type { StatMetrics } from '../types';
import type { ChartGroup } from '../metricRegistry';

// Map chart group key → card section header i18n key
const SECTION_LABEL_KEY: Record<ChartGroup, string> = {
  delivery:    'stats.sectionDelivery',
  interaction: 'stats.sectionInteraction',
  cost:        'stats.sectionBilling',
  performance: 'stats.sectionPerformance',
  kpi:         'stats.sectionKpi',
};

interface StatsCardProps {
  title: string;
  metrics: StatMetrics;
  variant?: 'total' | 'row';
}

export function StatsCard({ title, metrics, variant = 'row' }: StatsCardProps) {
  const { t } = useLang();
  const isTotal = variant === 'total';

  // Fill in any missing KPI values calculated from base metrics.
  // For the total card, aggregateRows() already ran computeDerivedKpis;
  // for individual row cards, this fills gaps the backend left.
  const m = fillMissingKpis(metrics);

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        isTotal ? 'border-primary-300 ring-1 ring-primary-200' : 'border-gray-200'
      }`}
    >
      {/* Card title */}
      <div
        className={`mb-3 text-sm font-semibold truncate ${
          isTotal ? 'text-primary-700' : 'text-gray-800'
        }`}
      >
        {title}
      </div>

      {/* Grouped metric sections */}
      <div className="space-y-4">
        {CHART_GROUP_ORDER.map((group) => {
          const keys = CHART_GROUP_METRICS[group];

          // Only render section when at least one metric has a defined value.
          const hasData = keys.some((k) => m[k] !== undefined && m[k] !== null);
          if (!hasData) return null;

          return (
            <div key={group}>
              {/* Section header */}
              <div className="mb-1.5 border-b border-gray-100 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {t(SECTION_LABEL_KEY[group] as Parameters<typeof t>[0])}
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
                {keys.map((k) => {
                  const cfg = getMetricConfig(k);
                  const val = m[k];
                  const hasVal = val !== undefined && val !== null;
                  return (
                    <div key={k} className="flex flex-col gap-0.5">
                      <span className="text-[10px] leading-tight text-gray-400">
                        {t(cfg.labelKey as Parameters<typeof t>[0])}
                      </span>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: hasVal ? cfg.color : '#9ca3af' }}
                      >
                        {formatStatisticsMetricValue(cfg.type, val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
