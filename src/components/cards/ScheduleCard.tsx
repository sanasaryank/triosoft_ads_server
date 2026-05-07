import React from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { CardShell, CardHeader, CardActions } from './CardBase';
import type { Schedule, WeekDay } from '../../types/models';

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: () => void;
  onToggleBlock: () => void;
  blockLoading?: boolean;
}

const DAY_ORDER: WeekDay['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function fmtTime(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** Group consecutive days (in natural order) that share identical start/end times */
function groupDays(days: WeekDay[]): { days: WeekDay[]; start: number; end: number }[] {
  const sorted = [...days].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const groups: { days: WeekDay[]; start: number; end: number }[] = [];
  for (const d of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.start === d.start && last.end === d.end) {
      last.days.push(d);
    } else {
      groups.push({ days: [d], start: d.start, end: d.end });
    }
  }
  return groups;
}

export function ScheduleCard({ schedule: s, onEdit, onToggleBlock, blockLoading }: ScheduleCardProps) {
  const { getLocalized, t } = useLang();

  const enabledDays = s.weekSchedule.filter((d) => d.enabled);
  const disabledDays = [...s.weekSchedule.filter((d) => !d.enabled)].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
  );
  const groups = groupDays(enabledDays);

  const colorDot = (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: s.color }}
      title={s.color}
    />
  );

  return (
    <CardShell>
      <CardHeader
        title={getLocalized(s.name)}
        isBlocked={s.isBlocked}
        prefix={colorDot}
        className="mb-3"
      />

      {/* Enabled day groups with hours */}
      {groups.length > 0 ? (
        <div className="mb-2 flex flex-col gap-1">
          {groups.map((g, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap gap-0.5">
                {g.days.map((d) => (
                  <span
                    key={d.day}
                    className="rounded px-1.5 py-0.5 font-medium bg-primary-100 text-primary-700"
                  >
                    {t(`schedules.${d.day}`)}
                  </span>
                ))}
              </div>
              <span className="flex-shrink-0 text-gray-500 text-[11px] tabular-nums">
                {fmtTime(g.start)} – {fmtTime(g.end)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-2 text-xs text-gray-400">{t('common.empty')}</p>
      )}

      {/* Disabled days */}
      {disabledDays.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-0.5">
          {disabledDays.map((d) => (
            <span
              key={d.day}
              className="rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-400"
            >
              {t(`schedules.${d.day}`)}
            </span>
          ))}
        </div>
      )}

      <CardActions
        isBlocked={s.isBlocked}
        onEdit={onEdit}
        onToggleBlock={onToggleBlock}
        blockLoading={blockLoading}
      />
    </CardShell>
  );
}
