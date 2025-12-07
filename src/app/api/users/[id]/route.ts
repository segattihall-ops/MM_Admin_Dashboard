import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { deleteUser, getUser, logAdminAction, updateUser } from '@/lib/supabase/crud';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await getUser(params.id);
  if (error) return failure(error.message, 404);
  return success(data);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const payload = await request.json();
  const { data, error } = await updateUser(params.id, payload);
  if (error) return failure(error.message, 400);
  if (admin) await logAdminAction('update_user', admin.id, { userId: params.id });
  return success(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const { data, error } = await deleteUser(params.id);
  if (error) return failure(error.message, 400);
  if (admin) await logAdminAction('delete_user', admin.id, { userId: params.id });
  return success(data);
}
