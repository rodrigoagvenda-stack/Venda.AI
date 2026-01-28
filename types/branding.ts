export interface CompanyBranding {
  company_id: number;
  logo_url: string | null;
  logo_url_light: string | null;
  favicon_url: string | null;
  app_name: string;
  primary_color: string;
  secondary_color: string | null;
  background_color: string | null;
}

export interface CompanyDomain {
  id: string;
  company_id: number;
  domain: string;
  is_primary: boolean;
}

// Branding padrão do sistema
export const DEFAULT_BRANDING: CompanyBranding = {
  company_id: 0,
  logo_url: 'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Logo-Venda-Ai-transparente-branco.png',
  logo_url_light: 'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Logo-Venda-Ai-transparente-branco.png',
  favicon_url: 'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Fivecon-vendai.png',
  app_name: 'vend.AI',
  primary_color: '#DAFF00',
  secondary_color: null,
  background_color: null,
};
