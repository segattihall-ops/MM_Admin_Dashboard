import { cookies, headers } from 'next/headers';
import { supabaseClient } from '../supabaseClient';
import { supabaseAdmin } from '../supabaseAdmin';
import type { AdminRow, AdminContext, AdminRole } from '../supabase/types';

type AuthContext = {
  user: AdminContext['user'] | null;
  token: string | null;
};

export const ACCESS_TOKEN_COOKIE = 'sb-access-token';
export const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

/**
 * Valid admin roles in order of privilege (highest to lowest)
 * Centralized constant used by middleware, API routes, and components
 */
export const ALLOWED_ADMIN_ROLES: AdminRole[] = ['superadmin', 'manager', 'viewer'];

/**
 * Role hierarchy for permission checks
 */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  superadmin: 3,
  manager: 2,
  viewer: 1,
};

/**
 * Error responses for auth failures
 */
export const AUTH_ERRORS = {
  NOT_ADMIN: {
    error: 'Access denied: User is not an admin',
    code: 'NOT_ADMIN',
    status: 403,
  },
  INSUFFICIENT_PERMISSIONS: {
    error: 'Access denied: Insufficient permissions for this action',
    code: 'INSUFFICIENT_PERMISSIONS',
    status: 403,
  },
  INVALID_ROLE: {
    error: 'Invalid admin role',
    code: 'INVALID_ROLE',
    status: 400,
  },
  UNAUTHORIZED: {
    error: 'Unauthorized',
    code: 'UNAUTHORIZED',
    status: 401,
  },
} as const;

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const headersList = await headers();
  const headerAuth = headersList.get('authorization');
  const tokenFromHeader = headerAuth?.startsWith('Bearer ') ? headerAuth.slice(7) : null;
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? tokenFromHeader ?? null;
}

export async function getAuthContext(): Promise<AuthContext> {
  const token = await getAccessToken();
  if (!token) return { user: null, token: null };

  const { data, error } = await supabaseClient.auth.getUser(token);
  if (error || !data.user) return { user: null, token: null };

  return { user: data.user, token };
}

export async function getAdminContext(): Promise<AdminContext | { user: null; admin: null }> {
  const { user } = await getAuthContext();
  if (!user) return { user: null, admin: null };

  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return { user, admin: (adminRecord as AdminRow | null) ?? null };
}

export async function requireAdmin(): Promise<{ user: NonNullable<AdminContext['user']>; admin: AdminRow }> {
  const context = await getAdminContext();
  if (!('user' in context) || !context.user || !context.admin) {
    throw new Error('Admin access required');
  }
  if (!context.admin.role || !ALLOWED_ADMIN_ROLES.includes(context.admin.role)) {
    throw new Error('Insufficient admin role');
  }
  return { user: context.user, admin: context.admin };
}

/**
 * Check if a role is valid
 */
export function isValidAdminRole(role: unknown): role is AdminRole {
  return typeof role === 'string' && ALLOWED_ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Check if a role has sufficient privilege
 * @param userRole The role to check
 * @param requiredRole The minimum required role
 * @returns true if userRole has equal or higher privilege than requiredRole
 */
export function hasRequiredRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get admin record by user_id (non-cached version for API routes)
 * @param userId The auth.users id
 * @returns Admin record or null
 */
export async function getAdminByUserId(userId: string): Promise<AdminRow | null> {
  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('id, user_id, role, permissions, created_at, created_by')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getAdminByUserId] Error:', error);
    return null;
  }

  return data;
}

/**
 * Validate that a user is an admin with valid role
 * @param userId The auth.users id
 * @returns Admin record if valid, null otherwise
 */
export async function validateAdmin(userId: string): Promise<AdminRow | null> {
  const admin = await getAdminByUserId(userId);

  if (!admin) {
    return null;
  }

  if (!admin.role || !isValidAdminRole(admin.role)) {
    console.error('[validateAdmin] Invalid role:', admin.role);
    return null;
  }

  return admin;
}

/**
 * Check if user has permission for a specific action
 * @param admin The admin record
 * @param action The action to check (e.g., 'create_admin', 'delete_user')
 * @returns true if admin has permission
 */
export function hasPermission(admin: AdminRow, action: string): boolean {
  if (!isValidAdminRole(admin.role)) {
    return false;
  }

  const role: AdminRole = admin.role;

  // Superadmins have all permissions
  if (role === 'superadmin') {
    return true;
  }

  // Check role-based permissions (superadmin already handled above)
  switch (action) {
    case 'create_admin':
    case 'delete_admin':
    case 'update_admin_role':
      return false; // Only superadmin can do this (already returned above)

    case 'approve_therapist':
    case 'reject_therapist':
    case 'update_user':
    case 'delete_user':
      return role === 'manager'; // Superadmin already returned, so only manager can do this

    case 'view_users':
    case 'view_therapists':
    case 'view_payments':
    case 'view_logs':
      return true; // All roles can view

    default:
      // Check custom permissions from JSONB field
      if (admin.permissions && typeof admin.permissions === 'object') {
        return admin.permissions[action] === true;
      }
      return false;
  }
}

/**
 * Get friendly role name for display
 */
export function getRoleName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    superadmin: 'Super Admin',
    manager: 'Manager',
    viewer: 'Viewer',
  };
  return names[role];
}

/**
 * Get role color for UI badges
 */
export function getRoleColor(role: AdminRole): string {
  const colors: Record<AdminRole, string> = {
    superadmin: 'red',
    manager: 'blue',
    viewer: 'gray',
  };
  return colors[role];
}
