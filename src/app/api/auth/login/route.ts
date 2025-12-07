import { cookies } from 'next/headers';
import { supabaseClient } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, ALLOWED_ADMIN_ROLES } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return failure('Email and password are required', 400);
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return failure(error?.message ?? 'Invalid credentials', 401);
  }

  const { data: adminRecord, error: adminError } = await supabaseAdmin
    .from('admins')
    .select('id, role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (adminError || !adminRecord || !ALLOWED_ADMIN_ROLES.includes(adminRecord.role as any)) {
    return failure('You do not have admin access. Contact an administrator.', 403);
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
  });

  return success({ user: data.user, expires_at: data.session.expires_at });
}
