import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { logAdminAction } from '@/lib/supabase/crud';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const { admin } = await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const payments = Array.isArray(body?.payments) ? body.payments : null;

  if (!payments) {
    return failure('Expected "payments" array payload', 400);
  }

  const { data, error } = await supabaseAdmin.from('payments').upsert(payments).select();
  if (error) return failure(error.message, 400);

  await logAdminAction('sync_payments', admin.id, { count: data?.length ?? 0 });
  return success(data);
}
