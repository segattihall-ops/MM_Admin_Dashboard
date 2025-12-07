# Configuração de Autenticação OAuth/OTP para Admins

Este guia explica como habilitar login social (Google, Apple, Facebook) e autenticação via telefone/email OTP para admins do dashboard.

## Arquitetura de Segurança

### Fluxo de Autenticação com httpOnly Cookies

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Client    │         │   Next.js API    │         │  Supabase   │
│  (Browser)  │         │   (Server-side)  │         │    Auth     │
└──────┬──────┘         └────────┬─────────┘         └──────┬──────┘
       │                         │                          │
       │ 1. signInWithOAuth()    │                          │
       ├────────────────────────────────────────────────────>│
       │                         │                          │
       │ 2. OAuth redirect       │                          │
       │<────────────────────────────────────────────────────┤
       │                         │                          │
       │ 3. Callback com code    │                          │
       ├────────────────────────>│                          │
       │                         │                          │
       │                         │ 4. exchangeCodeForSession│
       │                         ├─────────────────────────>│
       │                         │                          │
       │                         │ 5. access/refresh tokens │
       │                         │<─────────────────────────┤
       │                         │                          │
       │                         │ 6. Check admins table    │
       │                         │                          │
       │                         │ 7. Set httpOnly cookies  │
       │ 8. Redirect /dashboard  │                          │
       │<────────────────────────┤                          │
       │                         │                          │
```

**Pontos importantes:**
- ✅ Tokens nunca expostos ao JavaScript do cliente
- ✅ Cookies httpOnly protegem contra XSS
- ✅ Middleware valida admin em cada requisição
- ✅ RLS garante que apenas service_role acessa dados
- ✅ Refresh automático de tokens quando expiram

## 1. Configuração no Supabase Dashboard

### 1.1 Habilitar Provedores OAuth

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **Authentication** > **Providers**
3. Habilite os provedores desejados:

#### Google OAuth

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Vá para **APIs & Services** > **Credentials**
3. Crie um **OAuth 2.0 Client ID**
4. Configure as **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
5. Copie o **Client ID** e **Client Secret**
6. No Supabase, habilite Google e cole as credenciais
7. Adicione domínios autorizados se necessário

#### Apple OAuth

1. Acesse [Apple Developer](https://developer.apple.com)
2. Crie um **App ID** e habilite **Sign in with Apple**
3. Crie um **Services ID**
4. Configure **Return URLs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
5. Gere uma **Private Key** para Sign in with Apple
6. No Supabase, habilite Apple e configure:
   - Services ID
   - Team ID
   - Key ID
   - Private Key (arquivo .p8)

#### Facebook OAuth

1. Acesse [Facebook Developers](https://developers.facebook.com)
2. Crie um app e adicione **Facebook Login**
3. Configure **Valid OAuth Redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Copie o **App ID** e **App Secret**
5. No Supabase, habilite Facebook e cole as credenciais

### 1.2 Habilitar Phone Authentication

1. No Supabase, vá para **Authentication** > **Providers**
2. Habilite **Phone**
3. Configure o provedor de SMS (Twilio, MessageBird, etc.):
   - Twilio: Account SID, Auth Token, Phone Number
   - MessageBird: Access Key
4. Teste enviando um código OTP

### 1.3 Configurar Email OTP (Magic Links)

1. No Supabase, vá para **Authentication** > **Providers**
2. Habilite **Email**
3. Configure templates de email em **Email Templates**
4. Customize o template "Magic Link" se necessário

### 1.4 Configurar Redirect URLs

1. Vá para **Authentication** > **URL Configuration**
2. Adicione suas URLs de redirect:
   ```
   Development: http://localhost:3000/api/auth/callback
   Production:  https://admin.masseurmatch.com/api/auth/callback
   ```
3. Adicione também o site URL:
   ```
   Development: http://localhost:3000
   Production:  https://admin.masseurmatch.com
   ```

## 2. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas em `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 3. Criar Primeiro Admin

Antes de fazer login, você precisa criar um admin no banco de dados:

