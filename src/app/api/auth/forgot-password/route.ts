import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email é obrigatório' } },
        { status: 400 }
      );
    }

    // Enviar email de recuperação usando Supabase Auth
    // Por segurança, sempre retornamos sucesso independente se o email existe
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'}/reset-password`,
    });

    if (resetError) {
      console.error('[forgot-password] Error sending reset email:', resetError);
      return NextResponse.json(
        { error: { message: 'Erro ao enviar email de recuperação.' } },
        { status: 500 }
      );
    }

    // Sempre retornamos sucesso, mesmo se o email não existir (boa prática de segurança)
    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá instruções de recuperação.',
    });
  } catch (error) {
    console.error('[forgot-password] Unexpected error:', error);
    return NextResponse.json(
      { error: { message: 'Erro inesperado ao processar solicitação.' } },
      { status: 500 }
    );
  }
}
