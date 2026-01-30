-- Criar tabela pauta_config para configuração do webhook de pauta
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pauta_config (
  id SERIAL PRIMARY KEY,
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT false,
  last_test_at TIMESTAMP WITH TIME ZONE,
  last_test_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração inicial se não existir
INSERT INTO pauta_config (id, is_active, created_at, updated_at)
VALUES (1, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna updated_at na briefing_config se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'briefing_config' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE briefing_config ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Habilitar RLS (Row Level Security) para pauta_config
ALTER TABLE pauta_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura por admins autenticados
CREATE POLICY "Admins can read pauta_config" ON pauta_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- Política para permitir atualização por admins autenticados
CREATE POLICY "Admins can update pauta_config" ON pauta_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- Política para permitir inserção por admins autenticados
CREATE POLICY "Admins can insert pauta_config" ON pauta_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

-- Conceder permissões ao service_role
GRANT ALL ON pauta_config TO service_role;
GRANT USAGE, SELECT ON SEQUENCE pauta_config_id_seq TO service_role;
