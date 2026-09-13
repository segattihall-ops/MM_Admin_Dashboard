'use client';

import { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/data-table';
import { useToast } from '@/hooks/use-toast';
import type { VerificationDataRow, ProfileEditRow, TherapistEditRow } from '@/lib/supabase/types';
import { PageHeader } from '@/components/layout/page-header';

type Props = {
  verification: VerificationDataRow[];
  profileEdits: ProfileEditRow[];
  therapistEdits: TherapistEditRow[];
};

export default function ReviewClient({ verification, profileEdits, therapistEdits }: Props) {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState(verification);
  const [profiles, setProfiles] = useState(profileEdits);
  const [therapists, setTherapists] = useState(therapistEdits);
  const [isPending, startTransition] = useTransition();

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
      <PageHeader title="Review Queue" description="Approve or reject pending verification and edit requests." />

      <Tabs defaultValue="verification">
        <TabsList className="mb-4">
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="profile-edits">Profile Edits</TabsTrigger>
          <TabsTrigger value="therapist-edits">Therapist Edits</TabsTrigger>
        </TabsList>

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
