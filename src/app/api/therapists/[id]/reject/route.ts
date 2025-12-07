import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { logAdminAction, rejectTherapist } from '@/lib/supabase/crud';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const { reason } = body;
  const { data, error } = await rejectTherapist(params.id, admin.id, reason);
  if (error) return failure(error.message, 400);
  await logAdminAction('reject_therapist', admin.id, { therapistId: params.id, reason });
  return success(data);
}
