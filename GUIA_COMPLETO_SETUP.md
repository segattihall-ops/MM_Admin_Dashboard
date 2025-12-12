# 📋 GUIA COMPLETO DE SETUP - MasseurMatch Admin Dashboard

## ✅ TODO LIST COMPLETO

### 🗄️ BANCO DE DADOS SUPABASE

- [ ] **1. Limpar banco de dados completamente**
  - Executar: `cleanup-database-ultra.sql` no Supabase SQL Editor
  - Verificar: Deve retornar "Database cleanup ULTRA completed!"

- [ ] **2. Criar schema completo**
  - Executar: `docs/COMPLETE_DATABASE_SCHEMA.sql` no Supabase SQL Editor
  - Aguardar ~10 segundos para concluir
  - Verificar: Deve criar 11 tabelas

- [ ] **3. Verificar estrutura do banco**
  - Executar: `verify-database-schema.sql` no Supabase SQL Editor
  - Conferir: Todas as verificações devem estar com ✅ OK
  - Confirmar: 11 tabelas criadas corretamente

### 👤 USUÁRIOS ADMIN

- [ ] **4. Criar primeiro usuário admin (superadmin)**
  - Supabase Dashboard → Authentication → Users → Add user
  - Email: `admin@test.com` (ou seu email)
  - Password: `Admin@123456` (ou senha forte)
  - ✅ Marcar: Auto Confirm User
  - Copiar: USER_ID gerado

- [ ] **5. Adicionar usuário na tabela admins**
  - Supabase SQL Editor → New Query
  - Executar SQL substituindo USER_ID:
    ```sql
    INSERT INTO public.admins (user_id, role, created_at, updated_at)
    VALUES ('COLE_USER_ID_AQUI', 'superadmin', NOW(), NOW());
    ```

- [ ] **6. Verificar admin criado**
  - Executar SQL:
    ```sql
    SELECT a.*, au.email
    FROM public.admins a
    LEFT JOIN auth.users au ON au.id = a.user_id;
    ```
  - Deve mostrar 1 admin com email correto

### 🔧 AMBIENTE LOCAL

- [ ] **7. Verificar arquivo .env.local**
  - Confirmar que existe: `.env.local`
  - Verificar variáveis:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
  - Todas devem estar preenchidas (não podem ter "your-" no valor)

- [ ] **8. Instalar dependências (se necessário)**
  ```bash
  npm install
  ```

- [ ] **9. Iniciar servidor de desenvolvimento**
  ```bash
  npm run dev
  ```
  - Aguardar: "Ready on http://localhost:9002"
  - Verificar: Sem erros no console

### 🧪 TESTES

- [ ] **10. Testar página de login**
  - Acessar: http://localhost:9002/login
  - Verificar: Página carrega sem erros
  - Formulário: Email e senha aparecem

- [ ] **11. Fazer login com admin**
  - Email: `admin@test.com` (ou o que você criou)
  - Senha: `Admin@123456` (ou a que você definiu)
  - Clicar: Sign In
  - Verificar: Redireciona para `/dashboard`

- [ ] **12. Testar dashboard**
  - Verificar: Dashboard carrega
  - Conferir: Cards de estatísticas aparecem
  - Menu lateral: Todas as opções visíveis

- [ ] **13. Testar navegação**
  - [ ] Acessar: `/users` (Lista de usuários)
  - [ ] Acessar: `/therapists` (Lista de terapeutas)
  - [ ] Acessar: `/subscriptions` (Assinaturas)
  - [ ] Acessar: `/billing` (Faturamento)
  - [ ] Acessar: `/content` (Conteúdo)
  - Todas as páginas devem carregar sem erros

### 🔐 TESTES DE PERMISSÕES

- [ ] **14. Criar usuário Manager (opcional)**
  - Criar novo usuário no Supabase Auth
  - Adicionar com role 'manager' na tabela admins
  - Testar login
  - Verificar: Permissões limitadas

- [ ] **15. Criar usuário Viewer (opcional)**
  - Criar novo usuário no Supabase Auth
  - Adicionar com role 'viewer' na tabela admins
  - Testar login
  - Verificar: Apenas leitura

### 📊 VERIFICAÇÕES FINAIS

- [ ] **16. Executar script de verificação completa**
  - Supabase SQL Editor: `verify-database-schema.sql`
  - Conferir todas as seções:
    - ✅ Tabelas existentes (11 tabelas)
    - ✅ Foreign keys corretas
    - ✅ Indexes criados
    - ✅ RLS policies ativas
    - ✅ Triggers funcionando
    - ✅ Functions criadas

- [ ] **17. Testar build de produção**
  ```bash
  npm run build
  ```
  - Verificar: Build completa sem erros
  - Confirmar: "Compiled successfully"

---

## 📄 ARQUIVOS DO PROJETO

### Scripts SQL

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| `cleanup-database-ultra.sql` | Limpa banco completamente | Antes de recriar schema |
| `docs/COMPLETE_DATABASE_SCHEMA.sql` | Schema completo do banco | Primeira instalação |
| `verify-database-schema.sql` | Verifica estrutura do banco | Após criar schema |
| `create-test-admins.sql` | Criar admins manualmente | Opcional |

### Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `.env.local` | Variáveis de ambiente (credenciais Supabase) |
| `.env.example` | Template de variáveis |
| `next.config.ts` | Configuração Next.js |
| `tsconfig.json` | Configuração TypeScript |

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Documentação principal |
| `docs/QUICK_START.md` | Início rápido |
| `docs/DATABASE_GUIDE.md` | Guia do banco |
| `docs/DEPLOYMENT_CHECKLIST.md` | Checklist de deploy |
| `docs/PRODUCTION_DEPLOYMENT.md` | Deploy em produção |

---

## 🔍 TABELAS ESPERADAS PELO FRONTEND

O código frontend consulta estas tabelas:

### Tabelas Principais

1. **profiles** - Perfis de usuário estendidos
   - Colunas: `id`, `display_name`, `bio`, `avatar_url`, `metadata`, `created_at`, `updated_at`

2. **admins** - Usuários administrativos
   - Colunas: `id`, `user_id`, `role`, `permissions`, `created_at`, `created_by`
   - Roles: `superadmin`, `manager`, `viewer`

3. **therapists** - Perfis de terapeutas
   - Colunas: `id`, `user_id`, `full_name`, `email`, `status`, `plan`, `slug`, `phone`, etc.
   - Status: `Pending`, `Active`, `Rejected`, `Suspended`

4. **verification_data** - Documentos de verificação
   - Colunas: `id`, `therapist_id`, `status`, `document_url`, `card_url`, `selfie_url`, etc.

5. **payments** - Pagamentos
   - Colunas: `id`, `user_id`, `amount`, `status`, `paid_at`, `invoice_id`, etc.

6. **subscriptions** - Assinaturas
   - Colunas: `id`, `user_id`, `plan_id`, `status`, `start_date`, `end_date`, etc.

7. **applications** - Aplicações de terapeutas
   - Colunas: `id`, `user_id`, `full_name`, `email`, `status`, `submitted_at`, etc.

8. **legal_acceptances** - Aceites de termos
   - Colunas: `id`, `user_id`, `version`, `accepted_at`, `ip_address`

9. **therapist_edits** - Edições pendentes de terapeutas
   - Colunas: `id`, `therapist_id`, `changes`, `status`, `created_at`, etc.

10. **profile_edits** - Edições pendentes de perfis
    - Colunas: `id`, `user_id`, `changes`, `status`, `created_at`, etc.

11. **audit_logs** - Logs de auditoria
    - Colunas: `id`, `admin_id`, `action`, `resource_type`, `resource_id`, `changes`, etc.

### Tabela de Configurações (Criada Dinamicamente)

- **settings** - Configurações do sistema (API keys, etc.)
  - Nota: Esta tabela pode não existir até ser usada pela primeira vez

---

## 🚨 PROBLEMAS COMUNS

### ❌ "Failed to fetch" no login

**Causa:** Variáveis de ambiente não configuradas
**Solução:**
1. Verificar se `.env.local` existe
2. Conferir se as 3 variáveis estão preenchidas
3. Reiniciar servidor: `npm run dev`

### ❌ "Database error creating user"

**Causa:** Schema do banco não foi executado
**Solução:**
1. Executar `cleanup-database-ultra.sql`
2. Executar `docs/COMPLETE_DATABASE_SCHEMA.sql`
3. Verificar com `verify-database-schema.sql`

### ❌ "You do not have admin access"

**Causa:** Usuário não está na tabela `admins`
**Solução:**
1. Pegar USER_ID do usuário em Authentication → Users
2. Inserir na tabela admins com role 'superadmin'

### ❌ "supabaseKey is required"

**Causa:** Build tentando rodar sem variáveis de ambiente
**Solução:**
- Usar `npm run dev` para desenvolvimento
- Para build: Configurar variáveis antes

---

## ✅ CHECKLIST FINAL

Antes de considerar completo, verificar:

- [ ] ✅ Banco limpo e schema criado
- [ ] ✅ Script de verificação passa em todos os checks
- [ ] ✅ Pelo menos 1 admin criado e funcionando
- [ ] ✅ Login funciona e redireciona para dashboard
- [ ] ✅ Todas as páginas principais carregam sem erro
- [ ] ✅ Build de produção completa sem erros
- [ ] ✅ Nenhum erro no console do navegador
- [ ] ✅ Nenhum erro no terminal do servidor

---

## 📞 PRÓXIMOS PASSOS

Depois de completar tudo acima:

1. **Testar fluxo completo de usuário**
   - Criar terapeuta
   - Aprovar/rejeitar
   - Gerenciar assinaturas

2. **Deploy para produção**
   - Seguir: `docs/PRODUCTION_DEPLOYMENT.md`
   - Configurar variáveis de ambiente no servidor
   - Fazer deploy

3. **Configurar OAuth (opcional)**
   - Google, Apple, Facebook
   - Seguir: `docs/OAUTH_SETUP.md`

---

**Data de criação:** 2025-12-11
**Versão:** 1.0
**Projeto:** MasseurMatch Admin Dashboard
