import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { logAdminAction, updateTherapist } from '@/lib/supabase/crud';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const { notes, status } = body;

  if (status) {
    const { error } = await updateTherapist(params.id, { status });
    if (error) return failure(error.message, 400);
  }

  await logAdminAction('review_therapist', admin.id, { therapistId: params.id, notes, status });
  return success({ ok: true });
}
