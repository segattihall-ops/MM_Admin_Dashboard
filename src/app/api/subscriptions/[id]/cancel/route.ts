import { requireAdmin } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { cancelSubscriptionProcedure, logAdminAction } from '@/lib/supabase/crud';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const { data, error } = await cancelSubscriptionProcedure(id, admin.id);
  if (error) return failure(error.message, 400);
  await logAdminAction('cancel_subscription', admin.id, { subscriptionId: id });
  return success(data);
}
