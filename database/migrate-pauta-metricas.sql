-- ============================================================================
-- MIGRAÇÃO: Pauta Responses - Métricas com Valores
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor se a tabela já existir
-- ============================================================================

-- 1. Adicionar coluna tipo_campanha (se não existir)
ALTER TABLE pauta_responses 
ADD COLUMN IF NOT EXISTS tipo_campanha TEXT;

-- 2. Criar coluna temporária para novos dados JSONB
ALTER TABLE pauta_responses 
ADD COLUMN IF NOT EXISTS metricas_new JSONB;

-- 3. Migrar dados antigos (TEXT[]) para novo formato (JSONB)
-- Dados antigos eram arrays de strings como ['CPA', 'CTR']
-- Novos são arrays de objetos como [{id, nome, valor}]
UPDATE pauta_responses 
SET metricas_new = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'nome', m,
      'valor', ''
    )
  )
  FROM unnest(metricas) AS m
)
WHERE metricas IS NOT NULL AND metricas_new IS NULL;

-- 4. Remover coluna antiga e renomear nova
ALTER TABLE pauta_responses DROP COLUMN IF EXISTS metricas;
ALTER TABLE pauta_responses RENAME COLUMN metricas_new TO metricas;

-- 5. Comentário para documentação
COMMENT ON COLUMN pauta_responses.tipo_campanha IS 'Tipo específico de campanha por plataforma (search, display, leads, etc.)';
COMMENT ON COLUMN pauta_responses.metricas IS 'Array de objetos com métricas: [{id, nome, valor}]';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
