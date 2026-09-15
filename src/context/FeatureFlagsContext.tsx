'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ISystemFeatures } from '@/models/SystemConfig';

interface FeatureFlagsContextType {
  features: ISystemFeatures;
  storageProvider: string;
  loading: boolean;
  refreshFlags: () => Promise<void>;
  isAllowed: (key: keyof ISystemFeatures) => boolean;
}

const defaultFeatures: ISystemFeatures = {
  globalSearch: true,
  aiAssistant: true,
  customerPortal: true,
  playcanvas3d: true,
  scrollVideoFrames: true,
  cms: true,
  templateEditors: true,
  themeToggle: true,
  realtimeAuditLogs: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const FeatureFlagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<ISystemFeatures>(defaultFeatures);
  const [storageProvider, setStorageProvider] = useState<string>('supabase');
  const [loading, setLoading] = useState<boolean>(true);

  const refreshFlags = async () => {
    try {
      const res = await fetch('/api/auth/bootstrap', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.features) setFeatures(data.features);
        if (data.storageProvider) setStorageProvider(data.storageProvider);
      }
    } catch {
      // fallback to defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFlags();
  }, []);

  const isAllowed = (key: keyof ISystemFeatures): boolean => {
    return !!features[key];
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        features,
        storageProvider,
        loading,
        refreshFlags,
        isAllowed,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
