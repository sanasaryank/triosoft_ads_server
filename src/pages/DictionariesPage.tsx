import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export function DictionariesPage() {
  return <Navigate to={ROUTES.SCHEDULES} replace />;
}
