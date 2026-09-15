'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface UserSession {
  _id?: string;
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  isDeveloper: boolean;
  isOwner: boolean;
  roleId?: string;
  role?: any;
}

export interface BrandingInfo {
  websiteName: string;
  headerLogo: string;
  footerLogo: string;
  favicon: string;
  headerLogoLight?: string;
  headerLogoDark?: string;
  footerLogoLight?: string;
  footerLogoDark?: string;
}

export interface SystemFeatures {
  globalSearch?: boolean;
  aiAssistant?: boolean;
  customerPortal?: boolean;
  playcanvas3d?: boolean;
  scrollVideoFrames?: boolean;
  cms?: boolean;
  templateEditors?: boolean;
  themeToggle?: boolean;
  realtimeAuditLogs?: boolean;
  [key: string]: boolean | undefined;
}

const DEFAULT_FEATURES: SystemFeatures = {
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

interface AuthContextType {
  user: UserSession | null;
  branding: BrandingInfo;
  permissions: Record<string, Record<string, boolean>>;
  effectivePermissions: string[];
  effectiveScopes: Record<string, string>;
  features: SystemFeatures;
  setupCompleted: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; redirectPath?: string; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isFeatureAllowed: (key: string) => boolean;
  can: (permissionKey: string) => boolean;
  getScope: (permissionKey: string) => string | undefined;
}

const DEFAULT_BRANDING: BrandingInfo = {
  websiteName: 'Aura Heights Luxury Estates',
  headerLogo: '',
  footerLogo: '',
  favicon: '/favicon.ico',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [branding, setBranding] = useState<BrandingInfo>(DEFAULT_BRANDING);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [effectiveScopes, setEffectiveScopes] = useState<Record<string, string>>({});
  const [features, setFeatures] = useState<SystemFeatures>(DEFAULT_FEATURES);
  const [setupCompleted, setSetupCompleted] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/bootstrap', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        if (data.branding) setBranding(data.branding);
        if (data.permissions) setPermissions(data.permissions);
        if (Array.isArray(data.effectivePermissions)) {
          setEffectivePermissions(data.effectivePermissions);
        }
        if (data.effectiveScopes) {
          setEffectiveScopes(data.effectiveScopes);
        }
        if (data.features) setFeatures(data.features);
        if (data.setupCompleted !== undefined) setSetupCompleted(data.setupCompleted);
      } else {
        setUser(null);
        setEffectivePermissions([]);
        setEffectiveScopes({});
      }
    } catch {
      setUser(null);
      setEffectivePermissions([]);
      setEffectiveScopes({});
    } finally {
      setLoading(false);
    }
  };

  const isFeatureAllowed = (key: string): boolean => {
    return features[key] !== false;
  };

  const can = (permissionKey: string): boolean => {
    if (!user) return false;
    if (user.isDeveloper) return true;
    if (user.isOwner) {
      if (permissionKey === 'system.configure') return false;
      return true;
    }
    return effectivePermissions.includes(permissionKey);
  };

  const getScope = (permissionKey: string): string | undefined => {
    if (user?.isDeveloper || user?.isOwner) return 'all';
    return effectiveScopes[permissionKey];
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; redirectPath?: string; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshSession();
        return { success: true, redirectPath: data.redirectPath };
      }
      return { success: false, message: data.message || 'Invalid credentials' };
    } catch {
      return { success: false, message: 'Authentication error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setEffectivePermissions([]);
      setEffectiveScopes({});
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        branding,
        permissions,
        effectivePermissions,
        effectiveScopes,
        features,
        setupCompleted,
        loading,
        login,
        logout,
        refreshSession,
        isFeatureAllowed,
        can,
        getScope,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
