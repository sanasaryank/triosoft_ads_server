import type { LangCode } from '../types/common';

export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: 'ARM', label: 'ՀԱՅ' },
  { code: 'ENG', label: 'ENG' },
  { code: 'RUS', label: 'РУС' },
];

export const DEFAULT_LANG: LangCode = 'ENG';
export const LANG_STORAGE_KEY = 'ads_admin_lang';
