# 🚀 GUIA RÁPIDO DE CORREÇÃO PARA DEPLOY

## ⚠️ STATUS ATUAL: NÃO PRONTO PARA DEPLOY

**Razão:** 29 erros TypeScript devido a incompatibilidade com Next.js 15
**Tempo necessário:** 2-3 horas de trabalho focado
**Dificuldade:** Baixa (padrão repetitivo)

---

## 🎯 PROBLEMA PRINCIPAL

Next.js 15 mudou a API de rotas dinâmicas:
- `params` e `searchParams` agora são **Promises** e precisam ser **awaited**

---

## 🔧 CORREÇÃO PADRÃO

### Para API Routes com [id]:

```typescript
// ❌ ANTES (Next.js 14)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await doSomething(params.id);
  return success(data);
}

// ✅ DEPOIS (Next.js 15)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // ⭐ Adicionar esta linha
  const data = await doSomething(id);  // ⭐ Usar 'id' ao invés de 'params.id'
  return success(data);
}
```

### Para Pages com searchParams:

```typescript
// ❌ ANTES
export default async function MyPage({
  searchParams
}: {
  searchParams?: { page?: string }
}) {
  const page = searchParams?.page ?? '1';
}

// ✅ DEPOIS
export default async function MyPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const params = await searchParams;  // ⭐ Adicionar esta linha
  const page = params?.page ?? '1';   // ⭐ Usar 'params' ao invés de 'searchParams'
}
```

---

## 📝 LISTA DE ARQUIVOS PARA CORRIGIR

### 🔴 API Routes (11 arquivos) - 30-45 min

Aplicar correção padrão em:

```
src/app/api/users/[id]/route.ts                           (3 métodos: GET, PUT, DELETE)
src/app/api/therapists/[id]/route.ts                      (3 métodos: GET, PUT, DELETE)
src/app/api/therapists/[id]/approve/route.ts              (POST)
src/app/api/therapists/[id]/reject/route.ts               (POST)
src/app/api/therapists/[id]/review/route.ts               (POST)
src/app/api/subscriptions/[id]/activate/route.ts          (POST)
src/app/api/subscriptions/[id]/cancel/route.ts            (POST)
src/app/api/verification/[id]/approve/route.ts            (POST)
src/app/api/verification/[id]/reject/route.ts             (POST)
src/app/api/profile-edits/[id]/resolve/route.ts           (POST)
src/app/api/therapist-edits/[id]/resolve/route.ts         (POST)
```

### 🔴 Pages (6 arquivos) - 20 min

```
src/app/billing/page.tsx          (searchParams)
src/app/content/page.tsx          (searchParams)
src/app/subscriptions/page.tsx    (searchParams)
src/app/therapists/page.tsx       (searchParams)
src/app/users/page.tsx            (searchParams)
src/app/therapists/[id]/page.tsx  (params)
```

### 🔴 Configuração (1 arquivo) - 2 min

**src/next.config.ts**
```typescript
// REMOVER estas linhas:
typescript: {
  ignoreBuildErrors: true,  // ❌ DELETAR
},
eslint: {
  ignoreDuringBuilds: true, // ❌ DELETAR
},
```

---

## 🎬 PASSO A PASSO RÁPIDO

### 1️⃣ Correções (2-3 horas)

```bash
# Criar branch para correções
git checkout -b fix/nextjs15-compatibility

# Corrigir os 18 arquivos seguindo os padrões acima
# Use find & replace no seu editor para agilizar

# Remover flags de ignorar erros do next.config.ts

# Testar
npm run build
```

### 2️⃣ Verificação (5 min)

```bash
# Build deve passar sem erros
npm run build

# TypeCheck deve passar
npm run typecheck

# Se falhar, corrigir erros e repetir
```

### 3️⃣ Configuração Ambiente (10 min)

```bash
# Copiar .env.example para .env.local
cp .env.example .env.local

# Editar .env.local com suas credenciais Supabase
# Obter em: https://app.supabase.com → Seu Projeto → Settings → API
```

### 4️⃣ Deploy (15 min)

```bash
# Commit e push
git add .
git commit -m "Fix Next.js 15 compatibility issues"
git push origin fix/nextjs15-compatibility

# Merge para branch de deploy
git checkout database
git merge fix/nextjs15-compatibility
git push origin database

# Configurar variáveis de ambiente no Render
# Trigger deploy
```

---

## 🛠️ DICAS PARA ACELERAR

### Use Find & Replace no seu editor:

**Para API Routes:**

1. Encontrar: `{ params }: { params: { id: string } }`
2. Substituir por: `{ params }: { params: Promise<{ id: string }> }`

3. Depois, adicionar manualmente após a linha da função:
   ```typescript
   const { id } = await params;
   ```

4. Substituir todas as ocorrências de `params.id` por `id`

**Para Pages:**

1. Encontrar: `searchParams?: { page`
2. Substituir por: `searchParams?: Promise<{ page`

3. Adicionar após declaração da função:
   ```typescript
   const params = await searchParams;
   ```

4. Substituir `searchParams?.` por `params?.`

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Antes do Deploy

- [ ] 11 API routes corrigidos
- [ ] 6 pages corrigidos
- [ ] next.config.ts sem ignoreBuildErrors
- [ ] `npm run build` passa ✅
- [ ] `npm run typecheck` passa ✅
- [ ] .env.local criado e configurado
- [ ] Schema SQL executado no Supabase
- [ ] Admins de teste criados no Supabase

### Durante Deploy

- [ ] Variáveis de ambiente configuradas no Render:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] NEXT_PUBLIC_SITE_URL
  - [ ] NODE_ENV=production

### Pós-Deploy

- [ ] Build no Render passou
- [ ] Aplicação está online
- [ ] Login funciona
- [ ] Dashboard carrega

---

## 🆘 SE ALGO DER ERRADO

### Build continua falhando?

```bash
# Limpar cache e reinstalar
rm -rf .next node_modules
npm install
npm run build
```

### Erro de variável de ambiente?

```bash
# Verificar se todas estão definidas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY

# No Render, verificar no dashboard:
# Settings → Environment → Environment Variables
```

### Login não funciona?

```sql
-- Verificar admins no Supabase SQL Editor
SELECT u.email, a.role
FROM auth.users u
JOIN public.admins a ON a.user_id = u.id;

-- Se vazio, executar:
-- docs/create-test-admins.sql
```

---

## 📚 RECURSOS ADICIONAIS

- **Relatório Completo:** `DEPLOYMENT_READINESS_REPORT.md`
- **Guia de Login:** `RELATORIO_LOGIN_SUPABASE.md`
- **Schema SQL:** `docs/COMPLETE_DATABASE_SCHEMA.sql`
- **Criar Admins:** `docs/create-test-admins.sql`
- **Documentação Next.js 15:** https://nextjs.org/docs/app/api-reference/file-conventions/route

---

## ⏱️ TEMPO ESTIMADO

- Correções de código: **2-3 horas**
- Configuração: **15 min**
- Deploy: **15 min**
- **TOTAL: 3-4 horas**

---

**Boa sorte! 🚀**
