import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdmin } from '@/lib/supabase/crud';

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing access_token or refresh_token' },
        { status: 400 }
      );
    }

    // Verify the tokens and get user info
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(access_token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid tokens' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await getAdmin(user.id);

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Access denied: User is not an admin' },
        { status: 403 }
      );
    }

    // Verify role is valid
    if (!admin.role || !['superadmin', 'manager', 'viewer'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Access denied: Invalid admin role' },
        { status: 403 }
      );
    }

    // Set httpOnly cookies
    const cookieStore = await cookies();

    // Access token (expires in 1 hour by default)
    cookieStore.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    // Refresh token (expires in 7 days)
    cookieStore.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OAuth redirect from Supabase
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=missing_code`
    );
  }

  try {
    // Exchange code for session
    const { data, error: exchangeError } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.session) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=exchange_failed`
      );
    }

    const { access_token, refresh_token, user } = data.session;

    // Check if user is an admin
    const { data: admin, error: adminError } = await getAdmin(user.id);

    if (adminError || !admin) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=not_admin`
      );
    }

    if (!admin.role || !['superadmin', 'manager', 'viewer'].includes(admin.role)) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=invalid_role`
      );
    }

    // Set httpOnly cookies
    const cookieStore = await cookies();

    cookieStore.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    cookieStore.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=server_error`
    );
  }
}
