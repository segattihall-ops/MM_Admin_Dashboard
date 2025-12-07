import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { listPayments, listSubscriptions, listTherapists, listUsers } from '@/lib/supabase/crud';
import { PageHeader } from '@/components/layout/page-header';

export default async function DashboardPage() {
  const [{ data: users }, { data: subscriptions }, { data: therapists }, { data: payments }] = await Promise.all([
    listUsers(),
    listSubscriptions(),
    listTherapists(),
    listPayments(),
  ]);

  const totalUsers = users?.length ?? 0;
  const totalSubs = subscriptions?.length ?? 0;
  const totalTherapists = therapists?.length ?? 0;
  const totalPayments = payments?.length ?? 0;

  const monthlyRevenue = payments?.reduce((acc, payment) => acc + (payment.amount ?? 0), 0) ?? 0;
  const newSignups24h =
    users?.filter((u) => u.created_at && Date.now() - new Date(u.created_at).getTime() < 24 * 60 * 60 * 1000).length ?? 0;

  const recentTherapists = therapists?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Admin overview powered by Supabase data." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
            <CardDescription>Accounts in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">New (24h): {newSignups24h}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Subscriptions</CardTitle>
            <CardDescription>Total active and past</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payments</CardTitle>
            <CardDescription>Count this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPayments}</div>
            <div className="text-xs text-muted-foreground mt-1">Sum: {monthlyRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Therapists</CardTitle>
            <CardDescription>Profiles in Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTherapists}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Therapist Activity</CardTitle>
          <CardDescription>Latest updates pulled server-side.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTherapists.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-none last:pb-0">
                <div>
                  <div className="font-medium">{t.full_name ?? t.email ?? t.id}</div>
                  <div className="text-xs text-muted-foreground">{t.status ?? 'Unknown'} • {t.plan_name ?? t.plan ?? 'No plan'}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.updated_at ? new Date(t.updated_at).toLocaleString() : '—'}
                </div>
              </div>
            ))}
            {recentTherapists.length === 0 && (
              <div className="text-muted-foreground text-center py-6">No therapist activity yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
