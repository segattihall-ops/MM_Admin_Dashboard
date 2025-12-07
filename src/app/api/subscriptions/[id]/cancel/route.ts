import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { cancelSubscriptionProcedure, logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const { data, error } = await cancelSubscriptionProcedure(params.id, admin.id);
  if (error) return failure(error.message, 400);
  await logAdminAction('cancel_subscription', admin.id, { subscriptionId: params.id });
  return success(data);
}
