import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../../providers/LanguageProvider';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner, EmptyState } from '../../components/ui/States';
import { DateRangePicker } from './components/DateRangePicker';
import { EntityFilterSelector } from './components/EntityFilterSelector';
import { StatsCard } from './components/StatsCard';
import { ChartSection } from './components/ChartSection';
import { useStatistics } from './useStatistics';
import { useEntityFilterOptions } from './hooks/useEntityFilterOptions';
import { aggregateRows, aggregateTimeSeriesRows } from './utils';
import {
  STATISTICS_MODE_OPTIONS,
  MODE_LABEL_KEYS,
  STATISTICS_GROUPBY_ALL,
  STATISTICS_GROUPBY_LABEL_KEYS,
  GROUPBY_IS_FILTERABLE,
  STATISTICS_RELATION_ALL,
  RELATION_CONFIG,
} from './constants';
import { isTimeSeriesResponse } from './types';
import type {
  StatisticsGroupBy,
  StatisticsRelation,
  StatisticsQueryMode,
  StatisticsNavState,
} from './types';

// ── Small reusable segmented button group ─────────────────────────────────────

function SegmentedButtons<T extends string>({
  options,
  value,
  disabled,
  getLabel,
  onChange,
}: {
  options: T[];
  value: T;
  disabled?: boolean;
  getLabel: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md border border-gray-300 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0 border-gray-300 disabled:cursor-not-allowed disabled:opacity-60 ${
            value === opt
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {getLabel(opt)}
        </button>
      ))}
    </div>
  );
}

// ── GroupBy dropdown (22 values — too many for buttons) ───────────────────────

function GroupBySelect({
  value,
  disabled,
  onChange,
  getLabel,
}: {
  value: StatisticsGroupBy;
  disabled?: boolean;
  onChange: (v: StatisticsGroupBy) => void;
  getLabel: (v: StatisticsGroupBy) => string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StatisticsGroupBy)}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {STATISTICS_GROUPBY_ALL.map((gb) => (
        <option key={gb} value={gb}>
          {getLabel(gb)}
        </option>
      ))}
    </select>
  );
}

// ── Relationship dropdown ─────────────────────────────────────────────────────

