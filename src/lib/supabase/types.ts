/**
 * Admin roles available in the system
 * Must stay aligned with ALLOWED_ADMIN_ROLES in admin utils
 */
export type AdminRole = "superadmin" | "manager" | "viewer";

/**
 * Shape of the row returned from Supabase 'admins' table
 */
export interface AdminRow {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: Record<string, boolean> | null;
  created_at: string;
  created_by: string | null;
}
