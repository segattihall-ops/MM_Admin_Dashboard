import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listPayments, listSubscriptions } from '@/lib/supabase/crud';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 20;

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; tab?: string; subPage?: string; payPage?: string }>;
}) {
  const params = await searchParams;
  const tab = params?.tab ?? 'overview';
  const subPage = Math.max(parseInt(params?.subPage ?? '1', 10) || 1, 1);
  const payPage = Math.max(parseInt(params?.payPage ?? '1', 10) || 1, 1);

  const [{ data: payments, error: paymentsError, count: paymentsCount }, { data: subscriptions, error: subsError, count: subsCount }] =
    await Promise.all([listPayments(payPage, PAGE_SIZE), listSubscriptions(subPage, PAGE_SIZE)]);

  if (paymentsError || subsError) {
    return <div className="text-destructive">Failed to load billing data.</div>;
  }

  const subs = subscriptions ?? [];
  const pays = payments ?? [];
  const totalSubs = subsCount ?? subs.length;
  const totalPays = paymentsCount ?? pays.length;
  const totalSubsPages = Math.max(Math.ceil(totalSubs / PAGE_SIZE), 1);
  const totalPayPages = Math.max(Math.ceil(totalPays / PAGE_SIZE), 1);

  const statusVariantMap: Record<string, 'default' | 'destructive' | 'outline'> = {
    Active: 'default',
    Canceled: 'destructive',
  };

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Revenue, subscriptions, and payment records."
        actions={
          <div className="text-sm text-muted-foreground">
            Subs: {totalSubs} | Payments: {totalPays}
          </div>
        }
      />

      <Tabs defaultValue={tab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Key figures</CardTitle>
              <CardDescription>Aggregated stats from Supabase.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Total subscriptions</div>
                <div className="text-2xl font-bold">{totalSubs}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total payments</div>
                <div className="text-2xl font-bold">{totalPays}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active subs</div>
                <div className="text-2xl font-bold">{subs.filter((s) => s.status === 'Active').length}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Subscription Management</CardTitle>
              <CardDescription>Overview of active and past subscriptions.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={subs}
                columns={[
                  { key: 'user_id', header: 'User', cell: (row) => row.user_id ?? '-' },
                  { key: 'plan_id', header: 'Plan', cell: (row) => row.plan_id ?? '-' },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (row) => <Badge variant={statusVariantMap[row.status ?? ''] ?? 'outline'}>{row.status ?? 'Unknown'}</Badge>,
                  },
                  { key: 'start_date', header: 'Start', cell: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : '-') },
                  { key: 'end_date', header: 'End', cell: (row) => (row.end_date ? new Date(row.end_date).toLocaleDateString() : '-') },
                ]}
                emptyMessage="No subscriptions found."
              />
              <div className="mt-4 flex items-center justify-between text-sm">
                <Link
                  href={`/billing?tab=subscriptions&subPage=${Math.max(subPage - 1, 1)}`}
                  className={`text-primary ${subPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Previous
                </Link>
                <Link
                  href={`/billing?tab=subscriptions&subPage=${Math.min(subPage + 1, totalSubsPages)}`}
                  className={`text-primary ${subPage === totalSubsPages ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Next
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Payments</CardTitle>
              <CardDescription>Transactions synced from Supabase.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={pays}
                columns={[
                  { key: 'id', header: 'ID', cell: (row) => <span className="font-mono text-xs">{row.id}</span> },
                  { key: 'user_id', header: 'User', cell: (row) => row.user_id ?? '-' },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (row) => <Badge variant={row.status === 'failed' ? 'destructive' : 'default'}>{row.status ?? 'unknown'}</Badge>,
                  },
                  {
                    key: 'amount',
                    header: 'Amount',
                    cell: (row) => (row.amount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    align: 'right',
                  },
                  { key: 'paid_at', header: 'Date', cell: (row) => (row.paid_at ? new Date(row.paid_at).toLocaleString() : '-') },
                ]}
                emptyMessage="No payments yet."
              />
              <div className="mt-4 flex items-center justify-between text-sm">
                <Link
                  href={`/billing?tab=payments&payPage=${Math.max(payPage - 1, 1)}`}
                  className={`text-primary ${payPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Previous
                </Link>
                <Link
                  href={`/billing?tab=payments&payPage=${Math.min(payPage + 1, totalPayPages)}`}
                  className={`text-primary ${payPage === totalPayPages ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Next
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
