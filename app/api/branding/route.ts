import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('x-host') || request.headers.get('host') || '';

    // Extrair o domínio (remove porta se existir)
    const domain = host.split(':')[0];

    // Se for localhost ou o domínio principal, retorna branding padrão
    if (domain === 'localhost' || domain === 'vendai.pro' || domain === 'www.vendai.pro') {
      return NextResponse.json({ success: true, data: DEFAULT_BRANDING });
    }

    const supabase = await createClient();

    // Buscar empresa pelo domínio
    const { data: domainData, error: domainError } = await supabase
      .from('company_domains')
      .select('company_id')
      .eq('domain', domain)
      .single();

    if (domainError || !domainData) {
      // Tenta buscar com o host completo (com subdomínio)
      const { data: domainData2, error: domainError2 } = await supabase
        .from('company_domains')
        .select('company_id')
        .eq('domain', host)
        .single();

      if (domainError2 || !domainData2) {
        return NextResponse.json({ success: true, data: DEFAULT_BRANDING });
      }

      // Buscar branding
      const { data: branding } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', domainData2.company_id)
        .single();

      if (branding) {
        return NextResponse.json({
          success: true,
          data: {
            company_id: branding.company_id,
            logo_url: branding.logo_url,
            logo_url_light: branding.logo_url_light,
            favicon_url: branding.favicon_url,
            app_name: branding.app_name || DEFAULT_BRANDING.app_name,
            primary_color: branding.primary_color || DEFAULT_BRANDING.primary_color,
          },
        });
      }

      return NextResponse.json({ success: true, data: DEFAULT_BRANDING });
    }

    // Buscar branding
    const { data: branding } = await supabase
      .from('company_branding')
      .select('*')
      .eq('company_id', domainData.company_id)
      .single();

    if (branding) {
      return NextResponse.json({
        success: true,
        data: {
          company_id: branding.company_id,
          logo_url: branding.logo_url,
          logo_url_light: branding.logo_url_light,
          favicon_url: branding.favicon_url,
          app_name: branding.app_name || DEFAULT_BRANDING.app_name,
          primary_color: branding.primary_color || DEFAULT_BRANDING.primary_color,
        },
      });
    }

    return NextResponse.json({ success: true, data: DEFAULT_BRANDING });
  } catch (error: any) {
    console.error('Error fetching branding:', error);
    return NextResponse.json({ success: true, data: DEFAULT_BRANDING });
  }
}
