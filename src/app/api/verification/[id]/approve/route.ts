import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('verification_data')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: admin.id })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return failure(error.message, 400);
  await logAdminAction('approve_verification', admin.id, { verificationId: id });
  return success(data);
}
