import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { listLegalAcceptances } from '@/lib/supabase/crud';

export default async function LegalPage() {
  const { data, error } = await listLegalAcceptances();
  if (error) {
    return <div className="text-destructive">Failed to load legal acceptances: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Legal Acceptances</CardTitle>
        <CardDescription>Track which users accepted the latest legal documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Accepted</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.user_id}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.version ?? 'N/A'}</Badge>
                </TableCell>
                <TableCell>{row.accepted_at ? new Date(row.accepted_at).toLocaleString() : '—'}</TableCell>
                <TableCell>{row.ip_address ?? '—'}</TableCell>
              </TableRow>
            ))}
            {(data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No legal acceptances recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
