import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'green' | 'red' | 'blue' | 'gray' | 'yellow' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  isBlocked: boolean;
  activeLabel?: string;
  blockedLabel?: string;
}

export function StatusBadge({ isBlocked, activeLabel = 'Active', blockedLabel = 'Blocked' }: StatusBadgeProps) {
  return (
    <Badge variant={isBlocked ? 'red' : 'green'}>
      {isBlocked ? blockedLabel : activeLabel}
    </Badge>
  );
}
