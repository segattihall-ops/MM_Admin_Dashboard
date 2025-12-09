import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('profile_edits')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return failure(error.message, 400);
  await logAdminAction('resolve_profile_edit', admin.id, { profileEditId: id });
  return success(data);
}
