import React, { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLang } from '../../../providers/LanguageProvider';
import {
  CHART_GROUP_ORDER,
  CHART_GROUP_METRICS,
  getMetricConfig,
} from '../metricRegistry';
import { formatStatisticsMetricValue, fillMissingKpis } from '../utils';
import type { MetricConfig, ChartGroup } from '../metricRegistry';
import type { TimeSeriesPoint } from '../types';

// Section label keys (same map as StatsCard — both driven by chart groups)
const CHART_GROUP_LABEL_KEY: Record<ChartGroup, string> = {
  delivery:    'stats.sectionDelivery',
  interaction: 'stats.sectionInteraction',
  cost:        'stats.sectionBilling',
  performance: 'stats.sectionPerformance',
  kpi:         'stats.sectionKpi',
};

// ── Shared legend state type ──────────────────────────────────────────────────

// Each MetricsLineChart manages its own highlighted set independently.
// This is intentional: highlighting in one chart group does not affect others.

// ── Legend component ──────────────────────────────────────────────────────────

interface ChartLegendProps {
  metrics: MetricConfig[];
  highlighted: Set<string>;
  onToggle: (key: string) => void;
}

function ChartLegend({ metrics, highlighted, onToggle }: ChartLegendProps) {
  const { t } = useLang();
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {metrics.map((m) => {
        const isHighlighted = highlighted.size === 0 || highlighted.has(m.key);
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onToggle(m.key)}
            className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-gray-100 focus:outline-none"
          >
            <span
              className="inline-block h-2.5 w-5 rounded-full"
              style={{ backgroundColor: m.color, opacity: highlighted.has(m.key) || highlighted.size === 0 ? 1 : 0.35 }}
            />
            <span
              className={highlighted.has(m.key) || highlighted.size === 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}
            >
              {t(m.labelKey as Parameters<typeof t>[0])}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Timestamp formatter ───────────────────────────────────────────────────────

function formatTs(ts: number): string {
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Single group line chart ───────────────────────────────────────────────────

interface MetricsLineChartProps {
  points: TimeSeriesPoint[];
  metrics: MetricConfig[];
}

function MetricsLineChart({ points, metrics }: MetricsLineChartProps) {
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setHighlighted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Fill missing KPIs in each point so derived metrics render correctly
  // even for backend points that lack full KPI coverage.
  const chartData = points.map((pt) => {
    const filled = fillMissingKpis(pt);
    const row: Record<string, number | undefined> = { ts: pt.ts };
    for (const m of metrics) {
      row[m.key] = filled[m.key] ?? undefined;
    }
    return row;
  });

  const anyHighlighted = highlighted.size > 0;

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="ts"
            tickFormatter={formatTs}
            tick={{ fontSize: 10 }}
            minTickGap={60}
          />
          <YAxis tick={{ fontSize: 10 }} width={45} />
          <Tooltip
            labelFormatter={(val) => formatTs(val as number)}
            formatter={(value, name) => {
              const cfg = getMetricConfig(name as MetricConfig['key']);
              return [
                cfg ? formatStatisticsMetricValue(cfg.type, value as number) : String(value),
                cfg ? name : name,
              ];
            }}
            contentStyle={{ fontSize: 12 }}
          />
          {metrics.map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              stroke={m.color}
              dot={false}
              activeDot={{ r: 4 }}
              strokeWidth={anyHighlighted && !highlighted.has(m.key) ? 1 : highlighted.has(m.key) ? 3 : 1.5}
              strokeOpacity={anyHighlighted && !highlighted.has(m.key) ? 0.25 : 1}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend metrics={metrics} highlighted={highlighted} onToggle={toggle} />
    </div>
  );
}

// ── Helper: detect which groups have actual data in the point series ──────────

function groupsWithData(points: TimeSeriesPoint[]): ChartGroup[] {
  return CHART_GROUP_ORDER.filter((group) => {
    const keys = CHART_GROUP_METRICS[group];
    return points.some((pt) => keys.some((k) => pt[k] !== undefined));
  });
}

// ── Full chart section for one entity / aggregated ───────────────────────────

interface ChartSectionProps {
  title: string;
  points: TimeSeriesPoint[];
}

export function ChartSection({ title, points }: ChartSectionProps) {
  const { t } = useLang();

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-gray-800">{title}</div>
        <p className="py-8 text-center text-sm text-gray-400">{t('stats.emptyResult')}</p>
      </div>
    );
  }

  // Determine which chart groups have at least one defined data point.
  const visibleGroups = groupsWithData(points);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-gray-800">{title}</div>

      <div className="space-y-6">
        {visibleGroups.map((group, idx) => {
          // Only include metrics in this group that actually appear in the data.
          const keys = CHART_GROUP_METRICS[group];
          const metrics = keys
            .map((k) => getMetricConfig(k))
            .filter((cfg) => points.some((pt) => pt[cfg.key] !== undefined));

          if (metrics.length === 0) return null;

          return (
            <div key={group}>
              {/* Group separator (skip before first) */}
              {idx > 0 && <div className="border-t border-gray-100 -mt-3 mb-3" />}
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t(CHART_GROUP_LABEL_KEY[group] as Parameters<typeof t>[0])}
              </div>
              <MetricsLineChart points={points} metrics={metrics} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
