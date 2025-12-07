import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from './lib/supabaseAdmin';
import { ALLOWED_ADMIN_ROLES } from './lib/auth/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/callback',
  '/api/auth/signout',
  '/api/auth/refresh',
  '/api/auth/oauth',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path)) || pathname.startsWith('/_next');

  if (isPublic) {
    return NextResponse.next();
  }

  // Get access token from httpOnly cookie or Authorization header
  const accessToken =
    request.cookies.get('sb-access-token')?.value ??
    (request.headers.get('authorization')?.startsWith('Bearer ')
      ? request.headers.get('authorization')?.slice(7)
      : null);

  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  // If no access token, redirect to login
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the access token
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  // If token is expired and we have a refresh token, try to refresh
  if (userError && refreshToken) {
    try {
      const { data: refreshData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (refreshError || !refreshData.session) {
        // Refresh failed, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }

      // Refresh succeeded, verify user is admin
      const { user } = refreshData.session;

      const { data: adminRecord } = await supabaseAdmin
        .from('admins')
        .select('id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminRecord || !ALLOWED_ADMIN_ROLES.includes(adminRecord.role as any)) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }

      // Update cookies with new tokens and continue
      const response = NextResponse.next();
      response.cookies.set('sb-access-token', refreshData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });
      response.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      return response;
    } catch (error) {
      console.error('Token refresh error in middleware:', error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    }
  }

  // If user verification failed and no refresh available, redirect to login
  if (userError || !userData.user) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }

  // Check if user is an admin with valid role
  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!adminRecord || !ALLOWED_ADMIN_ROLES.includes(adminRecord.role as any)) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
