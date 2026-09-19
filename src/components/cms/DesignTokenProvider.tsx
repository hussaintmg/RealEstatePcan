'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface DesignContextType {
  activeThemeKey: string;
  themeMode: string;
  publicLayouts: {
    topbarKey: string;
    mobileNavKey: string;
    footerKey: string;
    stickyNav?: boolean;
    searchEnabled?: boolean;
    ctaText?: string;
    ctaUrl?: string;
  };
  typography: {
    headingFont?: string;
    bodyFont?: string;
    uiFont?: string;
    fluidType?: any;
  };
  loading: boolean;
}

const defaultContext: DesignContextType = {
  activeThemeKey: 'luxury-dark',
  themeMode: 'dark',
  publicLayouts: {
    topbarKey: 'topbar-minimal-centered',
    mobileNavKey: 'mob-drawer-left',
    footerKey: 'footer-large-editorial',
    stickyNav: true,
    searchEnabled: true,
    ctaText: 'Book VIP Viewing',
    ctaUrl: '/#contact',
  },
  typography: {
    headingFont: "'Cormorant Garamond', serif",
    bodyFont: "'Inter', sans-serif",
    uiFont: "'Inter', sans-serif",
  },
  loading: true,
};

const DesignContext = createContext<DesignContextType>(defaultContext);

export const useDesignTokens = () => useContext(DesignContext);

export const DesignTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [designState, setDesignState] = useState<DesignContextType>(defaultContext);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/cms/design/public')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data.success) return;

        // Inject Google Fonts link
        if (data.googleFontsUrl) {
          let link = document.getElementById('cms-google-fonts') as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.id = 'cms-google-fonts';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          link.href = data.googleFontsUrl;
        }

        // Inject CSS Variables style tag
        if (data.cssString) {
          let style = document.getElementById('cms-design-tokens') as HTMLStyleElement | null;
          if (!style) {
            style = document.createElement('style');
            style.id = 'cms-design-tokens';
            document.head.appendChild(style);
          }
          style.innerHTML = data.cssString;
        }

        setDesignState({
          activeThemeKey: data.activeThemeKey || 'luxury-dark',
          themeMode: data.themeMode || 'dark',
          publicLayouts: data.publicLayouts || defaultContext.publicLayouts,
          typography: data.typography || defaultContext.typography,
          loading: false,
        });
      })
      .catch((err) => {
        console.warn('CMS design public load fallback:', err);
        if (isMounted) setDesignState((prev) => ({ ...prev, loading: false }));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return <DesignContext.Provider value={designState}>{children}</DesignContext.Provider>;
};