function RelationSelect({
  value,
  disabled,
  onChange,
  getLabel,
}: {
  value: StatisticsRelation;
  disabled?: boolean;
  onChange: (v: StatisticsRelation) => void;
  getLabel: (v: StatisticsRelation) => string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StatisticsRelation)}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {STATISTICS_RELATION_ALL.map((rel) => (
        <option key={rel} value={rel}>
          {getLabel(rel)}
        </option>
      ))}
    </select>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function StatisticsPage() {
  const { t } = useLang();
  const location = useLocation();
  const navState = (location.state as StatisticsNavState | null) ?? null;

  const isFromRow = navState !== null;

  const { state, setState, statsData, loading, error, validationError, load } =
    useStatistics(navState);

  // ── Derived values ────────────────────────────────────────────────────────

  // In direct mode, filter dimension == groupBy.
  // In relationship mode, filter dimension == sourceBy.
  const filterDimension: StatisticsGroupBy =
    state.queryMode === 'relationship' && state.sourceBy
      ? state.sourceBy
      : state.groupBy;

  // Row label dimension is always groupBy (even in relationship mode).
  const labelDimension = state.groupBy;

  // ── Entity filter options ─────────────────────────────────────────────────
  const filterOpts = useEntityFilterOptions(filterDimension);

  // getName for result rows always uses groupBy dimension.
  const resultOpts = useEntityFilterOptions(labelDimension);

  // ── Helper: get i18n label for a groupBy value ────────────────────────────
  const gbLabel = (gb: StatisticsGroupBy) =>
    t(STATISTICS_GROUPBY_LABEL_KEYS[gb] as Parameters<typeof t>[0]);

  const relLabel = (rel: StatisticsRelation) =>
    t(RELATION_CONFIG[rel].labelKey as Parameters<typeof t>[0]);

  // ── Mode change handlers ──────────────────────────────────────────────────

  const DEFAULT_RELATION: StatisticsRelation = 'placement->slots';

  const handleQueryModeChange = (qm: StatisticsQueryMode) => {
    if (qm === state.queryMode) return;
    if (qm === 'relationship') {
      const rel = DEFAULT_RELATION;
      const conf = RELATION_CONFIG[rel];
      setState((prev) => ({
        ...prev,
        queryMode: 'relationship',
        relation: rel,
        sourceBy: conf.sourceBy,
        groupBy: conf.groupBy,
        ids: [],
      }));
    } else {
      // Back to direct — restore advertiser as safe default
      setState((prev) => ({
        ...prev,
        queryMode: 'direct',
        relation: undefined,
        sourceBy: undefined,
        groupBy: 'advertiser',
        ids: [],
      }));
    }
  };

  const handleGroupByChange = (gb: StatisticsGroupBy) => {
    if (gb === state.groupBy) return;
    setState((prev) => ({ ...prev, groupBy: gb, ids: [] }));
  };

  const handleRelationChange = (rel: StatisticsRelation) => {
    if (rel === state.relation) return;
    const conf = RELATION_CONFIG[rel];
    setState((prev) => ({
      ...prev,
      relation: rel,
      sourceBy: conf.sourceBy,
      groupBy: conf.groupBy,
      ids: [],
    }));
  };

  // Whether to show the entity filter
  const showFilter =
    state.queryMode === 'direct'
      ? GROUPBY_IS_FILTERABLE[state.groupBy]
      : true; // relationship always has a filterable sourceBy

  // ── Render results ─────────────────────────────────────────────────────────
  const renderResults = () => {
    if (loading) return <LoadingSpinner message={t('common.loading')} />;

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
          {t(error as Parameters<typeof t>[0])}
        </div>
      );
    }

    if (!statsData) return null;

    if (statsData.rows.length === 0) {
      return <EmptyState message={t('stats.emptyResult')} />;
    }

    if (isTimeSeriesResponse(statsData)) {
      const aggregatedPoints = aggregateTimeSeriesRows(statsData.rows);
      return (
        <div className="flex flex-col gap-4">
          {/* Always show aggregated chart first, even for a single row */}
          <ChartSection
            title={t('stats.aggregatedChart')}
            points={aggregatedPoints}
          />
          {/* Per-entity charts, only when more than one row */}
          {statsData.rows.length > 1 && statsData.rows.map((row) => (
            <ChartSection
              key={row.id}
              title={resultOpts.getName(row.id)}
              points={row.points}
            />
          ))}
        </div>
      );
    }

    // Aggregated mode
    const total = aggregateRows(statsData.rows);
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total card always spans full width for better readability */}
        <div className="col-span-full">
          <StatsCard title={t('stats.total')} metrics={total} variant="total" />
        </div>
        {statsData.rows.map((row) => (
          <StatsCard
            key={row.id}
            title={resultOpts.getName(row.id)}
            metrics={row}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">{t('stats.title')}</h1>

      {/* ── Controls panel ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">

        {/* Date range */}
        <DateRangePicker
          start={state.start}
          end={state.end}
          onChange={(start, end) => setState((prev) => ({ ...prev, start, end }))}
        />

        <div className="flex flex-wrap gap-x-6 gap-y-3 items-end">

          {/* Stats mode (aggregated / by hour / by minute) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{t('stats.mode')}</label>
            <SegmentedButtons
              options={STATISTICS_MODE_OPTIONS}
              value={state.mode}
              getLabel={(m) => t(MODE_LABEL_KEYS[m] as Parameters<typeof t>[0])}
              onChange={(mode) => setState((prev) => ({ ...prev, mode }))}
            />
          </div>

          {/* Query mode (direct / relationship) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{t('stats.queryMode')}</label>
            <SegmentedButtons
              options={['direct', 'relationship'] as StatisticsQueryMode[]}
              value={state.queryMode}
              disabled={isFromRow}
              getLabel={(qm) => t(qm === 'direct' ? 'stats.queryModeDirect' : 'stats.queryModeRelationship')}
              onChange={handleQueryModeChange}
            />
          </div>

          {/* ── Direct mode: Group by selector ─────────────────────────────── */}
          {state.queryMode === 'direct' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t('stats.groupBy')}</label>
              <GroupBySelect
                value={state.groupBy}
                disabled={isFromRow}
                onChange={handleGroupByChange}
                getLabel={gbLabel}
              />
            </div>
          )}

          {/* ── Relationship mode: Relation + grouped-by label ──────────────── */}
          {state.queryMode === 'relationship' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">{t('stats.relation')}</label>
                <RelationSelect
                  value={state.relation ?? DEFAULT_RELATION}
                  disabled={isFromRow}
                  onChange={handleRelationChange}
                  getLabel={relLabel}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">{t('stats.groupedBy')}</label>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  {gbLabel(state.groupBy)}
                </span>
              </div>
            </>
          )}

          {/* ── Dynamic filter selector ────────────────────────────────────── */}
          {showFilter && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t('stats.filter')}</label>
              <EntityFilterSelector
                options={filterOpts.options}
                selected={state.ids}
                onChange={(ids) => setState((prev) => ({ ...prev, ids }))}
                loading={filterOpts.loading}
                disabled={filterOpts.loading}
              />
            </div>
          )}
        </div>

        {/* Validation error */}
        {validationError && (
          <p className="text-xs font-medium text-red-600">
            {t(validationError as Parameters<typeof t>[0])}
          </p>
        )}

        {/* Load button */}
        <div>
          <Button type="button" loading={loading} onClick={load}>
            {t('stats.load')}
          </Button>
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {renderResults()}
    </div>
  );
}
