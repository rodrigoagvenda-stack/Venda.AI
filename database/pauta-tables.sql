-- ============================================================================
-- PAUTA FORM - TABELAS
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- Configuração do webhook
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

-- Respostas do formulário de pauta
CREATE TABLE IF NOT EXISTS pauta_responses (
  id BIGSERIAL PRIMARY KEY,

  -- Tipo de pauta
  tipo_pauta TEXT NOT NULL, -- 'social_media', 'trafego'

  -- Dados comuns
  nome_cs TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  objetivos TEXT[] NOT NULL, -- array de objetivos selecionados
  plataformas TEXT[] NOT NULL, -- array de plataformas
  observacoes TEXT,

  -- Campos específicos de Social Media
  quantidade_posts TEXT, -- '1 a 3', '4 a 7', '8 a 12', 'Mais de 12'
  formatos_conteudo TEXT[], -- array: 'Estático', 'Vídeo', 'Carrossel', 'Reels', 'Stories'
  precisa_copy TEXT, -- 'sim', 'nao'
  precisa_legenda TEXT, -- 'sim', 'nao'

  -- Campos específicos de Tráfego
  metricas TEXT[], -- array: 'CPA', 'CPL', 'CPC', 'CPM', 'CTR', 'ROAS', etc.
  campanha_especifica TEXT,

  -- Meta
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  webhook_sent BOOLEAN DEFAULT FALSE,
  webhook_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pauta_responses_created_at ON pauta_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pauta_responses_tipo_pauta ON pauta_responses(tipo_pauta);
CREATE INDEX IF NOT EXISTS idx_pauta_responses_nome_cliente ON pauta_responses(nome_cliente);
CREATE INDEX IF NOT EXISTS idx_pauta_responses_nome_cs ON pauta_responses(nome_cs);

-- RLS (público pode inserir, admin pode ver tudo)
ALTER TABLE pauta_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pauta_responses ENABLE ROW LEVEL SECURITY;

-- Service role pode fazer tudo
CREATE POLICY "pauta_config_service_all" ON pauta_config
  FOR ALL USING (true);

CREATE POLICY "pauta_responses_service_all" ON pauta_responses
  FOR ALL USING (true);

-- Público pode inserir respostas
CREATE POLICY "pauta_responses_public_insert" ON pauta_responses
  FOR INSERT WITH CHECK (true);

-- Apenas admins podem ver respostas
CREATE POLICY "pauta_responses_admin_select" ON pauta_responses
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Apenas admins podem ver configuração
CREATE POLICY "pauta_config_admin_select" ON pauta_config
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Apenas admins podem atualizar configuração
CREATE POLICY "pauta_config_admin_update" ON pauta_config
  FOR UPDATE USING (
    auth.uid() IN (SELECT auth_user_id FROM admin_users WHERE is_active = true)
  );

-- Trigger: atualizar updated_at (usa a mesma função do briefing se já existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pauta_config_updated_at ON pauta_config;
CREATE TRIGGER update_pauta_config_updated_at
  BEFORE UPDATE ON pauta_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração inicial (vazia)
INSERT INTO pauta_config (webhook_url, is_active)
VALUES (NULL, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
