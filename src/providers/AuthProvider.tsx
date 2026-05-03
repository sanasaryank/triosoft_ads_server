import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { CurrentUser } from '../types/auth';
import { getMe } from '../api/authService';
import type { LangCode } from '../types/common';
import { DEFAULT_LANG, LANG_STORAGE_KEY } from '../constants/languages';

interface AuthContextValue {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  lang: LangCode;
  setLang: (lang: LangCode) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [lang, setLangState] = useState<LangCode>(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
    return stored ?? DEFAULT_LANG;
  });

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  }, []);

  useEffect(() => {
    getMe()
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setInitialized(true));
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated: !!user,
      isLoading: !initialized,
      lang,
      setLang,
    }),
    [user, initialized, lang, setLang],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
