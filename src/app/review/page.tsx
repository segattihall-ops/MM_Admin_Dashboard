import { listVerificationData, listProfileEdits, listTherapistEdits } from '@/lib/supabase/crud';
import ReviewClient from './review-client';

export default async function ReviewPage() {
  const [{ data: verifications }, { data: profileEdits }, { data: therapistEdits }] = await Promise.all([
    listVerificationData(),
    listProfileEdits(),
    listTherapistEdits(),
  ]);

  return (
    <ReviewClient
      verification={verifications ?? []}
      profileEdits={profileEdits ?? []}
      therapistEdits={therapistEdits ?? []}
    />
  );
}
