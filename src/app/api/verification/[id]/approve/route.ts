import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('verification_data')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: admin.id })
    .eq('id', params.id)
    .select()
    .maybeSingle();

  if (error) return failure(error.message, 400);
  await logAdminAction('approve_verification', admin.id, { verificationId: params.id });
  return success(data);
}
