import Link from 'next/link';
import { listUsers } from '@/lib/supabase/crud';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 20;

export default async function UsersPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(parseInt(params?.page ?? '1', 10) || 1, 1);
  const { data, error, count } = await listUsers(page, PAGE_SIZE);

  if (error) {
    return <div className="text-destructive">Failed to load users: {error.message}</div>;
  }

  const users = data ?? [];
  const totalPages = Math.max(Math.ceil((count ?? users.length) / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage user accounts and statuses."
        actions={
          <div className="text-sm text-muted-foreground">
            Total: {count ?? users.length} • Page {currentPage} / {totalPages}
          </div>
        }
      />

      <DataTable
        data={users}
        columns={[
          {
            key: 'name',
            header: 'User',
            cell: (row: any) => `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || row.email || row.id,
          },
          { key: 'email', header: 'Email', cell: (row: any) => row.email ?? '—' },
          {
            key: 'status',
            header: 'Status',
            cell: (row: any) => <Badge variant={row.status === 'Inactive' ? 'destructive' : 'default'}>{row.status ?? 'Active'}</Badge>,
          },
          {
            key: 'last_login',
            header: 'Last Login',
            cell: (row: any) => (row.last_login ? new Date(row.last_login).toLocaleString() : '—'),
          },
        ]}
        emptyMessage="No users found."
      />

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link
          href={`/users?page=${Math.max(currentPage - 1, 1)}`}
          className={`text-primary ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Previous
        </Link>
        <Link
          href={`/users?page=${Math.min(currentPage + 1, totalPages)}`}
          className={`text-primary ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
