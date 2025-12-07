import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { activateSubscription, logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const { data, error } = await activateSubscription(params.id, admin.id);
  if (error) return failure(error.message, 400);
  await logAdminAction('activate_subscription', admin.id, { subscriptionId: params.id });
  return success(data);
}
