'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

// URLs das logos no Supabase
const LOGO_WHITE = 'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Logo-Venda-Ai-transparente-branco.png';
const LOGO_BLACK = 'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Logo-Venda-Ai-transparente-branco.png';

export function Logo({ className = '', width = 120, height = 40 }: LogoProps) {
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

  // Antes de montar, mostra a logo branca (dark mode é o padrão)
  if (!mounted) {
    return (
      <div className={className}>
        <Image
          src={LOGO_WHITE}
          alt="vend.AI"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  const logoSrc = isDark ? LOGO_WHITE : LOGO_BLACK;

  return (
    <div className={className}>
      <Image
        src={logoSrc}
        alt="vend.AI"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}

// Logo simples sem detecção de tema (para usar em fundos específicos)
export function LogoWhite({ className = '', width = 120, height = 40 }: LogoProps) {
  return (
    <div className={className}>
      <Image
        src={LOGO_WHITE}
        alt="vend.AI"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}

export function LogoBlack({ className = '', width = 120, height = 40 }: LogoProps) {
  return (
    <div className={className}>
      <Image
        src={LOGO_BLACK}
        alt="vend.AI"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
