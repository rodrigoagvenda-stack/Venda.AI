'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useBranding } from '@/components/providers/BrandingProvider';
import { DEFAULT_BRANDING } from '@/types/branding';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = '', width = 120, height = 40 }: LogoProps) {
  const branding = useBranding();
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check initial theme
    const checkTheme = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    };

    checkTheme();

    // Observe changes to the class
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // URLs do branding
  const logoWhite = branding.logo_url || DEFAULT_BRANDING.logo_url!;
  const logoBlack = branding.logo_url_light || branding.logo_url || DEFAULT_BRANDING.logo_url_light!;

  // Antes de montar, mostra a logo branca (dark mode é o padrão)
  if (!mounted) {
    return (
      <div className={className}>
        <Image
          src={logoWhite}
          alt={branding.app_name}
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  const logoSrc = isDark ? logoWhite : logoBlack;

  return (
    <div className={className}>
      <Image
        src={logoSrc}
        alt={branding.app_name}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}

// Logo simples sem detecção de tema (para usar em fundos escuros)
export function LogoWhite({ className = '', width = 120, height = 40 }: LogoProps) {
  const branding = useBranding();
  const logoUrl = branding.logo_url || DEFAULT_BRANDING.logo_url!;

  return (
    <div className={className}>
      <Image
        src={logoUrl}
        alt={branding.app_name}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}

// Logo para fundos claros
export function LogoBlack({ className = '', width = 120, height = 40 }: LogoProps) {
  const branding = useBranding();
  const logoUrl = branding.logo_url_light || branding.logo_url || DEFAULT_BRANDING.logo_url_light!;

  return (
    <div className={className}>
      <Image
        src={logoUrl}
        alt={branding.app_name}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
