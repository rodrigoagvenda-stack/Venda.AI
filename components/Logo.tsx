'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useBranding } from '@/components/providers/BrandingProvider';

// URLs hardcoded da VendAI - sempre usadas quando NÃO há white label
const VENDAI_LOGO_WHITE = 'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Logo-Venda-Ai-transparente-branco.png';
const VENDAI_LOGO_BLACK = 'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Logo-Venda-Ai-transparente-branco.png';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = '', width = 120, height = 40 }: LogoProps) {
  const branding = useBranding();
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // White label ativo APENAS se company_id > 0 (domínio cadastrado com branding)
  const hasWhiteLabel = branding.company_id > 0;

  useEffect(() => {
    setMounted(true);

    const checkTheme = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    };

    checkTheme();

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

  // Se tem white label E logo customizada, usa ela. Senão, usa VendAI hardcoded
  const logoWhite = hasWhiteLabel && branding.logo_url ? branding.logo_url : VENDAI_LOGO_WHITE;
  const logoBlack = hasWhiteLabel && branding.logo_url_light ? branding.logo_url_light : VENDAI_LOGO_BLACK;
  const appName = hasWhiteLabel ? branding.app_name : 'vend.AI';

  if (!mounted) {
    return (
      <div className={className}>
        <Image
          src={logoWhite}
          alt={appName}
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
        alt={appName}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}

// Logo para fundos escuros (branca)
export function LogoWhite({ className = '', width = 120, height = 40 }: LogoProps) {
  const branding = useBranding();

  // White label ativo APENAS se company_id > 0
  const hasWhiteLabel = branding.company_id > 0;
  const logoUrl = hasWhiteLabel && branding.logo_url ? branding.logo_url : VENDAI_LOGO_WHITE;
  const appName = hasWhiteLabel ? branding.app_name : 'vend.AI';

  return (
    <div className={className}>
      <Image
        src={logoUrl}
        alt={appName}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}

// Logo para fundos claros (preta)
export function LogoBlack({ className = '', width = 120, height = 40 }: LogoProps) {
  const branding = useBranding();

  // White label ativo APENAS se company_id > 0
  const hasWhiteLabel = branding.company_id > 0;
  const logoUrl = hasWhiteLabel && branding.logo_url_light ? branding.logo_url_light : VENDAI_LOGO_BLACK;
  const appName = hasWhiteLabel ? branding.app_name : 'vend.AI';

  return (
    <div className={className}>
      <Image
        src={logoUrl}
        alt={appName}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
