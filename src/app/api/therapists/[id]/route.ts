import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import {
  deleteTherapist,
  getTherapist,
  logAdminAction,
  updateTherapist,
} from '@/lib/supabase/crud';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await getTherapist(id);
  if (error) return failure(error.message, 404);
  return success(data);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const payload = await request.json();
  const { data, error } = await updateTherapist(id, payload);
  if (error) return failure(error.message, 400);
  if (admin) await logAdminAction('update_therapist', admin.id, { therapistId: id });
  return success(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const { data, error } = await deleteTherapist(id);
  if (error) return failure(error.message, 400);
  if (admin) await logAdminAction('delete_therapist', admin.id, { therapistId: id });
  return success(data);
}
