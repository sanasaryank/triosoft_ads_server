import React from 'react';
import { SkeletonCard, EmptyState } from './States';

interface CardGridProps {
  loading: boolean;
  empty: boolean;
  emptyMessage: string;
  skeletonCount?: number;
  pagination?: React.ReactNode;
  children: React.ReactNode;
}

export function CardGrid({
  loading,
  empty,
  emptyMessage,
  skeletonCount = 6,
  pagination,
  children,
}: CardGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (empty) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      {pagination}
    </>
  );
}
