-- ============================================================================
-- WHITE LABEL - TABELAS PARA MULTI-COMPANY BRANDING
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- COMPANY DOMAINS
-- Mapeamento de domínios para companies
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por domínio
CREATE INDEX IF NOT EXISTS idx_company_domains_domain ON company_domains(domain);
CREATE INDEX IF NOT EXISTS idx_company_domains_company_id ON company_domains(company_id);

-- ============================================================================
-- COMPANY BRANDING
-- Configurações visuais de cada company
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id BIGINT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  logo_url TEXT,
  logo_url_light TEXT, -- Logo para modo light (opcional)
  favicon_url TEXT,
  app_name TEXT NOT NULL DEFAULT 'vend.AI',
  primary_color TEXT NOT NULL DEFAULT '#DAFF00',
  secondary_color TEXT,
  background_color TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por company
CREATE INDEX IF NOT EXISTS idx_company_branding_company_id ON company_branding(company_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE company_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;

-- Leitura pública para resolver domínio (necessário para middleware/SSR)
CREATE POLICY "public_read_company_domains" ON company_domains
  FOR SELECT USING (true);

CREATE POLICY "public_read_company_branding" ON company_branding
  FOR SELECT USING (true);

-- Service role pode fazer tudo
CREATE POLICY "service_role_all_company_domains" ON company_domains
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_company_branding" ON company_branding
  FOR ALL TO service_role USING (true);

-- Admins podem gerenciar
CREATE POLICY "admins_manage_company_domains" ON company_domains
  FOR ALL USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

CREATE POLICY "admins_manage_company_branding" ON company_branding
  FOR ALL USING (auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true));

-- ============================================================================
-- TRIGGER PARA UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVA EM PRODUÇÃO)
-- ============================================================================

-- Inserir branding padrão para company 1 (se existir)
-- INSERT INTO company_branding (company_id, app_name, logo_url, favicon_url, primary_color)
-- VALUES (
--   1,
--   'vend.AI',
--   'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Logo-Venda-Ai-transparente-branco.png',
--   'https://dkvznmmiiiljyrkopiqx.supabase.co/storage/v1/object/public/whatsapp-media/1/whatsapp/Fivecon-vendai.png',
--   '#DAFF00'
-- ) ON CONFLICT (company_id) DO NOTHING;

-- Inserir domínio padrão para company 1 (se existir)
-- INSERT INTO company_domains (company_id, domain, is_primary)
-- VALUES (1, 'localhost:3000', true)
-- ON CONFLICT (domain) DO NOTHING;

-- ============================================================================
-- FIM DO SCHEMA WHITE LABEL
-- ============================================================================
