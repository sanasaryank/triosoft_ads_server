import React from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { StatusBadge } from '../ui/Badge';
import { IconButtonWithTooltip } from '../ui/Tooltip';
import { IconEdit, IconLock, IconUnlock } from '../ui/Icons';

// ─── CardShell ────────────────────────────────────────────────────────────────
// Outer card wrapper. Use `overflowHidden` for cards that need a top media area
// (e.g. CreativeCard) — padding is then handled by the inner content instead.

interface CardShellProps {
  overflowHidden?: boolean;
  children: React.ReactNode;
}

export function CardShell({ overflowHidden, children }: CardShellProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow${
        overflowHidden ? ' overflow-hidden' : ' p-4'
      }`}
    >
      {children}
    </div>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────
// Title + StatusBadge row. Pass `prefix` for any leading element (e.g. color dot).

interface CardHeaderProps {
  title: string;
  isBlocked: boolean;
  prefix?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, isBlocked, prefix, className = 'mb-2' }: CardHeaderProps) {
  const { t } = useLang();
  return (
    <div className={`flex items-start justify-between gap-2 ${className}`}>
      {prefix ? (
        <div className="flex items-center gap-2">
          {prefix}
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
      ) : (
        <span className="font-semibold text-gray-900">{title}</span>
      )}
      <StatusBadge
        isBlocked={isBlocked}
        activeLabel={t('common.active')}
        blockedLabel={t('common.blocked')}
      />
    </div>
  );
}

// ─── CardActions ──────────────────────────────────────────────────────────────
// Edit + block/unblock button row, identical across all cards.

interface CardActionsProps {
  isBlocked: boolean;
  onEdit: () => void;
  onToggleBlock: () => void;
  blockLoading?: boolean;
  extraActions?: React.ReactNode;
}

export function CardActions({ isBlocked, onEdit, onToggleBlock, blockLoading, extraActions }: CardActionsProps) {
  const { t } = useLang();
  return (
    <div className="flex justify-end gap-1 border-t border-gray-100 pt-2">
      {extraActions}
      <IconButtonWithTooltip tooltip={t('common.edit')} icon={<IconEdit />} onClick={onEdit} />
      <IconButtonWithTooltip
        tooltip={isBlocked ? t('common.unblock') : t('common.block')}
        icon={isBlocked ? <IconUnlock /> : <IconLock />}
        variant={isBlocked ? 'success' : 'danger'}
        onClick={onToggleBlock}
        disabled={blockLoading}
      />
    </div>
  );
}
