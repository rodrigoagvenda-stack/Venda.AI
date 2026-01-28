import { createClient } from '@supabase/supabase-js';
import { CompanyBranding, DEFAULT_BRANDING } from '@/types/branding';

// Cache simples em memória (TTL de 5 minutos)
const brandingCache = new Map<string, { branding: CompanyBranding; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Cliente Supabase para uso no servidor (sem cookies)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Resolve company_id a partir do domínio
 */
export async function getCompanyIdByDomain(domain: string): Promise<number | null> {
  try {
    const supabase = getSupabaseClient();

    // Remove porta para matching (localhost:3000 -> localhost)
    const cleanDomain = domain.split(':')[0];

    // Tenta match exato primeiro
    let { data } = await supabase
      .from('company_domains')
      .select('company_id')
      .eq('domain', domain)
      .single();

    // Se não encontrou, tenta sem porta
    if (!data && domain !== cleanDomain) {
      const result = await supabase
        .from('company_domains')
        .select('company_id')
        .eq('domain', cleanDomain)
        .single();
      data = result.data;
    }

    // Fallback: busca por domínio contido na URL (caso salvo como https://domain/path)
    if (!data) {
      const result = await supabase
        .from('company_domains')
        .select('company_id')
        .ilike('domain', `%${cleanDomain}%`)
        .limit(1)
        .single();
      data = result.data;
    }

    return data?.company_id || null;
  } catch (error) {
    console.error('Error getting company by domain:', error);
    return null;
  }
}

/**
 * Busca branding de uma company
 */
export async function getBrandingByCompanyId(companyId: number): Promise<CompanyBranding> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('company_branding')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error || !data) {
      return DEFAULT_BRANDING;
    }

    return {
      company_id: data.company_id,
      logo_url: data.logo_url || DEFAULT_BRANDING.logo_url,
      logo_url_light: data.logo_url_light || data.logo_url || DEFAULT_BRANDING.logo_url_light,
      favicon_url: data.favicon_url || DEFAULT_BRANDING.favicon_url,
      app_name: data.app_name || DEFAULT_BRANDING.app_name,
      primary_color: data.primary_color || DEFAULT_BRANDING.primary_color,
      secondary_color: data.secondary_color,
      background_color: data.background_color,
    };
  } catch (error) {
    console.error('Error getting branding:', error);
    return DEFAULT_BRANDING;
  }
}

/**
 * Busca branding pelo domínio (com cache)
 */
export async function getBrandingByDomain(domain: string): Promise<CompanyBranding> {
  // Verifica cache
  const cached = brandingCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.branding;
  }

  // Busca company_id pelo domínio
  const companyId = await getCompanyIdByDomain(domain);

  if (!companyId) {
    // Domínio não encontrado, retorna branding padrão
    return DEFAULT_BRANDING;
  }

  // Busca branding
  const branding = await getBrandingByCompanyId(companyId);

  // Salva no cache
  brandingCache.set(domain, { branding, timestamp: Date.now() });

  return branding;
}

/**
 * Limpa o cache de branding (útil após atualizações)
 */
export function clearBrandingCache(domain?: string) {
  if (domain) {
    brandingCache.delete(domain);
  } else {
    brandingCache.clear();
  }
}

/**
 * Serializa branding para passar via headers/cookies
 */
export function serializeBranding(branding: CompanyBranding): string {
  return Buffer.from(JSON.stringify(branding)).toString('base64');
}

/**
 * Deserializa branding
 */
export function deserializeBranding(serialized: string): CompanyBranding {
  try {
    return JSON.parse(Buffer.from(serialized, 'base64').toString('utf-8'));
  } catch {
    return DEFAULT_BRANDING;
  }
}
