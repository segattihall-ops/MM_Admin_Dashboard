import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { listPayments } from '@/lib/supabase/crud';

export default async function LogsPage() {
  const { data, error } = await listPayments();
  if (error) {
    return <div className="text-destructive">Failed to load logs: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">System Logs</CardTitle>
        <CardDescription>Using Supabase payments as audit entries.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <Badge variant={payment.status === 'failed' ? 'destructive' : 'default'}>{payment.status ?? 'unknown'}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">Payment {payment.id}</TableCell>
                <TableCell>billing</TableCell>
                <TableCell>{payment.created_at ? new Date(payment.created_at).toLocaleString() : '—'}</TableCell>
              </TableRow>
            ))}
            {(data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No logs available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
