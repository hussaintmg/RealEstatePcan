'use client';

import React, { ReactNode } from 'react';
import { AlertCircle, ShieldAlert, Lock, RotateCcw } from 'lucide-react';
import { SkeletonTable } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export type AsyncStateStatus = 'loading' | 'error' | 'empty' | 'unavailable' | 'success';

export interface AsyncStateProps {
  status: AsyncStateStatus;
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorMessage?: string;
  errorTitle?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  unavailableTitle?: string;
  unavailableMessage?: string;
}

export const FeatureUnavailableState: React.FC<{
  title?: string;
  message?: string;
}> = ({
  title = 'Feature Currently Disabled',
  message = 'This module has been disabled by the platform developer in System Settings.',
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-amber-500/20 bg-amber-500/[0.03] space-y-4 my-6">
    <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Lock className="w-7 h-7" />
    </div>
    <div className="space-y-1 max-w-md">
      <h3 className="text-base font-bold text-amber-200 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-amber-300/70 leading-relaxed">
        {message}
      </p>
    </div>
  </div>
);

export const AccessDeniedState: React.FC<{
  title?: string;
  message?: string;
}> = ({
  title = 'Access Restricted',
  message = 'Your current role or permissions do not grant access to this resource.',
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] space-y-4 my-6">
    <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <ShieldAlert className="w-7 h-7" />
    </div>
    <div className="space-y-1 max-w-md">
      <h3 className="text-base font-bold text-rose-200 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-rose-300/70 leading-relaxed">
        {message}
      </p>
    </div>
  </div>
);

export const AsyncState: React.FC<AsyncStateProps> = ({
  status,
  children,
  loadingFallback = <SkeletonTable rows={4} columns={4} />,
  errorTitle = 'Unable to Load Data',
  errorMessage = 'An error occurred while fetching information from the server.',
  onRetry,
  emptyTitle = 'No Items Found',
  emptyDescription = 'There are no records available to display.',
  emptyAction,
  unavailableTitle,
  unavailableMessage,
}) => {
  switch (status) {
    case 'loading':
      return <>{loadingFallback}</>;

    case 'unavailable':
      return (
        <FeatureUnavailableState
          title={unavailableTitle}
          message={unavailableMessage}
        />
      );

    case 'error':
      return (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-rose-500/20 bg-[#140b0e] space-y-4 my-6">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-rose-200 tracking-tight">
              {errorTitle}
            </h3>
            <p className="text-xs text-rose-300/70 leading-relaxed">
              {errorMessage}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Retry Request
            </Button>
          )}
        </div>
      );

    case 'empty':
      return (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          primaryAction={emptyAction}
        />
      );

    case 'success':
    default:
      return <>{children}</>;
  }
};
