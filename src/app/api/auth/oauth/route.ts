import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { failure } from '@/lib/http/responses';

// Restrict to Apple only (Google and Facebook removed per request)
const SUPPORTED_PROVIDERS = ['apple'];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider || !SUPPORTED_PROVIDERS.includes(provider)) {
    return failure('Unsupported or missing provider', 400);
  }

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: provider as any,
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return failure(error?.message ?? 'OAuth sign-in failed', 400);
  }

  return NextResponse.redirect(data.url);
}
