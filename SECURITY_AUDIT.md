# 🔒 Auditoria de Segurança - Vend.AI

## ✅ SEGURO (Já implementado corretamente)

### 1. Variáveis de Ambiente
- ✅ Credenciais do Supabase em `.env` (não expostas no frontend)
- ✅ Chaves de API em variáveis de ambiente
- ✅ Webhooks ICP, WhatsApp usando env vars

### 2. Autenticação
- ✅ Verificação de usuário em todas as rotas de API
- ✅ Service Client usado apenas no servidor
- ✅ RLS habilitado no Supabase

---

## ❌ PROBLEMAS CRÍTICOS

### 1. **Webhook prospect.AI hardcoded em variável de ambiente**
**Arquivo**: `lib/n8n/client.ts:3`
```typescript
const N8N_WEBHOOK_MAPS = process.env.N8N_WEBHOOK_MAPS!;
```

**Problema**: URL do webhook está em variável de ambiente ao invés do banco

**Solução**: Mover para tabela `n8n_webhook_config` (igual ao ICP)

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Migrar webhook prospect.AI para banco de dados

**Adicionar campo na tabela `n8n_webhook_config`**:
```sql
-- Inserir configuração do webhook Maps
INSERT INTO public.n8n_webhook_config (webhook_type, webhook_url, auth_type, auth_username, auth_password, is_active, created_at, updated_at)
VALUES ('maps', 'SUA_URL_AQUI', 'basic', 'seu_usuario', 'sua_senha', true, now(), now());
```

**Atualizar `lib/n8n/client.ts`**:
Fazer o mesmo que já existe para ICP - buscar do banco ao invés de env var.

---

## 🛡️ SQL PARA AUDITORIA DE RLS

Execute este SQL no Supabase para identificar tabelas SEM Row Level Security:

```sql
-- 1. VERIFICAR TABELAS SEM RLS HABILITADO
SELECT
    schemaname,
    tablename,
    rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY tablename;

-- 2. LISTAR TODAS AS POLICIES EXISTENTES
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. IDENTIFICAR TABELAS COM RLS MAS SEM POLICIES
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND p.policyname IS NULL
ORDER BY t.tablename;
```

---

## 📋 POLÍTICAS RLS RECOMENDADAS

### Padrão para todas as tabelas com `company_id`:

```sql
-- Exemplo: Tabela LEADS
-- 1. Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2. Policy para SELECT (usuários veem apenas da própria empresa)
CREATE POLICY "Users can view own company leads"
ON public.leads
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.users WHERE id = auth.uid()
  )
);

-- 3. Policy para INSERT (usuários inserem apenas na própria empresa)
CREATE POLICY "Users can insert own company leads"
ON public.leads
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.users WHERE id = auth.uid()
  )
);

-- 4. Policy para UPDATE (usuários atualizam apenas da própria empresa)
CREATE POLICY "Users can update own company leads"
ON public.leads
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.users WHERE id = auth.uid()
  )
);

-- 5. Policy para DELETE (usuários deletam apenas da própria empresa)
CREATE POLICY "Users can delete own company leads"
ON public.leads
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.users WHERE id = auth.uid()
  )
);
```

### Padrão para tabelas com `user_id`:

```sql
-- Exemplo: Tabela ACTIVITY_LOGS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
ON public.activity_logs
FOR SELECT
USING (user_id = auth.uid());
```

---

## 🚨 CHECKLIST PRÉ-PRODUÇÃO

- [ ] Migrar webhook Maps para banco `n8n_webhook_config`
- [ ] Executar SQL de auditoria RLS
- [ ] Habilitar RLS em TODAS as tabelas
- [ ] Criar policies para SELECT, INSERT, UPDATE, DELETE
- [ ] Testar isolamento entre empresas
- [ ] Verificar que Service Client é usado apenas no servidor
- [ ] Revisar variáveis `.env` (nunca commitar)
- [ ] Adicionar `.env` no `.gitignore`
- [ ] Testar autenticação expirada
- [ ] Validar permissões de admin vs user

---

## 🔐 NOTAS DE SEGURANÇA

1. **NUNCA** exponha URLs de webhook no frontend
2. **SEMPRE** use RLS para isolamento de dados
3. **SEMPRE** valide `auth.uid()` nas policies
4. **NUNCA** use Service Client no frontend
5. **SEMPRE** use variáveis de ambiente para credenciais
6. **TESTAR** com usuários de empresas diferentes

---

## 📊 TABELAS QUE PRECISAM DE RLS

Execute a query #1 acima para identificar. Tabelas esperadas:

- ✅ `leads`
- ✅ `companies`
- ✅ `users`
- ✅ `conversations`
- ✅ `messages`
- ✅ `lead_icp`
- ✅ `n8n_webhook_config`
- ✅ `activity_logs`
- ✅ `briefing_responses`
- ✅ `whatsapp_instances`
- ✅ `templates`
- ✅ Todas as outras tabelas com dados sensíveis

---

**Data da Auditoria**: 07/02/2026
**Status**: ❌ NÃO PRONTO PARA PRODUÇÃO
**Ações Necessárias**: Migrar webhook Maps + Auditar RLS
