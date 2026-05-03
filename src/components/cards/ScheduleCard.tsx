import React from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { CardShell, CardHeader, CardActions } from './CardBase';
import type { Schedule } from '../../types/models';

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: () => void;
  onToggleBlock: () => void;
  blockLoading?: boolean;
}

export function ScheduleCard({ schedule: s, onEdit, onToggleBlock, blockLoading }: ScheduleCardProps) {
  const { getLocalized, t } = useLang();
  const enabledDays = s.weekSchedule.filter((d) => d.enabled);

  const daysActiveText = t('schedules.daysActive')
    .replace('{n}', String(enabledDays.length))
    .replace('{s}', enabledDays.length !== 1 ? 's' : '');

  const colorDot = (
    <span
      className="inline-block h-4 w-4 rounded-full flex-shrink-0"
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

      <div className="mb-3 flex flex-wrap gap-1">
        {s.weekSchedule.map((d) => (
          <span
            key={d.day}
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              d.enabled ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
            }`}
            title={d.enabled ? `${t(`schedules.${d.day}`)} ${d.start}:00 – ${d.end}:00` : t(`schedules.${d.day}`)}
          >
            {t(`schedules.${d.day}`)}
          </span>
        ))}
      </div>

      {enabledDays.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">{daysActiveText}</p>
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
