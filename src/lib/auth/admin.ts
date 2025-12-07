/**
 * Centralized admin role validation and helpers
 * Used by both middleware and API routes to ensure consistency
 */

import type { AdminRole, AdminRow } from '@/lib/supabase/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Valid admin roles in order of privilege (highest to lowest)
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
 * Get admin record by user_id
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

  // Check role-based permissions
  switch (action) {
    case 'create_admin':
    case 'delete_admin':
    case 'update_admin_role':
      return role === 'manager';

    case 'approve_therapist':
    case 'reject_therapist':
    case 'update_user':
    case 'delete_user':
      return role === 'manager';

    case 'view_users':
    case 'view_therapists':
    case 'view_payments':
    case 'view_logs':
      return role === 'viewer';

    default:
      // Check custom permissions from JSONB field
      if (admin.permissions && typeof admin.permissions === 'object') {
        return admin.permissions[action] === true;
      }
      return false;
  }
}

/**
 * Get friendly role name
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

/**
 * Error response for non-admin access
 */
export const NON_ADMIN_ERROR = {
  error: 'Access denied: User is not an admin',
  code: 'NOT_ADMIN',
  status: 403,
} as const;

/**
 * Error response for insufficient permissions
 */
export const INSUFFICIENT_PERMISSIONS_ERROR = {
  error: 'Access denied: Insufficient permissions for this action',
  code: 'INSUFFICIENT_PERMISSIONS',
  status: 403,
} as const;

/**
 * Error response for invalid role
 */
export const INVALID_ROLE_ERROR = {
  error: 'Invalid admin role',
  code: 'INVALID_ROLE',
  status: 400,
} as const;
