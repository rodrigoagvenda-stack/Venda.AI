-- Adicionar coluna telefone na tabela pauta_responses
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE pauta_responses
ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Criar índice para busca rápida por telefone
CREATE INDEX IF NOT EXISTS idx_pauta_responses_telefone
ON pauta_responses(telefone);
