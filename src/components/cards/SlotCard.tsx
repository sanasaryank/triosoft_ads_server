import React from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { Badge } from '../ui/Badge';
import { CardShell, CardHeader, CardActions } from './CardBase';
import { IconButtonWithTooltip } from '../ui/Tooltip';
import { IconBarChart } from '../ui/Icons';
import type { Slot, SlotType } from '../../types/models';

const TYPE_COLORS: Record<SlotType, 'blue' | 'purple' | 'yellow' | 'green'> = {
  MainBig: 'blue',
  MainSmall: 'purple',
  Group: 'yellow',
  Selection: 'green',
  Item: 'yellow',
};

interface SlotCardProps {
  slot: Slot;
  platformName?: string;
  onEdit: () => void;
  onToggleBlock: () => void;
  onStats?: () => void;
  blockLoading?: boolean;
}

export function SlotCard({ slot: s, platformName, onEdit, onToggleBlock, onStats, blockLoading }: SlotCardProps) {
  const { t, getLocalized } = useLang();

  return (
    <CardShell>
      <CardHeader title={getLocalized(s.name)} isBlocked={s.isBlocked} />

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant={TYPE_COLORS[s.type]}>{s.type}</Badge>
        {platformName && (
          <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
            {platformName}
          </span>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
        <div><span className="font-medium">{t('slots.rotationPeriod')}:</span> {s.rotationPeriod}s</div>
        <div><span className="font-medium">{t('slots.refreshTTL')}:</span> {s.refreshTTL}s</div>
        <div className="col-span-2">
          <span className="font-medium">{t('slots.noAdjacentSameAdvertiser')}:</span>{' '}
          {s.noAdjacentSameAdvertiser ? t('common.yes') : t('common.no')}
        </div>
      </div>

      {s.description && (
        <p className="mb-3 text-xs text-gray-500 line-clamp-2">{s.description}</p>
      )}

      <CardActions
        isBlocked={s.isBlocked}
        onEdit={onEdit}
        onToggleBlock={onToggleBlock}
        blockLoading={blockLoading}
        extraActions={onStats && (
          <IconButtonWithTooltip tooltip={t('stats.title')} icon={<IconBarChart />} onClick={onStats} />
        )}
      />
    </CardShell>
  );
}
