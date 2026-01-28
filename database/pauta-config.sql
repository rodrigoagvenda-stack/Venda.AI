-- ============================================================================
-- PAUTA CONFIG - Configuracao de Webhook para Pauta
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- Configuracao do webhook de pauta
CREATE TABLE IF NOT EXISTS pauta_config (
  id SERIAL PRIMARY KEY,
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT, -- 'success', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE pauta_config ENABLE ROW LEVEL SECURITY;

-- Service role pode fazer tudo
CREATE POLICY IF NOT EXISTS "pauta_config_service_all" ON pauta_config
  FOR ALL USING (true);

-- Apenas admins podem ver configuracao
CREATE POLICY IF NOT EXISTS "pauta_config_admin_select" ON pauta_config
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Apenas admins podem atualizar configuracao
CREATE POLICY IF NOT EXISTS "pauta_config_admin_update" ON pauta_config
  FOR UPDATE USING (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Trigger: atualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_pauta_config_updated_at
  BEFORE UPDATE ON pauta_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuracao inicial (vazia)
INSERT INTO pauta_config (webhook_url, is_active)
VALUES (NULL, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
