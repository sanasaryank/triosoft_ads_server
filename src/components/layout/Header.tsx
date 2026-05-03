import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useLang } from '../../providers/LanguageProvider';
import { LanguageSelector } from './LanguageSelector';

export function Header() {
  const { user } = useAuth();
  const { getLocalized } = useLang();

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
      <div />
      <div className="flex items-center gap-4">
        <LanguageSelector />
        {user && (
          <span className="text-sm font-medium text-gray-700">
            {getLocalized(user.name)}
          </span>
        )}
      </div>
    </header>
  );
}
