'use client';

import { createContext, useContext, ReactNode } from 'react';
import { CompanyBranding, DEFAULT_BRANDING } from '@/types/branding';

const BrandingContext = createContext<CompanyBranding>(DEFAULT_BRANDING);

interface BrandingProviderProps {
  children: ReactNode;
  branding: CompanyBranding;
}

export function BrandingProvider({ children, branding }: BrandingProviderProps) {
  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): CompanyBranding {
  const context = useContext(BrandingContext);
  if (!context) {
    return DEFAULT_BRANDING;
  }
  return context;
}
