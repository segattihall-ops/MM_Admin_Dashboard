import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { approveTherapist, logAdminAction } from '@/lib/supabase/crud';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const { notes } = body;
  const { data, error } = await approveTherapist(id, admin.id, notes);
  if (error) return failure(error.message, 400);
  await logAdminAction('approve_therapist', admin.id, { therapistId: id });
  return success(data);
}
