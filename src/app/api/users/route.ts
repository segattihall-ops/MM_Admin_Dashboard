import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { createUser, listUsers, logAdminAction } from '@/lib/supabase/crud';

export async function GET() {
  await requireAdmin();
  const { data, error } = await listUsers();
  if (error) return failure(error.message, 500);
  return success(data ?? []);
}

export async function POST(request: Request) {
  const { admin } = await requireAdmin();
  const payload = await request.json();
  const { data, error } = await createUser(payload);

  if (error) return failure(error.message, 400);
  if (admin) await logAdminAction('create_user', admin.id, { userId: data?.id });
  return success(data, 201);
}