```sql
-- 1) Primeiro, crie um usuário no Supabase Auth
-- Vá para Authentication > Users > Add User no Supabase Dashboard
-- Ou use a API Admin:
-- Email: admin@masseurmatch.com
-- Password: (defina uma senha forte)

-- 2) Copie o UUID do usuário criado

-- 3) Insira o admin na tabela admins
INSERT INTO public.admins (user_id, role)
VALUES ('UUID_DO_USUARIO_AQUI', 'superadmin');
```

**Importante:** O `user_id` deve ser o UUID do usuário na tabela `auth.users`, não o email!

## 4. Implementação no Frontend

### 4.1 Login com Google

```typescript
import { signInWithOAuth } from '@/lib/auth/client';

async function handleGoogleLogin() {
  try {
    await signInWithOAuth('google');
    // Usuário será redirecionado para Google
    // Após autorização, volta para /api/auth/callback
    // Callback verifica se é admin e seta cookies
    // Redireciona para /dashboard
  } catch (error) {
    console.error('Erro no login:', error);
  }
}
```

### 4.2 Login com Apple

```typescript
import { signInWithOAuth } from '@/lib/auth/client';

async function handleAppleLogin() {
  try {
    await signInWithOAuth('apple');
  } catch (error) {
    console.error('Erro no login:', error);
  }
}
```

### 4.3 Login com Facebook

```typescript
import { signInWithOAuth } from '@/lib/auth/client';

async function handleFacebookLogin() {
  try {
    await signInWithOAuth('facebook');
  } catch (error) {
    console.error('Erro no login:', error);
  }
}
```

### 4.4 Login com Email OTP

```typescript
import { signInWithEmailOTP, verifyOTP } from '@/lib/auth/client';

// Etapa 1: Enviar código
async function handleSendEmailOTP() {
  try {
    const email = 'admin@masseurmatch.com';
    await signInWithEmailOTP(email);
    alert('Código enviado para seu email!');
  } catch (error) {
    console.error('Erro ao enviar OTP:', error);
  }
}

// Etapa 2: Verificar código
async function handleVerifyEmailOTP(token: string) {
  try {
    const email = 'admin@masseurmatch.com';
    await verifyOTP({ email, token, type: 'email' });
    // Cookies setados, redirecionar para dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Erro ao verificar OTP:', error);
  }
}
```

### 4.5 Login com Phone OTP

```typescript
import { signInWithPhoneOTP, verifyOTP } from '@/lib/auth/client';

// Etapa 1: Enviar SMS
async function handleSendPhoneOTP() {
  try {
    const phone = '+5511999999999'; // Formato internacional
    await signInWithPhoneOTP(phone);
    alert('SMS enviado!');
  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
  }
}

// Etapa 2: Verificar código
async function handleVerifyPhoneOTP(token: string) {
  try {
    const phone = '+5511999999999';
    await verifyOTP({ phone, token, type: 'sms' });
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Erro ao verificar SMS:', error);
  }
}
```

### 4.6 Login com Email/Senha (tradicional)

```typescript
import { signInWithPassword } from '@/lib/auth/client';

async function handleEmailPasswordLogin(email: string, password: string) {
  try {
    await signInWithPassword(email, password);
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Erro no login:', error);
  }
}
```

### 4.7 Logout

```typescript
import { signOut } from '@/lib/auth/client';

async function handleLogout() {
  try {
    await signOut();
    window.location.href = '/login';
  } catch (error) {
    console.error('Erro no logout:', error);
  }
}
```

## 5. Componente de Login Completo

Exemplo de página de login com todos os métodos:

