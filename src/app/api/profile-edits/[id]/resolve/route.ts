import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('profile_edits')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .maybeSingle();

  if (error) return failure(error.message, 400);
  await logAdminAction('resolve_profile_edit', admin.id, { profileEditId: params.id });
  return success(data);
}
