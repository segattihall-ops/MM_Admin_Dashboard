import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { listProfileEdits } from '@/lib/supabase/crud';

export default async function SupportPage() {
  const { data, error } = await listProfileEdits();
  if (error) {
    return <div className="text-destructive">Failed to load support requests: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Support & Profile Edits</CardTitle>
        <CardDescription>Requests pulled directly from Supabase (profile_edits table).</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.user_id}</TableCell>
                <TableCell>
                  <Badge variant={row.status === 'resolved' ? 'default' : 'secondary'}>{row.status ?? 'Pending'}</Badge>
                </TableCell>
                <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.changes ? JSON.stringify(row.changes) : '—'}
                </TableCell>
              </TableRow>
            ))}
            {(data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No support requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
