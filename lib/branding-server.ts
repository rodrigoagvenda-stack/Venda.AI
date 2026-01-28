import { headers } from 'next/headers';
import { CompanyBranding, DEFAULT_BRANDING } from '@/types/branding';
import { deserializeBranding, getBrandingByDomain } from './branding';

/**
 * Obtém branding no servidor (para uso em Server Components)
 */
export async function getServerBranding(): Promise<CompanyBranding> {
  try {
    const headersList = await headers();
    const brandingHeader = headersList.get('x-branding');

    if (brandingHeader) {
      return deserializeBranding(brandingHeader);
    }

    // Fallback: busca pelo host se o header não estiver disponível
    const host = headersList.get('host') || 'localhost:3000';
    return await getBrandingByDomain(host);
  } catch (error) {
    console.error('Error getting server branding:', error);
    return DEFAULT_BRANDING;
  }
}

/**
 * Gera CSS variables baseado no branding
 * ISOLADO: Só gera quando há white label ativo (company_id > 0)
 */
export function generateCSSVariables(branding: CompanyBranding): string {
  // Se não tem white label (company_id = 0), não sobrescreve as cores padrão
  if (branding.company_id === 0) {
    return '';
  }

  const vars: string[] = [];

  vars.push(`--primary: ${hexToHSL(branding.primary_color)}`);

  if (branding.secondary_color) {
    vars.push(`--secondary: ${hexToHSL(branding.secondary_color)}`);
  }

  if (branding.background_color) {
    vars.push(`--accent: ${hexToHSL(branding.background_color)}`);
  }

  return vars.join('; ');
}

/**
 * Converte HEX para HSL (formato usado pelo Tailwind/shadcn)
 */
function hexToHSL(hex: string): string {
  // Remove # se existir
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

  // Retorna no formato do Tailwind: "H S% L%"
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