```typescript
'use client';

import { useState } from 'react';
import { signInWithOAuth, signInWithEmailOTP, signInWithPhoneOTP, verifyOTP, signInWithPassword } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [mode, setMode] = useState<'oauth' | 'email-otp' | 'phone-otp' | 'password'>('oauth');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSendEmailOTP = async () => {
    try {
      await signInWithEmailOTP(email);
      setOtpSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleVerifyEmailOTP = async () => {
    try {
      await verifyOTP({ email, token: otpToken, type: 'email' });
      window.location.href = '/dashboard';
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePasswordLogin = async () => {
    try {
      await signInWithPassword(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {mode === 'oauth' && (
        <div className="space-y-3">
          <Button onClick={() => handleOAuthLogin('google')} className="w-full">
            Login com Google
          </Button>
          <Button onClick={() => handleOAuthLogin('apple')} className="w-full">
            Login com Apple
          </Button>
          <Button onClick={() => handleOAuthLogin('facebook')} className="w-full">
            Login com Facebook
          </Button>
          <Button onClick={() => setMode('password')} variant="outline" className="w-full">
            Email/Senha
          </Button>
          <Button onClick={() => setMode('email-otp')} variant="outline" className="w-full">
            Email OTP
          </Button>
        </div>
      )}

      {mode === 'email-otp' && (
        <div className="space-y-3">
          {!otpSent ? (
            <>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleSendEmailOTP} className="w-full">
                Enviar Código
              </Button>
            </>
          ) : (
            <>
              <Input
                type="text"
                placeholder="Código OTP"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
              />
              <Button onClick={handleVerifyEmailOTP} className="w-full">
                Verificar
              </Button>
            </>
          )}
          <Button onClick={() => { setMode('oauth'); setOtpSent(false); }} variant="outline" className="w-full">
            Voltar
          </Button>
        </div>
      )}

      {mode === 'password' && (
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handlePasswordLogin} className="w-full">
            Entrar
          </Button>
          <Button onClick={() => setMode('oauth')} variant="outline" className="w-full">
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}
```

## 6. Fluxo de Verificação de Admin

### Como funciona a verificação:

1. **OAuth/OTP**: Usuário se autentica com provedor
2. **Callback**: API recebe tokens e verifica usuário
3. **Check Admin**: Consulta tabela `admins` pelo `user_id`
4. **Verificação de Role**: Confirma que role está em `['superadmin', 'manager', 'viewer']`
5. **Set Cookies**: Se válido, seta cookies httpOnly
6. **Redirect**: Redireciona para `/dashboard`

### Se usuário não for admin:

- Retorna erro 403: "Access denied: User is not an admin"
- Cookies não são setados
- Redirect para `/login?error=not_admin`

## 7. Adicionar Novos Admins

Para permitir que um novo usuário faça login como admin:

```sql
-- 1) Usuário faz primeiro login via OAuth (Google/Apple/Facebook)
--    Isso cria registro em auth.users automaticamente

-- 2) Copie o UUID do usuário de auth.users
SELECT id, email FROM auth.users WHERE email = 'novo.admin@example.com';

-- 3) Insira na tabela admins
INSERT INTO public.admins (user_id, role)
VALUES ('uuid-do-usuario', 'manager'); -- ou 'viewer'/'superadmin'
```

## 8. Segurança e Boas Práticas

### ✅ Implementado

- Cookies httpOnly (tokens não acessíveis via JS)
- Cookies secure em produção (HTTPS only)
- SameSite=lax (proteção CSRF)
- RLS no Supabase (apenas service_role)
- Verificação de admin em middleware
- Refresh automático de tokens
- Logout limpa cookies e sessão

### ⚠️ Importante

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no cliente
- Sempre use middleware para rotas protegidas
- Revise logs de admin regularmente (`admin_logs`)
- Use roles apropriados (viewer não pode deletar)
- Configure rate limiting no Supabase Auth
- Habilite 2FA para superadmins (opcional)

## 9. Troubleshooting

### Erro: "Access denied: User is not an admin"

- Verifique se o `user_id` está na tabela `admins`
- Confirme que o `role` é válido

### Erro: "Invalid tokens"

- Tokens podem ter expirado
- Tente fazer login novamente

### OAuth não redireciona corretamente

- Verifique as redirect URLs no Supabase e no provedor
- Confirme que a URL está exatamente igual (http vs https, trailing slash)

### Email OTP não chega

- Verifique spam/lixeira
- Confirme configuração de email no Supabase
- Veja logs de email em **Authentication** > **Logs**

## 10. Deploy

### Vercel/Netlify

1. Configure variáveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

2. Configure domínio customizado (ex: admin.masseurmatch.com)

3. Atualize redirect URLs no Supabase para produção:
   ```
   https://admin.masseurmatch.com/api/auth/callback
   ```

4. Atualize redirect URLs nos provedores OAuth (Google, Apple, Facebook)

5. Deploy!

---

**Pronto!** Seu dashboard agora suporta múltiplos métodos de autenticação com segurança máxima via cookies httpOnly. 🚀
