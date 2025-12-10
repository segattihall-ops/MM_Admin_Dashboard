import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { activateSubscription, logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const { data, error } = await activateSubscription(id, admin.id);
  if (error) return failure(error.message, 400);
  await logAdminAction('activate_subscription', admin.id, { subscriptionId: id });
  return success(data);
}
