import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { LangCode } from '../types/common';
import { DEFAULT_LANG, LANG_STORAGE_KEY } from '../constants/languages';
import { translations } from '../i18n/translations';
import type { TranslationKey } from '../i18n/translations';
import type { Translation } from '../types/common';

interface LangContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: TranslationKey) => string;
  getLocalized: (value: Translation | undefined | null) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
    return stored ?? DEFAULT_LANG;
  });

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return (translations[lang] as Record<string, string>)[key] ?? key;
    },
    [lang],
  );

  const getLocalized = useCallback(
    (value: Translation | undefined | null): string => {
      if (!value) return '';
      return value[lang] || value['ENG'] || value['ARM'] || value['RUS'] || '';
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, getLocalized }),
    [lang, setLang, t, getLocalized],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
