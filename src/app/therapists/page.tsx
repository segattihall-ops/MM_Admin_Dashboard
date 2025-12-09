import Link from 'next/link';
import { listTherapists } from '@/lib/supabase/crud';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 20;

export default async function TherapistsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(parseInt(params?.page ?? '1', 10) || 1, 1);
  const { data, error, count } = await listTherapists(page, PAGE_SIZE);
  if (error) {
    return <div className="text-destructive">Failed to load therapists: {error.message}</div>;
  }

  const therapists = data ?? [];
  const totalPages = Math.max(Math.ceil((count ?? therapists.length) / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      <PageHeader
        title="Therapists"
        description="Overview of therapist records."
        actions={
          <div className="text-sm text-muted-foreground">
            Total: {count ?? therapists.length} • Page {currentPage} / {totalPages}
          </div>
        }
      />

      <DataTable
        data={therapists}
        columns={[
          { key: 'full_name', header: 'Name', cell: (row) => row.full_name ?? row.email ?? row.id },
          { key: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
          { key: 'plan', header: 'Plan', cell: (row) => row.plan_name ?? row.plan ?? '—' },
          {
            key: 'status',
            header: 'Status',
            cell: (row) => <Badge variant={row.status === 'Active' ? 'default' : row.status === 'Pending' ? 'secondary' : 'destructive'}>{row.status ?? 'Pending'}</Badge>,
          },
          {
            key: 'updated_at',
            header: 'Updated',
            cell: (row) => (row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'),
          },
        ]}
        emptyMessage="No therapists found."
      />

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link
          href={`/therapists?page=${Math.max(currentPage - 1, 1)}`}
          className={`text-primary ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Previous
        </Link>
        <Link
          href={`/therapists?page=${Math.min(currentPage + 1, totalPages)}`}
          className={`text-primary ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
