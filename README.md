# MasseurMatch Admin Dashboard

Dashboard administrativo para gerenciamento da plataforma MasseurMatch.

## 🚀 Tecnologias

- **Next.js 15.3.6** - Framework React com App Router
- **React 19.2.1** - Interface do usuário
- **TypeScript 5** - Tipagem estática
- **Supabase** - Backend (PostgreSQL + Auth)
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de interface

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Edite `.env.local` com suas credenciais do Supabase

5. Execute o schema do banco de dados no Supabase:
   - Acesse `docs/COMPLETE_DATABASE_SCHEMA.sql`
   - Execute no SQL Editor do Supabase

6. Crie usuários admin de teste:
   - Siga as instruções em `create-test-admins.sql`

## 🏃 Executando

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar build
npm start
```

Acesse: http://localhost:9002

## 📚 Documentação

Documentação completa em `/docs`:
- `QUICK_START.md` - Início rápido
- `SUPABASE_SETUP.md` - Configuração do Supabase
- `DATABASE_GUIDE.md` - Guia do banco de dados
- `DEPLOYMENT_CHECKLIST.md` - Checklist de deploy
- `PRODUCTION_DEPLOYMENT.md` - Deploy em produção

## 🔐 Sistema de Permissões

- **superadmin** - Acesso total ao sistema
- **manager** - Gerenciamento de terapeutas e conteúdo
- **viewer** - Apenas visualização

## 🚢 Deploy

Veja `docs/PRODUCTION_DEPLOYMENT.md` para instruções detalhadas.

## 📄 Licença

Propriedade de MasseurMatch
