-- ============================================
-- SCRIPT PARA APLICAR RLS EM TODAS AS TABELAS
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. VERIFICAR ESTADO ATUAL
-- ============================================

-- Ver tabelas SEM RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY tablename;

-- ============================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

-- LEADS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company leads" ON public.leads;
CREATE POLICY "Users can view own company leads" ON public.leads
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own company leads" ON public.leads;
CREATE POLICY "Users can insert own company leads" ON public.leads
FOR INSERT WITH CHECK (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company leads" ON public.leads;
CREATE POLICY "Users can update own company leads" ON public.leads
FOR UPDATE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company leads" ON public.leads;
CREATE POLICY "Users can delete own company leads" ON public.leads
FOR DELETE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- COMPANIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Users can view own company" ON public.companies
FOR SELECT USING (
  id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
CREATE POLICY "Users can update own company" ON public.companies
FOR UPDATE USING (
  id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company users" ON public.users;
CREATE POLICY "Users can view own company users" ON public.users
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  OR id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (id = auth.uid());

-- CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company conversations" ON public.conversations;
CREATE POLICY "Users can view own company conversations" ON public.conversations
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own company conversations" ON public.conversations;
CREATE POLICY "Users can insert own company conversations" ON public.conversations
FOR INSERT WITH CHECK (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company conversations" ON public.conversations;
CREATE POLICY "Users can update own company conversations" ON public.conversations
FOR UPDATE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company messages" ON public.messages;
CREATE POLICY "Users can view own company messages" ON public.messages
FOR SELECT USING (
  conversa_id IN (
    SELECT id FROM public.conversations
    WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert own company messages" ON public.messages;
CREATE POLICY "Users can insert own company messages" ON public.messages
FOR INSERT WITH CHECK (
  conversa_id IN (
    SELECT id FROM public.conversations
    WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  )
);

-- LEAD_ICP
ALTER TABLE public.lead_icp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company icp" ON public.lead_icp;
CREATE POLICY "Users can view own company icp" ON public.lead_icp
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own company icp" ON public.lead_icp;
CREATE POLICY "Users can insert own company icp" ON public.lead_icp
FOR INSERT WITH CHECK (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company icp" ON public.lead_icp;
CREATE POLICY "Users can update own company icp" ON public.lead_icp
FOR UPDATE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company icp" ON public.lead_icp;
CREATE POLICY "Users can delete own company icp" ON public.lead_icp
FOR DELETE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- N8N_WEBHOOK_CONFIG
ALTER TABLE public.n8n_webhook_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view webhook config" ON public.n8n_webhook_config;
CREATE POLICY "Only admins can view webhook config" ON public.n8n_webhook_config
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- ACTIVITY_LOGS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON public.activity_logs;
CREATE POLICY "Users can view own logs" ON public.activity_logs
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own logs" ON public.activity_logs;
CREATE POLICY "Users can insert own logs" ON public.activity_logs
FOR INSERT WITH CHECK (user_id = auth.uid());

-- BRIEFING_RESPONSES
ALTER TABLE public.briefing_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company briefings" ON public.briefing_responses;
CREATE POLICY "Users can view own company briefings" ON public.briefing_responses
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own company briefings" ON public.briefing_responses;
CREATE POLICY "Users can insert own company briefings" ON public.briefing_responses
FOR INSERT WITH CHECK (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- WHATSAPP_INSTANCES
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company instances" ON public.whatsapp_instances;
CREATE POLICY "Users can view own company instances" ON public.whatsapp_instances
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company instances" ON public.whatsapp_instances;
CREATE POLICY "Users can update own company instances" ON public.whatsapp_instances
FOR UPDATE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- TEMPLATES
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company templates" ON public.templates;
CREATE POLICY "Users can view own company templates" ON public.templates
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own company templates" ON public.templates;
CREATE POLICY "Users can insert own company templates" ON public.templates
FOR INSERT WITH CHECK (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company templates" ON public.templates;
CREATE POLICY "Users can update own company templates" ON public.templates
FOR UPDATE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company templates" ON public.templates;
CREATE POLICY "Users can delete own company templates" ON public.templates
FOR DELETE USING (
  company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);

-- ============================================
-- 3. VERIFICAR RESULTADO FINAL
-- ============================================

-- Ver todas as tabelas e seu status de RLS
SELECT
    tablename,
    rowsecurity as "RLS Habilitado",
    COUNT(p.policyname) as "Número de Policies"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Ver tabelas com RLS mas sem policies (PROBLEMA)
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND p.policyname IS NULL
ORDER BY t.tablename;
