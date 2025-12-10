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

/**
 * Admin context including user and admin record
 */
export interface AdminContext {
  user: any; // Supabase User type
  admin: AdminRow | null;
}

/**
 * Verification data for therapist documents
 */
export interface VerificationDataRow {
  id: string;
  therapist_id: string;
  status: string;
  document_url: string | null;
  card_url: string | null;
  selfie_url: string | null;
  signed_term_url: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
}

/**
 * Profile edit requests
 */
export interface ProfileEditRow {
  id: string;
  user_id: string;
  changes: Record<string, any>;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

/**
 * Therapist edit requests
 */
export interface TherapistEditRow {
  id: string;
  therapist_id: string;
  changes: Record<string, any>;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

/**
 * Application submissions
 */
export interface ApplicationRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

/**
 * Legal document acceptances
 */
export interface LegalAcceptanceRow {
  id: string;
  user_id: string;
  version: string;
  accepted_at: string;
  ip_address: string | null;
}

/**
 * Payment records
 */
export interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  invoice_id: string | null;
  created_at: string;
}

/**
 * Subscription records
 */
export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  canceled_at: string | null;
  created_at: string;
}

/**
 * Therapist profiles
 */
export interface TherapistRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  plan: string | null;
  plan_name: string | null;
  subscription_status: string | null;
  slug: string | null;
  phone: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  document_url: string | null;
  card_url: string | null;
  selfie_url: string | null;
  signed_term_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User profiles
 */
export interface ProfileRow {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
