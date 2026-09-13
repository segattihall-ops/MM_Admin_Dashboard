'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { useToast } from '@/hooks/use-toast';
import type { VerificationDataRow, ProfileEditRow, TherapistEditRow } from '@/lib/supabase/types';
import { PageHeader } from '@/components/layout/page-header';

type PhotoReviewRow = {
  id: string;
  profile_id: string | null;
  user_id: string | null;
  url: string | null;
  storage_path: string | null;
  storage_bucket: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
  moderation_status: string | null;
  moderation_reason: string | null;
  created_at: string | null;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
};

type Props = {
  verification: VerificationDataRow[];
  profileEdits: ProfileEditRow[];
  therapistEdits: TherapistEditRow[];
  photos: PhotoReviewRow[];
};

const pendingPhotoStatuses = new Set(['pending', 'pending_review', 'reviewing']);

export default function ReviewClient({ verification, profileEdits, therapistEdits, photos }: Props) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [verifications, setVerifications] = useState(verification);
  const [profiles, setProfiles] = useState(profileEdits);
  const [therapists, setTherapists] = useState(therapistEdits);
  const [photoRows, setPhotoRows] = useState(photos);
  const [isPending, startTransition] = useTransition();

  const requestedTab = searchParams.get('tab');
  const allowedTabs = ['photos', 'verification', 'profile-edits', 'therapist-edits'];
  const initialTab = requestedTab && allowedTabs.includes(requestedTab) ? requestedTab : 'photos';
  const pendingPhotoCount = photoRows.filter((photo) =>
    pendingPhotoStatuses.has(String(photo.moderation_status ?? 'pending').toLowerCase())
  ).length;

  const callAction = async (url: string, body?: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.error || 'Action failed');
    }
    return res.json().catch(() => ({}));
  };

  const handlePhotoModeration = (id: string, action: 'approve' | 'reject') => {
    let reason: string | undefined;

    if (action === 'reject') {
      const value = window.prompt(
        'Reason for rejection:',
        'Photo does not meet MasseurMatch public profile photo guidelines.'
      );
      if (value === null) return;
      reason = value.trim() || 'Photo does not meet MasseurMatch public profile photo guidelines.';
    }

    startTransition(() => {
      callAction(`/api/photos/${id}/${action}`, reason ? { reason } : undefined)
        .then(() => {
          setPhotoRows((prev) =>
            prev.map((photo) =>
              photo.id === id
                ? {
                    ...photo,
                    moderation_status: action === 'approve' ? 'approved' : 'rejected',
                    moderation_reason:
                      action === 'approve'
                        ? 'Photo reviewed and approved by admin.'
                        : reason ?? 'Photo rejected by admin.',
                  }
                : photo
            )
          );
          toast({ title: action === 'approve' ? 'Photo approved' : 'Photo rejected' });
        })
        .catch((e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }));
    });
  };

  const handleVerification = (id: string, action: 'approve' | 'reject') => {
    startTransition(() => {
      callAction(`/api/verification/${id}/${action}`).then(() => {
        setVerifications((prev) => prev.map((item) => (item.id === id ? { ...item, status: action === 'approve' ? 'Approved' : 'Rejected' } : item)));
        toast({ title: `Verification ${action}d` });
      }).catch((e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }));
    });
  };

  const handleResolveProfile = (id: string) => {
    startTransition(() => {
      callAction(`/api/profile-edits/${id}/resolve`).then(() => {
        setProfiles((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item)));
        toast({ title: 'Profile edit resolved' });
      }).catch((e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }));
    });
  };

  const handleResolveTherapist = (id: string) => {
    startTransition(() => {
      callAction(`/api/therapist-edits/${id}/resolve`).then(() => {
        setTherapists((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item)));
        toast({ title: 'Therapist edit resolved' });
      }).catch((e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }));
    });
  };

  return (
    <div>
      <PageHeader title="Review Queue" description="Approve or reject provider photos, verification, and edit requests." />

      <Tabs defaultValue={initialTab}>
        <TabsList className="mb-4 flex h-auto flex-wrap">
          <TabsTrigger value="photos">
            Photos{pendingPhotoCount > 0 ? ` (${pendingPhotoCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="profile-edits">Profile Edits</TabsTrigger>
          <TabsTrigger value="therapist-edits">Therapist Edits</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Photo Review</CardTitle>
              <CardDescription>
                Review individual provider photos. Approving a photo does not approve the entire provider profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <DataTable
                data={photoRows}
                getRowId={(row) => row.id}
                columns={[
                  {
                    key: 'preview',
                    header: 'Photo',
                    cell: (row) => {
                      const src = row.url || row.storage_path;
                      return src ? (
                        <a href={src} target="_blank" rel="noreferrer" className="block w-fit">
                          <img
                            src={src}
                            alt={`${row.display_name || row.full_name || 'Provider'} profile submission`}
                            className="h-20 w-20 rounded-md border object-cover"
                            loading="lazy"
                          />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No image</span>
                      );
                    },
                  },
                  {
                    key: 'provider',
                    header: 'Provider',
                    cell: (row) => (
                      <div className="min-w-40">
                        <div className="font-medium">{row.display_name || row.full_name || 'Unknown provider'}</div>
                        <div className="text-xs text-muted-foreground">{row.email || row.profile_id || '—'}</div>
                        {(row.city || row.state) && (
                          <div className="text-xs text-muted-foreground">
                            {[row.city, row.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'is_primary',
                    header: 'Type',
                    cell: (row) => (
                      <Badge variant={row.is_primary ? 'default' : 'secondary'}>
                        {row.is_primary ? 'Primary' : 'Gallery'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'moderation_status',
                    header: 'Status',
                    cell: (row) => {
                      const status = String(row.moderation_status ?? 'pending').toLowerCase();
                      const variant = status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary';
                      return <Badge variant={variant}>{status.replaceAll('_', ' ')}</Badge>;
                    },
                  },
                  {
                    key: 'created_at',
                    header: 'Submitted',
                    cell: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—'),
                  },
                  {
                    key: 'moderation_reason',
                    header: 'Notes',
                    cell: (row) => (
                      <div className="max-w-xs whitespace-normal text-sm text-muted-foreground">
                        {row.moderation_reason || '—'}
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    cell: (row) => {
                      const status = String(row.moderation_status ?? 'pending').toLowerCase();
                      return (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending || status === 'approved'}
                            onClick={() => handlePhotoModeration(row.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={isPending || status === 'rejected'}
                            onClick={() => handlePhotoModeration(row.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      );
                    },
                  },
                ]}
                emptyMessage="No photos available for review."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Verification</CardTitle>
              <CardDescription>Pending identity/document checks.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <DataTable
                data={verifications}
                columns={[
                  { key: 'therapist_id', header: 'Therapist', cell: (row) => row.therapist_id ?? '—' },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (row) => <Badge variant={row.status === 'Approved' ? 'default' : row.status === 'Rejected' ? 'destructive' : 'secondary'}>{row.status ?? 'Pending'}</Badge>,
                  },
                  { key: 'submitted_at', header: 'Submitted', cell: (row) => (row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '—') },
                  {
                    key: 'document_url',
                    header: 'Document',
                    cell: (row) =>
                      row.document_url ? (
                        <a href={row.document_url} target="_blank" rel="noreferrer" className="text-primary underline">
                          View
                        </a>
                      ) : (
                        '—'
                      ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    cell: (row) => (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleVerification(row.id, 'approve')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => handleVerification(row.id, 'reject')}>
                          Reject
                        </Button>
                      </div>
                    ),
                  },
                ]}
                emptyMessage="No verification items."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile-edits">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Profile Edits</CardTitle>
              <CardDescription>Data from profile_edits table.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <DataTable
                data={profiles}
                columns={[
                  { key: 'user_id', header: 'User', cell: (row) => row.user_id ?? '—' },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (row) => <Badge variant={row.status === 'Approved' ? 'default' : 'secondary'}>{row.status ?? 'Pending'}</Badge>,
                  },
                  { key: 'created_at', header: 'Submitted', cell: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—') },
                  {
                    key: 'changes',
                    header: 'Changes',
                    cell: (row) => (row.changes ? JSON.stringify(row.changes) : '—'),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    cell: (row) => (
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleResolveProfile(row.id)}>
                        Mark Resolved
                      </Button>
                    ),
                  },
                ]}
                emptyMessage="No profile edit requests."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapist-edits">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Therapist Edits</CardTitle>
              <CardDescription>Data from therapists_edit table.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <DataTable
                data={therapists}
                columns={[
                  { key: 'therapist_id', header: 'Therapist', cell: (row) => row.therapist_id ?? '—' },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (row) => <Badge variant={row.status === 'Approved' ? 'default' : 'secondary'}>{row.status ?? 'Pending'}</Badge>,
                  },
                  { key: 'created_at', header: 'Submitted', cell: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—') },
                  {
                    key: 'changes',
                    header: 'Changes',
                    cell: (row) => (row.changes ? JSON.stringify(row.changes) : '—'),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    cell: (row) => (
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleResolveTherapist(row.id)}>
                        Mark Resolved
                      </Button>
                    ),
                  },
                ]}
                emptyMessage="No therapist edit requests."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
