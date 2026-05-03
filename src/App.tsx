import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorModalProvider } from './providers/ErrorModalProvider';
import { LanguageProvider } from './providers/LanguageProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { AppShell } from './components/layout/AppShell';
import { LoadingSpinner } from './components/ui/States';
import { LoginPage } from './pages/LoginPage';
import { PlacementsPage } from './pages/PlacementsPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { SlotsPage } from './pages/SlotsPage';
import { AdvertisersPage } from './pages/AdvertisersPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CreativesPage } from './pages/CreativesPage';
import { DictionariesPage } from './pages/DictionariesPage';
import { ROUTES } from './constants/routes';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner message="" />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.PLACEMENTS} replace />} />
        <Route path={ROUTES.PLACEMENTS} element={<PlacementsPage />} />
        <Route path={ROUTES.DICTIONARIES} element={<DictionariesPage />} />
        <Route path={ROUTES.SCHEDULES} element={<SchedulesPage />} />
        <Route path={ROUTES.SLOTS} element={<SlotsPage />} />
        <Route path={ROUTES.ADVERTISERS} element={<AdvertisersPage />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path={ROUTES.CREATIVES} element={<CreativesPage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.PLACEMENTS} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorModalProvider>
        <LanguageProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </ErrorModalProvider>
    </ErrorBoundary>
  );
}
