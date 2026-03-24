-- =============================================
-- Briefing Multi-Tenant System
-- =============================================

-- 1. Config por empresa (slug, tema, cor, webhook, logo)
CREATE TABLE IF NOT EXISTS briefing_company_config (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  company_name    TEXT NOT NULL,
  logo_url        TEXT,
  primary_color   TEXT DEFAULT '#000000',
  welcome_title   TEXT DEFAULT 'Bem-vindo ao Briefing',
  welcome_message TEXT DEFAULT 'Vamos conhecer melhor a sua empresa e entender como podemos ajudar.',
  success_message TEXT DEFAULT 'Obrigado! Em breve entraremos em contato.',
  webhook_url     TEXT,
  webhook_secret  TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perguntas por empresa
CREATE TABLE IF NOT EXISTS briefing_questions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id      UUID NOT NULL REFERENCES briefing_company_config(id) ON DELETE CASCADE,
  label          TEXT NOT NULL,
  field_key      TEXT NOT NULL,
  question_type  TEXT NOT NULL CHECK (question_type IN ('text','textarea','select','radio','multiselect','checkbox','currency','url','whatsapp')),
  options        JSONB,            -- [{ "value": "...", "label": "..." }]
  placeholder    TEXT,
  is_required    BOOLEAN DEFAULT true,
  order_index    INTEGER NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (config_id, field_key)
);

-- 3. Respostas (JSONB: { field_key: valor, ... })
CREATE TABLE IF NOT EXISTS briefing_mt_responses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      UUID REFERENCES briefing_company_config(id) ON DELETE SET NULL,
  answers         JSONB NOT NULL DEFAULT '{}',
  lead_id         UUID,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  webhook_sent    BOOLEAN DEFAULT false,
  webhook_sent_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_briefing_questions_config  ON briefing_questions(config_id, order_index);
CREATE INDEX IF NOT EXISTS idx_briefing_mt_responses_co   ON briefing_mt_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_briefing_mt_responses_sub  ON briefing_mt_responses(submitted_at DESC);

-- RLS
ALTER TABLE briefing_company_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_mt_responses     ENABLE ROW LEVEL SECURITY;

-- Config e perguntas: leitura pública (formulário público precisa ler)
CREATE POLICY "briefing_config_public_read"
  ON briefing_company_config FOR SELECT
  USING (is_active = true);

CREATE POLICY "briefing_questions_public_read"
  ON briefing_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM briefing_company_config c
      WHERE c.id = briefing_questions.config_id AND c.is_active = true
    )
  );

-- Respostas: anon pode inserir; service role lê/atualiza via RLS bypass
CREATE POLICY "briefing_mt_responses_insert"
  ON briefing_mt_responses FOR INSERT
  WITH CHECK (true);
