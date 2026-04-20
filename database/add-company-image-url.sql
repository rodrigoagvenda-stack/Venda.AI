-- Adiciona coluna image_url na tabela companies para armazenar logo da empresa
ALTER TABLE companies ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adiciona coluna n8n_webhook_url para webhook de atendimento por empresa
ALTER TABLE companies ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;
