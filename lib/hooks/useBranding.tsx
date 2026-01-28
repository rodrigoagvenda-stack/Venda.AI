'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface BrandingData {
  company_id: number;
  logo_url: string | null;
  logo_url_light: string | null;
  favicon_url: string | null;
  app_name: string;
  primary_color: string;
}

const DEFAULT_BRANDING: BrandingData = {
  company_id: 0,
  logo_url: null,
  logo_url_light: null,
  favicon_url: null,
  app_name: 'vend.AI',
  primary_color: '#FF5500',
};

interface BrandingContextType {
  branding: BrandingData;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  loading: true,
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranding() {
      try {
        const response = await fetch('/api/branding');
        const data = await response.json();
        if (data.success && data.data) {
          setBranding(data.data);

          // Aplicar cor primária como variável CSS
          if (data.data.primary_color) {
            document.documentElement.style.setProperty('--primary', hexToHSL(data.data.primary_color));
          }

          // Atualizar favicon se existir
          if (data.data.favicon_url) {
            const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
              favicon.href = data.data.favicon_url;
            } else {
              const newFavicon = document.createElement('link');
              newFavicon.rel = 'icon';
              newFavicon.href = data.data.favicon_url;
              document.head.appendChild(newFavicon);
            }
          }

          // Atualizar título
          if (data.data.app_name) {
            document.title = data.data.app_name;
          }
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

// Converte HEX para HSL (formato usado pelo shadcn/ui)
function hexToHSL(hex: string): string {
  // Remove o # se existir
  hex = hex.replace('#', '');

  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Retorna no formato HSL usado pelo shadcn
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
