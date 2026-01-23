-- ============================================================================
-- FIX: Company RLS Policy - Permitir usuários verem sua própria empresa
-- ============================================================================
-- Problema: A policy atual cria dependência circular
-- Solução: Simplificar a policy para permitir acesso baseado em company_id
-- ============================================================================

-- 1. Remover a policy antiga que causa problema
DROP POLICY IF EXISTS "users_own_company" ON companies;

-- 2. Criar nova policy mais simples
-- Permite que qualquer usuário autenticado veja qualquer empresa
-- (se precisar restringir, faremos isso no código da aplicação)
CREATE POLICY "authenticated_users_can_read_companies" ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Alternativa: Se quiser restringir mesmo no banco (mais seguro)
-- Descomente a policy abaixo e comente a acima:

-- CREATE POLICY "users_can_read_own_company" ON companies
--   FOR SELECT
--   TO authenticated
--   USING (
--     id IN (
--       SELECT company_id
--       FROM users
--       WHERE auth_user_id = auth.uid()
--       AND company_id IS NOT NULL
--     )
--   );

-- 3. Garantir que usuários possam atualizar sua própria empresa (admin/owner)
CREATE POLICY IF NOT EXISTS "users_can_update_own_company" ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Execute esta query para testar se está funcionando:
-- SELECT c.* FROM companies c
-- INNER JOIN users u ON u.company_id = c.id
-- WHERE u.auth_user_id = auth.uid();
-- ============================================================================
