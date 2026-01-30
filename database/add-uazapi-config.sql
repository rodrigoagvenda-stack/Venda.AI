-- Adicionar campos de configuração da UazAPI na tabela pauta_config
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE pauta_config
ADD COLUMN IF NOT EXISTS uazapi_url TEXT,
ADD COLUMN IF NOT EXISTS uazapi_token TEXT;

-- Comentários para documentação
COMMENT ON COLUMN pauta_config.uazapi_url IS 'URL da instância UazAPI para envio de mensagens WhatsApp';
COMMENT ON COLUMN pauta_config.uazapi_token IS 'Token de autenticação da UazAPI';
