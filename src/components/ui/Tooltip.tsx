import React, { useState } from 'react';
import clsx from 'clsx';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-md">
          {content}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}

interface IconButtonWithTooltipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  icon: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
}

export function IconButtonWithTooltip({ tooltip, icon, variant = 'default', className, ...rest }: IconButtonWithTooltipProps) {
  const variantClass = {
    default: 'text-gray-500 hover:text-primary-700 hover:bg-primary-50',
    danger: 'text-gray-500 hover:text-red-600 hover:bg-red-50',
    success: 'text-gray-500 hover:text-green-600 hover:bg-green-50',
  }[variant];

  return (
    <Tooltip content={tooltip}>
      <button
        type="button"
        className={clsx(
          'inline-flex items-center justify-center rounded p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400',
          variantClass,
          className,
        )}
        {...rest}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
