import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTherapist, listVerificationData } from '@/lib/supabase/crud';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TherapistDetailPage({ params }: Props) {
  const { id } = await params;
  const [{ data: therapist }, { data: verification }] = await Promise.all([
    getTherapist(id),
    listVerificationData(),
  ]);

  if (!therapist) {
    return notFound();
  }

  const verificationEntry = verification?.find((entry) => entry.therapist_id === therapist.id);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{therapist.full_name ?? therapist.email}</CardTitle>
          <CardDescription>Therapist profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{therapist.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline">{therapist.status ?? 'Pending'}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span>{therapist.plan_name ?? therapist.plan ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subscription</span>
            <span>{therapist.subscription_status ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Verification</CardTitle>
          <CardDescription>Latest verification submission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {verificationEntry ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{verificationEntry.status ?? 'Pending'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document</span>
                <a className="text-primary underline" href={verificationEntry.document_url ?? '#'} target="_blank" rel="noreferrer">
                  {verificationEntry.document_url ?? 'N/A'}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selfie</span>
                <a className="text-primary underline" href={verificationEntry.selfie_url ?? '#'} target="_blank" rel="noreferrer">
                  {verificationEntry.selfie_url ?? 'N/A'}
                </a>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No verification submission found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
