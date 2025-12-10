import { supabaseClient } from '../supabaseClient';

type OAuthProvider = 'google' | 'apple' | 'facebook';

/**
 * Sign in with OAuth provider (Google, Apple, Facebook)
 * Redirects to provider's consent screen
 */
export async function signInWithOAuth(provider: OAuthProvider) {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in with email OTP (magic link)
 * Sends verification code to user's email
 */
export async function signInWithEmailOTP(email: string) {
  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in with phone OTP
 * Sends verification code to user's phone
 */
export async function signInWithPhoneOTP(phone: string) {
  const { data, error } = await supabaseClient.auth.signInWithOtp({
    phone,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Verify OTP code (for email or phone)
 * After verification, calls backend to set httpOnly cookies
 */
export async function verifyOTP(params: { email?: string; phone?: string; token: string; type: 'email' | 'sms' }) {
  const otpParams: any = {
    token: params.token,
    type: params.type,
  };

  if (params.email) otpParams.email = params.email;
  if (params.phone) otpParams.phone = params.phone;

  const { data, error } = await supabaseClient.auth.verifyOtp(otpParams);

  if (error) {
    throw error;
  }

  // Session is established, now send tokens to backend to set httpOnly cookies
  if (data.session) {
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set session cookies');
    }

    return await response.json();
  }

  return data;
}

/**
 * Sign in with email and password
 * After sign in, calls backend to set httpOnly cookies
 */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // Send tokens to backend to set httpOnly cookies
  if (data.session) {
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set session cookies');
    }

    return await response.json();
  }

  return data;
}

/**
 * Sign out
 * Clears httpOnly cookies and Supabase session
 */
export async function signOut() {
  // Call backend to clear cookies
  const response = await fetch('/api/auth/signout', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to sign out');
  }

  // Also clear Supabase session on client
  await supabaseClient.auth.signOut();

  return await response.json();
}

/**
 * Get current session from Supabase client
 * Note: For server-side auth, use middleware with httpOnly cookies
 */
export async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

/**
 * Refresh the session
 * Calls backend to refresh tokens and update cookies
 */
export async function refreshSession() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to refresh session');
  }

  return await response.json();
}
