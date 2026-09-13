import { requireAdmin, hasRequiredRole } from '@/lib/auth/server';
import { failure, success } from '@/lib/http/responses';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAdminAction } from '@/lib/supabase/crud';

const PENDING_STATUSES = new Set(['pending', 'pending_review', 'reviewing']);

async function refreshProfilePhotoVerification(profileId: string) {
  const { data: photos, error } = await supabaseAdmin
    .from('profile_photos')
    .select('moderation_status')
    .eq('profile_id', profileId);

  if (error) {
    console.error('[photo-moderation] Failed to recalculate profile photo verification:', error.message);
    return;
  }

  const statuses = (photos ?? []).map((photo) => String(photo.moderation_status ?? 'pending').toLowerCase());
  const hasApproved = statuses.includes('approved');
  const hasPending = statuses.some((status) => PENDING_STATUSES.has(status));

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ is_verified_photos: hasApproved && !hasPending })
    .eq('id', profileId);

  if (profileError) {
    console.error('[photo-moderation] Failed to update profile photo verification:', profileError.message);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requireAdmin();
  if (!hasRequiredRole(admin.role, 'manager')) {
    return failure('Insufficient permissions to reject provider photos.', 403);
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason =
    typeof body?.reason === 'string' && body.reason.trim()
      ? body.reason.trim()
      : 'Photo does not meet MasseurMatch public profile photo guidelines.';
  const now = new Date().toISOString();

  const { data: existing, error: findError } = await supabaseAdmin
    .from('profile_photos')
    .select('id, profile_id, moderation_status')
    .eq('id', id)
    .maybeSingle();

  if (findError) return failure(findError.message, 400);
  if (!existing) return failure('Photo not found.', 404);

  const { data, error } = await supabaseAdmin
    .from('profile_photos')
    .update({
      moderation_status: 'rejected',
      moderation_reason: reason,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return failure(error.message, 400);

  const { error: queueError } = await supabaseAdmin
    .from('moderation_queue')
    .update({
      status: 'rejected',
      moderation_reason: reason,
      admin_reason: reason,
      reviewed_at: now,
      updated_at: now,
    })
    .or(`photo_id.eq.${id},content_id.eq.${id},target_id.eq.${id}`);

  if (queueError) {
    console.error('[photo-moderation] Failed to sync moderation queue:', queueError.message);
  }

  if (existing.profile_id) {
    await refreshProfilePhotoVerification(existing.profile_id);
  }

  await logAdminAction('reject_photo', admin.id, {
    photoId: id,
    profileId: existing.profile_id,
    previousStatus: existing.moderation_status,
    reason,
  });

  return success(data);
}
