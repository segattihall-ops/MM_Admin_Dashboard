import { listVerificationData, listProfileEdits, listTherapistEdits } from '@/lib/supabase/crud';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import ReviewClient from './review-client';

async function listPhotoReviews() {
  const { data: photos, error } = await supabaseAdmin
    .from('profile_photos')
    .select(
      'id, profile_id, user_id, url, storage_path, storage_bucket, is_primary, sort_order, moderation_status, moderation_reason, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[review] Failed to load profile photos:', error.message);
    return [];
  }

  const photoRows = photos ?? [];
  const profileIds = Array.from(
    new Set(
      photoRows
        .map((photo) => photo.profile_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  const profileMap = new Map<
    string,
    {
      display_name: string | null;
      full_name: string | null;
      email: string | null;
      city: string | null;
      state: string | null;
    }
  >();

  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, full_name, email, city, state')
      .in('id', profileIds);

    if (profilesError) {
      console.error('[review] Failed to load photo profile details:', profilesError.message);
    } else {
      for (const profile of profiles ?? []) {
        profileMap.set(profile.id, {
          display_name: profile.display_name ?? null,
          full_name: profile.full_name ?? null,
          email: profile.email ?? null,
          city: profile.city ?? null,
          state: profile.state ?? null,
        });
      }
    }
  }

  const pendingStatuses = new Set(['pending', 'pending_review', 'reviewing']);

  return photoRows
    .map((photo) => {
      const profile = photo.profile_id ? profileMap.get(photo.profile_id) : undefined;
      return {
        ...photo,
        display_name: profile?.display_name ?? null,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        city: profile?.city ?? null,
        state: profile?.state ?? null,
      };
    })
    .sort((a, b) => {
      const aStatus = String(a.moderation_status ?? 'pending').toLowerCase();
      const bStatus = String(b.moderation_status ?? 'pending').toLowerCase();
      const aPending = pendingStatuses.has(aStatus);
      const bPending = pendingStatuses.has(bStatus);

      if (aPending !== bPending) return aPending ? -1 : 1;

      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
}

export default async function ReviewPage() {
  const [{ data: verifications }, { data: profileEdits }, { data: therapistEdits }, photos] = await Promise.all([
    listVerificationData(),
    listProfileEdits(),
    listTherapistEdits(),
    listPhotoReviews(),
  ]);

  return (
    <ReviewClient
      verification={verifications ?? []}
      profileEdits={profileEdits ?? []}
      therapistEdits={therapistEdits ?? []}
      photos={photos}
    />
  );
}
