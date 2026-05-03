import React from 'react';
import { useLang } from '../../providers/LanguageProvider';
import { LANGUAGES } from '../../constants/languages';
import type { LangCode } from '../../types/common';

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact }: LanguageSelectorProps) {
  const { lang, setLang, t } = useLang();

  return (
    <div className="flex items-center gap-2">
      {!compact && <span className="text-sm text-gray-500">{t('auth.selectLanguage')}:</span>}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as LangCode)}
        className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
        aria-label="Select language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}
