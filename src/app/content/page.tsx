import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listApplications } from '@/lib/supabase/crud';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';

const PAGE_SIZE = 20;

export default async function ContentPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(parseInt(params?.page ?? '1', 10) || 1, 1);
  const { data, error, count } = await listApplications(page, PAGE_SIZE);
  if (error) {
    return <div className="text-destructive">Failed to load applications: {error.message}</div>;
  }

  const items = data ?? [];
  const totalPages = Math.max(Math.ceil((count ?? items.length) / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      <PageHeader
        title="Content / Applications"
        description="Review submissions stored in Supabase."
        actions={
          <div className="text-sm text-muted-foreground">
            Total: {count ?? items.length} • Page {currentPage} / {totalPages}
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Applications</CardTitle>
          <CardDescription>Submissions and status.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={items}
            columns={[
              { key: 'full_name', header: 'Name', cell: (row) => row.full_name ?? row.id },
              { key: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
              {
                key: 'status',
                header: 'Status',
                cell: (row) => (
                  <Badge variant={row.status === 'approved' ? 'default' : row.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {row.status ?? 'Pending'}
                  </Badge>
                ),
              },
              { key: 'submitted_at', header: 'Submitted', cell: (row) => (row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '—') },
            ]}
            emptyMessage="No submissions found."
          />
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              href={`/content?page=${Math.max(currentPage - 1, 1)}`}
              className={`text-primary ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Previous
            </Link>
            <Link
              href={`/content?page=${Math.min(currentPage + 1, totalPages)}`}
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
