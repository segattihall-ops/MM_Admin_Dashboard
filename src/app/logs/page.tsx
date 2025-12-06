'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const logsData: any[] = [];

const levelVariantMap: { [key: string]: 'destructive' | 'default' | 'secondary' | 'outline' } = {
  'ERROR': 'destructive',
  'INFO': 'default',
  'WARN': 'secondary',
  'DEBUG': 'outline',
};

const LogsPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">System Logs & Monitoring</CardTitle>
        <CardDescription>Monitor system logs in real-time and filter by service or level.</CardDescription>
        <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." className="pl-8" />
            </div>
            <Select>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
            </Select>
             <Select>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[180px]">Service</TableHead>
              <TableHead className="w-[200px]">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsData.length > 0 ? logsData.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant={levelVariantMap[log.level]}>{log.level}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{log.message}</TableCell>
                 <TableCell>{log.service}</TableCell>
                <TableCell>{log.timestamp}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  No logs to display. System logs will appear here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LogsPage;
