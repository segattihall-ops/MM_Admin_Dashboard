import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { listSubscriptions } from '@/lib/supabase/crud';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 20;

export default async function SubscriptionsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(parseInt(params?.page ?? '1', 10) || 1, 1);
  const { data, error, count } = await listSubscriptions(page, PAGE_SIZE);
  if (error) {
    return <div className="text-destructive">Failed to load subscriptions: {error.message}</div>;
  }

  const subs = data ?? [];
  const totalPages = Math.max(Math.ceil((count ?? subs.length) / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Server-side data directly from Supabase."
        actions={
          <div className="text-sm text-muted-foreground">
            Total: {count ?? subs.length} • Page {currentPage} / {totalPages}
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Subscriptions</CardTitle>
          <CardDescription>Manage subscription lifecycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={subs}
            columns={[
              { key: 'user_id', header: 'User', cell: (row) => row.user_id ?? '—' },
              { key: 'plan_id', header: 'Plan', cell: (row) => row.plan_id ?? '—' },
              {
                key: 'status',
                header: 'Status',
                cell: (row) => <Badge variant={row.status === 'Active' ? 'default' : 'destructive'}>{row.status ?? 'Unknown'}</Badge>,
              },
              { key: 'start_date', header: 'Start', cell: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : '—') },
              { key: 'end_date', header: 'End', cell: (row) => (row.end_date ? new Date(row.end_date).toLocaleDateString() : '—') },
              {
                key: 'actions',
                header: 'Actions',
                cell: (row) => (
                  <div className="flex gap-2">
                    <form action={`/api/subscriptions/${row.id}/activate`} method="post">
                      <Button size="sm" variant="outline" type="submit">
                        Activate
                      </Button>
                    </form>
                    <form action={`/api/subscriptions/${row.id}/cancel`} method="post">
                      <Button size="sm" variant="ghost" className="text-destructive" type="submit">
                        Cancel
                      </Button>
                    </form>
                  </div>
                ),
              },
            ]}
            emptyMessage="No subscriptions found."
          />
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              href={`/subscriptions?page=${Math.max(currentPage - 1, 1)}`}
              className={`text-primary ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Previous
            </Link>
            <Link
              href={`/subscriptions?page=${Math.min(currentPage + 1, totalPages)}`}
              className={`text-primary ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Next
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
