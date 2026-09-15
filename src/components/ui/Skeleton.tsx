'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-xl',
}) => {
  return (
    <div
      style={{ width, height }}
      className={`bg-white/[0.07] animate-pulse ${rounded} ${className}`}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.75rem"
          rounded="rounded-md"
          className={i === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return <Skeleton className={`${sizeMap[size]} rounded-full ${className}`} />;
};

export const SkeletonButton: React.FC<{
  width?: string;
  className?: string;
}> = ({ width = 'w-28', className = '' }) => {
  return <Skeleton height="2.25rem" className={`${width} rounded-xl ${className}`} />;
};

export const SkeletonCard: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-2xl bg-[#0f1422] border border-white/10 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton height="1.25rem" className="w-1/3" />
        <Skeleton height="1rem" className="w-16 rounded-full" />
      </div>
      <SkeletonText lines={2} />
      <div className="pt-2 flex justify-between items-center border-t border-white/5">
        <Skeleton height="0.75rem" className="w-20" />
        <Skeleton height="1.5rem" className="w-16 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonMetric: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-2xl bg-[#0f1422] border border-white/10 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton height="0.75rem" className="w-24" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <Skeleton height="2rem" className="w-32" />
      <Skeleton height="0.75rem" className="w-20" />
    </div>
  );
};

export const SkeletonTableRow: React.FC<{
  columns?: number;
}> = ({ columns = 5 }) => {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          className={i === 0 ? 'w-1/4' : 'flex-1'}
        />
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 5, className = '' }) => {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0f1422] overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border-b border-white/10">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            height="0.875rem"
            className={i === 0 ? 'w-1/4' : 'flex-1'}
          />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
};

export const SkeletonSidebar: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`w-64 h-full bg-[#070a0f] border-r border-white/10 p-4 flex flex-col justify-between ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton height="1rem" className="w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="2.25rem" className="w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="pt-4 border-t border-white/10 flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton height="1rem" className="w-24" />
      </div>
    </div>
  );
};
