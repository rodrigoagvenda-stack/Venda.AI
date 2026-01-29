-- ============================================================================
-- PAUTA FORM - TABELAS
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- Configuração do webhook de Pauta
CREATE TABLE IF NOT EXISTS pauta_config (
  id SERIAL PRIMARY KEY,
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT, -- 'success', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE pauta_config ENABLE ROW LEVEL SECURITY;

-- Service role pode fazer tudo
DROP POLICY IF EXISTS "pauta_config_service_all" ON pauta_config;
CREATE POLICY "pauta_config_service_all" ON pauta_config
  FOR ALL USING (true);

-- Apenas admins podem ver configuração
DROP POLICY IF EXISTS "pauta_config_admin_select" ON pauta_config;
CREATE POLICY "pauta_config_admin_select" ON pauta_config
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Apenas admins podem atualizar configuração
DROP POLICY IF EXISTS "pauta_config_admin_update" ON pauta_config;
CREATE POLICY "pauta_config_admin_update" ON pauta_config
  FOR UPDATE USING (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Apenas admins podem inserir configuração
DROP POLICY IF EXISTS "pauta_config_admin_insert" ON pauta_config;
CREATE POLICY "pauta_config_admin_insert" ON pauta_config
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Trigger: atualizar updated_at
DROP TRIGGER IF EXISTS update_pauta_config_updated_at ON pauta_config;
CREATE TRIGGER update_pauta_config_updated_at
  BEFORE UPDATE ON pauta_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
