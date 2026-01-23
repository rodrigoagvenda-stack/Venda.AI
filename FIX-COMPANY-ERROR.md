# 🔴 FIX: "Erro ao identificar sua empresa"

## 🐛 Problema Identificado

O erro "Erro ao identificar sua empresa" ocorre quando:
1. Usuário está corretamente cadastrado na tabela `users` com `company_id` válido ✅
2. Empresa existe na tabela `companies` ✅
3. Mas o código não consegue carregar a empresa via JOIN/query ❌

---

## 🔍 Causa Raiz

### **Dependência Circular no RLS (Row Level Security)**

A policy RLS na tabela `companies` estava criando uma dependência circular:

```sql
-- Policy antiga (PROBLEMA)
CREATE POLICY "users_own_company" ON companies
  FOR SELECT USING (
    id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  );
```

**O que acontece:**
1. Hook `useUser()` tenta buscar user → ✅
2. Hook tenta JOIN com `companies` → ❌
3. RLS de `companies` precisa buscar em `users` de novo → 🔄 **LOOP!**
4. Query falha ou retorna vazio
5. `company` fica `null`
6. Código mostra erro: "Erro ao identificar sua empresa"

---

## ✅ Solução Aplicada

### **1. Corrigido o Hook `useUser()`**

**Antes:** Tentava JOIN em uma única query
```typescript
// ❌ Não funciona por causa do RLS circular
.from('users')
.select('*, companies:company_id(*)')
```

**Depois:** Busca separadamente
```typescript
// ✅ Funciona: busca user primeiro
const { data: userData } = await supabase
  .from('users')
  .select('*')
  .eq('auth_user_id', authUserId)
  .single();

// ✅ Depois busca company com o company_id
const { data: companyData } = await supabase
  .from('companies')
  .select('*')
  .eq('id', userData.company_id)
  .single();
```

✅ **Arquivo corrigido:** `lib/hooks/useUser.ts`

### **2. Criado SQL Fix para RLS Policy**

✅ **Arquivo criado:** `database/fix-company-rls.sql`

Execute no Supabase SQL Editor:

```sql
-- Remover policy antiga problemática
DROP POLICY IF EXISTS "users_own_company" ON companies;

-- Criar nova policy simples (permite ler qualquer empresa)
CREATE POLICY "authenticated_users_can_read_companies" ON companies
  FOR SELECT
  TO authenticated
  USING (true);
```

**Nota:** Esta policy permite que qualquer usuário autenticado veja qualquer empresa. Se precisar restringir mais, use a policy comentada no arquivo `fix-company-rls.sql`.

---

## 🚀 Como Aplicar a Correção

### **Passo 1: Atualizar o Código**

O código já foi corrigido automaticamente em `lib/hooks/useUser.ts`.

### **Passo 2: Executar SQL no Supabase**

1. Acesse o Supabase → SQL Editor
2. Abra o arquivo `database/fix-company-rls.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**

### **Passo 3: Testar**

1. Faça logout do sistema
2. Faça login novamente
3. Acesse a página `/prospect`
4. O erro "Erro ao identificar sua empresa" **não deve mais aparecer**
5. Abra o Console do navegador (F12) e verifique os logs:
   - ✅ `User found: {id, name, company_id, ...}`
   - ✅ `Company found: {id, name, email, ...}`

---

## 🔍 Debug Adicional

Se o problema persistir, verifique:

### **1. Verificar se o usuário tem company_id**

```sql
SELECT * FROM users WHERE auth_user_id = 'SEU_AUTH_USER_ID';
-- Verifique se company_id não é NULL
```

### **2. Verificar se a empresa existe**

```sql
SELECT * FROM companies WHERE id = 2; -- ou o ID da empresa
```

### **3. Verificar se RLS está habilitado**

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'companies');
-- Se rowsecurity = true, RLS está ativo
```

### **4. Verificar policies ativas**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'companies';
```

### **5. Testar query manualmente no SQL Editor**

```sql
-- Login como o usuário (use o auth_user_id dele)
SELECT
  u.id,
  u.name,
  u.company_id,
  c.id as company_id_real,
  c.name as company_name
FROM users u
LEFT JOIN companies c ON c.id = u.company_id
WHERE u.auth_user_id = 'SEU_AUTH_USER_ID';
```

Se retornar a empresa, o problema era mesmo o RLS.

---

## 📊 Logs de Debug no Console

Após a correção, você verá logs no console do navegador:

```
✅ User found: {
  id: 9,
  auth_user_id: "98068b68-7b1f-4a5c-b552-a2a274d578cf",
  user_id: "98068b68-7b1f-4a5c-b552-a2a274d578cf",
  company_id: 2,
  name: "AWF",
  email: "contato@awfcontabil.com.br",
  ...
}

✅ Company found: {
  id: 2,
  name: "AWF",
  email: "contato@awfcontabil.com.br",
  phone: null,
  ...
}
```

Se aparecer `⚠️ Company not found`, significa que:
- O `company_id` está correto no user
- Mas a query na tabela `companies` está falhando (provavelmente RLS)

---

## 📝 Resumo da Correção

| Item | Status |
|------|--------|
| Hook `useUser()` corrigido | ✅ |
| SQL fix criado | ✅ |
| Logs de debug adicionados | ✅ |
| RLS policy simplificada | ⏳ (precisa executar SQL) |

---

## 🆘 Se Nada Funcionar

Se após executar o SQL o problema persistir:

1. **Desabilite RLS temporariamente** para testar:
```sql
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
-- Teste se funciona
-- Depois reabilite:
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

2. **Use Service Role Key** (bypass RLS):
   - No código, troque o client Supabase de `anon key` para `service role key`
   - **CUIDADO:** Isso bypassa todas as políticas de segurança

3. **Verifique se o usuário está realmente autenticado**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

---

**🎉 Após aplicar a correção, o sistema deve funcionar normalmente!**
