import type { PostgrestError } from '@supabase/supabase-js';
import { supabaseAdmin } from '../supabaseAdmin';
import {
  AdminRow,
  ApplicationRow,
  LegalAcceptanceRow,
  PaymentRow,
  ProfileEditRow,
  ProfileRow,
  SubscriptionRow,
  TherapistEditRow,
  TherapistRow,
  VerificationDataRow,
} from './types';

export type SupabaseResult<T> = { data: T | null; error: PostgrestError | null; count?: number | null };

const makeCrud = <T>(table: string) => ({
  list: async (page = 1, pageSize = 20): Promise<SupabaseResult<T[]>> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabaseAdmin.from(table).select('*', { count: 'exact' }).range(from, to);
    return { data: (data as T[]) ?? null, error, count };
  },
  get: async (id: string): Promise<SupabaseResult<T>> => {
    const { data, error } = await supabaseAdmin.from(table).select('*').eq('id', id).single();
    return { data: (data as T) ?? null, error };
  },
  create: async (payload: Partial<T>): Promise<SupabaseResult<T>> => {
    const { data, error } = await supabaseAdmin.from(table).insert(payload).select().single();
    return { data: (data as T) ?? null, error };
  },
  update: async (id: string, payload: Partial<T>): Promise<SupabaseResult<T>> => {
    const { data, error } = await supabaseAdmin.from(table).update(payload).eq('id', id).select().single();
    return { data: (data as T) ?? null, error };
  },
  remove: async (id: string): Promise<SupabaseResult<T>> => {
    const { data, error } = await supabaseAdmin.from(table).delete().eq('id', id).select().single();
    return { data: (data as T) ?? null, error };
  },
});

// =============================================
// AUTH USERS (from Supabase Auth)
// =============================================
// Users are managed by Supabase Auth (auth.users), not a custom table
// We provide wrapper functions for consistency with other CRUD operations

export async function listUsers(page = 1, pageSize = 20) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: pageSize });
  return {
    data: data?.users ?? null,
    error: error ? { message: error.message, code: error.code || 'AUTH_ERROR' } : null,
    count: (data && 'total' in data) ? data.total : null,
  };
}

export async function getUser(id: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
  return {
    data: data?.user ?? null,
    error: error ? { message: error.message, code: error.code || 'AUTH_ERROR' } : null,
  };
}

export async function createUser(payload: { email: string; password?: string; email_confirm?: boolean }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser(payload);
  return {
    data: data?.user ?? null,
    error: error ? { message: error.message, code: error.code || 'AUTH_ERROR' } : null,
  };
}

export async function updateUser(id: string, payload: { email?: string; password?: string; user_metadata?: Record<string, any> }) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, payload);
  return {
    data: data?.user ?? null,
    error: error ? { message: error.message, code: error.code || 'AUTH_ERROR' } : null,
  };
}

export async function deleteUser(id: string) {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id);
  return {
    data: data ?? null,
    error: error ? { message: error.message, code: error.code || 'AUTH_ERROR' } : null,
  };
}

const profilesCrud = makeCrud<ProfileRow>('profiles');
export const listProfiles = profilesCrud.list;
export const getProfile = profilesCrud.get;
export const createProfile = profilesCrud.create;
export const updateProfile = profilesCrud.update;
export const deleteProfile = profilesCrud.remove;

const therapistsCrud = makeCrud<TherapistRow>('therapists');
export const listTherapists = therapistsCrud.list;
export const getTherapist = therapistsCrud.get;
export const createTherapist = therapistsCrud.create;
export const updateTherapist = therapistsCrud.update;
export const deleteTherapist = therapistsCrud.remove;

const verificationCrud = makeCrud<VerificationDataRow>('verification_data');
export const listVerificationData = verificationCrud.list;
export const getVerificationEntry = verificationCrud.get;
export const createVerificationEntry = verificationCrud.create;
export const updateVerificationEntry = verificationCrud.update;
export const deleteVerificationEntry = verificationCrud.remove;

