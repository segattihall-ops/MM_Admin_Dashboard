'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Extrair access_token da URL hash (formato Supabase)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');

    if (token) {
      setAccessToken(token);
    } else {
      toast({
        variant: 'destructive',
        title: 'Link inválido',
        description: 'O link de recuperação é inválido ou expirou.',
      });
    }
  }, [toast]);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha fraca',
        description: 'A senha deve ter pelo menos 8 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não coincidem',
        description: 'As senhas digitadas não são iguais.',
      });
      return;
    }

    if (!accessToken) {
      toast({
        variant: 'destructive',
        title: 'Token não encontrado',
        description: 'Link de recuperação inválido.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.error?.message || 'Não foi possível redefinir a senha.',
        });
        return;
      }

      setResetSuccess(true);
      toast({
        title: 'Senha redefinida!',
        description: 'Sua senha foi alterada com sucesso.',
      });

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {resetSuccess ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-12 h-12 text-primary" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
              </svg>
            )}
          </div>
          <CardTitle className="text-2xl font-headline">
            {resetSuccess ? 'Sucesso!' : 'Redefinir Senha'}
          </CardTitle>
          <CardDescription>
            {resetSuccess
              ? 'Sua senha foi alterada. Redirecionando para o login...'
              : 'Digite sua nova senha abaixo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!resetSuccess ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isSubmitting || !accessToken}
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 8 caracteres
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    required
                    disabled={isSubmitting || !accessToken}
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full mt-6"
                disabled={isSubmitting || !accessToken}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Redefinir Senha
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-center">
                <p className="font-medium">✅ Senha alterada com sucesso!</p>
                <p className="text-muted-foreground mt-1">
                  Você será redirecionado para o login em alguns segundos.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Ir para o login agora
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
