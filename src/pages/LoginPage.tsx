import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authService';
import { getMe } from '../api/authService';
import { normalizeError } from '../api/client';
import { useAuth } from '../providers/AuthProvider';
import { useLang } from '../providers/LanguageProvider';
import { LanguageSelector } from '../components/layout/LanguageSelector';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants/routes';

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useLang();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      const me = await getMe();
      setUser(me);
      navigate(ROUTES.PLACEMENTS, { replace: true });
    } catch (err) {
      const normalized = normalizeError(err);
      setError(normalized.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo className="h-14 w-14" />
          <h1 className="text-2xl font-bold text-gray-900">Triosoft Ads Admin</h1>
        </div>

        {/* Language selector */}
        <div className="mb-6 flex justify-center">
          <LanguageSelector />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-8 shadow-md"
        >
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">
            {t('auth.login')}
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="username">
              {t('auth.username')}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="mb-6 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full justify-center">
            {t('auth.loginButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}