const paymentsCrud = makeCrud<PaymentRow>('payments');
export const listPayments = paymentsCrud.list;
export const getPayment = paymentsCrud.get;
export const createPayment = paymentsCrud.create;
export const updatePayment = paymentsCrud.update;
export const deletePayment = paymentsCrud.remove;

const subscriptionsCrud = makeCrud<SubscriptionRow>('subscriptions');
export const listSubscriptions = subscriptionsCrud.list;
export const getSubscription = subscriptionsCrud.get;
export const createSubscription = subscriptionsCrud.create;
export const updateSubscription = subscriptionsCrud.update;
export const deleteSubscription = subscriptionsCrud.remove;

const therapistEditsCrud = makeCrud<TherapistEditRow>('therapists_edit');
export const listTherapistEdits = therapistEditsCrud.list;
export const getTherapistEdit = therapistEditsCrud.get;
export const createTherapistEdit = therapistEditsCrud.create;
export const updateTherapistEdit = therapistEditsCrud.update;
export const deleteTherapistEdit = therapistEditsCrud.remove;

const profileEditsCrud = makeCrud<ProfileEditRow>('profile_edits');
export const listProfileEdits = profileEditsCrud.list;
export const getProfileEdit = profileEditsCrud.get;
export const createProfileEdit = profileEditsCrud.create;
export const updateProfileEdit = profileEditsCrud.update;
export const deleteProfileEdit = profileEditsCrud.remove;

const applicationsCrud = makeCrud<ApplicationRow>('applications');
export const listApplications = applicationsCrud.list;
export const getApplication = applicationsCrud.get;
export const createApplication = applicationsCrud.create;
export const updateApplication = applicationsCrud.update;
export const deleteApplication = applicationsCrud.remove;

const adminsCrud = makeCrud<AdminRow>('admins');
export const listAdmins = adminsCrud.list;
export const getAdmin = adminsCrud.get;
export const createAdmin = adminsCrud.create;
export const updateAdmin = adminsCrud.update;
export const deleteAdmin = adminsCrud.remove;

const legalCrud = makeCrud<LegalAcceptanceRow>('legal_acceptances');
export const listLegalAcceptances = legalCrud.list;
export const getLegalAcceptance = legalCrud.get;
export const createLegalAcceptance = legalCrud.create;
export const updateLegalAcceptance = legalCrud.update;
export const deleteLegalAcceptance = legalCrud.remove;

export async function approveTherapist(therapistId: string, adminId: string, notes?: string) {
  const { data, error } = await supabaseAdmin.rpc('approve_therapist', {
    therapist_id: therapistId,
    admin_id: adminId,
    notes: notes ?? null,
  });
  return { data, error };
}

export async function rejectTherapist(therapistId: string, adminId: string, reason?: string) {
  const { data, error } = await supabaseAdmin.rpc('reject_therapist', {
    therapist_id: therapistId,
    admin_id: adminId,
    rejection_reason: reason ?? null,
  });
  return { data, error };
}

export async function activateSubscription(subscriptionId: string, adminId: string) {
  const { data, error } = await supabaseAdmin.rpc('activate_subscription', {
    subscription_id: subscriptionId,
    admin_id: adminId,
  });
  return { data, error };
}

export async function cancelSubscriptionProcedure(subscriptionId: string, adminId: string) {
  const { data, error } = await supabaseAdmin.rpc('cancel_subscription', {
    subscription_id: subscriptionId,
    admin_id: adminId,
  });
  return { data, error };
}

export async function logAdminAction(action: string, adminId: string, metadata?: Record<string, any>) {
  const { data, error } = await supabaseAdmin.rpc('log_admin_action', {
    action_name: action,
    admin_id: adminId,
    metadata: metadata ?? {},
  });
  return { data, error };
}
