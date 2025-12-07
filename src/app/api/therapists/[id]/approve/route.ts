import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { approveTherapist, logAdminAction } from '@/lib/supabase/crud';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const { notes } = body;
  const { data, error } = await approveTherapist(params.id, admin.id, notes);
  if (error) return failure(error.message, 400);
  await logAdminAction('approve_therapist', admin.id, { therapistId: params.id });
  return success(data);
}
