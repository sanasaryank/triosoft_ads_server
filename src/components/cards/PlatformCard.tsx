import React from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { CardShell, CardHeader, CardActions } from './CardBase';
import type { Platform } from '../../types/models';

interface PlatformCardProps {
  platform: Platform;
  onEdit: () => void;
  onToggleBlock: () => void;
  blockLoading?: boolean;
}

export function PlatformCard({ platform: p, onEdit, onToggleBlock, blockLoading }: PlatformCardProps) {
  const { getLocalized } = useLang();

  return (
    <CardShell>
      <CardHeader title={getLocalized(p.name)} isBlocked={p.isBlocked} />

      {p.description && (
        <p className="mb-3 text-xs text-gray-500 line-clamp-2">{p.description}</p>
      )}

      <CardActions
        isBlocked={p.isBlocked}
        onEdit={onEdit}
        onToggleBlock={onToggleBlock}
        blockLoading={blockLoading}
      />
    </CardShell>
  );
}
